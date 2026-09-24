import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import LandRequestHistory from '@/lib/models/LandRequestHistory';

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

        // Fetch user's land requests to get their IDs
        const userRequests = await LandRequest.find({ email });
        const requestIds = userRequests.map(req => req._id.toString());

        // Create a map for receipt numbers based on request ids
        const receiptMap: Record<string, string> = {};
        userRequests.forEach(req => {
            receiptMap[req._id.toString()] = req.receiptNumber;
        });

        // Fetch history for these requests
        const history = await LandRequestHistory.find({
            landRequestId: { $in: requestIds }
        }).sort({ timestamp: -1 });

        // Enhance with receipt numbers
        const enhancedHistory = history.map(item => ({
            _id: item._id.toString(),
            historyId: item.historyId,
            receiptNumber: receiptMap[item.landRequestId] || item.landRequestId,
            fromUser: item.fromUser,
            toUser: item.toUser,
            fromDesignation: item.fromDesignation,
            toDesignation: item.toDesignation,
            action: item.action,
            remarks: item.remarks,
            timestamp: item.timestamp,
        }));

        return NextResponse.json({
            message: 'Notifications fetched successfully',
            notifications: enhancedHistory,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { message: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
