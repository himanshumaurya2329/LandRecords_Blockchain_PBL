import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { IncomingMessage } from 'http';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import puppeteer from 'puppeteer';

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
      console.log('Checking MongoDB for pattaHash:', ipfsHash);
      const landRequest = await LandRequest.findOne({ pattaHash: ipfsHash });

      if (landRequest) {
        console.log('Found land request:', landRequest.receiptNumber);

        if (landRequest.pattaHtmlContent) {
          console.log(`✅ Found HTML content in MongoDB (${landRequest.pattaHtmlContent.length} bytes)`);

          if (isPrint) {
            // Generate PDF from HTML
            console.log('Generating PDF from HTML content...');
            console.log('HTML content length:', landRequest.pattaHtmlContent.length);
            console.log('HTML contains table:', landRequest.pattaHtmlContent.includes('<table>'));
            console.log('HTML contains certificate-container:', landRequest.pattaHtmlContent.includes('certificate-container'));
            console.log('HTML contains GOVERNMENT OF TELANGANA:', landRequest.pattaHtmlContent.includes('GOVERNMENT OF TELANGANA'));

            const browser = await puppeteer.launch({
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Added for server environments
                '--disable-gpu'
              ]
            });

            try {
              const page = await browser.newPage();
              console.log('Setting page content...');

              await page.setContent(landRequest.pattaHtmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
              });

              console.log('Page content set, waiting for certificate container...');

              // Wait for the certificate container to be rendered
              await page.waitForSelector('.certificate-container', { timeout: 5000 });

              console.log('Certificate container found, generating PDF...');

              // Generate PDF with proper A4 settings
              const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                  top: '20mm',
                  right: '20mm',
                  bottom: '20mm',
                  left: '20mm'
                },
                printBackground: true,
                preferCSSPageSize: true,
                timeout: 30000
              });

              await browser.close();

              console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

              return new NextResponse(pdfBuffer, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `attachment; filename="patta-${landRequest.certificateNumber || ipfsHash}.pdf"`,
                  'Cache-Control': 'public, max-age=31536000',
                },
              });
            } catch (pdfError) {
              console.error('PDF generation failed:', pdfError);
              await browser.close();
              // Fall back to HTML if PDF generation fails
              console.log('Falling back to HTML display due to PDF generation failure');
            }
          }

          // Add print CSS to convert HTML to PDF-ready format
          const htmlWithPrintCSS = landRequest.pattaHtmlContent.replace(
            '</head>',
            `<style>
              @media print {
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; }
              }
            </style>
            <script>
              window.onload = function() {
                // Auto-trigger print dialog for PDF generation
                if (window.location.search.includes('print=true')) {
                  window.print();
                }
              };
            </script>
            </head>`
          );

          return new NextResponse(htmlWithPrintCSS, {
            headers: {
              'Content-Type': 'text/html',
              'Content-Disposition': `inline; filename="patta-${ipfsHash}.html"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        } else {
          console.log('Land request found but no pattaHtmlContent');
        }
      } else {
        console.log('No land request found with pattaHash:', ipfsHash);
      }
    } catch (dbError) {
      console.error('MongoDB lookup failed:', dbError);
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
      const fs = require('fs');
      const path = require('path');
      const samplePath = path.resolve(process.cwd(), 'public', 'sample-land-document.png');

      if (fs.existsSync(samplePath)) {
        const buffer = fs.readFileSync(samplePath);
        return new NextResponse(buffer, {
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
