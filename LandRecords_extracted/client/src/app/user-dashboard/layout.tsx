'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiLogOut,
  FiEdit3,
  FiInbox,
  FiTrendingUp,
  FiUser,
  FiChevronRight,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { MdCreateNewFolder, MdDashboard } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState('create');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (!response.ok) {
          router.push('/userlogin');
          return;
        }
        
        const data = await response.json();
        setUserName(data.user.name || data.user.email);
        setUserEmail(data.user.email);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/userlogin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/userlogin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const tabs = [
    { id: 'create', label: 'Create Request', icon: MdCreateNewFolder, color: 'from-blue-500 to-blue-600' },
    { id: 'inbox', label: 'Inbox', icon: FiInbox, color: 'from-purple-500 to-purple-600' },
    { id: 'status', label: 'Status', icon: FiTrendingUp, color: 'from-green-500 to-green-600' },
    { id: 'details', label: 'Profile', icon: FiUser, color: 'from-orange-500 to-orange-600' },
  ];

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-lg shadow-blue-500/50"></div>
          <p className="text-blue-200 font-bold text-xl mb-2">Loading Your Dashboard</p>
          <p className="text-blue-300/70 text-sm">Please wait while we prepare your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-900/95 border-b-2 border-blue-500/30 shadow-2xl shadow-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-2xl group-hover:shadow-blue-500/70 transform group-hover:scale-110 transition-all duration-300">
                <MdDashboard className="text-2xl text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">E-Land Records</p>
                <p className="text-xs text-blue-300 font-semibold">Smart Land Management</p>
              </div>
            </Link>

            <div className="flex items-center space-x-6">
              <div className="text-right hidden md:block border-r-2 border-blue-500/30 pr-6">
                <p className="text-sm font-bold text-white">{userName}</p>
                <p className="text-xs text-blue-300">{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 text-lg font-bold text-white ring-2 ring-blue-400/50">
                {userName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 transition-all duration-300 text-sm font-bold shadow-lg transform flex items-center gap-2 border-2 border-red-400/50"
              >
                <FiLogOut className="text-lg" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {/* <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:static md:translate-x-0 left-0 top-20 md:top-0 z-40 w-72 h-screen md:h-auto
          bg-slate-900/95 backdrop-blur-xl border-r-2 border-blue-500/30
          transition-transform duration-300 md:transition-none
          overflow-y-auto shadow-2xl shadow-blue-500/10
        `}>
          <div className="p-6 space-y-3">
            <div className="mb-6">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 px-2">Navigation</h2>
              <div className="h-1 bg-linear-to-r from-blue-500/50 to-transparent rounded-full"></div>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorMap: Record<string, { from: string; to: string; border: string; shadow: string; text: string; }> = {
                'create': { from: 'from-blue-500/20', to: 'to-cyan-500/20', border: 'border-blue-500', shadow: 'shadow-blue-500/30', text: 'text-blue-400' },
                'status': { from: 'from-green-500/20', to: 'to-emerald-500/20', border: 'border-green-500', shadow: 'shadow-green-500/30', text: 'text-green-400' },
                'inbox': { from: 'from-purple-500/20', to: 'to-pink-500/20', border: 'border-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-400' },
                'details': { from: 'from-orange-500/20', to: 'to-red-500/20', border: 'border-orange-500', shadow: 'shadow-orange-500/30', text: 'text-orange-400' },
              };
              const colors = colorMap[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full px-5 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 group border-2
                    ${isActive
                      ? `bg-linear-to-br ${colors.from} ${colors.to} ${colors.border} shadow-xl ${colors.shadow} scale-105`
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? `bg-linear-to-br ${colors.from.replace('/20', '')} ${colors.to.replace('/20', '')} shadow-lg` : 'bg-slate-800'
                  }`}>
                    <Icon className={`text-xl ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'} transition-all`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{tab.label}</p>
                    <p className={`text-xs ${isActive ? colors.text : 'text-slate-500'}`}>
                      {tab.id === 'create' && 'New application'}
                      {tab.id === 'status' && 'Track progress'}
                      {tab.id === 'inbox' && 'Messages'}
                      {tab.id === 'details' && 'Your profile'}
                    </p>
                  </div>
                  {isActive && <FiChevronRight className="text-xl text-white" />}
                </button>
              );
            })}
          </div>
        </aside> */}

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed bottom-8 right-8 z-30 w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transform hover:scale-110 transition-all duration-300 border-2 border-blue-400/50"
        >
          {sidebarOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-900/30">
          <div className="max-w-7xl mx-auto p-4">
            {/* Tab Content Cards */}
            {activeTab === 'create' && (
              <div>
                <div className="border-b-2 border-blue-500/30 pb-4 mb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                      <MdCreateNewFolder className="text-3xl text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Create New Request</h1>
                      <p className="text-blue-300 text-sm mt-1">Fill in your land details and upload required documents</p>
                    </div>
                  </div>
                </div>
                {children}
              </div>
            )}

            {activeTab === 'inbox' && (
              <div>
                <div className="mb-8 pb-6 border-b-2 border-purple-500/30">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <FiInbox className="text-3xl text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Inbox</h1>
                      <p className="text-purple-300 text-sm mt-1">Messages and notifications</p>
                    </div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border-2 border-purple-500/30 shadow-2xl p-16 text-center hover:border-purple-500/50 transition-all duration-300">
                  <div className="w-24 h-24 bg-linear-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/30">
                    <FiInbox className="text-5xl text-purple-400" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-3">Inbox Coming Soon</p>
                  <p className="text-purple-300 text-sm max-w-md mx-auto">View your submitted applications, official communications, and important updates all in one place</p>
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div>
                {children}
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                <div className="mb-8 pb-6 border-b-2 border-orange-500/30">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                      <FiUser className="text-3xl text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Profile Details</h1>
                      <p className="text-orange-300 text-sm mt-1">Manage your account information</p>
                    </div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border-2 border-orange-500/30 shadow-2xl p-16 text-center hover:border-orange-500/50 transition-all duration-300">
                  <div className="w-24 h-24 bg-linear-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/30">
                    <FiUser className="text-5xl text-orange-400" />
                  </div>
                  <p className="text-white font-bold text-2xl mb-3">Profile Management Coming Soon</p>
                  <p className="text-orange-300 text-sm max-w-md mx-auto">Manage your account settings, update personal information, and customize preferences</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
