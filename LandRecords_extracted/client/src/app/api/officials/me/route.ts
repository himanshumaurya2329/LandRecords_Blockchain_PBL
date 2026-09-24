import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Official from '@/lib/models/Official';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    console.log('Session token from cookie:', sessionToken ? 'Present' : 'Missing');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated - no session token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get official from session using sessionToken
    const Session = require('@/lib/models/Session').default;
    const session = await Session.findOne({ 
      sessionToken,
      expiresAt: { $gt: new Date() }
    });

    console.log('Session found:', session ? 'Yes' : 'No');
    console.log('Session officialId:', session?.officialId);

    if (!session || !session.officialId) {
      return NextResponse.json(
        { error: 'Session not found or not an official session' },
        { status: 401 }
      );
    }

    const official = await Official.findById(session.officialId).select('-password');

    console.log('Official found:', official ? 'Yes' : 'No');

    if (!official) {
      return NextResponse.json(
        { error: 'Official not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      official: {
        _id: official._id,
        firstName: official.firstName,
        lastName: official.lastName,
        email: official.email,
        designation: official.designation,
        officeId: official.officeId,
        department: official.department
      }
    });
  } catch (error) {
    console.error('Error fetching official data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
