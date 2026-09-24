import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import Official from '@/lib/models/Official';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const receiptNumber = request.nextUrl.searchParams.get('receipt');

    if (!receiptNumber) {
      return NextResponse.json(
        { message: 'Receipt number is required' },
        { status: 400 }
      );
    }

    // Find the land request
    const landRequest = await LandRequest.findOne({ receiptNumber });
    
    if (!landRequest) {
      return NextResponse.json(
        { message: 'Request not found' },
        { status: 404 }
      );
    }

    // If currentlyWith exists, fetch the official details
    let officialDetails = null;
    if (landRequest.currentlyWith) {
      try {
        officialDetails = await Official.findById(landRequest.currentlyWith);
      } catch (err) {
        console.log('Could not fetch official:', err);
      }
    }

    return NextResponse.json({
      receiptNumber: landRequest.receiptNumber,
      status: landRequest.status,
      currentlyWithId: landRequest.currentlyWith,
      currentlyWithName: officialDetails ? `${officialDetails.firstName} ${officialDetails.lastName}` : 'N/A',
      email: landRequest.email,
      surveyNumber: landRequest.surveyNumber,
      createdAt: landRequest.createdAt,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch request details' },
      { status: 500 }
    );
  }
}
