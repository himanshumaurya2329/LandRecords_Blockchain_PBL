'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiLoader,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiCalendar,
  FiMapPin,
  FiMap,
  FiHome,
  FiFileText,
  FiUpload,
  FiInfo,
  FiDownload,
} from 'react-icons/fi';
import { MdOutlineLandscape, MdVerified } from 'react-icons/md';
import { IoRocketSharp } from 'react-icons/io5';

interface LandRequestData {
  receiptNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  aadharNumber: string;
  dob: string;
  ownerName: string;
  surveyNumber: string;
  area: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  nature: string;
  ipfsHash: string;
  status: string;
  createdAt: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptNumber = params.receipt as string;

  const [landRequest, setLandRequest] = useState<LandRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/land-requests/receipt/${receiptNumber}`);
        if (!response.ok) {
          throw new Error('Receipt not found');
        }
        const data = await response.json();
        setLandRequest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptNumber]);

  const handleSubmitToClerk = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/land-requests/submit-to-clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      // Show success and redirect
      alert('✅ Successfully submitted to Clerk!');
      router.push('/user-dashboard');
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Submission failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-200 border-t-cyan-600 mx-auto mb-6"></div>
          <p className="text-lg font-semibold text-gray-700">Loading receipt...</p>
          <p className="text-sm text-gray-500 mt-2">Processing your land request</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <FiFileText className="text-3xl text-red-600" />
            </div>
            <p className="text-red-800 font-bold text-lg mb-4">{error}</p>
            <Link href="/user-dashboard">
              <button className="w-full px-6 py-3 bg-linear-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2">
                <FiArrowLeft className="text-lg" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!landRequest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/user-dashboard">
            <button className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center gap-2 border border-gray-300 shadow-sm">
              <FiArrowLeft className="text-xl" />
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* PDF-Style Document Container */}
        <div className="bg-white rounded-lg shadow-2xl p-12 md:p-16 max-w-4xl mx-auto">
          {/* Document Header */}
          <div className="text-center pb-12 border-b-4 border-gray-800 mb-12">
            <div className="inline-block mb-6">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                <MdOutlineLandscape className="text-3xl text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">LAND REQUEST APPLICATION</h1>
            <p className="text-gray-700 font-semibold text-lg">Official Receipt Document</p>

            <div className="mt-8 space-y-1">
              <p className="text-gray-800 font-bold text-sm">Receipt Number: <span className="font-black text-base">{landRequest.receiptNumber}</span></p>
              <p className="text-gray-700 text-sm">Date of Submission: <span className="font-semibold">{new Date(landRequest.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Letter Content */}
            <div className="space-y-6 text-justify">
              <p className="text-gray-900 leading-relaxed">
                <span className="font-bold">Dear Sir/Madam,</span>
              </p>

              <p className="text-gray-800 leading-relaxed">
                This is to certify that a formal application for lease/registration of farmland has been received and registered in our records. The applicant details and property information are documented below for official records and further processing.
              </p>

              {/* Applicant Details Section */}
              <div className="bg-gray-50 p-8 border border-gray-300 rounded-lg">
                <h3 className="font-black text-gray-900 mb-6 text-lg">APPLICANT INFORMATION</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Full Name</p>
                    <p className="text-gray-900 font-semibold mt-1">{landRequest.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Email Address</p>
                    <p className="text-gray-900 font-semibold mt-1">{landRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Phone Number</p>
                    <p className="text-gray-900 font-semibold mt-1">{landRequest.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Date of Birth</p>
                    <p className="text-gray-900 font-semibold mt-1">{new Date(landRequest.dob).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Aadhar Number</p>
                    <p className="text-gray-900 font-semibold mt-1">****{landRequest.aadharNumber.slice(-4)}</p>
                  </div>
                </div>
              </div>

              {/* Property Details Section */}
              <div className="bg-gray-50 p-8 border border-gray-300 rounded-lg">
                <h3 className="font-black text-gray-900 mb-6 text-lg">PROPERTY INFORMATION</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Owner Name</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Survey Number</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.surveyNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Land Area</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.area} sq. ft.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Property Nature</p>
                      <p className="text-gray-900 font-semibold mt-1 capitalize">{landRequest.nature}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">Property Address</p>
                    <p className="text-gray-900 font-semibold mt-1">{landRequest.address}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">State</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.state}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">City</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.city}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase">Pincode</p>
                      <p className="text-gray-900 font-semibold mt-1">{landRequest.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* IPFS Hash Section */}
              <div className="bg-gray-50 p-8 border border-gray-300 rounded-lg">
                <h3 className="font-black text-gray-900 mb-4 text-lg">DOCUMENT STATUS</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-semibold">Document Upload Status:</p>
                    <p className="px-4 py-2 bg-gray-900 text-white rounded font-bold text-sm">✓ VERIFIED</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">IPFS Hash (Blockchain Reference)</p>
                    <p className="text-gray-800 font-mono text-xs break-all bg-white p-3 border border-gray-300 rounded">{landRequest.ipfsHash}</p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t-2 border-b-2 border-gray-800 py-6">
                <p className="text-gray-800 leading-relaxed text-sm">
                  The applicant agrees to all terms and conditions outlined in the application guidelines. This receipt serves as proof of application submission. The property details mentioned above have been verified and recorded. Any further documentation or clarification required will be communicated through the provided contact information.
                </p>
              </div>

              {/* Signature Section */}
              <div className="pt-8 space-y-2">
                <p className="text-gray-900 leading-relaxed">
                  <span className="font-bold">Authorized By:</span> Land Registry Department
                </p>
                <p className="text-gray-900 leading-relaxed">
                  <span className="font-bold">Date:</span> {new Date(landRequest.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-4 border-gray-800 mt-12 pt-8">
            <p className="text-center text-gray-600 font-semibold text-sm">
              This is an official document. Please keep it safe for future reference.
            </p>
            <p className="text-center text-gray-500 text-xs mt-3">
              Generated on {new Date(landRequest.createdAt).toLocaleDateString('en-GB')} | Receipt: {landRequest.receiptNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons - Below Document */}
        <div className="max-w-4xl mx-auto mt-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => window.open(`/api/land-requests/generate-pdf?receipt=${landRequest.receiptNumber}`, '_blank')}
              className="w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-100 shadow-md hover:shadow-lg active:scale-95"
            >
              <FiDownload className="text-2xl" />
              <span>Download PDF Receipt</span>
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmitToClerk}
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${isSubmitting
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-xl active:scale-95'
                }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="text-2xl animate-spin" />
                  <span>Submitting to Clerk...</span>
                </>
              ) : (
                <>
                  <IoRocketSharp className="text-2xl" />
                  <span>Submit to Clerk</span>
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-white border-l-4 border-gray-900 rounded-lg p-6 shadow-md">
            <p className="font-bold text-gray-900 mb-2">📋 NEXT STEPS</p>
            <p className="text-sm text-gray-700">
              After submission, your application will be forwarded to the Clerk's office for verification and processing. You will receive email updates on the progress of your application. The processing typically takes 5-10 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
