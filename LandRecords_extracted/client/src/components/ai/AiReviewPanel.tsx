'use client';

import { useState } from 'react';
import { FiAlertCircle, FiArrowUpRight, FiCheckCircle, FiCpu, FiLoader } from 'react-icons/fi';

type AiTask = 'document' | 'clerk' | 'survey';
type AiResult = {
  model: string;
  task: string;
  assessment: string | null;
  confidence: number | null;
  confidenceNote: string;
  requiresHumanReview: boolean;
  reasons: string[];
  steps: string[];
  fields?: Record<string, { expected: string; status: string }>;
  textExtracted?: boolean;
  pageCount?: number;
};

const labels: Record<string, string> = {
  routine_review: 'Routine review suggested', needs_review: 'Review recommended', urgent_review: 'Priority review suggested',
  consistent: 'No mismatch detected', mismatch_review: 'Possible mismatch', insufficient_evidence: 'Insufficient evidence',
  match: 'Text appears to match',
};

export default function AiReviewPanel({
  task, fields, file, documentHash, receiptNumber, onHumanReviewIntent,
}: {
  task: AiTask;
  fields: Record<string, string>;
  file?: File | null;
  documentHash?: string;
  receiptNumber?: string;
  onHumanReviewIntent?: (requested: boolean) => void;
}) {
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState('');
  const [escalated, setEscalated] = useState(false);

  const analyze = async () => {
    setError('');
    setResult(null);
    if (task === 'document' && !file && !documentHash) {
      setError('Select a DigiLocker PDF before running the document screen.');
      return;
    }
    setLoading(true);
    try {
      let body: BodyInit;
      const headers: Record<string, string> = {};
      if (task === 'document') {
        let documentFile = file;
        if (!documentFile && documentHash) {
          const documentResponse = await fetch(`/api/documents/view?hash=${encodeURIComponent(documentHash)}`, { cache: 'no-store' });
          if (!documentResponse.ok) throw new Error('Could not retrieve the selected DigiLocker PDF.');
          const documentBlob = await documentResponse.blob();
          if (documentBlob.type && documentBlob.type !== 'application/pdf') throw new Error('Only PDF documents can be screened.');
          documentFile = new File([documentBlob], 'selected-document.pdf', { type: 'application/pdf' });
        }
        if (!documentFile || documentFile.type !== 'application/pdf') throw new Error('The selected vault file is not a PDF.');
        const form = new FormData();
        form.set('file', documentFile);
        Object.entries(fields).forEach(([key, value]) => form.set(key, value));
        body = form;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(fields);
      }
      const response = await fetch(`/api/local-ai/analyze?task=${task}`, { method: 'POST', headers, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Analysis could not be completed.');
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Local analysis is unavailable. Continue with manual review.');
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    if (!receiptNumber || !result) return;
    setEscalating(true);
    setError('');
    try {
      const response = await fetch('/api/local-ai/escalate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber, result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not request human review.');
      setEscalated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not request human review.');
    } finally {
      setEscalating(false);
    }
  };

  const title = task === 'document' ? 'Document screening' : task === 'clerk' ? 'Clerk triage' : 'Survey consistency';
  const assessment = result ? labels[result.assessment || ''] || 'Human review required' : '';
  const confidencePercent = result?.confidence == null ? null : Math.round(result.confidence * 100);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950" aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-100"><FiCpu aria-hidden="true" /></span>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-neutral-100">{title}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Powered by Laya System 1 · local inference</p>
          </div>
        </div>
        <button type="button" onClick={analyze} disabled={loading || (task === 'document' && !file && !documentHash)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">
          {loading ? <><FiLoader className="animate-spin" /> Analyzing</> : 'Run review'}
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-neutral-300 sm:grid-cols-3">
        <p className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-neutral-900">1 · Reduce to relevant facts</p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-neutral-900">2 · Compare against fixed review choices</p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-neutral-900">3 · Route uncertain cases to a person</p>
      </div>

      {task === 'document' && <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-neutral-400">Searchable PDFs only · up to 10 MB and 8 pages. Scanned/image-only PDFs are flagged for manual review. Aadhaar, date of birth, phone and email are not sent to the model.</p>}
      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><FiAlertCircle className="mt-0.5 shrink-0" />{error}</p>}

      {result && <div className="mt-5 border-t border-slate-200 pt-4 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {result.requiresHumanReview ? <FiAlertCircle className="text-amber-700" /> : <FiCheckCircle className="text-emerald-700" />}
            <strong className="text-sm text-slate-900">{assessment}</strong>
          </div>
          {confidencePercent !== null && <span className="text-xs font-medium text-slate-600 dark:text-neutral-300">Raw model score {confidencePercent}%</span>}
        </div>
        {confidencePercent !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-slate-700 dark:bg-neutral-200" style={{ width: `${confidencePercent}%` }} /></div>}
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">{result.confidenceNote || 'Model scores are advisory and not calibrated as legal confidence.'}</p>

        {result.fields && <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {Object.entries(result.fields).map(([name, value]) => <div key={name} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
            <span className="capitalize text-slate-700 dark:text-neutral-200">{name.replace(/([A-Z])/g, ' $1')}</span>
            <span className={`rounded-full px-2 py-1 font-medium ${value.status === 'match' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{value.status.replace('_', ' ')}</span>
          </div>)}
        </div>}
        {result.reasons?.length > 0 && <ul className="mt-3 space-y-1 text-xs text-slate-700">{result.reasons.map((reason, index) => <li key={index}>• {reason}</li>)}</ul>}
        <ol className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">{result.steps.map((step, index) => <li key={index} className="rounded-lg bg-slate-50 p-2 dark:bg-neutral-900">{step}</li>)}</ol>

        {result.requiresHumanReview && task === 'document' && onHumanReviewIntent && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><input type="checkbox" className="mt-1 accent-slate-800" onChange={(event) => onHumanReviewIntent(event.target.checked)} /><span><strong>Request a human document review</strong><br />This request is attached to your application for the assigned official.</span></label>}
        {(task !== 'document' || Boolean(receiptNumber)) && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="max-w-xl text-xs leading-5 text-amber-950">{result.requiresHumanReview ? 'A staff member remains responsible for this decision. Escalation adds a review flag without changing the application stage.' : 'If you want a second staff review, escalate this case. The application stage will not change.'}</p>
          {receiptNumber && <button type="button" disabled={escalating || escalated} onClick={escalate} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 disabled:opacity-60">
            {escalated ? <><FiCheckCircle /> Human review requested</> : escalating ? <><FiLoader className="animate-spin" /> Saving request</> : <>Escalate to staff <FiArrowUpRight /></>}
          </button>}
        </div>}
      </div>}
    </section>
  );
}
