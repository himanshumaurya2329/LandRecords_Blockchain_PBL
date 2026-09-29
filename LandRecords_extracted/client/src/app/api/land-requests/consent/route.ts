import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import LandRequest from "@/lib/models/LandRequest";
import { getCurrentUser } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiptNumber, ownerAadhar, ownerEmail, remarks } = body;

    if (!receiptNumber) {
      return NextResponse.json({ message: "Receipt number is required" }, { status: 400 });
    }

    // Find the application
    const application = await LandRequest.findOne({ receiptNumber });
    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (application.ownershipType !== "joint") {
      return NextResponse.json({ message: "This is not a joint ownership application" }, { status: 400 });
    }

    // Find the co-owner by aadhar or ownerId (email)
    const owners = application.owners || [];
    let ownerIdx = -1;

    if (ownerAadhar) {
      ownerIdx = owners.findIndex((o: any) => o.aadhar === ownerAadhar);
    }
    if (ownerIdx === -1 && ownerEmail) {
      ownerIdx = owners.findIndex((o: any) => o.ownerId === ownerEmail);
    }

    if (ownerIdx === -1) {
      return NextResponse.json({ message: "You are not listed as a co-owner on this application" }, { status: 403 });
    }

    // Update consent status
    application.owners[ownerIdx].consentStatus = "consented";
    application.owners[ownerIdx].consentTimestamp = new Date().toISOString();
    application.owners[ownerIdx].remarks = remarks || "Digitally consented";

    // Check if ALL owners have now consented
    const allConsented = application.owners.every((o: any) => o.consentStatus === "consented");
    application.allConsentsGiven = allConsented;

    await application.save();

    return NextResponse.json({
      message: "Consent granted successfully",
      allConsentsGiven: allConsented,
      ownerIdx,
    });
  } catch (error) {
    console.error("Consent route error:", error);
    return NextResponse.json({ message: "Failed to grant consent" }, { status: 500 });
  }
}
