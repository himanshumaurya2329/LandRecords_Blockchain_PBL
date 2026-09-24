import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import LandRequestHistory from '@/lib/models/LandRequestHistory';
import LandApplication from '@/lib/models/LandApplication';
import Official from '@/lib/models/Official';
import crypto from 'crypto';
import { apiCall, API_CONFIG } from '@/lib/fabric-api';
import { sendEmailAlert } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { receiptNumber } = body;

    if (!receiptNumber) {
      return NextResponse.json(
        { message: 'Receipt number is required' },
        { status: 400 }
      );
    }

    console.log('=== SUBMIT TO CLERK ===');
    console.log('Receipt number:', receiptNumber);

    // Find the land request
    const landRequest = await LandRequest.findOne({ receiptNumber });
    if (!landRequest) {
      console.error('Land request not found:', receiptNumber);
      return NextResponse.json(
        { message: 'Land request not found' },
        { status: 404 }
      );
    }

    console.log('Land request found:', landRequest._id);

    // Find the first clerk official
    let clerkOfficial = await Official.findOne({ designation: 'clerk' });
    if (!clerkOfficial) {
      console.log('No clerk found, creating default clerk...');
      // Create a default clerk if none exists
      const defaultClerk = new Official({
        firstName: 'System',
        lastName: 'Clerk',
        email: 'clerk@system.local',
        phone: '0000000000',
        designation: 'clerk',
        officeId: 'default-office',
      });
      await defaultClerk.save();
      console.log('Created default clerk:', defaultClerk._id);
      clerkOfficial = defaultClerk;
    }

    console.log('Found clerk official:', clerkOfficial._id, clerkOfficial.firstName, clerkOfficial.lastName);

    // Update land request status
    landRequest.status = 'with_clerk';
    landRequest.currentlyWith = clerkOfficial._id.toString();
    console.log('Setting currentlyWith to:', clerkOfficial._id.toString());
    await landRequest.save();

    console.log('Updated land request status to with_clerk');
    console.log('Land request after save:', { status: landRequest.status, currentlyWith: landRequest.currentlyWith });

    // Create or update LandApplication record for the dashboard
    const applicationId = `APP-${landRequest.receiptNumber}`;
    console.log('Creating application with ID:', applicationId);
    console.log('Application stage: clerk');

    const application = await LandApplication.findOneAndUpdate(
      { applicationId },
      {
        applicationId,
        landRequestId: landRequest._id.toString(),
        userName: landRequest.fullName,
        userEmail: landRequest.email,
        surveyNumber: landRequest.surveyNumber,
        landArea: landRequest.area,
        location: `${landRequest.address}, ${landRequest.city}, ${landRequest.state}`,
        currentStage: 'clerk',
        status: 'pending_clerk_review',
        receiptNumber: landRequest.receiptNumber,
        nature: landRequest.nature,
        ipfsHash: landRequest.ipfsHash,
      },
      { upsert: true, new: true }
    );

    console.log('LandApplication created/updated:', application._id);
    console.log('Application current stage:', application.currentStage);

    // Create application in blockchain
    console.log('Creating application in blockchain...');
    const userData = {
      name: landRequest.fullName,
      aadhar: landRequest.aadharNumber,
      surveyNo: landRequest.surveyNumber,
      district: landRequest.city, // Using city as district
      mandal: landRequest.city, // Using city as mandal
      village: landRequest.city, // Using city as village
    };

    try {
      const fabricResult = await apiCall(API_CONFIG.ENDPOINTS.LAND.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          applicationId: landRequest.receiptNumber,
          userData,
        }),
      }, req);

      if (!fabricResult.success) {
        console.error('Failed to create application in blockchain:', fabricResult.error);
        // Continue anyway, as MongoDB is updated
      } else {
        console.log('Application created in blockchain successfully');
      }
    } catch (fabricError) {
      console.error('Error creating application in blockchain:', fabricError);
      // Continue anyway
    }

    // Create history entry
    const historyId = crypto.randomBytes(6).toString('hex').toUpperCase();
    await LandRequestHistory.create({
      landRequestId: landRequest._id.toString(),
      historyId,
      toUser: clerkOfficial?._id.toString(),
      toDesignation: (clerkOfficial as any)?.designation,
      action: 'forwarded',
      remarks: 'Submitted by user for initial verification',
    });

    console.log('History entry created:', historyId);

    // Send Email Alert
    await sendEmailAlert({
      to: landRequest.email,
      subject: `Application Submitted - ${landRequest.receiptNumber}`,
      html: `
        <h2>Application Submitted Successfully</h2>
        <p>Dear ${landRequest.fullName},</p>
        <p>Your land registration application (Receipt: <strong>${landRequest.receiptNumber}</strong>) has been successfully submitted to the Clerk for processing.</p>
        <p>You can track the progress of your application in the Status tab of your dashboard.</p>
        <br/>
        <p>Regards,<br/>E-Land Records System</p>
      `
    });

    console.log('=== SUBMIT TO CLERK COMPLETE ===');

    return NextResponse.json({
      message: 'Successfully submitted to Clerk',
      receiptNumber: landRequest.receiptNumber,
      applicationId: applicationId,
      historyId,
    });
  } catch (error) {
    console.error('Submit to clerk error:', error);
    return NextResponse.json(
      { message: 'Failed to submit to clerk' },
      { status: 500 }
    );
  }
}
