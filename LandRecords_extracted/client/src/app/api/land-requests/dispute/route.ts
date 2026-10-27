import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import LandRequest from "@/lib/models/LandRequest";
import { getCurrentUser } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getCurrentUser();
    const body = await req.json();
    const { receiptNumber, reason } = body;

    if (!receiptNumber || !reason) {
      return NextResponse.json({ message: "Receipt number and reason are required" }, { status: 400 });
    }

    const application = await LandRequest.findOne({ receiptNumber });
    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (application.isDisputed) {
      return NextResponse.json({ message: "Dispute already active on this application" }, { status: 400 });
    }

    application.isDisputed = true;
    application.disputeDetails = {
      isDisputed: true,
      raisedBy: session?.userId || "user_portal",
      reason,
      timestamp: new Date().toISOString(),
    };

    await application.save();

    return NextResponse.json({ message: "Dispute raised successfully. Application is now frozen." });
  } catch (error) {
    console.error("Dispute route error:", error);
    return NextResponse.json({ message: "Failed to raise dispute" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiptNumber, action, decision, orderNumber, updatedOwners } = body;

    if (!receiptNumber || !action) {
      return NextResponse.json({ error: "receiptNumber and action are required" }, { status: 400 });
    }

    const application = await LandRequest.findOne({ receiptNumber });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!application.isDisputed) {
      return NextResponse.json({ error: "Application has no active dispute to resolve" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    if (action === 'rectify_shares') {
      if (updatedOwners && Array.isArray(updatedOwners)) {
        for (const update of updatedOwners) {
          const ownerIdx = (application.owners || []).findIndex(
            (o: any) => o.ownerId === update.ownerId || o.aadhar === update.ownerId
          );
          if (ownerIdx !== -1) {
            application.owners![ownerIdx].sharePercent = parseFloat(update.sharePercent);
          }
        }
      }
      application.isDisputed = false;
      application.disputeDetails = {
        isDisputed: false,
        raisedBy: application.disputeDetails?.raisedBy || 'co_owner',
        reason: application.disputeDetails?.reason || '',
        timestamp: application.disputeDetails?.timestamp || timestamp,
        resolvedAt: timestamp,
        resolvedBy: 'District Collector',
        resolution: decision || 'Shares rectified by District Collector order',
        orderNumber: orderNumber || 'DC/REV/ORDER',
      };
    } else if (action === 'reject') {
      application.isDisputed = false;
      application.status = 'rejected';
      application.disputeDetails = {
        isDisputed: false,
        raisedBy: application.disputeDetails?.raisedBy || 'co_owner',
        reason: application.disputeDetails?.reason || '',
        timestamp: application.disputeDetails?.timestamp || timestamp,
        resolvedAt: timestamp,
        resolvedBy: 'District Collector',
        resolution: decision || 'Application rejected permanently by District Collector',
        orderNumber: orderNumber || 'DC/REV/REJECT',
      };
    }

    application.actionHistory = application.actionHistory || [];
    application.actionHistory.push({
      officialId: 'district_collector',
      officialName: 'District Collector',
      designation: 'district_collector',
      action: action === 'reject' ? 'rejected' : 'approved',
      remarks: `Dispute resolved: ${action} - ${decision || ''} (Order: ${orderNumber || 'N/A'})`,
      timestamp: new Date(),
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: "Dispute resolved successfully",
      application,
    });
  } catch (error: any) {
    console.error("Resolve dispute error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve dispute" }, { status: 500 });
  }
}

