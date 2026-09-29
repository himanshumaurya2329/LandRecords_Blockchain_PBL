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
