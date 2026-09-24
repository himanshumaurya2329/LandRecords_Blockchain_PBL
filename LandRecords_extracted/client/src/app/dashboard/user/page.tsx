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
}

export default function UserDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        surveyNumber: '',
        landArea: '',
        location: ''
    });
    const [submitting, setSubmitting] = useState(false);
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
            const response = await apiFetcher.getUserApplications();
            if (response.success) {
                setApplications(response.applications);
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await apiFetcher.createApplication(formData);
            if (response.success) {
                setShowCreateForm(false);
                setFormData({ surveyNumber: '', landArea: '', location: '' });
                fetchApplications();
            }
        } catch (error) {
            console.error('Failed to create application:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-900 to-slate-900">
                <DashboardHeader
                    title="Loading..."
                    subtitle="Please wait"
                    officialName={auth.getUser()?.name || ''}
                    designation="Land Owner"
                />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-900 to-slate-900">
            <DashboardHeader
                title="User Dashboard"
                subtitle="Manage your land registration applications"
                officialName={auth.getUser()?.name || ''}
                designation="Land Owner"
            />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        {showCreateForm ? 'Cancel' : '+ New Application'}
                    </button>
                </div>

                {showCreateForm && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Application</h3>
                        <form onSubmit={handleCreateApplication} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Survey Number
                                    </label>
                                    <input
                                        type="text"
                                        name="surveyNumber"
                                        required
                                        value={formData.surveyNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-white/20 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter survey number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Land Area (sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        name="landArea"
                                        required
                                        value={formData.landArea}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-white/20 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter land area"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-white/20 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter location"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Application'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h3 className="text-lg font-semibold text-white">Your Applications</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Application ID
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
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Created
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
                                            {app.surveyNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {app.landArea} sq ft
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {app.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                app.currentStage === 'application_created'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : app.currentStage === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {app.currentStage.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                            No applications found. Create your first application above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}