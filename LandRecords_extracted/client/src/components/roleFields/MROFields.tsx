'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaShieldAlt } from 'react-icons/fa';

export interface MROFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const MROFields = forwardRef<MROFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [landApprovalStatus, setLandApprovalStatus] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [recordVerification, setRecordVerification] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const mroEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'mro');
      
      if (mroEntry?.data) {
        const data = mroEntry.data;
        if (data.landApprovalStatus) setLandApprovalStatus(data.landApprovalStatus);
        if (data.approvalRemarks) setApprovalRemarks(data.approvalRemarks);
        if (data.recordVerification) setRecordVerification(data.recordVerification);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/mro/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          landApprovalStatus,
          approvalRemarks,
          recordVerification,
        }),
      });

      if (response.ok) {
        onUpdate();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    getFormData: (applicationId: string) => {
      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('role', 'mro');
      formData.append('landApprovalStatus', landApprovalStatus);
      formData.append('approvalRemarks', approvalRemarks);
      formData.append('recordVerification', recordVerification);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-emerald-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-emerald-300 mb-4 flex items-center gap-2">
        <FaShieldAlt />
        🛡️ Mandal Revenue Officer (MRO)
      </h2>

      {/* Land Approval Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-emerald-200 mb-3">1. Land Approval Authority</h3>
        <select
          value={landApprovalStatus}
          onChange={(e) => setLandApprovalStatus(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Approval Status</option>
          <option value="approved">✅ Approved for Land Allocation</option>
          <option value="conditional">⚠️ Conditionally Approved</option>
          <option value="rejected">❌ Not Approved</option>
          <option value="pending_review">⏳ Pending Review</option>
        </select>
        <textarea
          value={approvalRemarks}
          onChange={(e) => setApprovalRemarks(e.target.value)}
          placeholder="Add approval remarks or conditions..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/20 rounded-lg text-white resize-none"
        />
      </div>

      {/* Record Verification */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-emerald-200 mb-3">2. Revenue Record Verification</h3>
        <select
          value={recordVerification}
          onChange={(e) => setRecordVerification(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/20 rounded-lg text-white"
        >
          <option value="">Select Verification Status</option>
          <option value="verified">✅ Records Verified</option>
          <option value="discrepancy">⚠️ Discrepancy Found</option>
          <option value="incomplete">📋 Incomplete Records</option>
        </select>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <p className="text-sm text-emerald-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

MROFields.displayName = 'MROFields';
export default MROFields;
