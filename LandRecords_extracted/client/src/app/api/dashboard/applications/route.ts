import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Official from '@/lib/models/Official';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(req: NextRequest) {
  try {
    // Authenticate using session token (like officials/me route)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          official: {
            id: 'unknown',
            name: 'Not Authenticated',
            designation: 'unknown',
            officeId: 'unknown',
          },
          currentStage: 'error',
          totalApplications: 0,
          applications: [],
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get official from session
    const Session = require('@/lib/models/Session').default;
    const session = await Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session || !session.officialId) {
      return NextResponse.json(
        {
          official: {
            id: 'unknown',
            name: 'Session not found',
            designation: 'unknown',
            officeId: 'unknown',
          },
          currentStage: 'error',
          totalApplications: 0,
          applications: [],
          error: 'Session not found or not an official session',
        },
        { status: 401 }
      );
    }

    const official = await Official.findById(session.officialId).select('-password');

    if (!official) {
      return NextResponse.json(
        {
          official: {
            id: 'unknown',
            name: 'Official not found',
            designation: 'unknown',
            officeId: 'unknown',
          },
          currentStage: 'error',
          totalApplications: 0,
          applications: [],
          error: 'Official not found',
        },
        { status: 404 }
      );
    }

    // Create currentUser object from official data
    const currentUser = {
      username: official.username,
      role: official.designation,
      org: official.department
    };

    // Fetch applications from MongoDB
    let applications;
    const userRole = currentUser.role;
    switch (userRole) {
      case 'clerk':
      case 'superintendent':
        // Registration department - handle initial applications
        applications = await LandRequest.find({
          status: { $in: ['submitted', 'with_clerk', 'with_superintendent'] }
        }).sort({ createdAt: -1 });
        break;

      case 'mro':
      case 'vro':
      case 'revenue_officer':
      case 'revenue_dept':
        // Revenue department - handle verification
        applications = await LandRequest.find({
          status: { $in: ['with_mro', 'with_vro', 'with_revenue_officer', 'with_revenue_dept'] }
        }).sort({ createdAt: -1 });
        break;

      case 'surveyor':
        // Survey department - handle survey reports
        applications = await LandRequest.find({
          status: 'with_surveyor'
        }).sort({ createdAt: -1 });
        break;

      case 'joint_collector':
      case 'collector':
      case 'mw':
        // Collector department - final approval
        applications = await LandRequest.find({
          status: { $in: ['with_jointcollector', 'with_districtcollector', 'with_ministrywelfare'] }
        }).sort({ createdAt: -1 });
        break;

      default:
        // Admin or unknown role - see all applications
        applications = await LandRequest.find().sort({ createdAt: -1 });
    }

    // Format applications for dashboard using expected field names
    const formattedApplications = applications.map((app: any) => ({
      _id: app._id,
      receiptNumber: app.receiptNumber,
      ownerName: app.ownerName,
      surveyNumber: app.surveyNumber,
      area: app.area,
      address: app.address,
      state: app.state,
      city: app.city,
      pincode: app.pincode,
      nature: app.nature,
      status: app.status,
      createdAt: app.createdAt,
      fullName: app.fullName,
      email: app.email,
      ipfsHash: app.ipfsHash,
    }));

    return NextResponse.json({
      official: {
        id: official.username,
        name: `${official.firstName} ${official.lastName}`,
        designation: official.designation,
        officeId: official.officeId,
      },
      currentStage: userRole,
      totalApplications: formattedApplications.length,
      applications: formattedApplications,
    });
  } catch (error) {
    console.error('Error fetching dashboard applications:', error);
    return NextResponse.json(
      {
        official: {
          id: 'unknown',
          name: 'Error',
          designation: 'unknown',
          officeId: 'unknown',
        },
        currentStage: 'error',
        totalApplications: 0,
        applications: [],
        error: 'Failed to fetch applications',
      },
      { status: 500 }
    );
  }
}
