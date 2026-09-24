'use client';

import { FaSignOutAlt, FaUser, FaHome } from 'react-icons/fa';
import Link from 'next/link';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  officialName: string;
  designation: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  officialName,
  designation,
}: DashboardHeaderProps) {
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-purple-200 text-sm mt-1">{subtitle}</p>
          </div>

          {/* Right: User Info & Actions */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white font-semibold">{officialName}</p>
              <p className="text-purple-300 text-sm">{designation}</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 text-blue-300 transition"
                title="Home"
              >
                <FaHome className="text-xl" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg border border-red-500/30 text-red-300 transition"
                title="Logout"
              >
                <FaSignOutAlt className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
