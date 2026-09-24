import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file, fileName } = body;

    if (!file) {
      return NextResponse.json(
        { message: 'File is required' },
        { status: 400 }
      );
    }

    // Remove data:application/pdf;base64, prefix if present
    let base64Data = file;
    if (file.includes(',')) {
      base64Data = file.split(',')[1];
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Create FormData for Pinata
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, fileName || 'document.pdf');

    // Check if Pinata credentials are available
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.warn('Pinata credentials not configured, generating mock IPFS hash');
      // Generate a mock hash for testing
      const mockHash = 'Qm' + Math.random().toString(36).substr(2, 44).toUpperCase();
      return NextResponse.json({
        ipfsHash: mockHash,
        message: 'File uploaded to IPFS (mock)',
      });
    }

    // Upload to Pinata
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
      }
    );

    return NextResponse.json({
      ipfsHash: pinataResponse.data.IpfsHash,
      message: 'File uploaded to IPFS',
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { message: 'Failed to upload to IPFS', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
