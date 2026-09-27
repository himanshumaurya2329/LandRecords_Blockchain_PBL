import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import DigiLockerVault from '@/lib/models/DigiLockerVault';

export const dynamic = 'force-dynamic';

// Function to fetch content from Pinata Files API (not blocked by firewalls)
async function fetchFromPinataFilesAPI(ipfsHash: string): Promise<Buffer> {
  const pinataJWT = process.env.PINATA_JWT;

  if (!pinataJWT) {
    throw new Error('Pinata JWT not configured');
  }

  // Use Pinata's Files API endpoint instead of gateway
  const url = `https://api.pinata.cloud/data/pinList?status=pinned&hashContains=${ipfsHash}`;

  return new Promise((resolve, reject) => {
    // First, verify the file exists
    const options: https.RequestOptions = {
      hostname: 'api.pinata.cloud',
      port: 443,
      path: `/data/pinList?status=pinned&hashContains=${ipfsHash}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
      timeout: 30000,
    };

    const req = https.request(options, (res: IncomingMessage) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        res.resume();
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (data.rows && data.rows.length > 0) {
            // File exists, now fetch it from public IPFS gateways
            fetchFromPublicGateway(`https://ipfs.io/ipfs/${ipfsHash}`)
              .then(resolve)
              .catch(() => {
                // Try dweb.link as fallback
                fetchFromPublicGateway(`https://dweb.link/ipfs/${ipfsHash}`)
                  .then(resolve)
                  .catch(reject);
              });
          } else {
            reject(new Error('File not found in Pinata'));
          }
        } catch (error) {
          reject(error);
        }
      });

      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Fallback function for public gateways
function fetchFromPublicGateway(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 30000,
      rejectUnauthorized: false, // Disable SSL verification for corporate firewall
    };

    const req = https.request(options, (res: IncomingMessage) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        res.resume();
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    const ipfsHash = request.nextUrl.searchParams.get('hash');
    const isPrint = request.nextUrl.searchParams.get('print') === 'true';

    if (!ipfsHash) {
      return NextResponse.json(
        { message: 'IPFS hash is required' },
        { status: 400 }
      );
    }

    console.log('Fetching document from IPFS:', ipfsHash, 'print mode:', isPrint);

    // Try MongoDB first (fallback for blocked IPFS)
    try {
      await connectDB();

      // Check DigiLockerVault for citizen-uploaded documents (Aadhaar / Land Deed)
      const vaultDoc = await DigiLockerVault.findOne({
        $or: [{ ipfsHash: ipfsHash }, { docHash: ipfsHash }]
      });

      if (vaultDoc && vaultDoc.fileData) {
        console.log(`✅ Found DigiLocker document in MongoDB for hash: ${ipfsHash} (${vaultDoc.fileName})`);
        const base64Data = vaultDoc.fileData.includes(',')
          ? vaultDoc.fileData.split(',')[1]
          : vaultDoc.fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${vaultDoc.fileName || 'document.pdf'}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }

      // Check if this hash belongs to an application whose applicant has documents in DigiLockerVault
      const lrApplicant = await LandRequest.findOne({
        $or: [{ ipfsHash: ipfsHash }, { docHash: ipfsHash }]
      });
      if (lrApplicant && lrApplicant.aadharNumber) {
        const citizenVaultDoc = await DigiLockerVault.findOne({
          citizenAadhar: lrApplicant.aadharNumber,
          documentType: 'land_deed'
        });
        if (citizenVaultDoc && citizenVaultDoc.fileData) {
          console.log(`✅ Found DigiLocker document via applicant Aadhaar: ${lrApplicant.aadharNumber}`);
          const base64Data = citizenVaultDoc.fileData.includes(',')
            ? citizenVaultDoc.fileData.split(',')[1]
            : citizenVaultDoc.fileData;
          const buffer = Buffer.from(base64Data, 'base64');

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${citizenVaultDoc.fileName || 'document.pdf'}"`,
              'Content-Length': buffer.length.toString(),
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      }

      console.log('Checking MongoDB for pattaHash or receipt:', ipfsHash);
      const landRequest = await LandRequest.findOne({
        $or: [
          { pattaHash: ipfsHash },
          { receiptNumber: ipfsHash },
          { certificateNumber: ipfsHash }
        ]
      });

      if (landRequest) {
        console.log('Found land request:', landRequest.receiptNumber);

        if (landRequest.pattaHtmlContent) {
          console.log(`✅ Found HTML content in MongoDB (${landRequest.pattaHtmlContent.length} bytes)`);

          const certTitle = landRequest.certificateNumber || `PATTA-${landRequest.receiptNumber}`;

          // Replace broken wikimedia check icon with crisp inline green checkmark
          let htmlToServe = landRequest.pattaHtmlContent.replace(
            /<img[^>]*Check_icon[^>]*>/gi,
            `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;display:inline-block;vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          );

          // Inject professional toolbar, print styles, and client-side PDF generator (html2pdf)
          const enhancedHtml = htmlToServe.replace(
            '</head>',
            `<style>
              .action-bar-container {
                position: sticky;
                top: 0;
                z-index: 99999;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #ffffff;
                padding: 12px 24px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-bottom: 2px solid #10b981;
              }
              .action-bar {
                max-width: 1000px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 12px;
              }
              .action-bar-info {
                display: flex;
                flex-direction: column;
                gap: 3px;
              }
              .action-bar-title {
                font-size: 15px;
                font-weight: 700;
                letter-spacing: 0.5px;
                color: #f8fafc;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .action-bar-sub {
                font-size: 12px;
                color: #94a3b8;
                font-family: monospace;
              }
              .action-bar-buttons {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .btn-action {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .btn-print {
                background: #2563eb;
                color: #ffffff;
              }
              .btn-print:hover {
                background: #1d4ed8;
                transform: translateY(-1px);
              }
              .btn-download {
                background: #059669;
                color: #ffffff;
              }
              .btn-download:hover {
                background: #047857;
                transform: translateY(-1px);
              }
              @media print {
                .no-print {
                  display: none !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 15mm;
                }
                body {
                  background-color: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .certificate-container {
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border: 8px double #4a7c59 !important;
                }
              }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <script>
              function downloadAsPDF() {
                var btn = document.getElementById('downloadPdfBtn');
                if (btn) btn.innerHTML = '⏳ Generating PDF...';
                var element = document.querySelector('.certificate-container');
                if (!element) {
                  window.print();
                  return;
                }
                var opt = {
                  margin:       [8, 8, 8, 8],
                  filename:     'patta-${certTitle}.pdf',
                  image:        { type: 'jpeg', quality: 0.98 },
                  html2canvas:  { scale: 2, useCORS: true, logging: false },
                  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                if (window.html2pdf) {
                  html2pdf().set(opt).from(element).save().then(function() {
                    if (btn) btn.innerHTML = '⬇️ Download PDF';
                  }).catch(function(err) {
                    console.error('html2pdf error:', err);
                    if (btn) btn.innerHTML = '⬇️ Download PDF';
                    window.print();
                  });
                } else {
                  window.print();
                }
              }

              window.addEventListener('load', function() {
                var params = new URLSearchParams(window.location.search);
                if (params.get('download') === 'pdf' || params.get('download') === 'true') {
                  setTimeout(downloadAsPDF, 700);
                } else if (params.get('print') === 'true') {
                  setTimeout(function() { window.print(); }, 500);
                }
              });
            </script>
            </head>`
          ).replace(
            '<body>',
            `<body>
            <div class="no-print action-bar-container">
              <div class="action-bar">
                <div class="action-bar-info">
                  <span class="action-bar-title">🏛️ Government of Telangana &bull; Official Land Patta Certificate</span>
                  <span class="action-bar-sub">Certificate No: ${certTitle} | Receipt: ${landRequest.receiptNumber}</span>
                </div>
                <div class="action-bar-buttons">
                  <button type="button" onclick="window.print()" class="btn-action btn-print">
                    🖨️ Print / Save as PDF
                  </button>
                  <button type="button" id="downloadPdfBtn" onclick="downloadAsPDF()" class="btn-action btn-download">
                    ⬇️ Download PDF
                  </button>
                </div>
              </div>
            </div>`
          );

          return new NextResponse(enhancedHtml, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Disposition': `inline; filename="patta-${certTitle}.html"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        } else {
          console.log('Land request found but no pattaHtmlContent');
        }
      } else {
        console.log('No land request found with pattaHash/receipt:', ipfsHash);
      }
    } catch (dbError) {
      console.error('MongoDB lookup failed:', dbError);
      try {
        fs.appendFileSync('/tmp/view_error.log', 'DB ERROR: ' + (dbError instanceof Error ? dbError.stack : String(dbError)) + '\n');
      } catch (e) {}
    }

    // Try your dedicated Pinata gateway (with SSL verification disabled for corporate firewall)
    try {
      console.log('Trying dedicated Pinata gateway...');
      const dedicatedGatewayUrl = `https://indigo-tough-toucan-900.mypinata.cloud/ipfs/${ipfsHash}`;
      const buffer = await fetchFromPublicGateway(dedicatedGatewayUrl);

      if (buffer && buffer.length > 0) {
        console.log(`✅ Successfully fetched from dedicated gateway (${buffer.length} bytes)`);

        // Detect content type based on buffer content
        let contentType = 'application/pdf'; // Default for user-uploaded documents
        let filename = `document-${ipfsHash}.pdf`;

        // Check if it's HTML content (for patta certificates)
        const contentStr = buffer.toString('utf8', 0, 100);
        if (contentStr.includes('<html') || contentStr.includes('<!DOCTYPE html')) {
          contentType = 'text/html';
          filename = `patta-${ipfsHash}.html`;
        }

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    } catch (error) {
      console.error('Dedicated gateway failed:', error instanceof Error ? error.message : String(error));
    }

    // Try public IPFS gateways if dedicated gateway fails
    const publicGateways = [
      { url: `https://ipfs.io/ipfs/${ipfsHash}`, name: 'ipfs.io' },
      { url: `https://dweb.link/ipfs/${ipfsHash}`, name: 'dweb.link' },
      { url: `https://cf-ipfs.com/ipfs/${ipfsHash}`, name: 'cloudflare-ipfs' },
      { url: `https://gateway.ipfs.io/ipfs/${ipfsHash}`, name: 'gateway.ipfs.io' },
    ];

    for (const gateway of publicGateways) {
      try {
        console.log(`Trying ${gateway.name}: ${gateway.url}`);
        const buffer = await fetchFromPublicGateway(gateway.url);

        if (buffer && buffer.length > 0) {
          console.log(`✅ Successfully fetched from ${gateway.name} (${buffer.length} bytes)`);

          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="document-${ipfsHash}.pdf"`,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Content-Length': buffer.length.toString(),
            },
          });
        }
      } catch (error) {
        console.error(`❌ ${gateway.name} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    console.error('All IPFS retrieval methods failed. Falling back to local sample for demonstration.');

    // Fallback to local sample image for Demo purposes
    try {
      const samplePath = path.resolve(process.cwd(), 'public', 'sample-land-document.png');

      if (fs.existsSync(samplePath)) {
        const buffer = fs.readFileSync(samplePath);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'inline; filename="sample-land-document.png"',
            'Cache-Control': 'no-store, must-revalidate',
          },
        });
      }
    } catch (fallbackError) {
      console.error('Local fallback also failed:', fallbackError);
    }

    return NextResponse.json(
      { message: 'Failed to fetch document from IPFS. The document may not be available or requires different access permissions.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
