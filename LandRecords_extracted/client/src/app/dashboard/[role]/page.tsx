'use client';

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { FaFileAlt, FaCheckCircle, FaClock, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { STAGE_DESCRIPTION, NEXT_STAGE_LABEL } from '@/lib/utils/workflow';

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
  stageHistory: Array<{
    stage: string;
    officialName: string;
    status: string;
    actionDate: string;
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

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; accent: string; iconBg: string; button: string }> = {
  projectofficer: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-indigo-200',
    accent: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  vro: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  surveyor: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-cyan-200',
    accent: 'text-cyan-600',
    iconBg: 'bg-cyan-100',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white'
  },
  revenueInspector: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-orange-200',
    accent: 'text-orange-600',
    iconBg: 'bg-orange-100',
    button: 'bg-orange-600 hover:bg-orange-700 text-white'
  },
  mro: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-blue-200',
    accent: 'text-blue-600',
    iconBg: 'bg-blue-100',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  revenueDeptOfficer: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-pink-200',
    accent: 'text-pink-600',
    iconBg: 'bg-pink-100',
    button: 'bg-pink-600 hover:bg-pink-700 text-white'
  },
  jointCollector: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-amber-200',
    accent: 'text-amber-600',
    iconBg: 'bg-amber-100',
    button: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  districtCollector: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-rose-200',
    accent: 'text-rose-600',
    iconBg: 'bg-rose-100',
    button: 'bg-rose-600 hover:bg-rose-700 text-white'
  },
  ministrywelfare: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-violet-200',
    accent: 'text-violet-600',
    iconBg: 'bg-violet-100',
    button: 'bg-violet-600 hover:bg-violet-700 text-white'
  },
};

const roleParam = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';
const roleColors = ROLE_COLORS[roleParam as keyof typeof ROLE_COLORS] || ROLE_COLORS.projectofficer;

export default function GenericDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionComment, setActionComment] = useState('');

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

  const getRoleTitle = (stage: string) => {
    const titleMap: Record<string, string> = {
      projectofficer: 'Project Officer Dashboard',
      vro: 'VRO Dashboard',
      surveyor: 'Surveyor Dashboard',
      revenueInspector: 'Revenue Inspector Dashboard',
      mro: 'MRO Dashboard',
      revenueDeptOfficer: 'Revenue Dept Officer Dashboard',
      jointCollector: 'Joint Collector Dashboard',
      districtCollector: 'District Collector Dashboard',
      ministrywelfare: 'Ministry of Welfare Dashboard',
    };
    return titleMap[stage] || 'Dashboard';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${roleColors.bg}`}>
        <DashboardHeader
          title="Loading..."
          subtitle="Please wait"
          officialName=""
          designation=""
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className={`text-4xl animate-spin mb-4 ${roleColors.accent}`}>⏳</div>
          <div className={`${roleColors.text} text-xl font-medium`}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`min-h-screen ${roleColors.bg}`}>
        <DashboardHeader
          title="Error"
          subtitle="Dashboard could not be loaded"
          officialName=""
          designation=""
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
          <div className="text-red-600 text-xl font-medium">{error}</div>
        </div>
      </div>
    );
  }

  const nextStageLabel = NEXT_STAGE_LABEL[dashboardData.currentStage] || 'Next Stage';

  return (
    <div className={`min-h-screen ${roleColors.bg}`}>
      <DashboardHeader
        title={getRoleTitle(dashboardData.currentStage)}
        subtitle={STAGE_DESCRIPTION[dashboardData.currentStage] || 'Review and process applications'}
        officialName={dashboardData.official.name}
        designation={dashboardData.official.designation}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white rounded-xl shadow-sm border ${roleColors.border} p-6 transition-transform hover:-translate-y-1 duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Applications at This Stage</p>
                <p className={`text-4xl font-bold mt-2 ${roleColors.accent}`}>{dashboardData.totalApplications}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${roleColors.iconBg}`}>
                <FaFileAlt className={`text-xl ${roleColors.accent}`} />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm border ${roleColors.border} p-6 transition-transform hover:-translate-y-1 duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending Action</p>
                <p className={`text-4xl font-bold mt-2 ${roleColors.accent}`}>{dashboardData.totalApplications}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${roleColors.iconBg}`}>
                <FaClock className={`text-xl ${roleColors.accent}`} />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm border ${roleColors.border} p-6 transition-transform hover:-translate-y-1 duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Next Official</p>
                <p className={`text-lg font-bold mt-2 line-clamp-2 ${roleColors.text}`}>{nextStageLabel}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${roleColors.iconBg}`}>
                <FaArrowRight className={`text-xl ${roleColors.accent}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className={`bg-white border-l-4 ${roleColors.border.replace('/20', '')} shadow-sm rounded-r-lg p-5 mb-8 flex items-start gap-4`}>
          <div className={`p-2 rounded-full ${roleColors.iconBg}`}>
            <FaExclamationTriangle className={`text-lg ${roleColors.accent}`} />
          </div>
          <div className="text-slate-700">
            <p className={`font-bold ${roleColors.accent}`}>Workflow Status</p>
            <p className="mt-1 text-sm text-slate-600">Review applications and approve to forward to <span className="font-semibold">{nextStageLabel}</span>. If next official is not registered, please contact system admin.</p>
          </div>
        </div>

        {/* Applications Table */}
        <div className={`bg-white rounded-2xl shadow-lg border ${roleColors.border} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className={`text-lg font-bold ${roleColors.text}`}>Active Applications</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors.iconBg} ${roleColors.accent}`}>
              {dashboardData.applications.length} Pending
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Application ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Survey Number</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Land Area</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Received Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FaCheckCircle className="text-4xl mb-3 opacity-20" />
                        <p className="font-medium">No applications to process</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dashboardData.applications.map((app, idx) => (
                    <tr key={app._id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{app.applicationId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-800">{app.userName}</div>
                        <div className="text-xs text-slate-500">{app.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-medium">{app.surveyNumber}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{app.landArea}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className={`text-sm font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${roleColors.button}`}
                        >
                          Review Application
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
