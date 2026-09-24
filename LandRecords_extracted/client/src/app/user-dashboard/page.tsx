'use client';

import { useState, useRef, useEffect } from 'react';
import DIDDisplay from '@/components/DIDDisplay';
import { useRouter } from 'next/navigation';
import {
  FiUpload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiMap,
  FiHome,
  FiLoader,
  FiInfo,
  FiRefreshCw,
  FiArrowRight,
  FiFolder,
  FiInbox,
  FiTrendingUp,
  FiList,
  FiClock,
  FiEye,
  FiDownload,
} from 'react-icons/fi';
import {
  MdOutlineLandscape,
  MdDocumentScanner,
  MdRadio,
} from 'react-icons/md';
import { IoRocketSharp } from 'react-icons/io5';

interface UserData {
  id: string;
  firstName: string;
  did?: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  aadhar: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  name?: string;
}

interface LandRequest {
  _id: string;
  receiptNumber: string;
  createdAt: string;
  status: string;
  currentlyWith: string;
  currentlyWithName?: string;
  fullName: string;
  surveyNumber: string;
  area: string;
  ownerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  ipfsHash?: string;
  pattaHash?: string; // IPFS hash of generated Patta certificate
  certificateNumber?: string;
}

interface NotificationItem {
  _id: string;
  historyId: string;
  receiptNumber: string;
  action: string;
  remarks?: string;
  fromDesignation?: string;
  timestamp: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [digiLockerDocs, setDigiLockerDocs] = useState<any[]>([]);
  const [selectedDigiDoc, setSelectedDigiDoc] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [nature, setNature] = useState('electronic');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<LandRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: '',
    surveyNumber: '',
    area: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          if (data.user?.aadhar) fetchDigiLockerDocs(data.user.aadhar);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const fetchRequests = async () => {
    if (!userData) return;
    setLoadingRequests(true);
    try {
      const response = await fetch(
        `/api/land-requests/by-email?email=${userData.email}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status' && userData) {
      fetchRequests();
    }
  }, [activeTab, userData]);

  const fetchNotifications = async () => {
    if (!userData) return;
    setLoadingNotifications(true);
    try {
      const response = await fetch(
        `/api/user/notifications?email=${userData.email}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox' && userData) {
      fetchNotifications();
    }
  }, [activeTab, userData]);

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, pdf: 'Only PDF files are allowed' }));
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, pdf: 'PDF cannot exceed 20MB' }));
      return;
    }

    setPdfFile(file);
    const fileURL = URL.createObjectURL(file);
    setPdfPreview(fileURL);
    setErrors((prev) => ({ ...prev, pdf: '' }));
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedDigiDoc) newErrors.pdf = "Please select a document from DigiLocker";
    if (!userData?.firstName || !userData?.lastName) newErrors.fullName = 'Full name is required';
    if (!userData?.email) newErrors.email = 'Email is required';
    if (!userData?.phone) newErrors.phone = 'Phone number is required';
    if (!userData?.aadhar) newErrors.aadhar = 'Aadhar number is required';
    if (!userData?.dateOfBirth) newErrors.dob = 'Date of birth is required';
    if (!formData.surveyNumber.trim()) newErrors.surveyNumber = 'Survey number is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!/^\d{6}$/.test(formData.pincode.replace(/\D/g, ''))) newErrors.pincode = 'Pincode must be 6 digits';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchDigiLockerDocs = async (aadhar: string) => {
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/digilocker-vault?aadhar=${aadhar}`);
      const data = await res.json();
      if (data.success) {
        setDigiLockerDocs(data.data);
        const landDeed = data.data.find((d: any) => d.documentType === "land_deed");
        if (landDeed) setSelectedDigiDoc(landDeed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };
  const uploadToIPFS = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const response = await fetch('/api/ipfs/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64String,
              fileName: file.name,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'IPFS upload failed');
          }

          const data = await response.json();
          resolve(data.ipfsHash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');

    if (!userData) {
      setErrors({ submit: 'User data not loaded. Please refresh the page.' });
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Uploading PDF to IPFS...');
      setUploadProgress(30);
      const ipfsHash = selectedDigiDoc?.ipfsHash || selectedDigiDoc?._id;
      if (!selectedDigiDoc) throw new Error("No DigiLocker document selected");
      console.log('DigiLocker document selected:', selectedDigiDoc.fileName);
      setUploadProgress(60);

      console.log('Creating land request...', { formData, userData });
      const response = await fetch('/api/land-requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          fullName: `${userData?.firstName} ${userData?.lastName}` || '',
          email: userData?.email || '',
          phoneNumber: userData?.phone || '',
          aadharNumber: userData?.aadhar || '',
          dob: userData?.dateOfBirth || '',
          nature,
          ipfsHash,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.message || 'Failed to create land request');
      }

      const data = await response.json();
      console.log('Land request created:', data);
      setUploadProgress(100);

      setTimeout(() => {
        router.push(`/user-dashboard/receipt/${data.receiptNumber}`);
      }, 500);
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      console.error('Full error details:', errorMessage);
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status: string) => {
    // Show "Approved" if completed or approved, "Rejected" if rejected, otherwise "Pending"
    if (status === 'completed' || status === 'approved') {
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'APPROVED', icon: '✅', border: 'border-green-200' };
    } else if (status === 'rejected') {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED', icon: '❌', border: 'border-red-200' };
    } else {
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING', icon: '⏳', border: 'border-yellow-200' };
    }
  };

  const handleViewPatta = async (receiptNumber: string) => {
    const request = requests.find(r => r.receiptNumber === receiptNumber);
    console.log('handleViewPatta called for:', receiptNumber, 'status:', request?.status, 'pattaHash:', request?.pattaHash);

    // If pattaHash is available (Ministry of Welfare approved), open from IPFS
    if (request?.pattaHash) {
      const documentUrl = `/api/documents/view?hash=${request.pattaHash}&print=true`;
      // For PDF download, create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `patta-${request.certificateNumber || request.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // If status is completed but no pattaHash, try to generate Patta on-demand
    if (request?.status === 'completed') {
      try {
        console.log('Generating Patta on-demand for:', receiptNumber);
        const response = await fetch('/api/patta/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: request._id }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Patta generated:', data);

          // Fetch fresh data instead of relying on state update
          const freshResponse = await fetch(
            `/api/land-requests/by-email?email=${userData?.email}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (freshResponse.ok) {
            const freshData = await freshResponse.json();
            const updatedRequest = freshData.requests?.find((r: any) => r.receiptNumber === receiptNumber);

            if (updatedRequest?.pattaHash) {
              const documentUrl = `/api/documents/view?hash=${updatedRequest.pattaHash}`;
              window.open(documentUrl, '_blank');
              return;
            }
          }
        } else {
          console.error('Failed to generate Patta:', await response.text());
        }
      } catch (error) {
        console.error('Error generating Patta:', error);
      }
    }

    // Also try for approved status as fallback
    if (request?.status === 'approved' && !request?.pattaHash) {
      try {
        console.log('Generating Patta on-demand for approved application:', receiptNumber);
        const response = await fetch('/api/patta/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: request._id }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Patta generated for approved application:', data);

          // Fetch fresh data
          const freshResponse = await fetch(
            `/api/land-requests/by-email?email=${userData?.email}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (freshResponse.ok) {
            const freshData = await freshResponse.json();
            const updatedRequest = freshData.requests?.find((r: any) => r.receiptNumber === receiptNumber);

            if (updatedRequest?.pattaHash) {
              const documentUrl = `/api/documents/view?hash=${updatedRequest.pattaHash}`;
              window.open(documentUrl, '_blank');
              return;
            }
          }
        } else {
          console.error('Failed to generate Patta for approved application:', await response.text());
        }
      } catch (error) {
        console.error('Error generating Patta for approved application:', error);
      }
    }

    // Fallback: Generate PDF view
    window.open(`/api/land-requests/generate-pdf?receipt=${receiptNumber}`, '_blank');
  };

  const handleDownloadPatta = async (receiptNumber: string) => {
    const request = requests.find(r => r.receiptNumber === receiptNumber);

    // If pattaHash is available (Ministry of Welfare approved), open in new window with print dialog
    if (request?.pattaHash) {
      const documentUrl = `/api/documents/view?hash=${request.pattaHash}&print=true`;
      // For PDF download, create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `patta-${request.certificateNumber || request.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // If status is completed but no pattaHash, try to generate Patta on-demand
    if (request?.status === 'completed') {
      try {
        console.log('Generating Patta on-demand for download:', receiptNumber);
        const response = await fetch('/api/patta/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: request._id }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Patta generated for download:', data);

          // Fetch fresh data instead of relying on state update
          const freshResponse = await fetch(
            `/api/land-requests/by-email?email=${userData?.email}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (freshResponse.ok) {
            const freshData = await freshResponse.json();
            const updatedRequest = freshData.requests?.find((r: any) => r.receiptNumber === receiptNumber);

            if (updatedRequest?.pattaHash) {
              const documentUrl = `/api/documents/view?hash=${updatedRequest.pattaHash}&print=true`;
              window.open(documentUrl, '_blank');
              return;
            }
          }
        } else {
          console.error('Failed to generate Patta for download:', await response.text());
        }
      } catch (error) {
        console.error('Error generating Patta for download:', error);
      }
    }

    // Also try for approved status as fallback
    if (request?.status === 'approved' && !request?.pattaHash) {
      try {
        console.log('Generating Patta on-demand for approved application download:', receiptNumber);
        const response = await fetch('/api/patta/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: request._id }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Patta generated for approved application download:', data);

          // Fetch fresh data
          const freshResponse = await fetch(
            `/api/land-requests/by-email?email=${userData?.email}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (freshResponse.ok) {
            const freshData = await freshResponse.json();
            const updatedRequest = freshData.requests?.find((r: any) => r.receiptNumber === receiptNumber);

            if (updatedRequest?.pattaHash) {
              const documentUrl = `/api/documents/view?hash=${updatedRequest.pattaHash}&print=true`;
              window.open(documentUrl, '_blank');
              return;
            }
          }
        } else {
          console.error('Failed to generate Patta for approved application download:', await response.text());
        }
      } catch (error) {
        console.error('Error generating Patta for approved application download:', error);
      }
    }

    // Fallback: Generate PDF download
    window.open(`/api/land-requests/generate-pdf?receipt=${receiptNumber}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500">Welcome back, {userData?.firstName || 'User'}</p>
          </div>
          <a href="/digilocker" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md">
            🔐 My DigiLocker
          </a>
        </div>

        {/* Tab Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`p-6 rounded-2xl transition-all duration-300 text-left border ${activeTab === 'create'
              ? 'bg-white border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeTab === 'create' ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <FiFolder className={`text-2xl ${activeTab === 'create' ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${activeTab === 'create' ? 'text-blue-900' : 'text-slate-700'}`}>
              Create Request
            </h3>
            <p className="text-sm text-slate-500">
              Submit new application
            </p>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`p-6 rounded-2xl transition-all duration-300 text-left border ${activeTab === 'status'
              ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-100 ring-1 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeTab === 'status' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <FiTrendingUp className={`text-2xl ${activeTab === 'status' ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${activeTab === 'status' ? 'text-emerald-900' : 'text-slate-700'}`}>
              Track Status
            </h3>
            <p className="text-sm text-slate-500">
              View your requests
            </p>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`p-6 rounded-2xl transition-all duration-300 text-left border ${activeTab === 'inbox'
              ? 'bg-white border-purple-500 shadow-lg shadow-purple-100 ring-1 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeTab === 'inbox' ? 'bg-purple-50' : 'bg-slate-50'}`}>
              <FiInbox className={`text-2xl ${activeTab === 'inbox' ? 'text-purple-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${activeTab === 'inbox' ? 'text-purple-900' : 'text-slate-700'}`}>
              Inbox
            </h3>
            <p className="text-sm text-slate-500">
              Messages & alerts
            </p>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`p-6 rounded-2xl transition-all duration-300 text-left border ${activeTab === 'details'
              ? 'bg-white border-orange-500 shadow-lg shadow-orange-100 ring-1 ring-orange-500/20'
              : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeTab === 'details' ? 'bg-orange-50' : 'bg-slate-50'}`}>
              <FiList className={`text-2xl ${activeTab === 'details' ? 'text-orange-600' : 'text-slate-400'}`} />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${activeTab === 'details' ? 'text-orange-900' : 'text-slate-700'}`}>
              My Profile
            </h3>
            <p className="text-sm text-slate-500">
              Personal information
            </p>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 ">
            {/* Left Side: PDF Preview - 3 columns */}
            <div className="lg:col-span-3 sticky space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                      <FiFileText className="text-lg text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">🔐 DigiLocker Documents</h3>
                      <p className="text-xs text-slate-500">Select your verified document</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {loadingDocs && (
                    <div className="text-center py-4 text-purple-600 text-sm">Loading DigiLocker documents...</div>
                  )}

                  {!loadingDocs && digiLockerDocs.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-yellow-800 font-medium">⚠️ No DigiLocker documents found</p>
                      <p className="text-xs text-yellow-600 mt-1">Contact government authority to upload your documents</p>
                      <a href="/digilocker" className="text-xs text-purple-600 underline mt-2 block">View DigiLocker →</a>
                    </div>
                  )}

                  {digiLockerDocs.map((doc: any) => (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDigiDoc(doc)}
                      style={{ cursor: 'pointer' }}
                      className={`rounded-xl p-4 border-2 transition-all ${selectedDigiDoc?._id === doc._id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {doc.documentType === 'aadhaar_card' ? '🪪 Aadhaar Card' : '📜 Land Deed'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{doc.fileName}</p>
                          <p className="text-xs text-slate-400 mt-0.5 break-all">{doc.ipfsHash ? 'IPFS: ' + doc.ipfsHash.slice(0, 20) + '...' : '📁 Stored in vault'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">✅ VERIFIED</span>
                          {selectedDigiDoc?._id === doc._id && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">✓ Selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {errors.pdf && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-xl text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{errors.pdf}</p>
                      </div>
                    </div>
                  )}

                  {selectedDigiDoc && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-purple-800">🔐 DigiLocker Document Selected</p>
                      <p className="text-xs text-purple-600 mt-1">{selectedDigiDoc.fileName}</p>
                      <p className="text-xs text-purple-500 mt-0.5 break-all">{selectedDigiDoc.ipfsHash ? 'Hash: ' + selectedDigiDoc.ipfsHash : 'Document ready - IPFS on approval'}</p>
                    </div>
                  )}

                  {!selectedDigiDoc && (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl h-32 flex items-center justify-center bg-purple-50">
                      <div className="text-center">
                        <p className="text-purple-400 font-medium text-sm">Select a document above</p>
                        <p className="text-xs text-purple-300 mt-1">DigiLocker verified documents only</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right Side: Form - 5 columns */}
            <div className="lg:col-span-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nature Details */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                      <MdDocumentScanner className="text-lg text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">Nature of Request</h4>
                      <p className="text-xs text-slate-500">Select document type</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border ${nature === 'electronic'
                      ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500/20'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                      }`}>
                      <input
                        type="radio"
                        name="nature"
                        value="electronic"
                        checked={nature === 'electronic'}
                        onChange={(e) => setNature(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <MdDocumentScanner className={`text-3xl ${nature === 'electronic' ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className={`font-bold text-sm ${nature === 'electronic' ? 'text-purple-900' : 'text-slate-600'}`}>Electronic</span>
                      </div>
                    </label>
                    <label className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border ${nature === 'physical'
                      ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500/20'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                      }`}>
                      <input
                        type="radio"
                        name="nature"
                        value="physical"
                        checked={nature === 'physical'}
                        onChange={(e) => setNature(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <FiFileText className={`text-3xl ${nature === 'physical' ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className={`font-bold text-sm ${nature === 'physical' ? 'text-purple-900' : 'text-slate-600'}`}>Physical</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Personal Details - Read Only */}
                {!userData ? (
                  <div className="bg-white rounded-2xl border border-yellow-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                        <FiLoader className="text-lg text-yellow-600 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">Loading Details</h4>
                        <p className="text-xs text-yellow-600">Please wait...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <FiUser className="text-lg text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">Personal Details</h4>
                        <p className="text-xs text-slate-500">Auto-filled from profile</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">First Name</label>
                        <input
                          type="text"
                          value={userData.firstName || ''}
                          disabled
                          className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed ${errors.fullName ? 'border-red-300' : 'border-slate-200'
                            }`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Last Name</label>
                        <input
                          type="text"
                          value={userData.lastName || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Email</label>
                        <input
                          type="email"
                          value={userData.email || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Phone</label>
                        <input
                          type="tel"
                          value={userData.phone || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Aadhar Number</label>
                        <input
                          type="text"
                          value={userData.aadhar || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Land Details */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                      <MdOutlineLandscape className="text-lg text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">Land Details</h4>
                      <p className="text-xs text-slate-500">Enter property information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(formData).map((key) => (
                      <div key={key} className={key === 'address' ? 'col-span-2' : ''}>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={formData[key as keyof typeof formData]}
                          onChange={handleInputChange}
                          placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                          className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium ${errors[key]
                            ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400'
                            } outline-none`}
                        />
                        {errors[key] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors[key]}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 border ${isUploading
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 border-transparent text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="text-2xl animate-spin" />
                      <div className="text-left">
                        <div className="text-sm">Processing...</div>
                        <div className="text-xs font-normal opacity-90">{uploadProgress}% Complete</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <IoRocketSharp className="text-xl" />
                      <span>Submit Application</span>
                      <FiArrowRight className="text-xl" />
                    </>
                  )}
                </button>

                {errors.submit && (
                  <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="text-2xl text-red-400 shrink-0 mt-1" />
                      <p className="text-sm text-red-300 font-semibold">{errors.submit}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div>
            <div className="mb-8 pb-6 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <FiTrendingUp className="text-2xl text-emerald-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Request Status</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Track your submitted requests</p>
                  </div>
                </div>
                <button
                  onClick={fetchRequests}
                  disabled={loadingRequests}
                  className="px-5 py-2.5 bg-white border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed md:text-sm"
                >
                  <FiRefreshCw className={loadingRequests ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingRequests ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-16 text-center">
                <FiLoader className="text-4xl text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-lg text-slate-700 font-bold mb-1">Loading Requests</p>
                <p className="text-slate-400 text-sm">Please wait while we fetch your applications...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-16 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                  <FiFolder className="text-4xl text-emerald-400" />
                </div>
                <p className="text-xl text-slate-800 font-bold mb-2">No Requests Yet</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">You haven't submitted any land requests. Create your first application to get started.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <FiArrowRight className="text-lg" />
                  Create Request
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt No.</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Survey No.</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Area</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Currently With</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req, idx) => {
                        const statusBadge = getStatusBadge(req.status);
                        const isApproved = req.status === 'completed' || req.status === 'approved';
                        return (
                          <tr key={req.receiptNumber || idx} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded">{req.receiptNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-700 font-semibold">{req.ownerName || req.fullName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{req.surveyNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 font-medium">{req.area} sq.ft</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-600">
                                <div className="font-semibold">{req.city}</div>
                                <div className="text-xs text-slate-400">{req.state}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-500">{formatDate(req.createdAt)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text} inline-flex items-center gap-1.5 border ${statusBadge.border}`}>
                                <span>{statusBadge.icon}</span>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">{req.currentlyWithName || 'Processing'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewPatta(req.receiptNumber)}
                                  disabled={!isApproved}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 inline-flex items-center gap-1.5 ${isApproved
                                    ? 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                                    : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                                    }`}
                                  title={isApproved ? 'View Patta Certificate' : 'Patta available only after approval'}
                                >
                                  <FiEye className="text-sm" />
                                  View
                                </button>
                                {isApproved && (
                                  <button
                                    onClick={() => handleDownloadPatta(req.receiptNumber)}
                                    className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md border border-transparent"
                                    title="Download Patta Certificate"
                                  >
                                    <FiDownload className="text-sm" />
                                    Download
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-center gap-6 text-sm">
                    <span className="text-slate-600">
                      📊 Total: <span className="font-bold text-slate-900">{requests.length}</span>
                    </span>
                    <span className="text-emerald-700">
                      ✅ Approved: <span className="font-bold">{requests.filter(r => r.status === 'completed').length}</span>
                    </span>
                    <span className="text-amber-600">
                      ⏳ Pending: <span className="font-bold">{requests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length}</span>
                    </span>
                    <span className="text-red-600">
                      ❌ Rejected: <span className="font-bold">{requests.filter(r => r.status === 'rejected').length}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div>
            <div className="mb-8 pb-6 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                    <FiInbox className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inbox</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Notifications and messages</p>
                  </div>
                </div>
                <button
                  onClick={fetchNotifications}
                  disabled={loadingNotifications}
                  className="px-5 py-2.5 bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed md:text-sm"
                >
                  <FiRefreshCw className={loadingNotifications ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingNotifications ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-16 text-center">
                <FiLoader className="text-4xl text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-lg text-slate-700 font-bold mb-1">Loading Notifications</p>
                <p className="text-slate-400 text-sm">Please wait while we fetch your messages...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-16 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-100">
                  <FiInbox className="text-4xl text-purple-400" />
                </div>
                <p className="text-xl text-slate-800 font-bold mb-2">No Messages Yet</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">You have no new notifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {notif.action === 'approved' && <span className="p-2 bg-green-100 text-green-700 rounded-full"><FiCheckCircle /></span>}
                        {notif.action === 'rejected' && <span className="p-2 bg-red-100 text-red-700 rounded-full"><FiAlertCircle /></span>}
                        {notif.action !== 'approved' && notif.action !== 'rejected' && <span className="p-2 bg-blue-100 text-blue-700 rounded-full"><FiInfo /></span>}
                        <div>
                          <p className="font-bold text-slate-800 text-lg capitalize">
                            Request <span className="font-mono text-base bg-slate-100 px-1 rounded">{notif.receiptNumber}</span> was {notif.action.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-slate-500">By {notif.fromDesignation || 'System'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {new Date(notif.timestamp).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {notif.remarks && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm text-slate-700"><span className="font-bold text-slate-900">Remarks:</span> {notif.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
            {userData ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 text-orange-600">
                    <FiUser className="text-3xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{userData.firstName} {userData.lastName}</h3>
                    <p className="text-slate-500 font-medium">{userData.email}</p>
                    <div className="flex gap-2 mt-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">User</span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Active</span>
                    </div>
                  </div>
                </div>
                {/* DID Display */}
                {userData.did && (
                  <div className="mb-6">
                    <DIDDisplay did={userData.did} />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/30 transition-colors group">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide group-hover:text-orange-400">Email Address</p>
                    <p className="text-lg font-semibold text-slate-800">{userData.email}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/30 transition-colors group">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide group-hover:text-orange-400">Phone Number</p>
                    <p className="text-lg font-semibold text-slate-800">{userData.phone}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/30 transition-colors group">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide group-hover:text-orange-400">Aadhar Number</p>
                    <p className="text-lg font-semibold text-slate-800">{userData.aadhar}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/30 transition-colors group">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide group-hover:text-orange-400">Date of Birth</p>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(userData.dateOfBirth)}</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/30 transition-colors group md:col-span-2">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide group-hover:text-orange-400">Address</p>
                    <p className="text-lg font-semibold text-slate-800">{userData.address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <FiLoader className="text-4xl text-orange-500 mx-auto mb-4 animate-spin" />
                <p className="text-lg text-slate-600 font-bold">Loading Profile...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
