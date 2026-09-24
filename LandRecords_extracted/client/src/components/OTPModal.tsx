'use client';

import { useState, FormEvent } from 'react';
import { FaLock, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

interface OTPModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function OTPModal({ isOpen, email, onVerify, onCancel, isLoading = false }: OTPModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be 6 digits');
      return;
    }

    setVerifying(true);
    try {
      await onVerify(otp);
      setSuccess(true);
      setTimeout(() => {
        setOtp('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-blue-500/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-linear-to-r from-blue-500 to-cyan-600 rounded-full mb-4 shadow-xl">
            <FaLock className="text-3xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
          <p className="text-blue-200 text-sm">Enter the OTP sent to your email</p>
        </div>

        {/* Email Display */}
        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3 mb-6 text-center">
          <p className="text-gray-300 text-sm">Email: <span className="text-blue-300 font-medium">{email}</span></p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
              <FaCheckCircle className="text-4xl text-green-400" />
            </div>
            <p className="text-green-400 font-semibold">OTP Verified Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="flex text-gray-200 font-medium mb-2 items-center gap-2">
                <FaLock className="text-blue-400" />
                Enter OTP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                maxLength={6}
                disabled={verifying || isLoading}
                className={`w-full px-4 py-4 rounded-lg bg-white/10 border transition focus:outline-none focus:ring-2 text-white text-center text-3xl tracking-widest font-bold placeholder-gray-400 ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-blue-500/30 focus:ring-blue-500'
                }`}
              />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                  <FaTimesCircle /> {error}
                </div>
              )}
            </div>

            {/* Info Text */}
            <p className="text-gray-400 text-xs text-center">
              OTP is valid for 10 minutes. Check your spam folder if you don't see the email.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                type="submit"
                disabled={verifying || isLoading || !otp}
                className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {verifying || isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Verify OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={verifying || isLoading}
                className="flex-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-bold py-3 px-6 rounded-lg transition-all border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
