import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiptNumber } = body;

    if (!receiptNumber) {
      return NextResponse.json(
        { error: 'Receipt number is required' },
        { status: 400 }
      );
    }

    // Get the land request
    const landRequest = await LandRequest.findOne({ receiptNumber });
    
    if (!landRequest) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (!landRequest.pattaHash) {
      return NextResponse.json(
        { error: 'No Patta certificate exists for this application' },
        { status: 400 }
      );
    }

    // Call the generate endpoint to regenerate with HTML content
    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/patta/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId: landRequest._id.toString() }),
    });

    if (generateResponse.ok) {
      const pattaData = await generateResponse.json();
      
      return NextResponse.json({
        success: true,
        message: 'Patta certificate regenerated successfully with HTML content',
        certificateNumber: pattaData.certificateNumber,
        ipfsHash: pattaData.ipfsHash,
      });
    } else {
      const errorText = await generateResponse.text();
      console.error('Failed to regenerate Patta:', errorText);
      return NextResponse.json(
        { error: 'Failed to regenerate Patta certificate' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error regenerating Patta:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
