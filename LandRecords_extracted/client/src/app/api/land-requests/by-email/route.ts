import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch applications from MongoDB
    const requests = await LandRequest.find({ email }).sort({ createdAt: -1 });

    // Transform MongoDB data to match expected format
    const enhancedRequests = requests.map((request: any) => ({
      _id: request._id.toString(),
      receiptNumber: request.receiptNumber,
      createdAt: request.createdAt,
      status: request.status === 'approved' ? 'completed' : request.status, // Map 'approved' to 'completed' for UI
      currentlyWith: request.currentlyWith,
      currentlyWithName: getOfficialNameByStatus(request.status),
      fullName: request.fullName,
      surveyNumber: request.surveyNumber,
      area: request.area,
      ownerName: request.ownerName,
      address: request.address,
      city: request.city,
      state: request.state,
      pincode: request.pincode,
      ipfsHash: request.ipfsHash,
      pattaHash: request.pattaHash,
      certificateNumber: request.certificateNumber,
    }));

    return NextResponse.json({
      message: 'Requests fetched successfully',
      requests: enhancedRequests,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// Helper function to get official name based on status
function getOfficialNameByStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Registration Clerk';
    case 'verified':
      return 'Revenue Officer';
    case 'surveyed':
      return 'Survey Officer';
    case 'approved':
      return 'District Collector';
    default:
      return 'Processing';
  }
}
