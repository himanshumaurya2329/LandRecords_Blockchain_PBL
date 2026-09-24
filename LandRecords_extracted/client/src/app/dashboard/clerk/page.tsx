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
}

export default function ClerkDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [verifying, setVerifying] = useState(false);
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
            // Get assigned applications for clerk
            const response = await fetch('/api/dashboard/applications');
            if (response.ok) {
                const data = await response.json();
                setApplications(data.applications);
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyApplication = async (applicationId: string) => {
        setVerifying(true);
        try {
            const response = await apiFetcher.verifyApplication({ applicationId });
            if (response.success) {
                // Refresh applications
                fetchApplications();
                setSelectedApp(null);
            }
        } catch (error) {
            console.error('Failed to verify application:', error);
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-900 to-slate-900">
                <DashboardHeader
                    title="Loading..."
                    subtitle="Please wait"
                    officialName={auth.getUser()?.name || ''}
                    designation="Registration Clerk"
                />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-900 to-slate-900">
            <DashboardHeader
                title="Registration Clerk Dashboard"
                subtitle="Verify land registration applications"
                officialName={auth.getUser()?.name || ''}
                designation="Registration Clerk"
            />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h3 className="text-lg font-semibold text-white">Applications Pending Verification</h3>
                        <p className="text-sm text-gray-300 mt-1">
                            Review and verify new land registration applications
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
                                        Created
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(app.createdAt).toLocaleDateString()}
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
                                            No applications pending verification.
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
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Review Application {selectedApp.applicationId}
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

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleVerifyApplication(selectedApp.applicationId)}
                                        disabled={verifying}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {verifying ? 'Verifying...' : 'Verify Application'}
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
