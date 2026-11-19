import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Session from '@/lib/models/Session';
import Official from '@/lib/models/Official';
import { getCurrentUser } from '@/lib/utils/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;
const SERVICE_URL = process.env.LAYA_SERVICE_URL || 'http://127.0.0.1:8765';
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function error(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function requireOfficial(req: NextRequest, task: string) {
  const sessionToken = (await cookies()).get('session_token')?.value;
  if (!sessionToken) return { response: error('Sign in as an authorized official to use this review.', 401) };
  await connectDB();
  const session = await Session.findOne({ sessionToken, expiresAt: { $gt: new Date() }, officialId: { $exists: true } });
  if (!session?.officialId) return { response: error('Official session not found.', 401) };
  const official = await Official.findById(session.officialId).select('designation');
  if (!official) return { response: error('Official account not found.', 401) };
  const role = String(official.designation || '').toLowerCase().replace(/[\s_-]/g, '');
  const allowed = task === 'clerk'
    ? ['clerk', 'superintendent', 'admin'].includes(role)
    : task === 'survey'
      ? ['surveyor', 'surveyofficer', 'admin'].includes(role)
      : ['clerk', 'superintendent', 'surveyor', 'surveyofficer', 'admin'].includes(role);
  if (!allowed) return { response: error('This analysis is not available for your role.', 403) };
  return { role };
}

export async function POST(req: NextRequest) {
  const task = req.nextUrl.searchParams.get('task');
  if (!['document', 'clerk', 'survey'].includes(task || '')) return error('Unknown analysis task.', 400);

  if (task === 'document') {
    const user = await getCurrentUser();
    if (!user) {
      const auth = await requireOfficial(req, 'document');
      if (auth.response) return auth.response;
    }
  } else {
    const auth = await requireOfficial(req, task!);
    if (auth.response) return auth.response;
  }

  try {
    let path: string;
    let payload: Record<string, unknown>;
    if (task === 'document') {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.type !== 'application/pdf') return error('Choose a PDF document.', 400);
      if (file.size < 1 || file.size > MAX_PDF_BYTES) return error('PDF must be 10 MB or smaller.', 413);
      payload = {
        pdfBase64: Buffer.from(await file.arrayBuffer()).toString('base64'),
        ownerName: form.get('ownerName'), surveyNumber: form.get('surveyNumber'), area: form.get('area'),
        city: form.get('city'), state: form.get('state'),
      };
      path = '/analyze/document';
    } else {
      const data = await req.json();
      if (Buffer.byteLength(JSON.stringify(data), 'utf8') > 16_000) return error('Analysis inputs must be 16 KB or smaller.', 413);
      payload = task === 'clerk' ? {
        ownerName: data.ownerName, surveyNumber: data.surveyNumber, area: data.area,
        address: data.address, city: data.city, state: data.state, nature: data.nature,
        flags: Array.isArray(data.flags) ? data.flags.slice(0, 8) : [],
      } : {
        surveyNumber: data.surveyNumber, area: data.area, location: data.location,
        ownerName: data.ownerName, surveyReport: String(data.surveyReport || '').slice(0, 1200),
        boundaryDetails: String(data.boundaryDetails || '').slice(0, 240),
        landClassification: String(data.landClassification || '').slice(0, 160),
      };
      path = task === 'clerk' ? '/analyze/clerk' : '/analyze/survey';
    }

    const response = await fetch(`${SERVICE_URL}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(50_000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ message: result.error || 'Local analysis failed.' }, { status: response.status });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    console.error('Local Laya analysis unavailable:', cause instanceof Error ? cause.message : 'unknown error');
    return error('Local Laya service is unavailable. Continue with the existing workflow and review manually.', 503);
  }
}
