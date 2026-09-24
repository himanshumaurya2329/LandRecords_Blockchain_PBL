'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import OTPModal from '@/components/OTPModal';
import { DESIGNATIONS, DESIGNATION_LABELS } from '@/lib/constants';
import {
  FaShieldAlt, FaUser, FaEnvelope, FaPhone, FaLock, FaCheckCircle, FaTimesCircle, FaArrowRight, FaBuilding,
  FaMap, FaLandmark, FaMapPin, FaFileAlt, FaBriefcase
} from 'react-icons/fa';

export default function OfficialRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    officeId: '',
    username: '',
    password: '',
    password2: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.officeId.trim()) newErrors.officeId = 'Office ID is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';

    return newErrors;
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/officials/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendOTP',
          email: formData.email,
          firstName: formData.firstName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || { submit: data.message || 'Failed to send OTP' });
      } else {
        setShowOTPModal(true);
        setErrors({});
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setOtpLoading(true);
    try {
      const response = await fetch('/api/officials/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyAndRegister',
          ...formData,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.otp || data.message || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      throw error;
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-center">
          {/* Left Section - Government Icons & Decoration (30%) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-center space-y-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">Official Registration</h2>
              <p className="text-purple-200 text-lg">Government Portal Access</p>
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

          {/* Right Section - Registration Form in Table Format (70%) */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="w-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-500/20">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-linear-to-r from-purple-500 to-indigo-600 rounded-full mb-4 shadow-xl">
                  <FaShieldAlt className="text-3xl text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Create Official Account</h1>
                <p className="text-purple-200">Register with email verification</p>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-xl flex items-center gap-3">
                  <FaTimesCircle className="text-xl" />
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* 3-Column Table Format */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {/* Row 1: First Name, Designation, Email */}
                      <tr className="border-b border-purple-500/20">
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaUser className="text-purple-400" />
                            First Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.firstName
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="John"
                          />
                          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaBuilding className="text-purple-400" />
                            Designation <span className="text-red-400">*</span>
                          </label>
                          <select
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white text-sm ${errors.designation
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                          >
                            <option value="">Select Role</option>
                            {DESIGNATIONS.map((designation) => (
                              <option key={designation} value={designation}>
                                {DESIGNATION_LABELS[designation]}
                              </option>
                            ))}
                          </select>
                          {errors.designation && <p className="text-red-400 text-xs mt-1">{errors.designation}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaEnvelope className="text-purple-400" />
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.email
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="official@email.com"
                          />
                          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </td>
                      </tr>

                      {/* Row 2: Last Name, Department, Phone */}
                      <tr className="border-b border-purple-500/20">
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaUser className="text-purple-400" />
                            Last Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.lastName
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="Doe"
                          />
                          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaBuilding className="text-purple-400" />
                            Department <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.department
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="Revenue"
                          />
                          {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaPhone className="text-purple-400" />
                            Phone <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.phone
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="1234567890"
                          />
                          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                        </td>
                      </tr>

                      {/* Row 3: Office ID, Username, Password */}
                      <tr className="border-b border-purple-500/20">
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaBuilding className="text-purple-400" />
                            Office ID <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="officeId"
                            value={formData.officeId}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.officeId
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="OFF-001"
                          />
                          {errors.officeId && <p className="text-red-400 text-xs mt-1">{errors.officeId}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaUser className="text-purple-400" />
                            Username <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.username
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="username"
                          />
                          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                        </td>
                        <td className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaLock className="text-purple-400" />
                            Password <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 text-sm ${errors.password
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="••••••"
                          />
                          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </td>
                      </tr>

                      {/* Row 4: Confirm Password (spans 3 columns) */}
                      <tr>
                        <td colSpan={3} className="p-4">
                          <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                            <FaLock className="text-purple-400" />
                            Confirm Password <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${errors.password2
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-purple-500/30 focus:ring-purple-500'
                              }`}
                            placeholder="••••••"
                          />
                          {errors.password2 && <p className="text-red-400 text-xs mt-1">{errors.password2}</p>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-8"
                >
                  {loading ? 'Sending OTP...' : 'Create Account'}
                  {!loading && <FaArrowRight />}
                </button>

                {/* Links */}
                <div className="space-y-3 text-center text-sm">
                  <p className="text-gray-400">
                    Already have an account?{' '}
                    <Link href="/officiallogin" className="text-purple-400 hover:text-purple-300 font-semibold">
                      Login here
                    </Link>
                  </p>
                  <p className="text-gray-400">
                    <Link href="/" className="text-purple-400 hover:text-purple-300 font-semibold">
                      ← Back to Home
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        email={formData.email}
        onVerify={handleOTPVerify}
        onCancel={() => setShowOTPModal(false)}
        isLoading={otpLoading}
      />
    </div>
  );
}
