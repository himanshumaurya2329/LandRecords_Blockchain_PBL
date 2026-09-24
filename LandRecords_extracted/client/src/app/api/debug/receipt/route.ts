import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const receiptNumber = request.nextUrl.searchParams.get('receipt');

    if (!receiptNumber) {
      return NextResponse.json(
        { message: 'Receipt number required' },
        { status: 400 }
      );
    }

    const landRequest = await LandRequest.findOne({ receiptNumber });

    if (!landRequest) {
      return NextResponse.json(
        { message: 'Land request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      receiptNumber: landRequest.receiptNumber,
      ipfsHash: landRequest.ipfsHash,
      status: landRequest.status,
      currentlyWith: landRequest.currentlyWith,
      email: landRequest.email,
      fullName: landRequest.fullName,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch' },
      { status: 500 }
    );
  }
}
