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
    owners[ownerIdx].consentStatus = "consented";
    owners[ownerIdx].consentTimestamp = new Date().toISOString();
    owners[ownerIdx].remarks = remarks || "Digitally consented";

    application.owners = owners;

    // Check if ALL owners have now consented
    const allConsented = owners.every((o: any) => o.consentStatus === "consented");
    application.allConsentsGiven = allConsented;

    await application.save();

    // Also sync consent to Fabric Blockchain peers so ledger is updated
    try {
      const currentOwner = owners[ownerIdx];
      let fabricOwnerId = currentOwner.ownerId;

      try {
        const ownersRes = await fetch(`http://localhost:3001/api/land/${receiptNumber}/owners`);
        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          const onChainOwners = ownersData.data?.owners || [];
          const match = onChainOwners.find(
            (o: any) =>
              (o.aadhar && currentOwner.aadhar && o.aadhar === currentOwner.aadhar) ||
              (o.name && currentOwner.name && o.name.toLowerCase().trim() === currentOwner.name.toLowerCase().trim()) ||
              (o.ownerId && currentOwner.ownerId && o.ownerId === currentOwner.ownerId)
          );
          if (match && match.ownerId) {
            fabricOwnerId = match.ownerId;
          }
        }
      } catch {}

      if (fabricOwnerId) {
        await fetch(`http://localhost:3001/api/land/${receiptNumber}/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId: fabricOwnerId,
            remarks: remarks || 'Consent given',
            username: 'user_portal',
          }),
        });
        console.log(`Consent synced to Fabric blockchain for ${fabricOwnerId}`);
      }
    } catch (fabricErr) {
      console.warn('Fabric API consent sync skipped or error:', fabricErr);
    }

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
