'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import apiFetcher from '@/utils/fetcher';
import { auth } from '@/utils/auth';

interface Application {
    applicationId: string;
    surveyNumber: string;
    landArea: string;
    location: string;
    currentStage: string;
    createdAt: string;
    userName: string;
    userEmail: string;
    surveyReport?: string;
    boundaryDetails?: string;
    landClassification?: string;
}

export default function JointCollectorDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [approving, setApproving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!auth.isAuthenticated()) {
            router.push('/login');
            return;
        }

        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            // Get applications that have survey reports and need approval
            const response = await apiFetcher.queryApplicationsByStatus('survey_report_updated');
            if (response.success) {
                setApplications(response.applications);
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveApplication = async (applicationId: string) => {
        setApproving(true);
        try {
            const response = await apiFetcher.approveApplication({ applicationId });
            if (response.success) {
                // Refresh applications
                fetchApplications();
                setSelectedApp(null);
            }
        } catch (error) {
            console.error('Failed to approve application:', error);
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-yellow-900 to-slate-900">
                <DashboardHeader
                    title="Loading..."
                    subtitle="Please wait"
                    officialName={auth.getUser()?.name || ''}
                    designation="Joint Collector"
                />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-yellow-900 to-slate-900">
            <DashboardHeader
                title="Joint Collector Dashboard"
                subtitle="Approve land registration applications"
                officialName={auth.getUser()?.name || ''}
                designation="Joint Collector"
            />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h3 className="text-lg font-semibold text-white">Applications Pending Approval</h3>
                        <p className="text-sm text-gray-300 mt-1">
                            Review and approve land registration applications with survey reports
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Application ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Survey Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Land Area
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Survey Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {applications.map((app) => (
                                    <tr key={app.applicationId} className="hover:bg-white/5">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {app.applicationId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div>
                                                <div className="font-medium">{app.userName}</div>
                                                <div className="text-xs text-gray-400">{app.userEmail}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {app.surveyNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {app.landArea} sq ft
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {app.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                Survey Complete
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => setSelectedApp(app)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                            No applications pending approval.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Application Review Modal */}
                {selectedApp && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Review Application for Approval - {selectedApp.applicationId}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">User Name</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedApp.userName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">User Email</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedApp.userEmail}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Survey Number</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedApp.surveyNumber}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Land Area</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedApp.landArea} sq ft</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Location</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedApp.location}</p>
                                    </div>
                                </div>

                                {selectedApp.surveyReport && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-3">Survey Report</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Boundary Details</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.boundaryDetails || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Land Classification</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedApp.landClassification || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Report Status</label>
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        Complete
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Survey Report Details</label>
                                                <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                                                    {selectedApp.surveyReport}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleApproveApplication(selectedApp.applicationId)}
                                        disabled={approving}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {approving ? 'Approving...' : 'Approve Application'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Reject Application
                                    </button>
                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}