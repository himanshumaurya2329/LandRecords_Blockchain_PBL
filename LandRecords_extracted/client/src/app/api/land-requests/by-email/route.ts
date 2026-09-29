import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import LandRequest from "@/lib/models/LandRequest";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const aadhar = request.nextUrl.searchParams.get("aadhar");

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const primaryRequests = await LandRequest.find({ email }).sort({ createdAt: -1 });

    let coOwnerRequests: any[] = [];
    if (aadhar) {
      const allWithOwners = await LandRequest.find({
        ownershipType: "joint",
        "owners.aadhar": aadhar,
        email: { $ne: email },
      }).sort({ createdAt: -1 });
      coOwnerRequests = allWithOwners;
    }

    const allRequests = [...primaryRequests, ...coOwnerRequests];

    const enhancedRequests = allRequests.map((req: any) => ({
      _id: req._id.toString(),
      receiptNumber: req.receiptNumber,
      createdAt: req.createdAt,
      status: req.status === "approved" ? "completed" : req.status,
      currentlyWith: req.currentlyWith,
      currentlyWithName: getOfficialNameByStatus(req.status),
      fullName: req.fullName,
      surveyNumber: req.surveyNumber,
      area: req.area,
      ownerName: req.ownerName,
      address: req.address,
      city: req.city,
      state: req.state,
      pincode: req.pincode,
      ipfsHash: req.ipfsHash,
      pattaHash: req.pattaHash,
      certificateNumber: req.certificateNumber,
      ownershipType: req.ownershipType || "single",
      allConsentsGiven: req.allConsentsGiven ?? true,
      isDisputed: req.isDisputed ?? false,
      owners: req.owners || [],
      isCoOwnerView: req.email !== email,
    }));

    return NextResponse.json({ message: "Requests fetched successfully", requests: enhancedRequests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}

function getOfficialNameByStatus(status: string): string {
  switch (status) {
    case "submitted": return "Waiting for Clerk";
    case "with_clerk": return "Registration Clerk";
    case "with_superintendent": return "Superintendent";
    case "with_projectofficer": return "Project Officer";
    case "with_vro": return "Village Revenue Officer";
    case "with_surveyor": return "Surveyor";
    case "with_revenueinspector": return "Revenue Inspector";
    case "with_mro": return "Mandal Revenue Officer";
    case "with_revenuedeptofficer": return "Revenue Dept Officer";
    case "with_jointcollector": return "Joint Collector";
    case "with_districtcollector": return "District Collector";
    case "with_ministrywelfare": return "Ministry of Welfare";
    case "approved": return "District Collector";
    case "completed": return "Completed";
    case "rejected": return "Rejected";
    default: return "Processing";
  }
}
