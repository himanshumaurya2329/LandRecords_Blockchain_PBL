'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import OTPModal from '@/components/OTPModal';
import { FaUser, FaPhone, FaIdCard, FaMapMarkerAlt, FaLock, FaCheckCircle, FaTimesCircle, FaArrowRight } from 'react-icons/fa';

export default function UserRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    aadhar: '',
    address: '',
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
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.aadhar.trim()) newErrors.aadhar = 'Aadhar number is required';
    if (!/^\d{12}$/.test(formData.aadhar)) newErrors.aadhar = 'Aadhar must be 12 digits';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';

    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/register', {
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
      const response = await fetch('/api/users/register', {
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-linear-to-r from-blue-500 to-cyan-600 rounded-full mb-4 shadow-xl">
            <FaUser className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">User Registration</h1>
          <p className="text-blue-200">Create your account to get started</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-blue-500/20">
          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-xl flex items-center gap-3">
              <FaTimesCircle className="text-xl" />
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.firstName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-500/30 transition focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    placeholder="Kumar"
                  />
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.lastName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>
            </div>

            {/* Demographic Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                Demographic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white ${
                      errors.dateOfBirth
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white ${
                      errors.gender
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaPhone className="text-blue-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Government ID */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaIdCard className="text-blue-400" />
                Government ID
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Aadhar Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhar"
                    value={formData.aadhar}
                    onChange={handleChange}
                    placeholder="000000000000"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.aadhar
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.aadhar && <p className="text-red-400 text-sm mt-1">{errors.aadhar}</p>}
                </div>
              </div>

              <div>
                <label className="block text-gray-200 font-medium mb-2">
                  <FaMapMarkerAlt className="inline mr-2 text-blue-400" />
                  Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                    errors.address
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-blue-500/30 focus:ring-blue-500'
                  }`}
                />
                {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>

            {/* Account Security */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaLock className="text-blue-400" />
                Account Security
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.username
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="••••••"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white placeholder-gray-400 ${
                      errors.password2
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-blue-500/30 focus:ring-blue-500'
                    }`}
                  />
                  {errors.password2 && <p className="text-red-400 text-sm mt-1">{errors.password2}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Sending OTP...' : 'Create Account'}
              {!loading && <FaArrowRight />}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/userlogin" className="text-blue-400 hover:text-blue-300 font-semibold">
                Login here
              </Link>
            </p>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
          <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition">
            ← Back to Home
          </Link>
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
