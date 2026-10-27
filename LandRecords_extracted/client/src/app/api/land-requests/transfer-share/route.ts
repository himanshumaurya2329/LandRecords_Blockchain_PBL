import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import QRCode from 'qrcode';
import { generatePattaHTML } from '@/app/api/patta/generate/route';
import { getCurrentUser } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiptNumber, fromOwnerId, toOwnerId, sharePercent, newOwnerData } = body;

    if (!receiptNumber || !fromOwnerId || !toOwnerId || !sharePercent) {
      return NextResponse.json(
        { error: 'receiptNumber, fromOwnerId, toOwnerId, and sharePercent are required' },
        { status: 400 }
      );
    }

    const shareNum = parseFloat(sharePercent);
    if (isNaN(shareNum) || shareNum < 1) {
      return NextResponse.json(
        { error: 'Transfer share percentage must be a valid number >= 1%' },
        { status: 400 }
      );
    }

    const application = await LandRequest.findOne({ receiptNumber });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.ownershipType !== 'joint') {
      return NextResponse.json(
        { error: 'Share transfer is only applicable for joint ownership applications' },
        { status: 400 }
      );
    }

    if (application.isDisputed) {
      return NextResponse.json(
        { error: 'Application is frozen due to an active dispute. Cannot transfer shares.' },
        { status: 400 }
      );
    }

    const owners = application.owners || [];
    // Find seller by ownerId or aadhar
    const sellerIdx = owners.findIndex(
      (o: any) => o.ownerId === fromOwnerId || o.aadhar === fromOwnerId
    );

    if (sellerIdx === -1) {
      return NextResponse.json(
        { error: `Seller '${fromOwnerId}' is not found in listed co-owners` },
        { status: 400 }
      );
    }

    if (owners[sellerIdx].sharePercent < shareNum) {
      return NextResponse.json(
        {
          error: `Seller owns ${owners[sellerIdx].sharePercent}% but requested to transfer ${shareNum}%. Insufficient share.`,
        },
        { status: 400 }
      );
    }

    // Check if buyer is an existing co-owner
    const buyerIdx = owners.findIndex(
      (o: any) => o.ownerId === toOwnerId || o.aadhar === toOwnerId
    );

    if (buyerIdx !== -1) {
      // Scenario A: Transfer to existing co-owner
      owners[sellerIdx].sharePercent = Math.round((owners[sellerIdx].sharePercent - shareNum) * 100) / 100;
      owners[buyerIdx].sharePercent = Math.round((owners[buyerIdx].sharePercent + shareNum) * 100) / 100;

      if (owners[sellerIdx].sharePercent === 0) {
        owners.splice(sellerIdx, 1);
      }
    } else {
      // Scenario B: Transfer to a new buyer
      if (!newOwnerData || !newOwnerData.name) {
        return NextResponse.json(
          { error: 'New buyer full name is required for transfer to a new owner' },
          { status: 400 }
        );
      }

      owners[sellerIdx].sharePercent = Math.round((owners[sellerIdx].sharePercent - shareNum) * 100) / 100;

      if (owners[sellerIdx].sharePercent === 0) {
        owners.splice(sellerIdx, 1);
      }

      owners.push({
        ownerId: toOwnerId,
        name: newOwnerData.name,
        aadhar: newOwnerData.aadhar || '',
        sharePercent: shareNum,
        consentStatus: 'consented',
        consentTimestamp: new Date().toISOString(),
        remarks: `Added via share transfer from ${fromOwnerId}.`,
      });
    }

    // Validate total is 100%
    const totalShare = owners.reduce((s: number, o: any) => s + (parseFloat(o.sharePercent) || 0), 0);
    if (Math.abs(totalShare - 100) > 0.05) {
      return NextResponse.json(
        { error: `After transfer, shares must sum to 100%. Got ${totalShare}%` },
        { status: 400 }
      );
    }

    application.owners = owners;
    application.actionHistory = application.actionHistory || [];
    application.actionHistory.push({
      officialId: fromOwnerId,
      officialName: newOwnerData?.name || toOwnerId,
      designation: 'co_owner',
      action: 'data_added',
      remarks: `${shareNum}% share transferred from ${fromOwnerId} to ${toOwnerId} (${newOwnerData?.name || toOwnerId}).`,
      timestamp: new Date(),
    });

    // Automatically regenerate Patta certificate reflecting the new co-owners lineup & updated share percentages
    try {
      const certificateNumber = `PATTA-TG-${Date.now()}-${application.receiptNumber}`;
      const issuedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${certificateNumber}`;
      let qrCodeDataUrl: string;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 300,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
      } catch {
        qrCodeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      }

      const updatedPattaHTML = generatePattaHTML({
        certificateNumber,
        issuedDate,
        fullName: application.fullName || application.ownerName || 'N/A',
        fatherName: application.fatherName || 'N/A',
        aadhaar: application.aadhaar || application.aadharNumber || 'N/A',
        mobile: application.phoneNumber || 'N/A',
        district: application.district || application.state || 'N/A',
        mandal: application.mandal || 'N/A',
        village: application.village || application.city || 'N/A',
        surveyNumber: application.surveyNumber || 'N/A',
        pattaNumber: `PATTA-${application.receiptNumber}`,
        landArea: application.area || 'N/A',
        landType: application.nature || 'Agricultural',
        qrCodeDataUrl,
        isJoint: true,
        owners: application.owners.map((o: any) => ({
          name: o.name || 'N/A',
          aadhar: o.aadhar || 'N/A',
          sharePercent: o.sharePercent || 0,
        })),
        verifyUrl,
      });

      application.pattaHtmlContent = updatedPattaHTML;
      application.certificateNumber = certificateNumber;
      application.pattaNumber = `PATTA-${application.receiptNumber}`;
      application.pattaGeneratedAt = new Date();
      if (!application.pattaHash || application.pattaHash.startsWith('local-')) {
        application.pattaHash = `local-${certificateNumber}`;
      }
    } catch (pattaGenErr) {
      console.error('Error auto-regenerating Patta after share transfer:', pattaGenErr);
    }

    await application.save();

    // Also forward to Fabric blockchain if available
    try {
      const existingOwnerIds = (application.owners || [])
        .filter((o: any) => o.ownerId !== fromOwnerId && o.aadhar !== fromOwnerId)
        .map((o: any) => o.ownerId || o.aadhar);

      await fetch(`http://localhost:3001/api/land/${receiptNumber}/transfer-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromOwnerId,
          toOwnerId,
          sharePercent: shareNum,
          newOwnerData: {
            name: newOwnerData?.name,
            aadhar: newOwnerData?.aadhar,
            nocApprovals: existingOwnerIds,
          },
          username: fromOwnerId,
        }),
      });
    } catch (fabricErr) {
      console.warn('Fabric API transfer-share skipped or offline:', fabricErr);
    }

    return NextResponse.json({
      success: true,
      message: `${shareNum}% share successfully transferred to ${newOwnerData?.name || toOwnerId}`,
      owners: application.owners,
    });
  } catch (error: any) {
    console.error('Transfer share error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer share' },
      { status: 500 }
    );
  }
}
