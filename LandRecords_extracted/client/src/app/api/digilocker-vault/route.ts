import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import DigiLockerVault from '@/lib/models/DigiLockerVault';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'view';

    // If an ID is provided, stream the document directly (view or download)
    if (id) {
      const doc = await DigiLockerVault.findById(id);
      if (!doc || !doc.fileData) {
        return NextResponse.json({ error: 'Document or file data not found' }, { status: 404 });
      }

      const base64Data = doc.fileData.includes(',') ? doc.fileData.split(',')[1] : doc.fileData;
      const buffer = Buffer.from(base64Data, 'base64');
      const disposition = action === 'download' ? 'attachment' : 'inline';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${doc.fileName || 'document.pdf'}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    const aadhar = searchParams.get('aadhar');
    const email = searchParams.get('email');
    if (!aadhar && !email) {
      return NextResponse.json({ error: 'Aadhar, email, or id required' }, { status: 400 });
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
