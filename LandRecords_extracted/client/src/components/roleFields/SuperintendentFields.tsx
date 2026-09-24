'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaCheckCircle, FaFileAlt } from 'react-icons/fa';

export interface SuperintendentFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const SuperintendentFields = forwardRef<SuperintendentFieldsHandle, { application: any; onUpdate: () => void }>(
  ({ application, onUpdate }, ref) => {
  const [documentChecklist, setDocumentChecklist] = useState({
    applicationForm: false,
    identityProof: false,
    addressProof: false,
    landDocuments: false,
    taxReceipts: false,
  });
  const [verificationComments, setVerificationComments] = useState('');
  const [landRecordCheck, setLandRecordCheck] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const supEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'superintendent');
      
      if (supEntry?.data) {
        const data = supEntry.data;
        if (data.documentChecklist) setDocumentChecklist(data.documentChecklist);
        if (data.verificationComments) setVerificationComments(data.verificationComments);
        if (data.landRecordCheck) setLandRecordCheck(data.landRecordCheck);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/superintendent/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          documentChecklist,
          verificationComments,
          landRecordCheck,
        }),
      });

      if (response.ok) {
        onUpdate();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error saving:', error);
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
      formData.append('role', 'superintendent');
      formData.append('documentChecklist', JSON.stringify(documentChecklist));
      formData.append('verificationComments', verificationComments);
      formData.append('landRecordCheck', landRecordCheck);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-cyan-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
        <FaFileAlt />
        📋 Superintendent Verification
      </h2>

      {/* Document Verification Checklist */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-200 mb-3">1. Document Verification Checklist</h3>
        <div className="space-y-3">
          {Object.entries(documentChecklist).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-all">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setDocumentChecklist({ ...documentChecklist, [key]: e.target.checked })}
                className="w-5 h-5 rounded border-cyan-500/30 bg-slate-900/50 checked:bg-cyan-500"
              />
              <span className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              {value && <FaCheckCircle className="ml-auto text-green-400" />}
            </label>
          ))}
        </div>
      </div>

      {/* Land Record Cross-Check */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-200 mb-3">2. Land Record Cross-Check</h3>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-sm text-cyan-300/70 mb-2 block">Survey Number Validation</label>
          <select
            value={landRecordCheck}
            onChange={(e) => setLandRecordCheck(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="">Select Status</option>
            <option value="verified">✅ Verified - Matches Records</option>
            <option value="mismatch">⚠️ Mismatch Found</option>
            <option value="not_found">❌ Record Not Found</option>
            <option value="pending_verification">⏳ Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Verification Comments */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-200 mb-3">3. Verification Comments</h3>
        <textarea
          value={verificationComments}
          onChange={(e) => setVerificationComments(e.target.value)}
          placeholder="Enter your verification remarks, observations, or concerns..."
          rows={5}
          className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <p className="text-sm text-cyan-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

SuperintendentFields.displayName = 'SuperintendentFields';
export default SuperintendentFields;
