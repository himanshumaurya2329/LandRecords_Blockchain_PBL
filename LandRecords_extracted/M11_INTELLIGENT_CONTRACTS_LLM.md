# M11 — From Smart Contracts to **Intelligent Contracts**

### Making Land Records AI-Smart, Using Small Fast Models Like Laya

**Note to the reader:** This file is written for someone who has **never seen this project before**.
If you are new here, start from the top. If you already know the project, jump to
[§0 TL;DR](#0-tldr--the-verdict-in-one-table).

Every claim about the code inside this project points to a real file. Every claim about AI
models or laws points to a source in [§13 Reference reading](#13-reference-reading).

---

## 0. TL;DR — the verdict in one table

| Question | Answer |
| --- | --- |
| Does this project have smart contracts? | **Yes.** 1 chaincode (a smart contract), about 1,295 lines, 16 functions, runs on a 3-group private Fabric network. |
| Does it have *intelligent* contracts today? | **No.** Every "AI" number it shows right now is a **fake fixed number written in the code**. |
| Can we make them intelligent using AI models? | **Yes — but not by putting an AI model inside the blockchain.** Fabric (the blockchain software) forbids it. The AI must live **outside** the blockchain, and send a signed report back. |
| Which AI model should we use? | **Laya** — it is open source (Apache 2.0 licence), free, and built exactly for fast decisions. It is the open alternative to **Jev**, which does the same job but is paid and closed. |
| Are "System 1 models" the right idea? | **Yes.** A System 1 model is a small fast model that makes quick pattern decisions. It is cheap, fast, and private. That is the right kind of AI for 80% of the work here. |
| How important is this? | **High.** This is the only way the "M9 AI/OCR" claim in your README becomes true instead of just words on paper. |
| How feasible is it? | **Very feasible for the first parts** (a few weeks, no GPU needed, runs on a laptop). Harder for the fancy "prove with math" parts. **Not possible** to run the AI directly on the blockchain. |

**The one-line version:**
You built a good ledger (the blockchain part). But the "brain" (the AI part) is fake right now — it just returns fixed numbers. The real job is: **move the AI outside the blockchain, make it produce a signed, repeatable report, and save that report on the ledger.**

---

## 1. What is actually in this project (read this first if you are new)

### 1.1 The big picture — how the pieces fit together

```
client/                  ← The website users see (Next.js)
  └── a person uploads a deed scan (PDF/image)
         │
         ▼
fabric-api/              ← The middle layer (Node.js + Express)
  └── talks to the blockchain for the website
         │
         ▼
chaincode/land-registration/   ← THE SMART CONTRACT (the brainless rules)
  └── land-registration-contract.js   ← 1,295 lines, 16 functions
         │
         ▼
ledger (mychannel)       ← The shared record, watched by 3 organisations
```

Three groups (called "Org1", "Org2", "Org3") each run their own peer (their own copy of the
blockchain node). For any change to be accepted, **all three must agree**.
This is called the **endorsement policy**: `AND(Org1, Org2, Org3)`.

The smart contract already does real, serious work:

- A **12-step workflow machine** — an application moves through stages like
  `submitted → with_superintendent → with_mro → with_surveyor → ... → approved`.
- **Access control by role** — who is allowed to do what (for example, only Org3 can resolve disputes).
- A **joint-ownership state machine** (from module M10) — handles shared ownership and share transfers.
- **Document integrity** — a deed scan is stored on IPFS (a file storage system), and its
  fingerprint (`docHash`) is saved on the blockchain so nobody can swap the file later.

**Bottom line:** the blockchain part is actually well built. The workflow, the access control,
the joint-ownership rules — those are real engineering.

### 1.2 The AI that does NOT exist yet — a line-by-line check

Module **M9** (`M9_AI_OCR_PIPELINE.md`) claims there is an "AI-Driven Document Digitization Pipeline"
with a "FastAPI inference bridge", an "NLP model", and "confidence scores".

**None of that exists.**

If you run this command in the project folder:

```
find . -name '*.py'
```

You get **zero Python files** (except in `fabric-samples/`, which is just sample code from Fabric,
not our project).

So where does the "AI" output come from? It comes from **three functions** inside
[`chaincode/land-registration/lib/land-registration-contract.js`](chaincode/land-registration/lib/land-registration-contract.js).

Look at this function (around line 564):

```js
_generateAIOCRData(application) {
    return {
        extractedOwner: application.userData ? application.userData.fullName || "Harika Devi" : "Harika Devi",
        extractedSurveyNo: application.surveyNumber || "SY-9012/C",
        extractedArea: application.area || "175",
        aiEngine: "Tesseract-NLP-v4",     // ← This is just a text string, not a real engine
        processingTime: "1.2s"            // ← This is a fixed number, not a real measurement
    };
}
```

And this (around lines 518–531, inside `getApplication()`):

```js
application.trustScore = this._calculateTrustScore(application);
application.trustDetails = { integrity: 100, veracity: 70, symmetry: 93, ... };
application.ocrMatch = { ownerMatch: true, surveyMatch: true, confidence: 99.2 };
```

And this (around line 542):

```js
_calculateTrustScore(application) {
    let score = 50.0;
    score += Math.min(history.length * 10, 30);
    if (status is late-stage) score += 20.0;
    return Math.min(score, 100.0);
}
```

**What is actually happening:**

1. `confidence: 99.2` is just a number typed in the code. It is `99.2` for **every** application,
   even a fake one.
2. `symmetry: 93` is also a fixed number. The code claims it is a "match percentage" between
   AI-extracted data and user input — but it does no comparison at all.
3. `_generateAIOCRData` tries to read `application.surveyNumber` and `application.area`, but the
   application object **does not have those fields**. So it falls back to `"SY-9012/C"` and `"175"`
   for **every** record. Every application gets the same fake extracted values.
4. These values are **never saved to the blockchain**. They are calculated at read time and thrown
   away. You cannot find them in any block. You cannot audit them. A trust score you cannot point to
   in a block is just decoration.

**Four real problems this causes:**

| Problem | Why it matters |
| --- | --- |
| **It is not evidence** | These numbers are not saved to any block. They have no signature. Nobody can replay or audit them. |
| **It is always "perfect"** | `ownerMatch: true`, `surveyMatch: true`, `confidence: 99.2` — for every application, including a fake one. A fraud check that never finds fraud is worse than no check, because a reviewer will read "99.2" and think the check passed. |
| **Every record gets the same values** | Because it reads fields that do not exist, every application gets "Harika Devi", "SY-9012/C", "175". The demo cannot fail because it cannot compute. |
| **`symmetry: 93` is fake** | It claims to compare AI output with user input. It does not. It is always 93. |

### 1.3 Two other bugs worth fixing (not AI, but important)

These are not about AI. But a project that claims "M7 encryption" and "M8 trust" will get checked
on them. And they are easy to fix.

**a) The "AES-256 encryption" is not real encryption — it is hiding.**

```js
// line 9
const ENCRYPTION_KEY = crypto.scryptSync('ELAND-SECURE-CHAINCODE-KEY-1234', 'salt', 32);
// line 10
const IV_ZEROS = Buffer.alloc(16, 0);   // all-zero starting vector
```

The key is made from a **password typed right into the code**, with a fixed salt, and a
**all-zero starting vector**. Problems:

- Anyone who reads the code knows the key. It is not secret.
- A zero starting vector in CBC mode leaks whether two messages start with the same block.
- If decryption fails, the code silently returns the garbage instead of raising an error.

For something like an Aadhaar number, this is a real weakness. The real fix is not "use a longer
password" — it is to move the key out of the code entirely (use a proper key manager or Fabric's
private data feature) and use a real authenticated cipher (AES-256-GCM).

**b) `forwardApplication` trusts the caller's word about their role, not their real identity.**

```js
// line 394, inside forwardApplication()
const userRole = forwardData.userRole;   // ← taken from the request body (what the caller typed)
if (!workflowStep.allowedRoles.includes(userRole)) { throw ... }
```

Every other function in this contract checks the caller's real certificate role
(`cid.getAttributeValue('role')` or `cid.getMSPID()`). This one function reads the role from
the JSON the caller sent. That means: a caller with a `clerk` certificate can send
`{"userRole": "superintendent"}` and skip ahead in the workflow. The access control here is
only pretend.

The fix: get the role from `ctx.clientIdentity`, and only use `forwardData.userRole` as a claim
to compare against the real identity.

> **Do not fix these two bugs inside the AI work.** Fix them as their own separate commit, so
> reviewers can see the security fix on its own, separate from the AI work.

---

## 2. What "smart contract" vs "intelligent contract" actually means

### 2.1 Smart contract (what you have today)

A **smart contract** is code that runs automatically and exactly the same way every time, whenever
something changes on the blockchain. It is purely rule-based:
> "if A, then do B. If the shares do not add up to 100%, reject."

It does not read documents. It does not "understand" anything. It just follows rules.

### 2.2 Intelligent contract (what we want to build)

An **intelligent contract** is a smart contract where **the decisions are helped by AI models
that can read unstructured things** (like a scanned deed), **but the actual execution stays
deterministic and auditable**.

The two are not the same. The confusion between them is where most "AI + blockchain" projects
go wrong.

Here is a ladder to understand the levels:

| Level | Name | What the contract does | Where the AI lives | Your project today |
| --- | --- | --- | --- | --- |
| **L0** | Pure rules | `if (sum != 100) throw` | Nothing | ✅ Done fully |
| **L1** | Tracked rules | Rules + every value traceable | Nothing | ✅ Mostly done (docHash, IPFS, history) |
| **L2** | AI helps read documents | An AI model reads a document and sends back extracted fields + confidence | Off-chain service | ⚠️ Claimed in M9, not built |
| **L3** | AI flags, human decides | AI scores / flags / prioritises. A human official makes the final call. | Off-chain service + escalation rule | ❌ Not built |
| **L4** | AI finds the law | AI looks up the relevant law and drafts a reason | Off-chain RAG service | ❌ Not built |
| **L5** | AI decides alone | AI output automatically changes the contract state | Off-chain, signed by an AI identity | ❌ Not advisable (see below) |

**The line between L3 and L5 is the whole ethical question.**

- **L3** keeps the human as the decision-maker. The AI is just a second pair of eyes.
- **L5** lets the AI's output be the decision itself.

For something involving **property rights** (people's land), **L3 is the correct ceiling**.
That is true for a real government system, and it is also the honest way to frame this for a
college project.

---

## 3. Why this matters for land records (the real-world reason)

### 3.1 The real problem was never storage. It was deciding what is true.

Blockchains are great at two things:
- Keeping a shared record that nobody can secretly change.
- Making sure a record signed by someone really came from them.

But the blockchain **does not solve the actual problem** in land records. The actual problem
comes *before* the record even reaches the blockchain:

- The original record (khatauni, 7/12, patta) is often **paper or a scanned image**.
  Everything after that is someone transcribing someone else's transcription.
- Deeds are **messy**: they have prose, seals, rubber stamps, survey sketches, notes in the
  margins, and different layouts in different districts. They often mix Telugu/Tamil/Kannada
  script with English.
- **Disputes happen because of confusion**: two deeds for the same survey number, a boundary
  described in words ("north side of the pond"), a co-owner who never agreed, a mutation order
  issued by someone without the right authority.
- The smart contract already models the *process* (the steps). It cannot model the *evidence*,
  because the evidence is an image.

**So the most valuable AI in this domain is: reading documents and flagging suspicious things.
Not making final decisions.** That is good news — reading documents and flagging is exactly what
AI models are good at, and exactly where a fast "System 1" model earns its keep.

### 3.2 The seven things AI could do here, ranked by value vs. effort

| # | What it does | What AI is needed | Level | Value | Effort | What happens if it is wrong |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Read a scanned deed and pull out fields** (survey no., area, owner name) | OCR + layout + field extraction | L2 | ★★★★★ | Medium | A wrong field → human corrects it |
| 2 | **Check if the deed matches the ledger record** | Rules + small classifier | L1/L2 | ★★★★★ | Small | Low risk; it is deterministic |
| 3 | **Spot signs of tampering or forgery** (re-saved PDF, copied scan) | Image forensics + hashing | L3 | ★★★★☆ | Medium | False alarm → human checks |
| 4 | **Find duplicates** (same survey number used twice, overlapping area) | Geometry + fuzzy matching | L3 | ★★★★☆ | Medium | Missed duplicate → human checks |
| 5 | **Spot stuck/aging cases** (which files are waiting too long) | Small classifier | L3 | ★★★☆☆ | Small | Low risk (only affects queue order) |
| 6 | **Answer: "which law applies here?"** | RAG + small LLM | L4 | ★★★★☆ | Large | Must cite sources or it is useless |
| 7 | **Let officials search in plain English** ("show me joint cases pending at Collectorate") | Text → database query | L4 | ★★★☆☆ | Small | Read-only, safe |

**Do #1, #2, #3, and #5 first.** They are cheap, you can check them by eye, and they make the
`trustScore` and `ocrMatch` fields in your contract actually mean something for the first time.

### 3.3 Why this is possible now (and was not a few years ago)

- **Document-reading models are now good enough.** Reading text from a scanned, stamped, tilted
  government form is a solved-enough problem. It does not need a giant reasoning model.
- **Small models got genuinely capable.** A 3-billion or 4-billion parameter model (see
  [§5.3](#53-which-system-1-model-to-use-laya-first)) can run on a laptop, handle many languages,
  and do extraction and classification well.
- **Private AI inference is real.** You can run AI inside a secure hardware box (called a TEE)
  so that the deed data never leaves your own system unencrypted.
- **Proof-based AI exists but is expensive.** You can mathematically prove that a specific small
  model produced a specific output (called zkML), but it is too slow and expensive for big models.

---

## 4. The hard rule: you cannot put an AI model inside the blockchain contract

This is the single most important technical fact in this document.
**If you get this wrong, you waste weeks.**

### 4.1 Why not

Fabric runs the smart contract (chaincode) on each organisation's peer node, during the
"simulate" phase, inside a sandboxed container. Here is what that means in plain terms:

1. **All peers must get the exact same answer.**
   Every endorsing peer must compute the same result, or the transaction is rejected at commit time.
   If you run an AI model that samples randomly (temperature > 0), it will give different answers
   on Org1, Org2, and Org3 → **the transaction fails**, and it fails in a random way that looks
   like a bug.

2. **Network calls from inside the contract are unreliable.**
   Calling an outside AI API from inside endorsement adds seconds of delay to *every* endorsement
   of the `AND(Org1, Org2, Org3)` policy.

3. **All three organisations would need the same model.**
   Your network has three organisations with separate peers. Org3's peer would need Org1's model
   weights and a GPU. That is not a deployment — that is a negotiation.

4. **Everything on the blockchain is permanent.**
   Every byte of AI output becomes a block forever. Putting model weights on-chain would be
   tens of gigabytes.

So the right way to think about it is:

> **The blockchain contract stays simple and deterministic. The AI lives outside the blockchain
> in a separate service. The ledger stores the AI's signed report, the model's identity,
> the fingerprint of the input, and the rule under which the report was accepted — but never the
> model itself.**

### 4.2 The five possible places to put the AI, ranked

| Place | Possible? | What we think for this project |
| --- | --- | --- |
| **P1. Pure rules + better checks** | ✅ Always | Keep this as the base. The L0/L1 parts are already strong. Do not make them worse. |
| **P2. AI service outside → contract saves the signed report** | ✅ **Use this** | Clean, standard pattern. Fits Fabric's endorsement model perfectly. |
| **P3. Run the contract as an outside service** (Fabric v2.0+) | ⚠️ Possible, not recommended | Useful for deployment, but does NOT remove the rule that all peers must agree. |
| **P4. AI runs inside a secure hardware box (TEE), report saved to ledger** | ✅ Strong option | Best balance of privacy + proof for sensitive data like Aadhaar. Adds a hardware need. |
| **P5. Math-proof the AI output on-chain** (zkML) | ⚠️ Research stage | Only for tiny models. See [§6, Phase 4](#phase-4--proof-based-ai-optional-hard). Not for a normal LLM. |

### 4.3 The design we recommend (draw this on a whiteboard)

```
  ┌─────────────────────────────────────────────────────────────┐
  │  CITIZEN / OFFICIAL                                          │
  │  uploads sale_deed.pdf ──► IPFS (the existing M7 pipeline)   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ ipfsHash + docHash
  ┌──────────────────────────────▼──────────────────────────────┐
  │  ai-service/   (NEW — a FastAPI service, Python)            │
  │                     [OUTSIDE THE BLOCKCHAIN]                 │
  │                                                             │
  │  1. fetch from IPFS, hash the bytes ────► sha256(doc)       │
  │  2. SYSTEM 1 (runs on every document, under 2 seconds)      │
  │       • OCR / layout reader   → fields + confidence per field│
  │       • cross-field checker   → rule violations              │
  │       • forgery/tamper check  → risk signals                 │
  │  3. build the AI REPORT (see §4.4)                          │
  │  4. send to fabric-api using the "ai-orchestrator" identity │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ submitTransaction(commitAIAttestation)
  ┌──────────────────────────────▼──────────────────────────────┐
  │  fabric-api/  route: POST /ai/attestation                   │
  │  → chaincode.commitAIAttestation(appId, attestationJSON)    │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  BLOCKCHAIN CONTRACT — deterministic, rule-only              │
  │   • checks the report FORMAT (not the content)              │
  │   • checks the report signature (the AI org's key)          │
  │   • checks report.docHash == ledger docHash                 │
  │   • checks report.timestamp is within the allowed window     │
  │   • checks modelId is in the allowed-list in the contract    │
  │   • calculates and saves riskScore from the report FIELDS   │
  │   • fires an AI_ATTESTATION_RECORDED event                  │
  │   • NEVER calls a model                                     │
  └─────────────────────────────────────────────────────────────┘
                                 ▼
                    ledger:  APP~ai~<appId>   ← auditable, replayable
```

**The key idea:**
The model produces *evidence*. The blockchain contract produces *the record*.
The contract's judgement is the only thing that can change state, and it only accepts evidence
whose origin it can check with hashes and signatures.

### 4.4 What the AI report looks like (the data we save)

```jsonc
{
  "type": "AI_ATTESTATION",
  "schemaVersion": "1.0",
  "applicationId": "APP-EBE11016F09F1A57",

  // ---- What was analysed ----
  "docHash": "sha256:9f2c…",         // MUST match the docHash already on the ledger
  "ipfsHash": "QmXy…",
  "modelId": "deed-extract-v3",      // must be in the contract's allowed-list
  "modelHash": "sha256:7b1e…",       // hash of the model weights + code + prompt
  "modelVersion": "2026-10-05.1",
  "runtimeHash": "sha256:containerimage",

  // ---- The output ----
  "extractedFields": {
    "surveyNumber": { "value": "SY-9012/C", "confidence": 0.97, "bbox": [0.11,0.22,0.30,0.06] },
    "areaSqYards":  { "value": "175",       "confidence": 0.88, "bbox": [0.44,0.61,0.12,0.04] },
    "ownerName":    { "value": "…",         "confidence": 0.54, "bbox": [0.08,0.09,0.35,0.05] }
  },
  "ruleFindings": [
    { "code": "AREA_MISMATCH", "severity": "warn", "detail": "deed 175 sq yd vs ledger 220 sq yd" },
    { "code": "LOW_CONF_FIELD", "severity": "info", "detail": "ownerName confidence 0.54" }
  ],
  "riskSignals": [ { "code": "PDF_REENCODED", "score": 0.71 } ],

  // ---- Who is responsible ----
  "aiOrgId": "AiOrchestratorMSP",     // a new 4th group, or a dedicated user in an existing group
  "attestationSignature": "base64…",  // sign(schema + docHash + modelHash + output)
  "policyId": "AI-POLICY-v2",
  "attestedAt": 1761859200,
  "expiresAt": 1761862800,

  // ---- The model's own self-check ----
  "humanReviewRequired": true,        // true if ANY field confidence < 0.85 or any warn+ finding
  "lowConfidenceFieldCount": 1
}
```

And in the application record, the contract calculates this **deterministically** (same on all peers):

```js
// Deterministic. No model. Same result on Org1, Org2, Org3.
const flags = attestation.ruleFindings.filter(f => f.severity === 'error').length;
const warns = attestation.ruleFindings.filter(f => f.severity === 'warn').length;
const lowC  = attestation.lowConfidenceFieldCount;

application.riskScore = Math.max(0, 100 - (flags * 30) - (warns * 10) - (lowC * 5));
application.aiReviewed  = attestation.humanReviewRequired;
application.trustScore  = Math.min(100, this._workflowTrustScore(application)
                                    + (attestation.humanReviewRequired ? 0 : 20));
```

Now `_calculateTrustScore` actually means something, and anyone can recompute it from the block
data — which is the real meaning of a "trust index".

### 4.5 How the report lifecycle stops the AI from becoming a backdoor

| Rule | Where it is enforced | What it does |
| --- | --- | --- |
| A `modelId` not in the allowed-list cannot be saved | blockchain contract | The only way to add a model is a contract upgrade (governed by the 3-org AND policy) |
| A report whose `docHash` != ledger `docHash` is rejected | blockchain contract | Stops someone from analysing a different document |
| A report older than the allowed window is rejected | blockchain contract | Stops someone replaying an old "all clear" report |
| A high `riskScore` forces `humanReviewRequired = true` | blockchain contract | **The model cannot approve anything** |
| `forwardApplication` still needs the human role | existing code | Unchanged. The AI has no path to `approved`. |
| Every report goes into `application.history` | blockchain contract | Same audit trail as every official action |

That last point is the whole point: **the AI can make a bad file cost more effort. It can never
grant a right.**

---

## 5. System 1 vs System 2 — the two-speed design

### 5.0 Wait — what is a "System 1 model"? (explain like I am new)

The idea comes from a famous book by Daniel Kahneman ("Thinking, Fast and Slow").

- **System 1** = fast, automatic, pattern-matching. Like recognizing a face or reading a word.
  It is always on, cheap, and quick.
- **System 2** = slow, careful, deliberate. Like solving a math problem. It costs more and takes
  longer, so you use it only when you need to.

In AI terms:
- A **System 1 model** makes quick, cheap decisions by pattern matching. It is small and fast.
- A **System 2 model** does slow, careful reasoning. It is bigger and more expensive.

**"System 1" is not just a marketing label.** For our project, it means a **speed and cost target**:

| | System 1 (fast tier) | System 2 (slow tier) |
| --- | --- | --- |
| Runs on | **every** document, no matter what | only the hard cases (target: under 5%) |
| Speed target | **under 2 seconds**, runs on a normal CPU | 10–60 seconds, needs a GPU |
| Cost | about $0 (runs on your own machine, open-source model) | $0.003–$0.05 per call (GPU or hosted API) |
| Model size | small (0.5B–4B parameters), or a non-AI classifier | bigger (8B–30B parameters), or a hosted big model |
| Must be repeatable? | **Yes** — same input gives same output (temperature 0, fixed model) | No — the output is a draft for a human |
| Privacy | must run on your own machine (PII like Aadhaar, deeds) | better inside a secure hardware box, or with a no-retention hosted API |
| If it is wrong | a wrong field → flagged as low-confidence, human looks | a wrong reason → a human reads it anyway |
| What goes on the ledger | structured data + confidence numbers | text + citations (usually NOT saved, or saved as a draft) |

**The money math:** If every document needs slow reasoning-grade AI, you pay System 2 cost for
every single transaction. If System 1 handles 95% and System 2 handles the 5% that System 1 flags,
you cut cost by about **20 times** — and you get a natural "send hard cases to a human" path.
That is exactly the L3 ceiling we want.

### 5.1 What exactly runs on every document (the System 1 fast path)

```python
# ai-service/pipeline.py — the System-1 fast path
async def system1_analyse(doc_bytes: bytes) -> System1Result:
    doc_hash = sha256(doc_bytes)                  # the proof trail starts here

    # ① READ THE DOCUMENT — fast, deterministic, no LLM needed
    ocr = layout_extractor(doc_bytes)             # PaddleOCR / Tesseract / docTR
    fields = field_extractor(ocr)                 # a small trained classifier

    # ② CHECK THE RULES — pure rules, this part must never be a model
    findings = RULEBOOK.check(fields, ledger_record)

    # ③ SPOT TAMPERING — cheap statistical checks, no model needed
    signals = [
        reencode_detector(doc_bytes),             # PDF was re-saved → possible edit
        metadata_anomaly(doc_bytes),
        image_copy_detector(doc_bytes),           # copied from another deed's scan
    ]

    # ④ DECIDE RISK — a small classifier or a tiny LLM, temperature 0
    risk, risk_factors = triage_head(fields, findings, signals)

    # ⑤ WRITE THE SUMMARY — uses a template, every line maps to a finding code
    summary = render_summary(fields, findings, signals)  # NO free-text generation

    return System1Result(
        doc_hash=doc_hash, fields=fields, findings=findings,
        signals=signals, risk=risk, summary=summary,
        escalate = (risk > 0.6
                    or any(f.severity == 'error' for f in findings)
                    or sum(1 for f in fields.values() if f.confidence < 0.85) > 2),
    )
```

**Notice what is missing: no free-text generation.**
Every line in `summary` maps back to a `finding code`. That means a reviewer can always ask
"why did it say this?" and get a clear, deterministic answer. **This is the most important
design rule of the fast tier.**

### 5.2 Which System 1 model to use — Laya first

Here is the key decision for our project.

**We choose Laya.**

| | **Laya** (our choice) | **Jev** (the paid alternative) |
| --- | --- | --- |
| Who makes it | Convai Innovations (open source) | TypeSafe AI (closed, paid) |
| Licence | **Apache 2.0** (free for any use, even commercial) | Closed — you pay to use it |
| Cost | **Free** — download and run it yourself | Paid API — about $42 per billion input tokens; a million decisions costs about $46 at list price |
| What it does | Answers typed questions (choice / score / yes-no), not long text | Same kind of task — typed decisions, not paragraphs |
| Size | Around 421 million parameters (small) | Not open, size not public |
| Runs on your machine? | **Yes** — you can self-host it | No — it is an API only |
| Good for our project? | **Yes** — free, open, self-hostable, made for fast decisions | Works, but costs money and you cannot inspect the model |

**Why Laya fits our project:**

1. **It is free and open.** Apache 2.0 means we can use it, modify it, and even ship it in a
   government-adjacent project without legal problems.
2. **It is built for exactly our kind of task.** Laya does not write paragraphs — it answers
   typed questions like "is this field present? (yes/no)", "what is the risk level? (low/medium/high)",
   "which rule applies? (A/B/C)". That is exactly what most of our System 1 steps need.
3. **You can run it on your own machine.** This matters because our documents contain sensitive
   data (Aadhaar numbers, deed scans). Sending them to a paid API is a privacy risk. Laya runs
   locally, so the data never leaves our system.
4. **It is a real System 1 model.** It was designed from the start to be fast and cheap at
   decision tasks, not a chopped-down chatbot.

**About Jev:** Jev does similar work and is reported to be about 100x faster and cheaper than
a normal LLM on decision tasks. But it is closed and paid. For a college project, paying for Jev
is not necessary when Laya does the same job for free and you can inspect it. We mention Jev here
so the reader understands the category — "System 1 decision models" — and knows that Laya is the
open alternative in that category.

**The honest caution about Laya:** Laya is a decision model, not a full language model. It is
great at "classify this, score this, choose between these options." It is **not** great at
"read this long legal text and write a reasoned paragraph." For that second job, we use a small
LLM in the System 2 tier (see [§5.4](#54-the-system-2-slow-tier-only-for-hard-cases)).

### 5.3 Other small models you could use (2026 list)

If Laya does not fit a specific task, here are other small open models you can consider.
Sizes and licences are from the current landscape (see [§13](#13-reference-reading)).

| Model | Size | Licence | Why it might fit |
| --- | --- | --- | --- |
| **Qwen3-1.7B / 4B** | 1.7B / 4B | Apache 2.0 | Handles many languages, 32K–128K context, runs on a laptop. Good all-round choice for extraction + classification + short grounded answers. |
| **SmolLM3-3B** | 3B | Apache 2.0, fully open | 128K context, open weights AND open data. Best choice if the college/project needs full reproducibility you can audit. |
| **Gemma 4 E2B / E4B** | effective 2B / 4B | open weights | Made for on-device/local use, and can see images directly (not just OCR text). Good if you want the model to look at the scanned page itself. |
| **Ministral 3 3B / 8B** | 3B / 8B | Apache 2.0 | Text + images, 256K context, multilingual. Apache 2.0 makes it safe for government-adjacent use. |
| **Phi-4-mini** | 3.8B | open weights | Strong small reasoner. Good for the System 2 tier on a CPU. |
| **Tiny Aya 3.35B** | 3.35B | **CC-BY-NC-4.0 (non-commercial)** | Good for Indian regional languages. ⚠️ **Not for commercial use** — fine for a college project, a problem if this ever ships for real. Check the licence before using. |

**How to actually run them:**

| Tool | Used for | Notes |
| --- | --- | --- |
| `llama.cpp` + GGUF `Q4_K_M` | Running 1B–4B models on a normal CPU/laptop | Needs about 4–8 GB RAM, no GPU. Good fallback when the lab has no GPU. |
| `Ollama` | Easy development, swapping models | Wraps llama.cpp. Good for trying things out; pin the model hash in the report. |
| ONNX Runtime + a trained classifier | **Steps ① and ③** (reading + tampering check) | 10–50 ms, deterministic, no text generation. This is what should really run on every document. |
| `vLLM` / SGLang | System 2 throughput on a GPU | Batch processing, quantised, exposes an OpenAI-compatible API. |

### 5.4 The most important honest advice

**Most of the System 1 tier does not need a language model at all.**

This is the advice that will make the project both stronger and cheaper:

| Task | The right tool | Why NOT a language model |
| --- | --- | --- |
| Read text from a scan | **OCR** (PaddleOCR / Tesseract / docTR) | A language model reading pixels is worse and 100x more expensive |
| Pull "Survey No." out of a form | **A small trained classifier / regex** | Deterministic, gives a position + confidence, never makes things up |
| Check that shares sum to 100% | **The existing `_validateSharesSum`** | Already perfect. Do not touch it. |
| "Is this PDF re-saved?" | **Byte/metadata checks** | Not a language task at all |
| "Is owner X the same person as Y?" | **Fuzzy match + Aadhaar checksum** | Deterministic, auditable |
| "Summarise this file for the collector" | **A template** | A template cannot make things up |
| "Which law applies here?" | **RAG + citation, System 2** | **This** is where a model earns its place |
| "Draft a rejection reason" | **System 2 LLM, human edits** | Exactly the 5% path |

**Rule of thumb:**
> If the output is a **data field** (a number, a name, a code) → use a classifier.
> If the output is **text that a human reads** → use a language model.

Your `ocrData` is data fields — it needs classifiers. Your "why is this flagged" panel is text
a human reads — that is where a small language model earns its cost.

**Where a language model DOES earn its place in the fast tier:**
- As a **router** that reads messy free text and picks the right rule set (for example: is this a
  *sale deed*, a *gift deed*, or a *mutation*? Each one needs different checks).
- As the **natural-language search** interface for the database (so an official can type
  "show me joint cases pending at Collectorate").

### 5.5 The System 2 slow tier — only for hard cases

This tier runs only when `system1.escalate == True` (the fast tier could not clear the case).

```python
# ai-service/system2.py — slow reasoning, only for escalated cases
async def system2_escalate(app_id: str, s1: System1Result, question: str | None) -> System2Result:
    # ① FIRST, look up the relevant law. Never let the model answer from memory.
    ctx = rag.retrieve(query=question or s1.summary,
                       corpus=CORPUS,          # laws + state rules + department procedures
                       top_k=6)

    # ② THEN reason, using only the text we just looked up.
    draft = llm(prompt=GROUNDED_REVIEW_PROMPT,
                messages=[{"role": "system", "content": ctx.as_prompt()},
                          {"role": "user",   "content": s1.serialise()}],
                temperature=0,                 # repeatable drafts
                model=os.environ["SYSTEM2_MODEL"])

    # ③ Hard rule: every legal claim must cite a source that is actually in ctx.
    citations = extract_citations(draft)
    unsupported = [c for c in citations if c not in ctx.supported_ids]
    if unsupported:
        return System2Result(status="rejected", reason="citations_not_found",
                             citations=citations)

    return System2Result(status="draft", draft=draft, citations=citations,
                         requires_officer=True)
```

**What goes into the law lookup (the RAG corpus):**
This is the real intellectual work, and it is what makes the module presentable.
Indian land law and procedure, in a readable digital form:

- Transfer of Property Act 1882
- Indian Registration Act 1908
- Bharatiya Sakshya Adhiniyam 2023 — sections 57 and 61 deal with electronic records
  (see [§10](#10-rules-and-laws-the-part-you-cannot-skip))
- Indian Contract Act 1872
- The Stamp Act 1899 and your state's stamp schedule
- RERA 2016 framework
- Your own state's land-record manual and department circulars
- Supreme Court decisions on property mutation

Check your retrieval quality against **LegalBench-RAG** — a legal AI benchmark with 6,868
expert-annotated question–answer pairs over a huge law corpus. Do not just eyeball the outputs.
Retrieval quality is what decides whether the answers are grounded.

---

## 6. How to build this — step by step plan

Effort is stated for **one competent developer** working on the existing 3-org test network.

### Phase 0 — Stop the fake numbers (half a day) — *do this first*

Goal: make the existing output honest, even before any real AI exists.

- [ ] Replace the fixed numbers in `_generateAIOCRData` / `_calculateTrustScore` / `ocrMatch`
      with a single `NOT_IMPLEMENTED` marker, so nobody can demo a fake `99.2`.
- [ ] Add a **"Status: this is a design idea, not built yet"** header to
      [M9_AI_OCR_PIPELINE.md](M9_AI_OCR_PIPELINE.md) until Phase 2 lands. A module document
      that describes something that does not exist is the project's biggest risk in evaluation.
- [ ] Add `riskScore: null, aiReviewed: null` to the application data shape, so downstream code
      has a real place to put future values.
- [ ] **Separately** (own commit): fix the hardcoded encryption key and the
      `forwardData.userRole` trust bug from [§1.3](#13-two-other-bugs-worth-fixing-not-about-ai).

**Exit check:** `getApplication` returns no fake intelligence. Nothing else in this plan matters
if the base still lies.

### Phase 1 — Build the AI service skeleton + write reports to the ledger (3–5 days)

```
ai-service/
  pyproject.toml           # fastapi, uvicorn, pydantic, pillow, pypdf, httpx
  app/main.py              # POST /attest, GET /healthz, GET /models
  app/schema.py            # pydantic models == the §4.4 contract, versioned
  app/attest.py            # build + sign the attestation
  app/pipeline.py          # system1_analyse() skeleton returning empty findings
  Dockerfile
  tests/test_attest.py
```

Add this to the blockchain contract
[`land-registration-contract.js`](chaincode/land-registration/lib/land-registration-contract.js):

```js
const AI_ALLOWED_MODELS = ['deed-extract-v1'];   // only grows via contract upgrade

async commitAIAttestation(ctx, applicationId, attestationStr) {
    const cid = new ClientIdentity(ctx.stub);
    // Only the AI orchestrator identity may write AI reports.
    if (cid.getAttributeValue('role') !== 'ai_orchestrator')
        throw new Error('Only the ai_orchestrator identity may commit AI attestations');

    const app = await this._load(ctx, applicationId);
    const att = JSON.parse(attestationStr);

    if (!AI_ALLOWED_MODELS.includes(att.modelId))
        throw new Error(`Model ${att.modelId} is not in the allowed-list`);
    if (att.docHash !== app.docHash)
        throw new Error('Report docHash does not match the ledger document hash');
    if (att.attestedAt < Number(app.createdAt))
        throw new Error('Report predates the application');
    if (Math.floor(ctx.stub.getTxTimestamp().seconds) - att.attestedAt > 3600)
        throw new Error('Report outside the acceptance window');
    if (!att.attestationSignature)
        throw new Error('Report is not signed');

    const key = ctx.stub.createCompositeKey('ai', [applicationId, att.modelVersion]);
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(att)));

    app.aiRisk    = this._scoreFromFindings(att);     // deterministic, see §4.4
    app.aiReviewed = att.humanReviewRequired === true;
    app.history.push(this._entry(ctx, 'ai_attestation',
        `model=${att.modelId} risk=${app.aiRisk} review=${app.aiReviewed}`));
    await ctx.stub.putState(applicationId, Buffer.from(JSON.stringify(app)));

    ctx.stub.setEvent('AI_ATTESTATION_RECORDED', Buffer.from(JSON.stringify({
        applicationId, modelId: att.modelId, risk: app.aiRisk, review: app.aiReviewed })));
    return JSON.stringify({ ok: true, risk: app.aiRisk, humanReviewRequired: app.aiReviewed });
}
```

> Note: the timestamp check uses `ctx.stub.getTxTimestamp()` instead of `Date.now()`.
> A non-deterministic clock inside the contract would break agreement across the three peers —
> exactly the failure described in [§4.1](#41-why-not).

Also add a `fabric-api/src/aiRoutes.js` router and register an `ai_orchestrator` identity,
following the same pattern as the existing `fabric-api/src/org1|org2|org3/registerUser.js`.

**Exit check:** an AI report sent by the AI identity lands in a block and shows up in `getHistory`,
**AND** a hand-made fake report (bad signature / wrong `docHash` / unlisted model / stale timestamp)
is **rejected by the contract**. Test both. This is your strongest demo —
*"the ledger refuses a fake AI report"* is a much better story than *"we used AI."*

### Phase 2 — Real System 1 models (1–2 weeks)

1. **Build the document set.** About 200–500 real (redacted) deeds, plus the synthetic templates
   already in the repo — [property_deed.html](property_deed.html), [aadhaar_card.html](aadhaar_card.html),
   [survey_boundary_map.html](survey_boundary_map.html),
   [district_collector_order.html](district_collector_order.html). Label the fields you need.
   **This is the bottleneck, not the modelling.**
2. **Read the documents (step ①).** PaddleOCR or Tesseract for text/layout, plus a small trained
   classifier for field extraction. Target **over 95% exact match on the 6 fields you actually use**
   (survey no., area, owner name, village/mandal, document type, date). Do not chase 99%.
3. **Spot tampering (step ③).** Re-encode detection, PDF metadata checks, perceptual-hash duplicate
   detection against the existing `docHash` integrity index. About 100 lines, no model, high signal.
4. **Write the rules (step ②).** Turn every check into a named `code` with a severity. This becomes
   your `ruleFindings` and feeds into `riskScore`.
5. **Decide risk (step ④).** Start with logistic regression or gradient boosting. Reach for a
   0.6B–1.7B language model only if hand-built features are not enough.
6. **Connect it** so Phase 1's `commitAIAttestation` carries real values.

**Exit check:** `extractedFields` are real, `confidence` is calculated (not just typed in), and
a deliberately damaged scan produces `confidence < 0.6` on the damaged field. **Show the failure** —
an AI demo that only shows successes proves nothing.

### Phase 3 — System 2 law lookup + escalation (2 weeks)

1. Load and version the law corpus from [§5.5](#55-the-system-2-slow-tier-only-for-hard-cases);
   split by statute/circular section.
2. Hybrid retrieval (BM25 + embeddings) — legal text has exact section numbers that pure vector
   search often misses.
3. Grounded prompt plus **mandatory citation check** (code above).
4. Check retrieval on held-out LegalBench-RAG-style questions.
5. Show drafts in the **existing role dashboards** (`collector`, `joint-collector`) as
   *"Draft reason — officer must edit and accept."* The `officials` / `survey` API routes and the
   `[role]` dashboard pages are where this fits with minimal new UI.
6. Log every System 2 output with its retrieved chunk IDs — **including the rejected ones**.

**Exit check:** an officer sees a cited draft, edits it, accepts it, and the accepted text plus
its citation set is in `history`. The AI's contribution becomes findable and attributable.

### Phase 4 — Proof-based AI (stretch goal, optional, hard)

| Approach | Speed | Cost per use | What you have to trust | Verdict for us |
| --- | --- | --- | --- | --- |
| **Secure hardware box (TEE)** — Intel TDX/SGX + NVIDIA confidential computing | 100–500 ms | about $1–5 compute | The hardware vendor is honest | ✅ **Best fit.** Prove model hash + input hash; PII stays encrypted in the box. |
| **Math proof (zkML)** — zk-SNARK over the inference | minutes to generate | 100–1000x normal compute; verification ~200K–500K gas | Nothing (it is math) | ⚠️ Tiny models only. A small transformer costs ~2M gas (too much); a 7B model ~500M gas (not possible). 8-bit quantisation cuts cost ~4–8x; combined tricks make **1–10M-parameter** models provable. Your field *classifier* might fit. A full LLM never will. |
| **Optimistic verification** — bond + challenge window | 1–7 days | $0.10–0.50 if unchallenged | Challengers are honest | ✅ Cheap and honest at government volume. Hold high-risk clearance reports for 24–72 hours before treating them as final. |

**Recommendation:** build TEE attestation; *mention* zkML in the report with the numbers above as
the research-grade option. Claiming zkML works for a full LLM is the most common way these projects
lose credibility with reviewers.

### Effort summary

| Phase | Effort | Value | Risk |
| --- | --- | --- | --- |
| Phase 0 — honesty | 0.5 day | **Huge** (removes a fake claim) | None |
| Phase 1 — report plumbing | 3–5 days | High (the architecture is the contribution) | Low |
| Phase 2 — System 1 models | 1–2 weeks | **Highest real value** | Medium (need the document set) |
| Phase 3 — System 2 law lookup | 2 weeks | High (impressive, demo-friendly) | Medium (model may make things up) |
| Phase 4 — proof-based AI | 1–2 weeks | Differentiates you, research-grade | High (needs hardware) |
