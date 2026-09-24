import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import Admin from '@/lib/models/Admin';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';
import Official from '@/lib/models/Official';
import LandRequest from '@/lib/models/LandRequest';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const session = await Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() },
      userType: 'admin'
    });

    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalOfficials = await Official.countDocuments();
    const totalApplications = await LandRequest.countDocuments();
    const completedApplications = await LandRequest.countDocuments({ status: 'completed' });
    const rejectedApplications = await LandRequest.countDocuments({ status: 'rejected' });
    const pendingApplications = totalApplications - completedApplications - rejectedApplications;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newApplicationsThisWeek = await LandRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const completedThisWeek = await LandRequest.countDocuments({ 
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo }
    });

    // Get applications by status
    const applicationsByStatus = await LandRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get officials by designation
    const officialsByDesignation = await Official.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average processing time for completed applications
    const completedApps = await LandRequest.find({ status: 'completed' })
      .select('createdAt updatedAt')
      .lean();
    
    let avgProcessingDays = 0;
    if (completedApps.length > 0) {
      const totalDays = completedApps.reduce((sum, app) => {
        const days = Math.floor((new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgProcessingDays = Math.round(totalDays / completedApps.length);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalOfficials,
        totalApplications,
        completedApplications,
        pendingApplications,
        rejectedApplications,
        newUsersThisWeek,
        newApplicationsThisWeek,
        completedThisWeek,
        avgProcessingDays,
        applicationsByStatus: applicationsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        officialsByDesignation: officialsByDesignation.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
