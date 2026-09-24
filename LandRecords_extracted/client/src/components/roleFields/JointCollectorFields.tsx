'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaGavel } from 'react-icons/fa';

export interface JointCollectorFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const JointCollectorFields = forwardRef<JointCollectorFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [disputeDecision, setDisputeDecision] = useState('');
  const [disputeJustification, setDisputeJustification] = useState('');
  const [boundaryApproval, setBoundaryApproval] = useState('');
  const [boundaryRemarks, setBoundaryRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const jcEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'jointcollector');
      
      if (jcEntry?.data) {
        const data = jcEntry.data;
        if (data.disputeDecision) setDisputeDecision(data.disputeDecision);
        if (data.disputeJustification) setDisputeJustification(data.disputeJustification);
        if (data.boundaryApproval) setBoundaryApproval(data.boundaryApproval);
        if (data.boundaryRemarks) setBoundaryRemarks(data.boundaryRemarks);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/jointcollector/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          disputeDecision,
          disputeJustification,
          boundaryApproval,
          boundaryRemarks,
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
      formData.append('role', 'jointcollector');
      formData.append('disputeDecision', disputeDecision);
      formData.append('disputeJustification', disputeJustification);
      formData.append('boundaryApproval', boundaryApproval);
      formData.append('boundaryRemarks', boundaryRemarks);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-red-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
        <FaGavel />
        ⚖️ Joint Collector
      </h2>

      {/* Dispute Review Decision */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-200 mb-3">1. Dispute Review Decision</h3>
        <select
          value={disputeDecision}
          onChange={(e) => setDisputeDecision(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Decision</option>
          <option value="favor_applicant">✅ Resolve in Favor of Applicant</option>
          <option value="reject_claim">❌ Reject Claim</option>
          <option value="further_investigation">🔍 Requires Further Investigation</option>
        </select>
        <textarea
          value={disputeJustification}
          onChange={(e) => setDisputeJustification(e.target.value)}
          placeholder="Add short justification for decision..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/20 rounded-lg text-white resize-none"
        />
      </div>

      {/* Final Layout or Boundary Approval */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-200 mb-3">2. Final Layout/Boundary Approval</h3>
        <select
          value={boundaryApproval}
          onChange={(e) => setBoundaryApproval(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Status</option>
          <option value="approved">✅ Approved</option>
          <option value="needs_changes">⚠️ Needs Changes</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        <textarea
          value={boundaryRemarks}
          onChange={(e) => setBoundaryRemarks(e.target.value)}
          placeholder="Add remarks about survey map or boundary approval..."
          rows={2}
          className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/20 rounded-lg text-white resize-none"
        />
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-sm text-red-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

JointCollectorFields.displayName = 'JointCollectorFields';
export default JointCollectorFields;
