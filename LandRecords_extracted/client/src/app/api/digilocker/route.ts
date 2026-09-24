import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import DigiLockerRequest from '@/lib/models/DigiLockerRequest';
import { getSessionCookieName } from '@/lib/utils/auth';
import { getSession } from '@/lib/utils/session';

// GET - fetch requests for citizen
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const cookieName = getSessionCookieName();
    const sessionToken = req.cookies.get(cookieName)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const requests = await DigiLockerRequest.find({
      citizenUsername: session.userId
    }).sort({ requestedAt: -1 });
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST - official creates document request
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { applicationId, requestedBy, requestedByDesignation,
            citizenUsername, citizenEmail, documentType, ipfsHash } = body;

    if (!applicationId || !requestedBy || !citizenUsername || !ipfsHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if request already exists
    const existing = await DigiLockerRequest.findOne({
      applicationId, requestedBy, status: 'pending'
    });
    if (existing) {
      return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
    }

    const request = await DigiLockerRequest.create({
      applicationId, requestedBy, requestedByDesignation,
      citizenUsername, citizenEmail, documentType, ipfsHash
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
