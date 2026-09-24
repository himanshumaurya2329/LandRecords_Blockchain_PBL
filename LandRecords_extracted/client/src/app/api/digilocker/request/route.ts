import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import DigiLockerRequest from '@/lib/models/DigiLockerRequest';
import DigiLockerVault from '@/lib/models/DigiLockerVault';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { aadharNumber, receiptNumber, officialId, officialName, designation, documentType } = await req.json();

    const vault = await DigiLockerVault.findOne({
      citizenAadhar: aadharNumber,
      documentType: documentType || 'land_deed'
    });

    if (!vault) {
      return NextResponse.json({ message: 'No DigiLocker document found for this citizen' }, { status: 404 });
    }

    const existing = await DigiLockerRequest.findOne({
      applicationId: receiptNumber,
      status: { $in: ['pending', 'approved'] }
    });
    if (existing) {
      return NextResponse.json({ message: 'Request already sent', request: existing });
    }

    const request = await DigiLockerRequest.create({
      applicationId: receiptNumber,
      requestedBy: officialId,
      requestedByDesignation: designation,
      citizenUsername: vault.citizenName || vault.citizenEmail || 'citizen',
      citizenEmail: vault.citizenEmail,
      documentType: documentType || 'land_deed',
      ipfsHash: vault.ipfsHash || '',
      status: 'pending'
    });

    return NextResponse.json({ message: 'Document request sent to citizen successfully', request }, { status: 201 });
  } catch (error) {
    console.error('DigiLocker request error:', error);
    return NextResponse.json({ message: 'Failed to create request' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const receiptNumber = searchParams.get('receiptNumber');
    const citizenEmail = searchParams.get('citizenEmail');

    const query: any = {};
    if (receiptNumber) query.applicationId = receiptNumber;
    if (citizenEmail) query.citizenEmail = citizenEmail;

    const requests = await DigiLockerRequest.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch requests' }, { status: 500 });
  }
}
