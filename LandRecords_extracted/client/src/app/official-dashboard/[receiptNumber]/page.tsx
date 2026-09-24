'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaUser, FaMapMarkedAlt, FaHome, FaClock, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import SuperintendentFields, { type SuperintendentFieldsHandle } from '@/components/roleFields/SuperintendentFields';
import ProjectOfficerFields, { type ProjectOfficerFieldsHandle } from '@/components/roleFields/ProjectOfficerFields';
import RevenueInspectorFields, { type RevenueInspectorFieldsHandle } from '@/components/roleFields/RevenueInspectorFields';
import VROFields, { type VROFieldsHandle } from '@/components/roleFields/VROFields';
import RevenueDeptOfficerFields, { type RevenueDeptOfficerFieldsHandle } from '@/components/roleFields/RevenueDeptOfficerFields';
import JointCollectorFields, { type JointCollectorFieldsHandle } from '@/components/roleFields/JointCollectorFields';
import DistrictCollectorFields, { type DistrictCollectorFieldsHandle } from '@/components/roleFields/DistrictCollectorFields';
import MinistryWelfareFields, { type MinistryWelfareFieldsHandle } from '@/components/roleFields/MinistryWelfareFields';
import SurveyorFields, { type SurveyorFieldsHandle } from '@/components/roleFields/SurveyorFields';
import MROFields, { type MROFieldsHandle } from '@/components/roleFields/MROFields';
import ClerkFields, { type ClerkFieldsHandle } from '@/components/roleFields/ClerkFields';
import ApplicationHistory from '@/components/ApplicationHistory';
import DigiLockerRequestPanel from '@/components/DigiLockerRequestPanel';
import OCRAnalysisPanel from '@/components/OCRAnalysisPanel';
import AITrustScore from '@/components/AITrustScore';
import DIDDisplay from '@/components/DIDDisplay';

interface Official {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  officeId: string;
}

interface Application {
  _id: string;
  receiptNumber: string;
  status: string;
  createdAt: string;
  ownerName: string;
  surveyNumber: string;
  area: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  nature?: string;
  ipfsHash?: string;
  docHash?: string;
  aadharNumber?: string;
  currentlyWith?: string;
  currentStage?: string;
  actionHistory?: Array<{
    officialId: string;
    officialName: string;
    designation: string;
    action: 'approved' | 'rejected' | 'data_added' | 'forwarded';
    remarks?: string;
    timestamp: string;
    blockNumber?: number;
    data?: any;
  }>;
}

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const receiptNumber = params.receiptNumber as string;

  const [official, setOfficial] = useState<Official | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssigned, setIsAssigned] = useState(false);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: 'approve' | 'reject' | 'forward', remarks: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for role fields that need to save data on approval
  const surveyorFieldsRef = useRef<SurveyorFieldsHandle>(null);
  const clerkFieldsRef = useRef<ClerkFieldsHandle>(null);
  const superintendentFieldsRef = useRef<SuperintendentFieldsHandle>(null);
  const projectOfficerFieldsRef = useRef<ProjectOfficerFieldsHandle>(null);
  const revenueInspectorFieldsRef = useRef<RevenueInspectorFieldsHandle>(null);
  const vroFieldsRef = useRef<VROFieldsHandle>(null);
  const revenueDeptOfficerFieldsRef = useRef<RevenueDeptOfficerFieldsHandle>(null);
  const jointCollectorFieldsRef = useRef<JointCollectorFieldsHandle>(null);
  const districtCollectorFieldsRef = useRef<DistrictCollectorFieldsHandle>(null);
  const ministryWelfareFieldsRef = useRef<MinistryWelfareFieldsHandle>(null);
  const mroFieldsRef = useRef<MROFieldsHandle>(null);

  useEffect(() => {
    fetchOfficialData();
    fetchApplicationData();
  }, [receiptNumber]);

  const fetchOfficialData = async () => {
    try {
      const response = await fetch('/api/officials/me');
      if (response.ok) {
        const data = await response.json();
        setOfficial(data.official);
      }
    } catch (error) {
      console.error('Error fetching official data:', error);
    }
  };

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/land-requests/by-receipt?receipt=${receiptNumber}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (official && application) {
      // Map application status to required role
      const statusToRoleMap: Record<string, string[]> = {
        'submitted': ['clerk'],
        'with_clerk': ['clerk'],
        'with_superintendent': ['superintendent'],
        'with_project_officer': ['project_officer', 'projectofficer'],
        'with_mro': ['mro'],
        'with_surveyor': ['surveyor'],
        'with_revenue_inspector': ['revenue_inspector', 'revenueinspector'],
        'with_vro': ['vro'],
        'with_revenue_dept': ['revenue_dept_officer', 'revenuedeptofficer', 'revenue_department_officer'],
        'with_joint_collector': ['joint_collector', 'jointcollector'],
        'with_collector': ['district_collector', 'districtcollector', 'collector'],
        'with_ministry_welfare': ['ministry_welfare', 'ministrywelfare', 'ministry_of_welfare']
      };

      const currentStatus = application.status?.toLowerCase() || '';
      const officialDesignation = official.designation?.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') || '';

      const allowedRoles = statusToRoleMap[currentStatus] || [];
      const assigned = allowedRoles.some(role => {
        const normalizedRole = role.replace(/\s+/g, '').replace(/_/g, '');
        const normalizedOfficialRole = official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
        return normalizedOfficialRole.includes(normalizedRole) || normalizedRole.includes(normalizedOfficialRole);
      });

      console.log('Assignment check:', {
        applicationStatus: currentStatus,
        officialDesignation: officialDesignation,
        allowedRoles: allowedRoles,
        assigned: assigned
      });

      setIsAssigned(assigned);
    }
  }, [official, application]);

  const handleAction = async (action: 'approve' | 'reject' | 'forward', remarks: string) => {
    try {
      // Save all role-specific data before proceeding with action
      if (surveyorFieldsRef.current) {
        await surveyorFieldsRef.current.save();
      }
      if (clerkFieldsRef.current) {
        await clerkFieldsRef.current.save();
      }
      if (superintendentFieldsRef.current) {
        await superintendentFieldsRef.current.save();
      }
      if (projectOfficerFieldsRef.current) {
        await projectOfficerFieldsRef.current.save();
      }
      if (revenueInspectorFieldsRef.current) {
        await revenueInspectorFieldsRef.current.save();
      }
      if (vroFieldsRef.current) {
        await vroFieldsRef.current.save();
      }
      if (revenueDeptOfficerFieldsRef.current) {
        await revenueDeptOfficerFieldsRef.current.save();
      }
      if (jointCollectorFieldsRef.current) {
        await jointCollectorFieldsRef.current.save();
      }
      if (districtCollectorFieldsRef.current) {
        await districtCollectorFieldsRef.current.save();
      }
      if (ministryWelfareFieldsRef.current) {
        await ministryWelfareFieldsRef.current.save();
      }
      if (mroFieldsRef.current) {
        await mroFieldsRef.current.save();
      }

      // Wait a moment for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now proceed with the action
      proceedWithAction(action, remarks);
    } catch (error) {
      console.error('Error before action:', error);
      proceedWithAction(action, remarks);
    }
  };

  const proceedWithAction = async (action: 'approve' | 'reject' | 'forward', remarks: string) => {
    setIsProcessing(true);
    try {
      // Create FormData with all official data + files
      const formData = new FormData();
      formData.append('applicationId', application?._id || '');
      formData.append('action', action);
      formData.append('remarks', remarks);

      // Collect data + files from whichever role component is active
      const designation = official?.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') || '';

      if (designation === 'surveyor' && surveyorFieldsRef.current?.getFormData) {
        const roleFormData = surveyorFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'clerk' && clerkFieldsRef.current?.getFormData) {
        const roleFormData = clerkFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'superintendent' && superintendentFieldsRef.current?.getFormData) {
        const roleFormData = superintendentFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'projectofficer' && projectOfficerFieldsRef.current?.getFormData) {
        const roleFormData = projectOfficerFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'revenueinspector' && revenueInspectorFieldsRef.current?.getFormData) {
        const roleFormData = revenueInspectorFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'vro' && vroFieldsRef.current?.getFormData) {
        const roleFormData = vroFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if ((designation === 'revenuedeptofficer' || designation === 'revenuedepartmentofficer') && revenueDeptOfficerFieldsRef.current?.getFormData) {
        const roleFormData = revenueDeptOfficerFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'jointcollector' && jointCollectorFieldsRef.current?.getFormData) {
        const roleFormData = jointCollectorFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'districtcollector' && districtCollectorFieldsRef.current?.getFormData) {
        const roleFormData = districtCollectorFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if ((designation === 'ministrywelfare' || designation === 'ministryofwelfare') && ministryWelfareFieldsRef.current?.getFormData) {
        const roleFormData = ministryWelfareFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      } else if (designation === 'mro' && mroFieldsRef.current?.getFormData) {
        const roleFormData = mroFieldsRef.current.getFormData(application?._id || '');
        for (const [key, value] of roleFormData) {
          formData.append(key, value);
        }
      }

      const response = await fetch('/api/dashboard/action', {
        method: 'POST',
        // NO Content-Type header - browser will set it with multipart boundary
        body: formData,
      });

      if (response.ok) {
        alert(`Application ${action}ed successfully!`);
        router.push('/official-dashboard');
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Action failed'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
      setIsProcessing(false);
    }
  };

  const getRoleComponent = () => {
    if (!official || !application) return null;

    const designation = official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');

    switch (designation) {
      case 'clerk':
        return <ClerkFields ref={clerkFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'superintendent':
        return <SuperintendentFields ref={superintendentFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'projectofficer':
        return <ProjectOfficerFields ref={projectOfficerFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'mro':
        return <MROFields ref={mroFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'surveyor':
        return <SurveyorFields ref={surveyorFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'revenueinspector':
        return <RevenueInspectorFields ref={revenueInspectorFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'vro':
        return <VROFields ref={vroFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'revenuedeptofficer':
      case 'revenuedepartmentofficer':
        return <RevenueDeptOfficerFields ref={revenueDeptOfficerFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'jointcollector':
        return <JointCollectorFields ref={jointCollectorFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'districtcollector':
        return <DistrictCollectorFields ref={districtCollectorFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      case 'ministrywelfare':
      case 'ministryofwelfare':
        return <MinistryWelfareFields ref={ministryWelfareFieldsRef} application={application} onUpdate={fetchApplicationData} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Application not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-lg border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/official-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white rounded-lg transition-all"
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-right">
            <p className="text-white font-semibold">{official?.firstName} {official?.lastName}</p>
            <p className="text-sm text-blue-200">{official?.designation}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Application Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Application Details</h1>
          <p className="text-xl text-blue-200 font-mono">{receiptNumber}</p>
          <div className="mt-4 flex items-center gap-4">
            <span className={`px-4 py-2 rounded-lg font-semibold ${application.status === 'completed' ? 'bg-green-500/20 text-green-200' :
              application.status === 'rejected' ? 'bg-red-500/20 text-red-200' :
                'bg-yellow-500/20 text-yellow-200'
              }`}>
              {application.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="text-blue-200">
              Submitted: {new Date(application.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Applicant Information */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
            <FaUser />
            Applicant Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-blue-300/70 uppercase tracking-wider">Full Name</label>
              <p className="text-white font-semibold mt-1 text-lg">{application.fullName || application.ownerName}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-blue-300/70 uppercase tracking-wider">Email</label>
              <p className="text-white font-semibold mt-1">{application.email || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-blue-300/70 uppercase tracking-wider">Phone Number</label>
              <p className="text-white font-semibold mt-1">{application.phoneNumber || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-blue-300/70 uppercase tracking-wider">Receipt Number</label>
              <p className="text-white font-semibold mt-1 font-mono text-sm">{application.receiptNumber}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-blue-300/70 uppercase tracking-wider block mb-2">Decentralized Identity (DID)</label>
              <DIDDisplay did={(application as any).did} compact={false} />
            </div>
          </div>
        </div>

        {/* Land Details */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-green-500/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
            <FaMapMarkedAlt />
            Land Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-green-300/70 uppercase tracking-wider">Owner Name</label>
              <p className="text-white font-semibold mt-1 text-lg">{application.ownerName}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-green-300/70 uppercase tracking-wider">Survey Number</label>
              <p className="text-white font-semibold mt-1">{application.surveyNumber}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-green-300/70 uppercase tracking-wider">Area</label>
              <p className="text-white font-semibold mt-1">{application.area}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-green-300/70 uppercase tracking-wider">Nature</label>
              <p className="text-white font-semibold mt-1 capitalize">{application.nature || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <FaHome />
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-purple-300/70 uppercase tracking-wider">Full Address</label>
              <p className="text-white font-semibold mt-1">{application.address || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-purple-300/70 uppercase tracking-wider">City</label>
              <p className="text-white font-semibold mt-1">{application.city || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-purple-300/70 uppercase tracking-wider">State</label>
              <p className="text-white font-semibold mt-1">{application.state || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <label className="text-xs text-purple-300/70 uppercase tracking-wider">Pincode</label>
              <p className="text-white font-semibold mt-1">{application.pincode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Documents & Security */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-indigo-500/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
            <FaFileAlt />
            Documents & Security
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-800/70 p-5 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Land Request Application Form</span>
                <a
                  href={`/api/land-requests/generate-form?receipt=${receiptNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 hover:text-white rounded-lg transition-all"
                >
                  View Form
                </a>
              </div>
            </div>

            {application.ipfsHash && (
              <div className="bg-slate-800/70 p-5 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">User Uploaded Document</span>
                  <a
                    href={`/api/documents/view?hash=${application.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-white rounded-lg transition-all"
                  >
                    View Document
                  </a>
                </div>
              </div>
            )}

            {/* M8 AI Trust Score (Persona: Collector / Joint Collector) */}
            <AITrustScore
              application={application}
              isVisible={['clerk', 'mro', 'collector', 'jointcollector', 'districtcollector', 'district_collector'].some(r => official?.designation?.toLowerCase().includes(r))}
            />

            {/* M7 Blockchain Integrity Anchor (Persona: Clerk, MRO and higher) */}
            {application.docHash && ['clerk', 'mro', 'collector', 'jointcollector', 'districtcollector', 'district_collector'].some(r => official?.designation?.toLowerCase().includes(r)) && (
              <div className="bg-slate-800/70 p-5 rounded-xl border border-green-500/30">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-300">
                    <FaShieldAlt className="text-xl" />
                    <span className="font-bold">Blockchain Integrity Anchor (M7)</span>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-500/20">
                    <p className="text-xs text-green-200/50 uppercase tracking-widest mb-1">SHA-256 DocHash</p>
                    <p className="text-sm text-green-400 font-mono break-all">{application.docHash}</p>
                  </div>
                  <p className="text-xs text-blue-200/70 mt-1 italic">
                    * This hash is anchored to the Hyperledger Fabric ledger and verified against the DigiLocker source.
                  </p>
                </div>
              </div>
            )}

            {/* M9 AI/OCR Analysis (Persona: Clerk, Superintendent, Project Officer, and MRO) */}
            {(['clerk', 'superintendent', 'project_officer', 'mro', 'officer', 'revenue'].some(r => official?.designation?.toLowerCase().includes(r))) && (
              <OCRAnalysisPanel application={application} />
            )}

            {/* DigiLocker Document Request (Visible to Processing Officers) */}
            {official?._id && (
              <DigiLockerRequestPanel
                aadharNumber={application.aadharNumber || ''}
                receiptNumber={application.receiptNumber}
                officialId={official._id || ''}
                officialName={`${official.firstName} ${official.lastName}`}
                designation={official.designation || ''}
              />
            )}
          </div>
        </div>

        {/* Application History Timeline */}
        <ApplicationHistory history={application.actionHistory} />

        {/* Role-Specific Fields */}
        {getRoleComponent()}

        {/* Action Buttons */}
        {
          isAssigned && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Take Action</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('forward', `Approved by ${official?.designation}`)}
                  disabled={isProcessing}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all border ${isProcessing
                    ? 'bg-gray-500/20 text-gray-300 border-gray-500/30 cursor-not-allowed opacity-50'
                    : 'bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-200 hover:text-white border-green-500/30'
                    }`}
                >
                  <FaCheckCircle className="inline mr-2" />
                  {isProcessing ? 'Processing...' : (official?.designation?.toLowerCase() === 'clerk' ? 'Forward' : 'Approve & Forward')}
                </button>
                <button
                  onClick={() => handleAction('reject', `Rejected by ${official?.designation}`)}
                  disabled={isProcessing}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all border ${isProcessing
                    ? 'bg-gray-500/20 text-gray-300 border-gray-500/30 cursor-not-allowed opacity-50'
                    : 'bg-linear-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-200 hover:text-white border-red-500/30'
                    }`}
                >
                  <FaExclamationTriangle className="inline mr-2" />
                  {isProcessing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          )
        }

        {
          !isAssigned && (
            <div className={`backdrop-blur-lg rounded-2xl border p-6 ${application?.status === 'completed'
              ? 'bg-green-500/10 border-green-500/30'
              : application?.status === 'rejected'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
              <div className="flex items-center gap-3">
                {application?.status === 'completed' ? (
                  <>
                    <FaCheckCircle className="text-green-400 text-3xl shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-green-300">✅ Application Approved</h3>
                      <p className="text-sm text-green-200 mt-1">
                        This application has been successfully approved and completed through all required stages.
                      </p>
                    </div>
                  </>
                ) : application.status === 'rejected' ? (
                  <>
                    <FaExclamationTriangle className="text-red-400 text-3xl shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-red-300">❌ Application Rejected</h3>
                      <p className="text-sm text-red-200 mt-1">
                        This application has been rejected. Please check the application history for rejection details and reasons.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FaClock className="text-yellow-400 text-3xl shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-yellow-300">ℹ️ Application In Progress</h3>
                      <p className="text-sm text-yellow-200 mt-1">
                        This application is not currently assigned to you. You can view the details but cannot take action.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        }

        {/* Unsaved Data Warning Modal */}
        {
          showDataWarning && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 rounded-2xl border border-yellow-500/30 p-8 max-w-md w-full">
                <div className="flex items-start gap-3 mb-4">
                  <FaExclamationTriangle className="text-yellow-400 text-2xl shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-300">Unsaved Data Detected</h3>
                    <p className="text-sm text-yellow-200 mt-1">
                      There may be data that hasn't been auto-saved yet. Please wait a moment or click the save button to ensure all data is saved before proceeding with your action.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-100">
                    <strong>⏳ Auto-save is running...</strong> Data will be saved automatically as you make changes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDataWarning(false);
                      setPendingAction(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      setShowDataWarning(false);
                      if (pendingAction) {
                        // Wait for auto-save to complete (2 seconds)
                        setTimeout(() => {
                          proceedWithAction(pendingAction.action, pendingAction.remarks);
                        }, 2500);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-500/30 rounded-lg font-semibold transition-all"
                  >
                    Wait & Proceed
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Loading Indicator Modal */}
        {
          isProcessing && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-6">
                {/* Animated Spinner */}
                <div className="relative w-20 h-20">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-400 animate-spin"
                    style={{
                      animation: 'spin 2s linear infinite'
                    }}
                  />
                  {/* Middle rotating ring (opposite direction) */}
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-400 border-l-blue-400 animate-spin"
                    style={{
                      animation: 'spin 3s linear infinite reverse'
                    }}
                  />
                  {/* Center dot */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-linear-to-br from-green-400 to-blue-400 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Text */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Processing</h3>
                  <p className="text-sm text-gray-300">Uploading documents and processing your action...</p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* CSS for custom animations */}
              <style>{`
              @keyframes spin {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>
            </div>
          )
        }
      </div >
    </div >
  );
}

