import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const receipt = searchParams.get('receipt');

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt number is required' },
        { status: 400 }
      );
    }

    const landRequest = await LandRequest.findOne({ receiptNumber: receipt });
    
    if (!landRequest) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(landRequest);

  } catch (error) {
    console.error('Error fetching land request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
