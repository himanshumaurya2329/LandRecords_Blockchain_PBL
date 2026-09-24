'use client';

import { useEffect, useState } from 'react';
import { FaCrown, FaUsers, FaShieldAlt, FaFileAlt, FaChartBar, FaSignOutAlt, FaKey, FaSearch, FaEye, FaEdit, FaTrash, FaHistory, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

interface Admin {
  username: string;
  email: string;
  role: string;
}

interface User {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  aadhar: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  createdAt: string;
}

interface Official {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  officeId: string;
  createdAt: string;
}

interface Application {
  _id: string;
  receiptNumber: string;
  ownerName: string;
  status: string;
  createdAt: string;
  createdBy: string;
  actionHistory?: any[];
}

interface Stats {
  totalUsers: number;
  totalOfficials: number;
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  newUsersThisWeek?: number;
  newApplicationsThisWeek?: number;
  completedThisWeek?: number;
  avgProcessingDays?: number;
  applicationsByStatus?: Record<string, number>;
  officialsByDesignation?: Record<string, number>;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'officials' | 'applications' | 'password'>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOfficials: 0,
    totalApplications: 0,
    completedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
    newUsersThisWeek: 0,
    newApplicationsThisWeek: 0,
    completedThisWeek: 0,
    avgProcessingDays: 0,
    applicationsByStatus: {},
    officialsByDesignation: {},
  });
  const [users, setUsers] = useState<User[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Activity data
  const [userActivity, setUserActivity] = useState<any>(null);
  const [officialActivity, setOfficialActivity] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Survey form states (for Surveyor role)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdminData();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'officials') {
      fetchOfficials();
    } else if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        window.location.href = '/adminlogin';
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      window.location.href = '/adminlogin';
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOfficials = async () => {
    try {
      const response = await fetch('/api/admin/officials');
      if (response.ok) {
        const data = await response.json();
        setOfficials(data.officials);
      }
    } catch (error) {
      console.error('Error fetching officials:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        alert('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/admin/user-activity?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserActivity(data);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchOfficialActivity = async (officialId: string) => {
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/admin/official-activity?officialId=${officialId}`);
      if (response.ok) {
        const data = await response.json();
        setOfficialActivity(data);
      }
    } catch (error) {
      console.error('Error fetching official activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    fetchUserActivity(user._id);
  };

  const handleViewOfficial = (official: Official) => {
    setSelectedOfficial(official);
    fetchOfficialActivity(official._id);
  };

  const filteredUsers = users.filter(user =>
    `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.phone?.includes(searchTerm)
  );

  const filteredOfficials = officials.filter(official =>
    `${official?.firstName || ''} ${official?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official?.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app =>
    app?.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app?.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-red-500 to-orange-600 rounded-full">
                <FaCrown className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-red-200 text-sm">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-medium">{admin?.username}</p>
                <p className="text-red-200 text-sm capitalize">{admin?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <FaSignOutAlt className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur border-b border-red-500/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartBar },
              { id: 'users', label: 'Users', icon: FaUsers },
              { id: 'officials', label: 'Officials', icon: FaShieldAlt },
              { id: 'applications', label: 'Applications', icon: FaFileAlt },
              { id: 'password', label: 'Change Password', icon: FaKey },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaUsers className="text-3xl text-blue-400" />
                  <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
                </div>
                <h3 className="text-blue-200 text-lg font-medium">Total Users</h3>
                <p className="text-gray-400 text-sm mt-2">Registered citizens</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaShieldAlt className="text-3xl text-purple-400" />
                  <span className="text-3xl font-bold text-white">{stats.totalOfficials}</span>
                </div>
                <h3 className="text-purple-200 text-lg font-medium">Total Officials</h3>
                <p className="text-gray-400 text-sm mt-2">Government officials</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaFileAlt className="text-3xl text-orange-400" />
                  <span className="text-3xl font-bold text-white">{stats.totalApplications}</span>
                </div>
                <h3 className="text-orange-200 text-lg font-medium">Total Applications</h3>
                <p className="text-gray-400 text-sm mt-2">Land registration requests</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaChartBar className="text-3xl text-green-400" />
                  <span className="text-3xl font-bold text-white">{stats.completedApplications}</span>
                </div>
                <h3 className="text-green-200 text-lg font-medium">Completed</h3>
                <p className="text-gray-400 text-sm mt-2">Successfully processed</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaClock className="text-3xl text-yellow-400" />
                  <span className="text-3xl font-bold text-white">{stats.pendingApplications}</span>
                </div>
                <h3 className="text-yellow-200 text-lg font-medium">Pending</h3>
                <p className="text-gray-400 text-sm mt-2">In progress</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-red-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaExclamationTriangle className="text-3xl text-red-400" />
                  <span className="text-3xl font-bold text-white">{stats.rejectedApplications}</span>
                </div>
                <h3 className="text-red-200 text-lg font-medium">Rejected</h3>
                <p className="text-gray-400 text-sm mt-2">Declined applications</p>
              </div>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaUsers className="text-2xl text-cyan-400" />
                  <span className="text-2xl font-bold text-white">{stats.newUsersThisWeek || 0}</span>
                </div>
                <h3 className="text-cyan-200 text-sm font-medium">New Users (7 days)</h3>
                <p className="text-gray-400 text-xs mt-1">Recent registrations</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaFileAlt className="text-2xl text-indigo-400" />
                  <span className="text-2xl font-bold text-white">{stats.newApplicationsThisWeek || 0}</span>
                </div>
                <h3 className="text-indigo-200 text-sm font-medium">New Applications (7 days)</h3>
                <p className="text-gray-400 text-xs mt-1">Recent submissions</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaCheckCircle className="text-2xl text-emerald-400" />
                  <span className="text-2xl font-bold text-white">{stats.completedThisWeek || 0}</span>
                </div>
                <h3 className="text-emerald-200 text-sm font-medium">Completed (7 days)</h3>
                <p className="text-gray-400 text-xs mt-1">Processed this week</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
                <div className="flex items-center justify-between mb-4">
                  <FaClock className="text-2xl text-amber-400" />
                  <span className="text-2xl font-bold text-white">{stats.avgProcessingDays || 0}</span>
                </div>
                <h3 className="text-amber-200 text-sm font-medium">Avg Processing Time</h3>
                <p className="text-gray-400 text-xs mt-1">Days to complete</p>
              </div>
            </div>

            {/* Detailed Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Officials by Designation */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-purple-400" />
                  Officials by Designation
                </h3>
                <div className="space-y-3">
                  {stats.officialsByDesignation && Object.entries(stats.officialsByDesignation).map(([designation, count]) => (
                    <div key={designation} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 capitalize">{designation.replace(/_/g, ' ')}</span>
                      <span className="text-white font-bold">{count as number}</span>
                    </div>
                  ))}
                  {(!stats.officialsByDesignation || Object.keys(stats.officialsByDesignation).length === 0) && (
                    <p className="text-gray-400 text-center py-4">No officials data available</p>
                  )}
                </div>
              </div>

              {/* Applications by Status */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaChartBar className="text-orange-400" />
                  Applications by Status
                </h3>
                <div className="space-y-3">
                  {stats.applicationsByStatus && Object.entries(stats.applicationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className={`capitalize ${
                        status === 'completed' ? 'text-green-300' :
                        status === 'rejected' ? 'text-red-300' :
                        'text-yellow-300'
                      }`}>
                        {status.replace(/_/g, ' ').replace('with ', '')}
                      </span>
                      <span className="text-white font-bold">{count as number}</span>
                    </div>
                  ))}
                  {(!stats.applicationsByStatus || Object.keys(stats.applicationsByStatus).length === 0) && (
                    <p className="text-gray-400 text-center py-4">No applications data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-2 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-red-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Aadhar</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/10">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white">{user?.firstName || ''} {user?.middleName || ''} {user?.lastName || ''}</td>
                        <td className="px-6 py-4 text-gray-300">{user?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{user?.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">****{user?.aadhar?.slice(-4) || '****'}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="View user details and activity"
                          >
                            <FaEye className="text-white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Officials Tab */}
        {activeTab === 'officials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Official Management</h2>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search officials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-2 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-red-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Designation</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Office ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/10">
                    {filteredOfficials.map((official) => (
                      <tr key={official._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white">{official?.firstName || ''} {official?.lastName || ''}</td>
                        <td className="px-6 py-4 text-gray-300">{official?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{official?.designation || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{official?.officeId || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {official?.createdAt ? new Date(official.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewOfficial(official)}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            title="View official details and activity"
                          >
                            <FaEye className="text-white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Application Management</h2>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-2 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-red-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Receipt No.</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Owner</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/10">
                    {filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-mono">{app?.receiptNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{app?.ownerName || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app?.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            app?.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {app?.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {app?.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                          >
                            <FaHistory className="text-white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-red-500/20">
              <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-blue-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">User Details & Activity</h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserActivity(null);
                }}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>
            
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Full Name</label>
                <p className="text-white text-lg">{selectedUser.firstName} {selectedUser.middleName} {selectedUser.lastName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white text-lg">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Phone Number</label>
                <p className="text-white text-lg">{selectedUser.phone}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Aadhar Number</label>
                <p className="text-white text-lg">{selectedUser.aadhar}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Address</label>
                <p className="text-white text-lg">{selectedUser.address}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Registration Date</label>
                <p className="text-white text-lg">{new Date(selectedUser.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Activity Summary */}
            {loadingActivity ? (
              <div className="text-center py-8 text-gray-400">Loading activity...</div>
            ) : userActivity ? (
              <>
                <div className="border-t border-gray-700 pt-6 mb-6">
                  <h4 className="text-xl font-bold text-white mb-4">Activity Summary</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <p className="text-blue-300 text-sm">Total Applications</p>
                      <p className="text-white text-2xl font-bold">{userActivity.summary.totalApplications}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <p className="text-green-300 text-sm">Completed</p>
                      <p className="text-white text-2xl font-bold">{userActivity.summary.completed}</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <p className="text-yellow-300 text-sm">Pending</p>
                      <p className="text-white text-2xl font-bold">{userActivity.summary.pending}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <p className="text-red-300 text-sm">Rejected</p>
                      <p className="text-white text-2xl font-bold">{userActivity.summary.rejected}</p>
                    </div>
                  </div>
                </div>

                {/* Applications List */}
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-xl font-bold text-white mb-4">All Applications</h4>
                  {userActivity.applications.length > 0 ? (
                    <div className="space-y-3">
                      {userActivity.applications.map((app: any) => {
                        // Find rejection details if rejected
                        const rejectedAction = app.status === 'rejected' && app.actionHistory 
                          ? app.actionHistory.find((action: any) => action.action === 'rejected')
                          : null;
                        
                        return (
                          <div key={app._id} className="bg-white/5 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium font-mono">{app.receiptNumber}</p>
                                <p className="text-gray-400 text-sm">{app.ownerName}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                app.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                app.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {app.status.toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Show rejection details */}
                            {rejectedAction && (
                              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-300 text-sm font-medium">
                                  ❌ Rejected by: {rejectedAction.officialName} ({rejectedAction.designation})
                                </p>
                                {rejectedAction.remarks && (
                                  <p className="text-red-200 text-xs mt-1">Reason: {rejectedAction.remarks}</p>
                                )}
                                <p className="text-red-400 text-xs mt-1">
                                  {new Date(rejectedAction.timestamp).toLocaleString()}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-gray-500 text-xs mt-2">
                              Submitted: {new Date(app.createdAt).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No applications submitted yet</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Official Details Modal */}
      {selectedOfficial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Official Details & Activity</h3>
              <button
                onClick={() => {
                  setSelectedOfficial(null);
                  setOfficialActivity(null);
                }}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>
            
            {/* Official Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <p className="text-white text-lg">{selectedOfficial.firstName} {selectedOfficial.lastName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white text-lg">{selectedOfficial.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Designation</label>
                <p className="text-white text-lg">{selectedOfficial.designation}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Office ID</label>
                <p className="text-white text-lg">{selectedOfficial.officeId}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Registration Date</label>
                <p className="text-white text-lg">{new Date(selectedOfficial.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Activity Summary */}
            {loadingActivity ? (
              <div className="text-center py-8 text-gray-400">Loading activity...</div>
            ) : officialActivity ? (
              <>
                <div className="border-t border-gray-700 pt-6 mb-6">
                  <h4 className="text-xl font-bold text-white mb-4">Work Summary</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                      <p className="text-purple-300 text-sm">Total Processed</p>
                      <p className="text-white text-2xl font-bold">{officialActivity.summary.totalProcessed}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <p className="text-green-300 text-sm">Approved</p>
                      <p className="text-white text-2xl font-bold">{officialActivity.summary.approved}</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <p className="text-yellow-300 text-sm">Pending</p>
                      <p className="text-white text-2xl font-bold">{officialActivity.summary.pending}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <p className="text-red-300 text-sm">Rejected</p>
                      <p className="text-white text-2xl font-bold">{officialActivity.summary.rejected}</p>
                    </div>
                  </div>
                </div>

                {/* Current Applications */}
                {officialActivity.currentApplications.length > 0 && (
                  <div className="border-t border-gray-700 pt-6 mb-6">
                    <h4 className="text-xl font-bold text-white mb-4">Current Applications ({officialActivity.currentApplications.length})</h4>
                    <div className="space-y-3">
                      {officialActivity.currentApplications.map((app: any) => (
                        <div key={app._id} className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium font-mono">{app.receiptNumber}</p>
                              <p className="text-gray-400 text-sm">{app.ownerName}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                              PENDING ACTION
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processed Applications */}
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-xl font-bold text-white mb-4">Processed Applications</h4>
                  {officialActivity.applications.length > 0 ? (
                    <div className="space-y-3">
                      {officialActivity.applications.slice(0, 10).map((app: any) => (
                        <div key={app.receiptNumber} className="bg-white/5 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium font-mono">{app.receiptNumber}</p>
                              <p className="text-gray-400 text-sm">{app.ownerName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              app.officialAction?.action === 'approved' || app.officialAction?.action === 'forwarded' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {app.officialAction?.action?.toUpperCase()}
                            </span>
                          </div>
                          {app.officialAction?.remarks && (
                            <p className="text-gray-400 text-sm mt-2">{app.officialAction.remarks}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-2">
                            {new Date(app.officialAction?.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No applications processed yet</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Application History Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-orange-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Application History</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Receipt Number</label>
                <p className="text-white text-lg font-mono">{selectedApp.receiptNumber}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Owner Name</label>
                <p className="text-white text-lg">{selectedApp.ownerName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Current Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedApp.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                  selectedApp.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {selectedApp.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-xl font-bold text-white mb-4">Action History & Entered Data</h4>
              {selectedApp.actionHistory && selectedApp.actionHistory.length > 0 ? (
                <div className="space-y-6">
                  {selectedApp.actionHistory.map((action, idx) => (
                    <div key={idx} className={`rounded-lg p-4 border ${
                      action.action === 'rejected' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : 'bg-white/5 border-gray-700'
                    }`}>
                      {/* Action Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{action.officialName}</p>
                          <p className="text-gray-400 text-sm">{action.designation}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          action.action === 'approved' ? 'bg-green-500/20 text-green-300' :
                          action.action === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {action.action.toUpperCase()}
                        </span>
                      </div>

                      {/* Remarks */}
                      {action.remarks && (
                        <p className={`mt-2 text-sm ${
                          action.action === 'rejected' ? 'text-red-200' : 'text-gray-300'
                        }`}>
                          {action.remarks}
                        </p>
                      )}

                      {/* Role-Specific Data */}
                      {action.data && Object.keys(action.data).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <p className="text-gray-400 text-xs uppercase font-semibold mb-3">Data Entered by {action.designation}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(action.data).map(([key, value]: [string, any]) => {
                              // Skip internal fields
                              if (key.startsWith('_') || key === 'officialId' || key === 'timestamp') return null;

                              // Format key for display
                              const displayKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim();

                              // Format value based on type
                              let displayValue = '';
                              if (Array.isArray(value)) {
                                displayValue = value.join(', ');
                              } else if (typeof value === 'object' && value !== null) {
                                displayValue = JSON.stringify(value, null, 2);
                              } else if (typeof value === 'boolean') {
                                displayValue = value ? '✓ Yes' : '✗ No';
                              } else {
                                displayValue = String(value || 'N/A');
                              }

                              return (
                                <div key={key} className="bg-black/20 rounded p-2">
                                  <p className="text-gray-400 text-xs">{displayKey}</p>
                                  <p className="text-white text-sm mt-1 text-wrap">
                                    {displayValue.length > 100 
                                      ? displayValue.substring(0, 100) + '...' 
                                      : displayValue}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-gray-600">
                        {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No action history available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
