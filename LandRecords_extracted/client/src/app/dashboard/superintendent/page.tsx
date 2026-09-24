'use client';

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { NEXT_STAGE_LABEL } from '@/lib/utils/workflow';

interface Application {
  _id: string;
  applicationId: string;
  userName: string;
  userEmail: string;
  surveyNumber: string;
  landArea: string;
  location: string;
  currentStage: string;
  createdAt: string;
  documents: Array<{ type: string; url: string }>;
  stageHistory: Array<{
    stage: string;
    officialName: string;
    status: string;
    actionDate: string;
    comments: string;
  }>;
}

interface DashboardData {
  official: {
    id: string;
    name: string;
    designation: string;
    officeId: string;
  };
  currentStage: string;
  totalApplications: number;
  applications: Application[];
}

export default function SuperintendentDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/dashboard/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleApprove = async (appId: string) => {
    setProcessingId(appId);
    try {
      const response = await fetch('/api/dashboard/applications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          action: 'approve',
          comments: actionComment,
        }),
      });

      if (response.ok) {
        // Refresh applications
        const refreshResponse = await fetch('/api/dashboard/applications');
        const data = await refreshResponse.json();
        setDashboardData(data);
        setSelectedApp(null);
        setActionComment('');
      }
    } catch (err) {
      console.error('Error approving application:', err);
    } finally {
      setProcessingId('');
    }
  };

  const handleSendBack = async (appId: string) => {
    setProcessingId(appId);
    try {
      const response = await fetch('/api/dashboard/applications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          action: 'send_back',
          comments: actionComment,
        }),
      });

      if (response.ok) {
        const refreshResponse = await fetch('/api/dashboard/applications');
        const data = await refreshResponse.json();
        setDashboardData(data);
        setSelectedApp(null);
        setActionComment('');
      }
    } catch (err) {
      console.error('Error sending back application:', err);
    } finally {
      setProcessingId('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <DashboardHeader
          title="Loading..."
          subtitle="Please wait"
          officialName=""
          designation=""
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <DashboardHeader
          title="Error"
          subtitle="Dashboard could not be loaded"
          officialName=""
          designation=""
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <DashboardHeader
        title="Superintendent Dashboard"
        subtitle="Verify applicant information and uploaded documents"
        officialName={dashboardData.official.name}
        designation={dashboardData.official.designation}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-white mt-2">{dashboardData.totalApplications}</p>
              </div>
              <FaFileAlt className="text-5xl text-purple-400/30" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl border border-yellow-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Pending Review</p>
                <p className="text-3xl font-bold text-white mt-2">{dashboardData.totalApplications}</p>
              </div>
              <FaClock className="text-5xl text-yellow-400/30" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Verified</p>
                <p className="text-3xl font-bold text-white mt-2">0</p>
              </div>
              <FaCheckCircle className="text-5xl text-green-400/30" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Next Stage</p>
                <p className="text-lg font-bold text-white mt-2">Project Officer</p>
              </div>
              <FaArrowRight className="text-5xl text-blue-400/30" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8 flex items-start gap-3">
          <FaExclamationTriangle className="text-blue-400 text-xl mt-1 shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold">Next Stage: {NEXT_STAGE_LABEL['superintendent']}</p>
            <p className="mt-1">Once approved, applications will automatically forward to the Project Officer.</p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-purple-500/10">
                  <th className="px-6 py-4 text-left text-white font-semibold">Application ID</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Applicant</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Survey Number</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Documents</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Received Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No applications to verify
                    </td>
                  </tr>
                ) : (
                  dashboardData.applications.map((app) => (
                    <tr key={app._id} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition">
                      <td className="px-6 py-4 text-white text-sm font-mono">{app.applicationId}</td>
                      <td className="px-6 py-4 text-white text-sm">{app.userName}</td>
                      <td className="px-6 py-4 text-purple-300 text-sm">{app.surveyNumber}</td>
                      <td className="px-6 py-4 text-white text-sm">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                          {app.documents?.length || 0} files
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
                        >
                          Review <FaArrowRight className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Application Review</h2>

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-purple-500/5 rounded-lg">
                <div>
                  <p className="text-purple-200 text-sm">Application ID</p>
                  <p className="text-white font-semibold mt-1">{selectedApp.applicationId}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-sm">Applicant</p>
                  <p className="text-white font-semibold mt-1">{selectedApp.userName}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-sm">Survey Number</p>
                  <p className="text-white font-semibold mt-1">{selectedApp.surveyNumber}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-sm">Land Area</p>
                  <p className="text-white font-semibold mt-1">{selectedApp.landArea}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-purple-200 text-sm">Location</p>
                  <p className="text-white font-semibold mt-1">{selectedApp.location}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Uploaded Documents</h3>
                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedApp.documents.map((doc, idx) => (
                      <div key={idx} className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                        <p className="text-purple-300 text-sm font-semibold">{doc.type}</p>
                        <a href={doc.url} className="text-blue-400 text-xs hover:text-blue-300 mt-1 inline-block">
                          View Document →
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No documents uploaded</p>
                )}
              </div>

              {/* Comments */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-3">Verification Comments</label>
                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Add your verification comments here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(selectedApp._id)}
                  disabled={processingId === selectedApp._id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  {processingId === selectedApp._id ? 'Processing...' : 'Approve & Forward to Project Officer'}
                </button>
                <button
                  onClick={() => handleSendBack(selectedApp._id)}
                  disabled={processingId === selectedApp._id}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  {processingId === selectedApp._id ? 'Processing...' : 'Send Back to Clerk'}
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
