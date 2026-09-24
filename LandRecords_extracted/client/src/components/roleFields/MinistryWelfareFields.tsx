'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaFileUpload, FaCheckCircle } from 'react-icons/fa';

export interface MinistryWelfareFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const MinistryWelfareFields = forwardRef<MinistryWelfareFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [policyType, setPolicyType] = useState('');
  const [welfareEligibility, setWelfareEligibility] = useState('');
  const [eligibilityNote, setEligibilityNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const mwEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'ministrywelfare');
      
      if (mwEntry?.data) {
        const data = mwEntry.data;
        if (data.policyType) setPolicyType(data.policyType);
        if (data.welfareEligibility) setWelfareEligibility(data.welfareEligibility);
        if (data.eligibilityNote) setEligibilityNote(data.eligibilityNote);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('policyType', policyType);
      formData.append('welfareEligibility', welfareEligibility);
      formData.append('eligibilityNote', eligibilityNote);
      if (policyFile) formData.append('policyDocument', policyFile);

      const response = await fetch('/api/role-data/ministrywelfare/save', {
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
      formData.append('role', 'ministrywelfare');
      formData.append('policyType', policyType);
      formData.append('welfareEligibility', welfareEligibility);
      formData.append('eligibilityNote', eligibilityNote);
      if (policyFile) formData.append('policyDocument', policyFile);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-pink-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
        <FaCheckCircle />
        🏛️ Ministry of Welfare - Final Approval
      </h2>

      {/* Publish Policies or Guidelines */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-pink-200 mb-3">1. Publish Policies/Guidelines</h3>
        <select
          value={policyType}
          onChange={(e) => setPolicyType(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Policy Type</option>
          <option value="welfare_policy">🏛️ New Welfare Policy</option>
          <option value="land_support_guideline">📋 Land Support Guideline</option>
          <option value="circular">📢 Circular</option>
        </select>
        <label className="text-sm text-pink-300/70 mb-2 flex items-center gap-2">
          <FaFileUpload />
          Upload Policy/Guideline Document
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-500/20 file:text-pink-200"
        />
        {policyFile && (
          <p className="mt-2 text-sm text-green-400">✅ {policyFile.name}</p>
        )}
      </div>

      {/* Approve Special Welfare Applications */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-pink-200 mb-3">2. Approve Special Welfare Applications</h3>
        <p className="text-sm text-pink-300/70 mb-3">Review applications under welfare category</p>
        <select
          value={welfareEligibility}
          onChange={(e) => setWelfareEligibility(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Eligibility</option>
          <option value="eligible">✅ Eligible for Welfare Scheme</option>
          <option value="not_eligible">❌ Not Eligible</option>
          <option value="conditional">⚠️ Conditionally Eligible</option>
        </select>
        <textarea
          value={eligibilityNote}
          onChange={(e) => setEligibilityNote(e.target.value)}
          placeholder="Add short note about welfare eligibility..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/20 rounded-lg text-white resize-none"
        />
      </div>

      <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
        <p className="text-sm text-pink-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

MinistryWelfareFields.displayName = 'MinistryWelfareFields';
export default MinistryWelfareFields;
