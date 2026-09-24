'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaHome } from 'react-icons/fa';

export interface VROFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const VROFields = forwardRef<VROFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [possessionVerified, setPossessionVerified] = useState('');
  const [possessionRemarks, setPossessionRemarks] = useState('');
  const [documentConfirmed, setDocumentConfirmed] = useState({
    rationCard: false,
    casteCertificate: false,
    residenceProof: false,
  });
  const [confirmationFile, setConfirmationFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const vroEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'vro');
      
      if (vroEntry?.data) {
        const data = vroEntry.data;
        if (data.possessionVerified) setPossessionVerified(data.possessionVerified);
        if (data.possessionRemarks) setPossessionRemarks(data.possessionRemarks);
        if (data.documentConfirmed) setDocumentConfirmed(typeof data.documentConfirmed === 'string' ? JSON.parse(data.documentConfirmed) : data.documentConfirmed);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('possessionVerified', possessionVerified);
      formData.append('possessionRemarks', possessionRemarks);
      formData.append('documentConfirmed', JSON.stringify(documentConfirmed));
      if (confirmationFile) formData.append('confirmationReport', confirmationFile);

      const response = await fetch('/api/role-data/vro/save', {
        method: 'POST',
        body: formData,
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
      formData.append('role', 'vro');
      formData.append('possessionVerified', possessionVerified);
      formData.append('possessionRemarks', possessionRemarks);
      formData.append('documentConfirmed', JSON.stringify(documentConfirmed));
      if (confirmationFile) formData.append('confirmationReport', confirmationFile);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-green-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
        <FaHome />
        🏡 VRO - Physical Verification
      </h2>

      {/* Physical Possession Verification */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-200 mb-3">1. Physical Possession Verification</h3>
        <select
          value={possessionVerified}
          onChange={(e) => setPossessionVerified(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Status</option>
          <option value="yes">✅ Yes - Applicant in Actual Possession</option>
          <option value="no">❌ No - Possession Disputed</option>
          <option value="partial">⚠️ Partial Possession</option>
        </select>
        <textarea
          value={possessionRemarks}
          onChange={(e) => setPossessionRemarks(e.target.value)}
          placeholder="Add verification remarks..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white resize-none"
        />
      </div>

      {/* Local Document Confirmation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-200 mb-3">2. Local-Level Document Confirmation</h3>
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={documentConfirmed.rationCard}
              onChange={(e) => setDocumentConfirmed({...documentConfirmed, rationCard: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Ration Card Verified</span>
          </label>
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={documentConfirmed.casteCertificate}
              onChange={(e) => setDocumentConfirmed({...documentConfirmed, casteCertificate: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Caste Certificate Verified</span>
          </label>
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={documentConfirmed.residenceProof}
              onChange={(e) => setDocumentConfirmed({...documentConfirmed, residenceProof: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Residence Proof Verified</span>
          </label>
        </div>
        <label className="text-sm text-green-300/70 block mb-2">Upload Confirmation Report</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setConfirmationFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/20 file:text-green-200"
        />
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-sm text-green-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

VROFields.displayName = 'VROFields';
export default VROFields;
