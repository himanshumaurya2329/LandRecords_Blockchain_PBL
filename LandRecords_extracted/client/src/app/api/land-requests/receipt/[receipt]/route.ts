import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receipt: string }> }
) {
  try {
    const { receipt } = await params;
    await connectDB();

    const landRequest = await LandRequest.findOne({ receiptNumber: receipt });

    if (!landRequest) {
      return NextResponse.json(
        { message: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      receiptNumber: landRequest.receiptNumber,
      fullName: landRequest.fullName,
      email: landRequest.email,
      phoneNumber: landRequest.phoneNumber,
      aadharNumber: landRequest.aadharNumber,
      dob: landRequest.dob,
      ownerName: landRequest.ownerName,
      surveyNumber: landRequest.surveyNumber,
      area: landRequest.area,
      address: landRequest.address,
      state: landRequest.state,
      city: landRequest.city,
      pincode: landRequest.pincode,
      nature: landRequest.nature,
      ipfsHash: landRequest.ipfsHash,
      status: landRequest.status,
      createdAt: landRequest.createdAt,
    });
  } catch (error) {
    console.error('Fetch receipt error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
