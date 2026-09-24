import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const receiptNumber = searchParams.get('receipt');

        if (!receiptNumber) {
            return NextResponse.json({ error: 'Receipt number required' }, { status: 400 });
        }

        await connectDB();
        const landRequest = await LandRequest.findOne({ receiptNumber });

        if (!landRequest) {
            return NextResponse.json({ error: 'Land request not found' }, { status: 404 });
        }

        // Generate HTML for the land request form
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Land Request Application Form - ${landRequest.receiptNumber}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { 
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .header h2 {
      margin: 10px 0 0 0;
      font-size: 20px;
      font-weight: normal;
    }
    .receipt-box {
      background: #f0f0f0;
      border: 2px solid #000;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .receipt-box .label {
      font-size: 12px;
      font-weight: bold;
    }
    .receipt-box .number {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 5px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      background: #333;
      color: #fff;
      padding: 10px;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 15px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .field-row {
      display: flex;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .field-label {
      font-weight: bold;
      width: 200px;
      padding-right: 20px;
    }
    .field-value {
      flex: 1;
      border-bottom: 1px solid #333;
      padding-bottom: 2px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #000;
      text-align: center;
      font-size: 12px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>E-Land Records System</h1>
    <h2>Land Request Application Form</h2>
  </div>

  <div class="receipt-box">
    <div class="label">APPLICATION RECEIPT NUMBER</div>
    <div class="number">${landRequest.receiptNumber}</div>
  </div>

  <div class="section">
    <div class="section-title">APPLICANT INFORMATION</div>
    <div class="field-row">
      <div class="field-label">Full Name:</div>
      <div class="field-value">${landRequest.fullName || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Email Address:</div>
      <div class="field-value">${landRequest.email || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Phone Number:</div>
      <div class="field-value">${landRequest.phoneNumber || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Aadhar Number:</div>
      <div class="field-value">${landRequest.aadharNumber || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Date of Birth:</div>
      <div class="field-value">${landRequest.dob ? new Date(landRequest.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">LAND DETAILS</div>
    <div class="field-row">
      <div class="field-label">Owner Name:</div>
      <div class="field-value">${landRequest.ownerName || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Survey Number:</div>
      <div class="field-value">${landRequest.surveyNumber || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Area:</div>
      <div class="field-value">${landRequest.area || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Nature of Record:</div>
      <div class="field-value" style="text-transform: capitalize;">${landRequest.nature || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ADDRESS INFORMATION</div>
    <div class="field-row">
      <div class="field-label">Address:</div>
      <div class="field-value">${landRequest.address || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">City:</div>
      <div class="field-value">${landRequest.city || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">State:</div>
      <div class="field-value">${landRequest.state || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Pincode:</div>
      <div class="field-value">${landRequest.pincode || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">APPLICATION STATUS</div>
    <div class="field-row">
      <div class="field-label">Current Status:</div>
      <div class="field-value" style="text-transform: uppercase;">${landRequest.status || 'N/A'}</div>
    </div>
    <div class="field-row">
      <div class="field-label">Submission Date:</div>
      <div class="field-value">${new Date(landRequest.createdAt).toLocaleDateString('en-GB')} at ${new Date(landRequest.createdAt).toLocaleTimeString('en-GB')}</div>
    </div>
    <div class="field-row">
      <div class="field-label">IPFS Document Hash:</div>
      <div class="field-value" style="font-size: 10px; word-break: break-all;">${landRequest.ipfsHash || 'N/A'}</div>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Applicant Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Official Signature</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>E-Land Records System</strong></p>
    <p>This is a computer-generated document. For verification, please use the receipt number: <strong>${landRequest.receiptNumber}</strong></p>
    <p>Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
  </div>
</body>
</html>
    `;

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true
        });

        await browser.close();

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="E-Land-Receipt-${landRequest.receiptNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        );
    }
}
