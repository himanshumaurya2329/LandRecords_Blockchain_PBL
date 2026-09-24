'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { DESIGNATIONS, DESIGNATION_LABELS } from '@/lib/constants';
import { FaShieldAlt, FaUser, FaLock, FaMap, FaLandmark, FaMapPin, FaFileAlt, FaArrowRight, FaBriefcase } from 'react-icons/fa';

export default function OfficialLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    designation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.designation) newErrors.designation = 'Designation/Role is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/officials/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || 'Login failed. Please try again.' });
        return;
      }

      // Login successful - redirect to unified official dashboard
      window.location.href = '/official-dashboard';
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Section - Land Icons & Government Theme */}
          <div className="hidden lg:flex flex-col justify-center items-center space-y-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">Government Portal</h2>
              <p className="text-purple-200 text-lg">Official Land Records Management</p>
            </div>

            {/* Floating Icons */}
            <div className="relative w-full h-96">
              {/* Main Icon */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-24 h-24 bg-linear-to-br from-purple-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FaShieldAlt className="text-5xl text-white" />
                </div>
              </div>

              {/* Top Left */}
              <div className="absolute top-20 left-0 animate-pulse">
                <div className="w-16 h-16 bg-linear-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaBriefcase className="text-3xl text-white" />
                </div>
              </div>

              {/* Top Right */}
              <div className="absolute top-20 right-0 animate-pulse animation-delay-200">
                <div className="w-16 h-16 bg-linear-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaLandmark className="text-3xl text-white" />
                </div>
              </div>

              {/* Bottom Left */}
              <div className="absolute bottom-0 left-8 animate-pulse animation-delay-400">
                <div className="w-14 h-14 bg-linear-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaMap className="text-2xl text-white" />
                </div>
              </div>

              {/* Bottom Right */}
              <div className="absolute bottom-0 right-8 animate-pulse animation-delay-600">
                <div className="w-14 h-14 bg-linear-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaFileAlt className="text-2xl text-white" />
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 text-sm w-full">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-purple-500/20">
                <p className="text-purple-200 flex items-center gap-2">
                  <FaShieldAlt className="text-purple-400" /> Secure Access
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-purple-500/20">
                <p className="text-purple-200 flex items-center gap-2">
                  <FaMapPin className="text-green-400" /> Land Management
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-purple-500/20">
                <p className="text-purple-200 flex items-center gap-2">
                  <FaBriefcase className="text-blue-400" /> Official Portal
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-purple-500/20">
                <p className="text-purple-200 flex items-center gap-2">
                  <FaFileAlt className="text-yellow-400" /> Record Tracking
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="flex justify-center items-center">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-linear-to-r from-purple-500 to-indigo-600 rounded-full mb-4 shadow-xl">
                  <FaShieldAlt className="text-3xl text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Official Login</h1>
                <p className="text-purple-200">Secure Government Access</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="flex text-gray-200 font-medium mb-2 items-center gap-2">
                    <FaUser className="text-purple-400" />
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${errors.username
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-purple-500/30 focus:ring-purple-500'
                      }`}
                  />
                  {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="flex text-gray-200 font-medium mb-2 items-center gap-2">
                    <FaLock className="text-purple-400" />
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-purple-500/30 focus:ring-purple-500'
                      }`}
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Designation/Role */}
                <div>
                  <label className="flex text-gray-200 font-medium mb-2 items-center gap-2">
                    <FaBriefcase className="text-purple-400" />
                    Designation/Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white ${errors.designation
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-purple-500/30 focus:ring-purple-500'
                      }`}
                  >
                    <option value="">Select Your Role</option>
                    {DESIGNATIONS.map((designation) => (
                      <option key={designation} value={designation}>
                        {DESIGNATION_LABELS[designation]}
                      </option>
                    ))}
                  </select>
                  {errors.designation && <p className="text-red-400 text-sm mt-1">{errors.designation}</p>}
                </div>

                {errors.submit && (
                  <div className="p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Logging in...' : 'Login'}
                  {!loading && <FaArrowRight />}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-linear-to-r from-transparent to-purple-500/20"></div>
                  <span className="text-gray-400 text-sm">or</span>
                  <div className="flex-1 h-px bg-linear-to-l from-transparent to-purple-500/20"></div>
                </div>

                {/* Register Link */}
                <p className="text-center text-gray-400 text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/officialregistration" className="text-purple-400 hover:text-purple-300 font-semibold">
                    Register here
                  </Link>
                </p>

                {/* Home Link */}
                <p className="text-center text-gray-400 text-sm">
                  <Link href="/" className="text-purple-400 hover:text-purple-300 font-semibold">
                    ← Back to Home
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
