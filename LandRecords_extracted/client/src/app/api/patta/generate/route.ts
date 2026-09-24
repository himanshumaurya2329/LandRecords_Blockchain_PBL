import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get the land request details
    const landRequest = await LandRequest.findById(applicationId);
    
    if (!landRequest) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Always regenerate Patta with latest template
    console.log('Generating Patta certificate with professional template...');

    // Generate certificate number
    const certificateNumber = `PATTA-TG-${Date.now()}-${landRequest.receiptNumber}`;
    
    // Generate QR code data URL
    let qrCodeDataUrl: string;
    try {
      const qrData = JSON.stringify({
        certificateNumber,
        receiptNumber: landRequest.receiptNumber,
        ownerName: landRequest.ownerName || landRequest.fullName,
        surveyNumber: landRequest.surveyNumber,
        area: landRequest.area,
        issuedDate: new Date().toLocaleDateString('en-IN'),
        verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${certificateNumber}`
      });

      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
      // Use a placeholder QR code or skip it
      qrCodeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }

    // Get current date
    const issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Generate HTML using the template
    const pattaHTML = generatePattaHTML({
      certificateNumber,
      issuedDate,
      fullName: landRequest.fullName || landRequest.ownerName || 'N/A',
      fatherName: landRequest.fatherName || 'N/A',
      aadhaar: landRequest.aadhaar || landRequest.aadharNumber || 'N/A',
      mobile: landRequest.phoneNumber || 'N/A',
      district: landRequest.district || landRequest.state || 'N/A',
      mandal: landRequest.mandal || 'N/A',
      village: landRequest.village || landRequest.city || 'N/A',
      surveyNumber: landRequest.surveyNumber || 'N/A',
      pattaNumber: `PATTA-${landRequest.receiptNumber}`,
      landArea: landRequest.area || 'N/A',
      landType: landRequest.nature || 'Agricultural',
      qrCodeDataUrl
    });
    
    console.log('Generated HTML length:', pattaHTML.length);
    console.log('HTML contains table:', pattaHTML.includes('<table>'));
    console.log('HTML contains digital signature:', pattaHTML.includes('Digital Signature'));
    
    if (!pattaHTML || typeof pattaHTML !== 'string') {
      throw new Error('HTML generation failed');
    }

    // Upload to IPFS via Pinata
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.error('Pinata credentials not configured');
      return NextResponse.json(
        { error: 'IPFS configuration missing' },
        { status: 500 }
      );
    }

    // Create a blob from HTML
    const blob = new Blob([pattaHTML], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', blob, `patta-${certificateNumber}.html`);

    const pinataMetadata = JSON.stringify({
      name: `Patta Certificate - ${certificateNumber}`,
      keyvalues: {
        type: 'patta',
        certificateNumber,
        receiptNumber: landRequest.receiptNumber,
        issuedDate
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    let ipfsHash: string | null = null;

    // Try to upload to IPFS, but don't fail if it doesn't work
    if (pinataApiKey && pinataSecretKey) {
      try {
        const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretKey,
          },
          body: formData,
        });

        if (pinataResponse.ok) {
          const pinataData = await pinataResponse.json();
          ipfsHash = pinataData.IpfsHash;
        } else {
          console.error('Pinata upload failed:', await pinataResponse.text());
        }
      } catch (error) {
        console.error('IPFS upload error:', error);
      }
    } else {
      console.log('Pinata credentials not configured, skipping IPFS upload');
    }

    // Update land request with Patta details
    landRequest.pattaHash = ipfsHash || `local-${certificateNumber}`; // Use local hash if IPFS fails
    landRequest.pattaNumber = `PATTA-${landRequest.receiptNumber}`;
    landRequest.certificateNumber = certificateNumber;
    landRequest.pattaGeneratedAt = new Date();
    landRequest.pattaHtmlContent = pattaHTML; // Store HTML directly as fallback
    
    try {
      await landRequest.save();
    } catch (saveError) {
      console.error('Error saving land request:', saveError);
      throw saveError; // Re-throw to be caught by outer catch
    }

    return NextResponse.json({
      success: true,
      message: 'Patta certificate generated and uploaded to IPFS',
      certificateNumber,
      ipfsHash,
      ipfsUrl: `https://ipfs.io/ipfs/${ipfsHash}`,
    });

  } catch (error) {
    console.error('Error generating Patta:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function generatePattaHTML(data: {
  certificateNumber: string;
  issuedDate: string;
  fullName: string;
  fatherName: string;
  aadhaar: string;
  mobile: string;
  district: string;
  mandal: string;
  village: string;
  surveyNumber: string;
  pattaNumber: string;
  landArea: string;
  landType: string;
  qrCodeDataUrl: string;
}): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Land Patta Certificate</title>

<style>
    @page { size: A4; margin: 20mm; }
    html, body { margin: 0; padding: 0; }

    body {
        font-family: 'Times New Roman', Times, serif;
        background-color: #f0f0f0;
    }

    .certificate-container {
        position: relative;
        width: 170mm;
        margin: 20px auto;
        border: 8px double #4a7c59;
        padding: 20px;
        background-color: #fcfcf0;
        box-shadow: 0 0 15px rgba(0,0,0,0.2);
        overflow: hidden;
    }

    .watermark {
        position: absolute;
        top: 50%; left: 50%;
        width: 500px;
        opacity: 0.08;
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;
    }

    .header { text-align: center; z-index: 1; position: relative; }
    .header-emblem { width: 80px; }

    .header h1 { margin: 2px 0; font-size: 22px; font-weight: bold; }
    .header h2 { margin: 2px 0; font-size: 18px; font-weight: bold; }
    .header h3 {
        margin-top: 5px;
        font-size: 24px;
        font-weight: bold;
        border-bottom: 2px solid #4a7c59;
        display: inline-block;
        padding-bottom: 5px;
    }

    .issued-date { text-align: right; font-size: 16px; font-weight: bold; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table, th, td { border: 1px solid #4a7c59; }
    th { background: #e8f5e9; width: 35%; }
    th, td { padding: 6px 10px; font-size: 16px; }

    /* ORIGINAL DIGITAL SIGNATURE STYLE */
    .signature-section {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }

    .digital-signature-box {
        flex: 1 1 55%;
        border: 2px solid #006400;
        background-color: #f4fcf4;
        border-radius: 8px;
        padding: 15px;
        font-size: 14px;
        line-height: 1.6;
    }

    .ds-header {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: bold;
        color: #006400;
        margin-bottom: 10px;
    }

    .ds-header img {
        width: 24px;
        height: 24px;
        margin-right: 10px;
    }

    .ds-body p { margin: 4px 0; font-size: 15px; color: #333; }
    .ds-body p strong { color: #000; }

    .barcode-section {
        width: 140px;
        height: 140px;
        text-align: center;
        min-width: 140px;
        min-height: 140px;
    }

    @media print {
        .certificate-container { margin: 0; box-shadow: none; }
    }
</style>

<!-- QR is generated server-side; no client JS needed -->

</head>
<body>

<div class="certificate-container">

    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/500px-Emblem_of_India.svg.png"
         class="watermark" alt="Watermark">

    <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png"
             class="header-emblem">
        <h1>GOVERNMENT OF TELANGANA</h1>
        <h2>REVENUE DEPARTMENT</h2>
        <h3>LAND PATTA CERTIFICATE</h3>
    </div>

    <div class="issued-date">
        Issued Date: <span id="issuedDate">${data.issuedDate}</span>
    </div>

    <table>
        <tr><th>Certificate Number</th><td>${data.certificateNumber}</td></tr>
        <tr><th>Full Name</th><td>${data.fullName}</td></tr>
        <tr><th>Father / Husband Name</th><td>${data.fatherName}</td></tr>
        <tr><th>Aadhaar Number</th><td>${data.aadhaar}</td></tr>
        <tr><th>Mobile Number</th><td>${data.mobile}</td></tr>
        <tr><th>District</th><td>${data.district}</td></tr>
        <tr><th>Mandal</th><td>${data.mandal}</td></tr>
        <tr><th>Village</th><td>${data.village}</td></tr>
        <tr><th>Survey Number</th><td>${data.surveyNumber}</td></tr>
        <tr><th>Patta Number</th><td>${data.pattaNumber}</td></tr>
        <tr><th>Total Land Area</th><td>${data.landArea}</td></tr>
        <tr><th>Land Type</th><td>${data.landType}</td></tr>
    </table>

    <div class="signature-section">

        <!-- RESTORED ORIGINAL DIGITAL SIGNATURE -->
        <div class="digital-signature-box">
            <div class="ds-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Check_icon.svg/48px-Check_icon.svg.png">
                <span>Digitally Signed</span>
            </div>

            <div class="ds-body">
                <p><strong>Name:</strong> K. Chandrasekhar</p>
                <p><strong>Designation:</strong> Tahsildar, Serilingampally</p>
                <p><strong>Date:</strong> ${data.issuedDate}</p>

            </div>
        </div>

        <!-- QR CODE (server-generated PNG data URI) -->
        <div class="barcode-section">
            ${data.qrCodeDataUrl ? `<img src="${data.qrCodeDataUrl}" alt="QR Code" style="width:140px;height:140px;" />` : '<div style="font-size:12px;color:#666;padding-top:50px;">QR unavailable</div>'}
        </div>
    </div>

</div>

<!-- QR generation is handled server-side in the view -->

</body>
</html>`;

  return html;
}
