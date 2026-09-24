'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaClipboardList } from 'react-icons/fa';

export interface RevenueDeptOfficerFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const RevenueDeptOfficerFields = forwardRef<RevenueDeptOfficerFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [auditStatus, setAuditStatus] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [highLevelApproval, setHighLevelApproval] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const rdoEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'revenuedeptofficer');
      
      if (rdoEntry?.data) {
        const data = rdoEntry.data;
        if (data.auditStatus) setAuditStatus(data.auditStatus);
        if (data.auditRemarks) setAuditRemarks(data.auditRemarks);
        if (data.highLevelApproval) setHighLevelApproval(data.highLevelApproval);
        if (data.approvalNote) setApprovalNote(data.approvalNote);
      }
    }
  }, [application?._id]);

  const landArea = parseFloat(application.area) || 0;
  const requiresHighLevelApproval = landArea > 10; // acres

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/revenuedeptofficer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          auditStatus,
          auditRemarks,
          highLevelApproval,
          approvalNote,
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
      formData.append('role', 'revenuedeptofficer');
      formData.append('auditStatus', auditStatus);
      formData.append('auditRemarks', auditRemarks);
      formData.append('highLevelApproval', highLevelApproval);
      formData.append('approvalNote', approvalNote);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
        <FaClipboardList />
        📊 Revenue Department Officer
      </h2>

      {/* District-Level Audit Log Review */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-200 mb-3">1. District-Level Audit Log Review</h3>
        <p className="text-sm text-purple-300/70 mb-3">Full timeline of approvals: Clerk → Superintendent → MRO → etc.</p>
        <select
          value={auditStatus}
          onChange={(e) => setAuditStatus(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Audit Status</option>
          <option value="passed">✅ Audit Passed</option>
          <option value="corrections_needed">⚠️ Corrections Needed</option>
          <option value="under_review">⏳ Under Review</option>
        </select>
        <textarea
          value={auditRemarks}
          onChange={(e) => setAuditRemarks(e.target.value)}
          placeholder="Add audit remarks or required corrections..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-lg text-white resize-none"
        />
      </div>

      {/* High-Level Approval for Large Land Parcels */}
      {requiresHighLevelApproval && (
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-orange-300 mb-3">
            ⚠️ 2. High-Level Approval Required (Land &gt; 10 acres)
          </h3>
          <p className="text-sm text-orange-200 mb-3">Land Area: {application.area}</p>
          <select
            value={highLevelApproval}
            onChange={(e) => setHighLevelApproval(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white mb-3"
          >
            <option value="">Select Decision</option>
            <option value="approve">✅ Approve</option>
            <option value="reject">❌ Reject</option>
            <option value="escalate">⬆️ Escalate to Higher Authority</option>
          </select>
          <textarea
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Add justification note..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white resize-none"
          />
        </div>
      )}

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <p className="text-sm text-purple-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

RevenueDeptOfficerFields.displayName = 'RevenueDeptOfficerFields';
export default RevenueDeptOfficerFields;
