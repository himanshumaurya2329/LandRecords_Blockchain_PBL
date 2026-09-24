'use client';

import { useEffect, useState } from 'react';
import {
  FaFileAlt, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaChartLine, FaBell, FaUser, FaSignOutAlt, FaHome,
  FaClipboardList, FaMapMarkedAlt, FaRuler, FaCoins,
  FaUserTie, FaBuilding, FaShieldAlt, FaCrown, FaBriefcase
} from 'react-icons/fa';
import Link from 'next/link';

// Role configurations
const ROLE_CONFIG: Record<string, {
  title: string;
  icon: any;
  color: string;
  gradient: string;
  description: string;
}> = {
  clerk: {
    title: 'Clerk Dashboard',
    icon: FaClipboardList,
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    description: 'Application Intake & Document Validation'
  },
  superintendent: {
    title: 'Superintendent Dashboard',
    icon: FaUserTie,
    color: 'purple',
    gradient: 'from-purple-600 to-pink-600',
    description: 'Application Review & Verification'
  },
  projectofficer: {
    title: 'Project Officer Dashboard',
    icon: FaBriefcase,
    color: 'indigo',
    gradient: 'from-indigo-600 to-purple-600',
    description: 'Project Management & Oversight'
  },
  mro: {
    title: 'MRO Dashboard',
    icon: FaShieldAlt,
    color: 'green',
    gradient: 'from-green-600 to-emerald-600',
    description: 'Mandal Revenue Officer - Land Approval Authority'
  },
  surveyor: {
    title: 'Surveyor Dashboard',
    icon: FaMapMarkedAlt,
    color: 'orange',
    gradient: 'from-orange-600 to-red-600',
    description: 'Land Survey & Boundary Verification'
  },
  revenueinspector: {
    title: 'Revenue Inspector Dashboard',
    icon: FaRuler,
    color: 'teal',
    gradient: 'from-teal-600 to-cyan-600',
    description: 'Revenue Record Inspection'
  },
  vro: {
    title: 'VRO Dashboard',
    icon: FaBuilding,
    color: 'yellow',
    gradient: 'from-yellow-600 to-orange-600',
    description: 'Village Revenue Officer - Local Verification'
  },
  revenuedepartmentofficer: {
    title: 'Revenue Department Officer',
    icon: FaCoins,
    color: 'red',
    gradient: 'from-red-600 to-pink-600',
    description: 'Revenue Collection & Tax Management'
  },
  jointcollector: {
    title: 'Joint Collector Dashboard',
    icon: FaCrown,
    color: 'violet',
    gradient: 'from-violet-600 to-purple-600',
    description: 'District-Level Oversight'
  },
  districtcollector: {
    title: 'District Collector Dashboard',
    icon: FaCrown,
    color: 'rose',
    gradient: 'from-rose-600 to-red-600',
    description: 'District Administration Authority'
  },
  ministrywelfare: {
    title: 'Ministry of Welfare',
    icon: FaCrown,
    color: 'slate',
    gradient: 'from-slate-600 to-gray-600',
    description: 'State-Level Policy & Administration'
  },
  admin: {
    title: 'System Administrator',
    icon: FaShieldAlt,
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    description: 'System Management & Configuration'
  }
};

interface Official {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  officeId: string;
}

interface Application {
  _id: string;
  receiptNumber: string;
  status: string;
  createdAt: string;
  ownerName: string;
  surveyNumber: string;
  area: string;
  currentStage?: string;
  currentlyWith?: string;
  ipfsHash?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  state?: string;
  city?: string;
  pincode?: string;
  nature?: string;
}

export default function OfficialDashboard() {
  const [official, setOfficial] = useState<Official | null>(null);
  const [assignedApplications, setAssignedApplications] = useState<Application[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'all'>('assigned');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Survey form states (for Surveyor role)
  const [surveyFormData, setSurveyFormData] = useState({
    pointALat: '',
    pointALong: '',
    pointBLat: '',
    pointBLong: '',
    pointCLat: '',
    pointCLong: '',
    pointDLat: '',
    pointDLong: '',
    measuredArea: '',
    surveyRemarks: ''
  });
  const [boundaryMapFile, setBoundaryMapFile] = useState<File | null>(null);
  const [fieldPhotoFiles, setFieldPhotoFiles] = useState<File[]>([]);
  const [uploadingSurvey, setUploadingSurvey] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    state: 'all',
    city: 'all',
    nature: 'all'
  });

  useEffect(() => {
    fetchOfficialData();
    fetchApplications();
  }, []);

  useEffect(() => {
    // Update applications based on active tab
    if (activeTab === 'assigned') {
      setApplications(assignedApplications);
    } else {
      setApplications(allApplications);
    }
  }, [activeTab, assignedApplications, allApplications]);

  useEffect(() => {
    // Apply filters whenever applications or filters change
    applyFilters();
  }, [applications, filters]);

  const applyFilters = () => {
    let filtered = [...applications];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // State filter
    if (filters.state !== 'all') {
      filtered = filtered.filter(app => app.state === filters.state);
    }

    // City filter
    if (filters.city !== 'all') {
      filtered = filtered.filter(app => app.city === filters.city);
    }

    // Nature filter
    if (filters.nature !== 'all') {
      filtered = filtered.filter(app => app.nature === filters.nature);
    }

    // Search term (receipt number, owner name, survey number)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.receiptNumber?.toLowerCase().includes(term) ||
        app.ownerName?.toLowerCase().includes(term) ||
        app.surveyNumber?.toLowerCase().includes(term) ||
        app.fullName?.toLowerCase().includes(term)
      );
    }

    setFilteredApplications(filtered);
  };

  const getUniqueValues = (key: keyof Application) => {
    const values = applications.map(app => app[key]).filter(Boolean);
    return Array.from(new Set(values));
  };

  const fetchOfficialData = async () => {
    try {
      console.log('Fetching official data...');
      const response = await fetch('/api/officials/me');
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Official data received:', data);
        setOfficial(data.official);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch official data:', errorData);
        window.location.href = '/officiallogin';
      }
    } catch (error) {
      console.error('Error fetching official data:', error);
      window.location.href = '/officiallogin';
    }
  };

  const fetchApplications = async () => {
    try {
      // Fetch applications assigned to current official
      const response = await fetch('/api/dashboard/applications');
      if (response.ok) {
        const data = await response.json();
        console.log('Assigned applications data:', data);
        const currentApplications = data.applications || [];
        console.log('First assigned app:', currentApplications[0]);
        setAssignedApplications(currentApplications);

        // Also fetch all applications for filtering purposes
        const allAppsResponse = await fetch('/api/dashboard/all-applications');
        if (allAppsResponse.ok) {
          const allData = await allAppsResponse.json();
          console.log('All applications data:', allData);
          console.log('First all app:', allData.applications?.[0]);
          setAllApplications(allData.applications || []);
        }

        // Set initial applications to assigned
        setApplications(currentApplications);

        // Fetch stats (now based on assigned applications only)
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Stats data received:', statsData);
          setStats(statsData.stats);
        } else {
          console.warn('Failed to fetch stats from API, using fallback calculation');
          // Fallback: Just show current applications count
          setStats({
            total: currentApplications.length,
            pending: currentApplications.length,
            approved: 0,
            rejected: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSurveyUpload = async (applicationId: string) => {
    try {
      setUploadingSurvey(true);

      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('pointALat', surveyFormData.pointALat);
      formData.append('pointALong', surveyFormData.pointALong);
      formData.append('pointBLat', surveyFormData.pointBLat);
      formData.append('pointBLong', surveyFormData.pointBLong);
      formData.append('pointCLat', surveyFormData.pointCLat);
      formData.append('pointCLong', surveyFormData.pointCLong);
      formData.append('pointDLat', surveyFormData.pointDLat);
      formData.append('pointDLong', surveyFormData.pointDLong);
      formData.append('measuredArea', surveyFormData.measuredArea);
      formData.append('surveyRemarks', surveyFormData.surveyRemarks);

      if (boundaryMapFile) {
        formData.append('boundaryMap', boundaryMapFile);
      }

      fieldPhotoFiles.forEach((file) => {
        formData.append('fieldPhotos', file);
      });

      const response = await fetch('/api/survey/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Survey data uploaded successfully!');
        // Reset form
        setSurveyFormData({
          pointALat: '',
          pointALong: '',
          pointBLat: '',
          pointBLong: '',
          pointCLat: '',
          pointCLong: '',
          pointDLat: '',
          pointDLong: '',
          measuredArea: '',
          surveyRemarks: ''
        });
        setBoundaryMapFile(null);
        setFieldPhotoFiles([]);
      } else {
        const error = await response.json();
        alert(`Failed to upload survey data: ${error.error || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Error uploading survey data:', error);
      alert('Failed to upload survey data');
    } finally {
      setUploadingSurvey(false);
    }
  };

  const handleAction = async (applicationId: string, action: 'approve' | 'reject', remarks: string) => {
    try {
      const response = await fetch('/api/dashboard/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action, remarks })
      });

      if (response.ok) {
        setSelectedApp(null);
        fetchApplications();
        alert(`Application ${action}ed successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Action failed'}`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    }
  };

  const isAssignedToMe = (app: Application) => {
    if (!official) {
      console.log('[isAssignedToMe] No official found');
      return false;
    }

    console.log('[isAssignedToMe] Checking application:', {
      receiptNumber: app.receiptNumber,
      currentlyWith: app.currentlyWith,
      officialId: official._id,
      designation: official.designation,
      appStatus: app.status,
      appCurrentStage: app.currentStage,
    });

    // First priority: Check if currentlyWith matches the official's ID
    if (app.currentlyWith && official._id) {
      const matches = app.currentlyWith === official._id.toString();
      console.log('[isAssignedToMe] ID comparison:', {
        currentlyWith: app.currentlyWith,
        officialId: official._id.toString(),
        matches,
      });
      if (matches) return true;
    }

    // Normalize designation (handle variations like project_officer, projectofficer, etc.)
    const designation = official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');

    // Second priority: Check if currentStage matches the official's designation
    if (app.currentStage) {
      const normalizedStage = app.currentStage.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
      if (normalizedStage === designation) {
        console.log('[isAssignedToMe] Matched via currentStage');
        return true;
      }
    }

    // Third priority: Check status format (with_<role>)
    const statusMap: Record<string, string> = {
      'clerk': 'with_clerk',
      'superintendent': 'with_superintendent',
      'projectofficer': 'with_project_officer',
      'project_officer': 'with_project_officer',
      'mro': 'with_mro',
      'surveyor': 'with_surveyor',
      'revenueinspector': 'with_revenue_inspector',
      'vro': 'with_vro',
      'revenuedeptofficer': 'with_revenue_dept',
      'jointcollector': 'with_joint_collector',
      'districtcollector': 'with_collector',
      'ministrywelfare': 'with_ministry_welfare',
    };

    const expectedStatus = statusMap[designation];
    if (app.status === expectedStatus) {
      console.log('[isAssignedToMe] Matched via status format');
      return true;
    }

    // Initial State special case for Clerk
    if (designation === 'clerk' && app.status === 'submitted') {
      console.log('[isAssignedToMe] Matched via initial submitted state for clerk');
      return true;
    }

    // Last priority: Check if status contains the designation (e.g., "pending_superintendent_review")
    const normalizedStatus = app.status.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    if (normalizedStatus.includes(designation)) {
      console.log('[isAssignedToMe] Matched via status contains designation');
      return true;
    }

    console.log('[isAssignedToMe] No match found');
    return false;
  };

  if (loading || !official) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Animated Spinner */}
          <div className="relative w-20 h-20">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-400 animate-spin"
              style={{
                animation: 'spin 2s linear infinite'
              }}
            />
            {/* Middle rotating ring (opposite direction) */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-400 border-l-purple-400 animate-spin"
              style={{
                animation: 'spin 3s linear infinite reverse'
              }}
            />
            {/* Center dot */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-linear-to-br from-blue-400 to-purple-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Loading Dashboard</h3>
            <p className="text-sm text-gray-300">Preparing your workspace...</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* CSS for custom animations */}
        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  const roleDisplayName = official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
  const roleConfig = ROLE_CONFIG[roleDisplayName] || ROLE_CONFIG.clerk;
  const Icon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-linear-to-r ${roleConfig.gradient} rounded-xl shadow-lg`}>
                <Icon className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{roleConfig.title}</h1>
                <p className="text-sm text-blue-200">{roleConfig.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-white font-semibold">{official.firstName} {official.lastName}</p>
                <p className="text-sm text-blue-200">{official.officeId}</p>
              </div>
              <Link
                href="/"
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Home"
              >
                <FaHome className="text-xl" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-lg transition-all"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="flex">
          {/* Left Side - Stats (30%) */}
          <div className="w-[30%] space-y-4 px-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Total Applications</p>
                  <p className="text-4xl font-bold text-white">{stats.total}</p>
                </div>
                <FaFileAlt className="text-5xl text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-yellow-200 text-sm mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-white">{stats.pending}</p>
                </div>
                <FaClock className="text-5xl text-yellow-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-200 text-sm mb-1">Approved</p>
                  <p className="text-4xl font-bold text-white">{stats.approved}</p>
                </div>
                <FaCheckCircle className="text-5xl text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-red-200 text-sm mb-1">Rejected</p>
                  <p className="text-4xl font-bold text-white">{stats.rejected}</p>
                </div>
                <FaExclamationTriangle className="text-5xl text-red-400" />
              </div>
            </div>
          </div>

          {/* Right Side - Applications Table (70%) */}
          <div className="w-[70%] px-4">
            {/* Tab Navigation */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${activeTab === 'assigned'
                  ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white border-blue-400 shadow-lg shadow-blue-500/50'
                  : 'bg-white/5 text-blue-200 border-blue-500/30 hover:bg-white/10 hover:border-blue-500/50'
                  }`}
              >
                📋 Assigned Applications ({assignedApplications.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${activeTab === 'all'
                  ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-purple-200 border-purple-500/30 hover:bg-white/10 hover:border-purple-500/50'
                  }`}
              >
                🌐 All Applications ({allApplications.length})
              </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-4 mb-4">
              <h3 className="text-white font-semibold mb-3">Filters</h3>
              <div className="grid grid-cols-5 gap-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by receipt, owner, survey..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
                />

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="with_clerk">With Clerk</option>
                  <option value="with_superintendent">With Superintendent</option>
                  <option value="with_project_officer">With Project Officer</option>
                  <option value="with_mro">With MRO</option>
                  <option value="with_surveyor">With Surveyor</option>
                  <option value="with_revenue_inspector">With Revenue Inspector</option>
                  <option value="with_vro">With VRO</option>
                  <option value="with_revenue_dept">With Revenue Dept</option>
                  <option value="with_joint_collector">With Joint Collector</option>
                  <option value="with_collector">With District Collector</option>
                  <option value="with_ministry_welfare">With Ministry of Welfare</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* State Filter */}
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All States</option>
                  {getUniqueValues('state').map((state) => (
                    <option key={state} value={state as string}>{state}</option>
                  ))}
                </select>

                {/* City Filter */}
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Cities</option>
                  {getUniqueValues('city').map((city) => (
                    <option key={city} value={city as string}>{city}</option>
                  ))}
                </select>

                {/* Nature Filter */}
                <select
                  value={filters.nature}
                  onChange={(e) => setFilters({ ...filters, nature: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Types</option>
                  <option value="electronic">Electronic</option>
                  <option value="physical">Physical</option>
                </select>
              </div>
              <div className="mt-2 text-sm text-blue-200">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-500/20">
                <h2 className="text-xl font-bold text-white">Assigned Applications</h2>
                <p className="text-sm text-blue-200 mt-1">Applications pending your action</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Receipt No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Survey No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Area</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">City</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">State</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/10">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-blue-200">
                          {applications.length === 0 ? 'No applications assigned yet' : 'No applications match the current filters'}
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-xs text-white font-mono">{app.receiptNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white">{app.ownerName || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white">{app.surveyNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white">{app.area || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white">{app.city || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white">{app.state || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs text-white capitalize">{app.nature || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${app.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              app.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                              {app.status ? app.status.replace(/_/g, ' ').replace('with ', '').toUpperCase() : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-blue-200">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/official-dashboard/${app.receiptNumber}`}
                              className="inline-block px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white rounded-lg text-xs transition-all"
                            >
                              View
                            </Link>
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
      </main>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-blue-500/30 shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className={`px-8 py-6 bg-linear-to-r ${roleConfig.gradient} relative overflow-hidden shrink-0`}>
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[20px_20px]"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <FaFileAlt className="text-3xl" />
                    Application Details
                  </h3>
                  <p className="text-white/90 mt-2 text-lg font-mono tracking-wider">{selectedApp.receiptNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90 duration-300"
                >
                  <span className="text-white text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-8">
              <div className="space-y-6">
                {/* Applicant Information Section */}
                <div className="bg-linear-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl p-6 border border-blue-500/20">
                  <h4 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
                    <FaUser />
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-blue-300/70 uppercase tracking-wider">Full Name</label>
                      <p className="text-white font-semibold mt-1 text-lg">{selectedApp.fullName || selectedApp.ownerName}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-blue-300/70 uppercase tracking-wider">Email</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.email || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-blue-300/70 uppercase tracking-wider">Phone Number</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.phoneNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-blue-300/70 uppercase tracking-wider">Receipt Number</label>
                      <p className="text-white font-semibold mt-1 font-mono text-sm">{selectedApp.receiptNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Land Details Section */}
                <div className="bg-linear-to-br from-green-500/5 to-emerald-500/5 rounded-2xl p-6 border border-green-500/20">
                  <h4 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
                    <FaMapMarkedAlt />
                    Land Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-green-300/70 uppercase tracking-wider">Owner Name</label>
                      <p className="text-white font-semibold mt-1 text-lg">{selectedApp.ownerName}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-green-300/70 uppercase tracking-wider">Survey Number</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.surveyNumber}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-green-300/70 uppercase tracking-wider">Area</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.area}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-green-300/70 uppercase tracking-wider">Nature</label>
                      <p className="text-white font-semibold mt-1 capitalize">{selectedApp.nature || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-linear-to-br from-purple-500/5 to-pink-500/5 rounded-2xl p-6 border border-purple-500/20">
                  <h4 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <FaHome />
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-purple-300/70 uppercase tracking-wider">Full Address</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.address || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-purple-300/70 uppercase tracking-wider">City</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.city || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-purple-300/70 uppercase tracking-wider">State</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.state || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-purple-300/70 uppercase tracking-wider">Pincode</label>
                      <p className="text-white font-semibold mt-1">{selectedApp.pincode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-linear-to-br from-yellow-500/5 to-orange-500/5 rounded-2xl p-6 border border-yellow-500/20">
                  <h4 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
                    <FaClock />
                    Application Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-yellow-300/70 uppercase tracking-wider">Current Status</label>
                      <p className={`mt-1 font-bold text-lg uppercase tracking-wide ${selectedApp.status === 'completed' ? 'text-green-400' :
                        selectedApp.status === 'rejected' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>{selectedApp.status.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <label className="text-xs text-yellow-300/70 uppercase tracking-wider">Submitted On</label>
                      <p className="text-white font-semibold mt-1">{new Date(selectedApp.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-linear-to-br from-indigo-500/5 to-blue-500/5 rounded-2xl p-6 border border-indigo-500/20">
                  <h4 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                    <FaFileAlt />
                    Documents
                  </h4>
                  <div className="space-y-4">
                    {/* Land Request Application Form */}
                    <div className="bg-slate-800/70 p-5 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
                          <FaFileAlt className="text-purple-400 text-xl" />
                        </div>
                        <div>
                          <span className="text-white font-semibold text-lg">Land Request Application Form</span>
                          <p className="text-purple-300/70 text-xs">System-generated official form</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={`/api/land-requests/generate-form?receipt=${selectedApp.receiptNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 hover:text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                        >
                          <FaFileAlt />
                          View Form
                        </a>
                        <button
                          onClick={() => window.print()}
                          className="flex-1 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 hover:text-white rounded-xl text-sm font-medium transition-all border border-purple-500/20"
                        >
                          Print Form
                        </button>
                      </div>
                    </div>

                    {/* User Uploaded Document */}
                    {selectedApp.ipfsHash && (
                      <div className="bg-slate-800/70 p-5 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                            <FaFileAlt className="text-blue-400 text-xl" />
                          </div>
                          <div>
                            <span className="text-white font-semibold text-lg">User Uploaded Document</span>
                            <p className="text-blue-300/70 text-xs">Supporting document from applicant</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <a
                            href={`/api/documents/view?hash=${selectedApp.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-blue-500/20"
                          >
                            <FaFileAlt />
                            View Document
                          </a>
                          <a
                            href={`/api/documents/view?hash=${selectedApp.ipfsHash}`}
                            download
                            className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/40 text-green-200 hover:text-white rounded-xl text-sm font-medium transition-all border border-green-500/20"
                          >
                            Download PDF
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Survey Form - Only visible for Surveyor */}
                {official && official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') === 'surveyor' && isAssignedToMe(selectedApp) && (
                  <div className="bg-linear-to-br from-cyan-500/5 to-teal-500/5 rounded-2xl p-6 border border-cyan-500/20">
                    <h4 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      <FaMapMarkedAlt />
                      📍 Survey Data & Field Evidence
                    </h4>

                    {/* GPS Coordinates */}
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-cyan-200 mb-3">GPS Boundary Coordinates</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['A', 'B', 'C', 'D'].map((point) => (
                          <div key={point} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <label className="text-xs text-cyan-300/70 uppercase tracking-wider block mb-2">Point {point}</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.000001"
                                placeholder="Latitude"
                                value={surveyFormData[`point${point}Lat` as keyof typeof surveyFormData]}
                                onChange={(e) => setSurveyFormData({ ...surveyFormData, [`point${point}Lat`]: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                              />
                              <input
                                type="number"
                                step="0.000001"
                                placeholder="Longitude"
                                value={surveyFormData[`point${point}Long` as keyof typeof surveyFormData]}
                                onChange={(e) => setSurveyFormData({ ...surveyFormData, [`point${point}Long`]: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Measured Area */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-cyan-200 block mb-2">Measured Area (sq. ft / acres)</label>
                      <input
                        type="text"
                        placeholder="Enter measured area"
                        value={surveyFormData.measuredArea}
                        onChange={(e) => setSurveyFormData({ ...surveyFormData, measuredArea: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Boundary Map Upload */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-cyan-200 block mb-2">🗺️ Upload Boundary Map (PDF/JPEG/PNG)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setBoundaryMapFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-200 hover:file:bg-cyan-500/30"
                        />
                        {boundaryMapFile && (
                          <p className="mt-2 text-xs text-green-400">✅ {boundaryMapFile.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Field Photos Upload */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-cyan-200 block mb-2">📷 Upload Field Photos (2-4 photos)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setFieldPhotoFiles(Array.from(e.target.files || []))}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-200 hover:file:bg-cyan-500/30"
                      />
                      {fieldPhotoFiles.length > 0 && (
                        <div className="mt-2 text-xs text-green-400">
                          ✅ {fieldPhotoFiles.length} photo(s) selected: {fieldPhotoFiles.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Survey Remarks */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-cyan-200 block mb-2">Survey Remarks / Notes</label>
                      <textarea
                        placeholder="Enter any additional observations or remarks..."
                        value={surveyFormData.surveyRemarks}
                        onChange={(e) => setSurveyFormData({ ...surveyFormData, surveyRemarks: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>

                    {/* Upload Button */}
                    <button
                      onClick={() => handleSurveyUpload(selectedApp._id)}
                      disabled={uploadingSurvey}
                      className="w-full px-6 py-4 bg-linear-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 text-cyan-200 hover:text-white rounded-xl font-bold transition-all border border-cyan-500/30 hover:border-cyan-500/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingSurvey ? 'Uploading to IPFS...' : '📤 Upload Survey Data to Blockchain'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Footer - Always Visible */}
            <div className="p-6 bg-slate-900/50 border-t border-slate-700/50 shrink-0">
              {isAssignedToMe(selectedApp) ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction(selectedApp._id, 'approve', 'Approved by ' + official?.designation)}
                    className="flex-1 px-6 py-4 bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-200 hover:text-white rounded-xl font-bold transition-all border border-green-500/30 hover:border-green-500/50 shadow-lg hover:shadow-green-500/20"
                  >
                    <FaCheckCircle className="inline mr-2 text-lg" />
                    Forward/Approve
                  </button>
                  <button
                    onClick={() => handleAction(selectedApp._id, 'reject', 'Rejected by ' + official?.designation)}
                    className="flex-1 px-6 py-4 bg-linear-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-200 hover:text-white rounded-xl font-bold transition-all border border-red-500/30 hover:border-red-500/50 shadow-lg hover:shadow-red-500/20"
                  >
                    <FaExclamationTriangle className="inline mr-2 text-lg" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-linear-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-200 text-sm text-center font-medium">
                    ℹ️ This application is not currently assigned to you. You can view the details but cannot take action.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
