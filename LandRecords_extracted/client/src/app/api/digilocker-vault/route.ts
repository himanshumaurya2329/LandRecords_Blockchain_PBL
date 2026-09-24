import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import DigiLockerVault from '@/lib/models/DigiLockerVault';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const aadhar = searchParams.get('aadhar');
    const email = searchParams.get('email');
    if (!aadhar && !email) {
      return NextResponse.json({ error: 'Aadhar or email required' }, { status: 400 });
    }
    const query = aadhar ? { citizenAadhar: aadhar } : { citizenEmail: email };
    // Don't return fileData (too large) — only metadata
    const documents = await DigiLockerVault.find(query).select('-fileData');
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { citizenAadhar, citizenName, citizenEmail, documentType, fileData, fileName, uploadedBy } = body;
    if (!citizenAadhar || !citizenName || !citizenEmail || !documentType || !fileData || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await DigiLockerVault.findOne({ citizenAadhar, documentType });
    if (existing) {
      existing.fileData = fileData;
      existing.fileName = fileName;
      existing.verifiedAt = new Date();
      existing.ipfsHash = undefined;
      await existing.save();
      return NextResponse.json({ success: true, data: existing, updated: true });
    }
    const doc = await DigiLockerVault.create({
      citizenAadhar, citizenName, citizenEmail,
      documentType, fileData, fileName,
      uploadedBy: uploadedBy || 'government_authority',
      isVerified: true,
      verifiedAt: new Date()
    });
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
