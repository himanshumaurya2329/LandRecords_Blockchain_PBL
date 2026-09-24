'use client';

import Link from 'next/link';
import { FaUser, FaShieldAlt, FaMap, FaLandmark, FaMapPin, FaFileAlt, FaBriefcase, FaArrowRight, FaBuilding, FaCheckCircle, FaCrown } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-4 tracking-tight">E-Land Records</h1>
            <p className="text-xl text-indigo-600 font-medium mb-2">Digital Land Management System</p>
            <p className="text-slate-500 max-w-lg">Secure, efficient, and transparent land record management for the modern era.</p>
          </div>
          <div className="shrink-0 animate-fade-in">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Emblem_of_India_with_transparent_background.png"
              alt="Emblem of India"
              className="w-40 h-40 object-contain drop-shadow-xl opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Two Portals */}
      <div className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* User Portal Section - CLEAN WHITE LOOK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Icons */}
            <div className="hidden lg:flex flex-col justify-center items-center space-y-8 order-last lg:order-first">
              {/* Floating Composition */}
              <div className="relative w-full h-80 bg-blue-50 rounded-[2rem] border border-blue-100 p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

                {/* Main Icon */}
                <div className="relative z-10 animate-float">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100 border border-blue-50">
                    <FaMap className="text-5xl text-blue-500" />
                  </div>
                </div>

                {/* Orbiting Icons */}
                <div className="absolute top-12 left-12 animate-pulse delay-100">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50">
                    <FaMapPin className="text-2xl text-emerald-500" />
                  </div>
                </div>
                <div className="absolute bottom-12 right-12 animate-pulse delay-300">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50">
                    <FaFileAlt className="text-2xl text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full"><FaCheckCircle className="text-green-500" /> View Records</span>
                <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full"><FaCheckCircle className="text-blue-500" /> Track Status</span>
                <span className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full"><FaCheckCircle className="text-purple-500" /> Download Docs</span>
              </div>
            </div>

            {/* Right - Login Form */}
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-8 border border-slate-100">
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4 text-blue-600">
                    <FaUser className="text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">User Portal</h3>
                  <p className="text-slate-500 text-sm">Citizen Services & Land Records</p>
                </div>

                <div className="space-y-4 mb-6">
                  <Link
                    href="/userlogin"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    User Login
                    <FaArrowRight className="text-sm" />
                  </Link>

                  <Link
                    href="/userregistration"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-6 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    Create Account
                    <FaArrowRight className="text-sm text-slate-400" />
                  </Link>
                </div>

                <div className="text-center text-xs text-slate-400">
                  Secure access for all citizens
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-slate-300 font-medium text-sm tracking-wider">OFFICIAL ACCESS</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          {/* Official Portal Section - PROFESSIONAL LOOK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Login Form */}
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-8 border border-slate-100">
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-indigo-50 rounded-2xl mb-4 text-indigo-600">
                    <FaShieldAlt className="text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Official Portal</h3>
                  <p className="text-slate-500 text-sm">Government Employee Access</p>
                </div>

                <div className="space-y-4 mb-6">
                  <Link
                    href="/officiallogin"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    Official Login
                    <FaArrowRight className="text-sm" />
                  </Link>

                  <Link
                    href="/officialregistration"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-6 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    Register Official
                    <FaArrowRight className="text-sm text-slate-400" />
                  </Link>
                </div>

                <div className="text-center text-xs text-slate-400">
                  Authorized personnel only
                </div>
              </div>
            </div>

            {/* Right - Admin/Official Info */}
            <div className="hidden lg:flex flex-col justify-center items-center space-y-8">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center hover:-translate-y-1 transition-transform">
                  <FaBriefcase className="text-3xl text-indigo-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700">Workflow</h4>
                  <p className="text-xs text-slate-500 mt-1">Efficient Processing</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center hover:-translate-y-1 transition-transform">
                  <FaLandmark className="text-3xl text-purple-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700">Governance</h4>
                  <p className="text-xs text-slate-500 mt-1">Transparent Records</p>
                </div>
              </div>

              {/* Admin Link Subtle */}
              <div className="pt-4">
                <Link href="/adminlogin" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
                  <FaCrown /> System Administration
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-400 text-sm font-medium">&copy; 2025 E-Land Records. Government of India.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
