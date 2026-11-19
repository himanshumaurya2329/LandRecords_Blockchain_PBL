from __future__ import annotations

import base64
import json
import os
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.getenv("LAYA_PORT", "8765"))
MODEL_ID = "convaiinnovations/laya-typed-decisions"
MODEL_REVISION = "1a793eb568e6718f15941d08f85432581df534e3"
MAX_BODY = 14 * 1024 * 1024
MAX_PDF_BYTES = 10 * 1024 * 1024
MAX_PDF_PAGES = 8
MAX_TEXT_CHARS = 2400
MODEL = None
MODEL_LOCK = threading.Lock()

# Keep runtime inference offline: application text and land records never leave this machine.
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("USE_TF", "0")


def get_model():
    global MODEL
    if MODEL is None:
        with MODEL_LOCK:
            if MODEL is None:
                from laya import Agent
                MODEL = Agent(MODEL_ID, revision=MODEL_REVISION, device="cpu")
    return MODEL


def decision(state: dict[str, Any], options: list[str], question: str) -> dict[str, Any]:
    # Only short, preprocessed facts enter the 1,024-token System 1 context.
    compact_state = json.dumps({"question": question, "options": options, **state}, ensure_ascii=False, separators=(",", ":"))[:1800]
    result = get_model().decide(
        compact_state,
        schema={
            "type": "object",
            "properties": {"assessment": {"type": "string", "enum": options}},
            "required": ["assessment"],
        },
        return_details=True,
        max_len=256,
    )
    value = result.values.get("assessment")
    confidence = result.answer_confidence.get("assessment")
    probabilities = result.probabilities.get("assessment", {})
    return {
        "assessment": value if value in options else None,
        "confidence": round(float(confidence), 4) if confidence is not None else None,
        "probabilities": probabilities,
        "question": question,
    }


def norm(value: Any) -> str:
    return re.sub(r"[^\w]", "", str(value or "").casefold(), flags=re.UNICODE)


def compare(expected: Any, text: str) -> str:
    a, b = norm(expected), norm(text)
    if not a or not b:
        return "not_found"
    if a.isdigit():
        found = re.search(rf"(?<!\d){re.escape(a)}(?!\d)", b) is not None
    else:
        found = a in b or b in a
    return "match" if found else "possible_mismatch"


def extract_pdf(encoded: str) -> dict[str, Any]:
    try:
        raw = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        raise ValueError("Invalid PDF payload") from exc
    if not raw or len(raw) > MAX_PDF_BYTES:
        raise ValueError("PDF must be between 1 byte and 10 MB")
    try:
        import fitz
        doc = fitz.open(stream=raw, filetype="pdf")
    except Exception as exc:
        raise ValueError("This file could not be read as a PDF") from exc
    if doc.page_count < 1 or doc.page_count > MAX_PDF_PAGES:
        doc.close()
        raise ValueError(f"PDF must contain 1 to {MAX_PDF_PAGES} pages")
    pages = [page.get_text("text") for page in doc]
    page_count = doc.page_count
    doc.close()
    text = "\n".join(pages)
    return {"text": text[:MAX_TEXT_CHARS], "pageCount": page_count, "hasText": bool(norm(text))}


class Handler(BaseHTTPRequestHandler):
    server_version = "LayaLocal/1.0"

    def _json(self, status: int, payload: dict[str, Any]):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._json(204, {})

    def do_GET(self):
        if self.path != "/health":
            return self._json(404, {"error": "Not found"})
        weights = os.path.expanduser(f"~/.cache/huggingface/hub/models--convaiinnovations--laya-typed-decisions/snapshots/{MODEL_REVISION}/model.safetensors")
        self._json(200, {
            "ok": True,
            "model": MODEL_ID,
            "loaded": MODEL is not None,
            "weightsCached": os.path.isfile(weights),
            "mode": "local-cpu",
        })

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BODY:
                return self._json(413, {"error": "Request is empty or exceeds the 14 MB limit"})
            body = json.loads(self.rfile.read(length))
            if self.path == "/analyze/clerk":
                return self._clerk(body)
            if self.path == "/analyze/survey":
                return self._survey(body)
            if self.path == "/analyze/document":
                return self._document(body)
            return self._json(404, {"error": "Not found"})
        except ValueError as exc:
            return self._json(400, {"error": str(exc)})
        except Exception as exc:
            return self._json(503, {"error": "Local Laya inference is unavailable", "detail": str(exc)[:300]})

    def _clerk(self, data):
        facts = {k: str(data.get(k, ""))[:120] for k in ("ownerName", "surveyNumber", "area", "state", "city", "nature")}
        facts["addressProvided"] = bool(str(data.get("address", "")).strip())
        completeness = [k for k, v in facts.items() if not str(v).strip()]
        flags = data.get("flags", [])
        flags = [str(x)[:100] for x in flags[:8]] if isinstance(flags, list) else []
        output = decision(
            {"task": "initial clerk triage", "fields": facts, "missingFields": completeness, "reviewFlags": flags,
             "instruction": "Choose whether a human should make routine review, needs_review, or urgent_review. Never approve or reject."},
            ["routine_review", "needs_review", "urgent_review"],
            "What review priority should the clerk assign based only on the supplied completeness and consistency cues?",
        )
        conf = output["confidence"]
        escalated = output["assessment"] != "routine_review" or conf is None or conf < .70 or bool(completeness)
        return self._json(200, self._result("clerk_triage", output, escalated, completeness, flags))

    def _survey(self, data):
        report = str(data.get("surveyReport", ""))[:1200]
        boundary = str(data.get("boundaryDetails", ""))[:240]
        classification = str(data.get("landClassification", ""))[:160]
        if not report.strip():
            raise ValueError("Enter the survey report before analysis")
        expected = {k: str(data.get(k, ""))[:160] for k in ("surveyNumber", "area", "location", "ownerName")}
        comparisons = {key: compare(value, report) for key, value in expected.items() if value.strip()}
        flags = [f"{key} not found in report" if status == "not_found" else f"{key} may differ from report" for key, status in comparisons.items() if status != "match"]
        output = decision(
            {"task": "survey report consistency triage", "applicationFacts": expected, "comparisonCues": comparisons,
             "reportExcerpt": report, "boundaryDetails": boundary, "landClassification": classification,
             "instruction": "Choose consistent, needs_review, or insufficient_evidence. Do not decide land ownership or approve/reject."},
            ["consistent", "needs_review", "insufficient_evidence"],
            "Does this survey report appear consistent with the submitted application facts, or should a human reconcile it?",
        )
        conf = output["confidence"]
        escalated = output["assessment"] != "consistent" or conf is None or conf < .70 or bool(flags)
        return self._json(200, self._result("survey_consistency", output, escalated, flags, []))

    def _document(self, data):
        extracted = extract_pdf(str(data.get("pdfBase64", "")))
        if not extracted["hasText"]:
            return self._json(200, {
                "model": MODEL_ID, "task": "document_screening", "pageCount": extracted["pageCount"],
                "textExtracted": False, "fields": {}, "assessment": "insufficient_evidence",
                "confidence": None, "requiresHumanReview": True,
                "reasons": ["No selectable text found. This appears to be a scanned/image PDF; local OCR is not configured."],
                "steps": ["PDF validated", "Text extraction found no selectable text", "Escalate to a human reviewer"],
            })
        text = extracted["text"]
        expected = {k: str(data.get(k, ""))[:120] for k in ("ownerName", "surveyNumber", "area", "city", "state")}
        fields = {key: {"expected": value, "status": compare(value, text)} for key, value in expected.items() if value.strip()}
        mismatches = [key for key, item in fields.items() if item["status"] != "match"]
        excerpt = re.sub(r"\s+", " ", text)[:900]
        output = decision(
            {"task": "document match triage", "fieldComparison": {k: v["status"] for k, v in fields.items()},
             "documentExcerpt": excerpt, "instruction": "Choose match, mismatch_review, or insufficient_evidence. This is screening only."},
            ["match", "mismatch_review", "insufficient_evidence"],
            "Do the visible document text and supplied land application facts appear to align, or does a human need to compare them?",
        )
        conf = output["confidence"]
        escalated = output["assessment"] != "match" or conf is None or conf < .70 or bool(mismatches)
        return self._json(200, {
            **self._result("document_screening", output, escalated, mismatches, []),
            "pageCount": extracted["pageCount"], "textExtracted": True, "fields": fields,
            "steps": ["PDF validated (10 MB / 8 page cap)", "Selectable text extracted (2,400 character cap)", "Land fields compared", "Laya System 1 triage applied"],
        })

    @staticmethod
    def _result(task, output, escalated, reasons, flags):
        return {
            "model": MODEL_ID, "task": task, "assessment": output["assessment"],
            "confidence": output["confidence"], "probabilities": output["probabilities"],
            "confidenceNote": "Raw model confidence; not calibrated for land records and not a probability of legal correctness.",
            "requiresHumanReview": escalated,
            "reasons": reasons or flags,
            "steps": ["Application facts reduced to a short structured snapshot", "Laya System 1 compared the snapshot against fixed review categories", "Confidence gate and explicit review flags applied"],
        }

    def log_message(self, fmt, *args):
        # Avoid writing personal/application data to service logs.
        print("%s - %s" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Laya local service listening at http://{HOST}:{PORT} ({MODEL_ID})")
    server.serve_forever()
