import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Session from '@/lib/models/Session';
import Official from '@/lib/models/Official';
import LandRequest from '@/lib/models/LandRequest';
import { getAssignedStatusesForRole } from '@/lib/utils/workflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const receiptNumber = String(body.receiptNumber || '').slice(0, 80);
    const result = body.result || {};
    if (!receiptNumber || result.model !== 'convaiinnovations/laya-typed-decisions') {
      return NextResponse.json({ message: 'A valid application and Laya assessment are required.' }, { status: 400 });
    }

    const sessionToken = (await cookies()).get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ message: 'Sign in as an official to escalate this case.' }, { status: 401 });
    await connectDB();
    const session = await Session.findOne({ sessionToken, expiresAt: { $gt: new Date() }, officialId: { $exists: true } });
    if (!session?.officialId) return NextResponse.json({ message: 'Official session not found.' }, { status: 401 });
    const official = await Official.findById(session.officialId).select('designation firstName lastName');
    if (!official) return NextResponse.json({ message: 'Official account not found.' }, { status: 401 });

    const role = String(official.designation || '').toLowerCase().trim();
    const normalized = role.replace(/[\s_-]/g, '');
    const assigned = normalized === 'admin' ? null : getAssignedStatusesForRole(role);
    const query: Record<string, unknown> = { receiptNumber };
    if (assigned) query.status = { $in: assigned.map((status) => new RegExp(`^${status}$`, 'i')) };
    const application = await LandRequest.findOne(query);
    if (!application) return NextResponse.json({ message: 'Application not found in your assigned stage.' }, { status: 404 });

    application.set({
      humanReviewRequested: true,
      humanReviewNote: `Laya ${String(result.task || 'assessment').slice(0, 40)}: ${String(result.assessment || 'review required').slice(0, 60)}${Array.isArray(result.reasons) && result.reasons.length ? ` — ${result.reasons.slice(0, 3).map((x: unknown) => String(x).slice(0, 120)).join('; ')}` : ''}`.slice(0, 500),
      humanReviewBy: `${official.firstName} ${official.lastName}`.trim(),
      humanReviewAt: new Date(),
      lastAiAssessment: {
        model: result.model,
        task: String(result.task || '').slice(0, 50),
        assessment: String(result.assessment || '').slice(0, 60),
        confidence: typeof result.confidence === 'number' && Number.isFinite(result.confidence) ? Math.max(0, Math.min(1, result.confidence)) : null,
      },
    });
    await application.save();
    return NextResponse.json({ message: 'Human review flag added.', humanReviewRequested: true });
  } catch (cause) {
    console.error('Human escalation failed:', cause instanceof Error ? cause.message : 'unknown error');
    return NextResponse.json({ message: 'Could not save the human review request.' }, { status: 500 });
  }
}
