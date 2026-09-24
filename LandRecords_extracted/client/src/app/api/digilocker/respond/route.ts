import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import DigiLockerRequest from '@/lib/models/DigiLockerRequest';
import DigiLockerVault from '@/lib/models/DigiLockerVault';
import crypto from 'crypto';

async function uploadToIPFS(fileData: string, fileName: string): Promise<{ ipfsHash: string; contentHash: string }> {
  const pinataApiKey = process.env.PINATA_API_KEY || '';
  const pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
  const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
  const buffer = Buffer.from(base64Data, 'base64');

  // Calculate SHA-256 Hash for M7 integrity check
  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const metaStr = JSON.stringify({ name: fileName });

  const bodyParts: Buffer[] = [];
  bodyParts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`
  ));
  bodyParts.push(buffer);
  bodyParts.push(Buffer.from(
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="pinataMetadata"\r\n\r\n${metaStr}\r\n--${boundary}--\r\n`
  ));
  const body = Buffer.concat(bodyParts);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey,
    },
    body: body
  });

  const data = await response.json();
  if (!data.IpfsHash) throw new Error('Pinata error: ' + JSON.stringify(data));
  return { ipfsHash: data.IpfsHash, contentHash };
}

async function recordOnBlockchain(ipfsHash: string, contentHash: string, requestId: string, aadharNumber: string, officialId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FABRIC_API_URL}/api/land/digilocker/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipfsHash, contentHash, requestId, aadharNumber, officialId })
    });
    if (response.ok) {
      const data = await response.json();
      return data.txId || 'recorded';
    }
  } catch (err) {
    console.log('Blockchain record failed, continuing:', err);
  }
  return 'local-only';
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { requestId, action } = await req.json();

    if (!requestId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const request = await DigiLockerRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (action === 'rejected') {
      await DigiLockerRequest.findByIdAndUpdate(requestId, {
        status: 'rejected',
        respondedAt: new Date(),
        citizenResponse: 'Access denied'
      });
      return NextResponse.json({ success: true, message: 'Request rejected' });
    }

    // action === 'approved'
    // Step 1: Get document from vault
    const vault = await DigiLockerVault.findOne({
      citizenAadhar: { $exists: true },
      documentType: request.documentType
    });

    // Find vault by aadhar (from land request)
    const landRequest = await (await import('@/lib/models/LandRequest')).default.findOne({
      receiptNumber: request.applicationId
    });
    const aadhar = landRequest?.aadharNumber || '';
    const vaultDoc = await DigiLockerVault.findOne({
      citizenAadhar: aadhar,
      documentType: request.documentType
    });

    if (!vaultDoc || !vaultDoc.fileData) {
      return NextResponse.json({ error: 'Document not found in vault' }, { status: 404 });
    }

    // Step 2: Upload to IPFS and Generate Integrity Hash
    let ipfsHash = '';
    let contentHash = '';
    try {
      const result = await uploadToIPFS(vaultDoc.fileData, vaultDoc.fileName);
      ipfsHash = result.ipfsHash;
      contentHash = result.contentHash;

      // Save hashes back to vault for M7 accountability
      vaultDoc.ipfsHash = ipfsHash;
      vaultDoc.docHash = contentHash;
      await vaultDoc.save();
    } catch (err) {
      console.error('IPFS upload/hash failed:', err);
      return NextResponse.json({ error: 'Failed to secure document to IPFS' }, { status: 500 });
    }

    // Step 3: Record on blockchain (including the new contentHash)
    const txId = await recordOnBlockchain(
      ipfsHash,
      contentHash,
      requestId,
      vaultDoc.citizenAadhar,
      request.requestedBy
    );

    // Step 4: Update request with ipfsHash, docHash and txId
    const updated = await DigiLockerRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'approved',
        respondedAt: new Date(),
        citizenResponse: 'Access granted',
        ipfsHash: ipfsHash,
        docHash: contentHash
      },
      { new: true }
    );

    console.log('\n==========================================');
    console.log('M7 SECURITY GATEWAY: HASH GENERATED');
    console.log('SHA-256:', contentHash);
    console.log('IPFS Address:', ipfsHash);
    console.log('==========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Document approved and uploaded to IPFS',
      ipfsHash,
      txId,
      data: updated
    });

  } catch (error) {
    console.error('Respond error:', error);
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}
