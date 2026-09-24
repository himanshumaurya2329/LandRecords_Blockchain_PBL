'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaCrown, FaUpload } from 'react-icons/fa';

export interface DistrictCollectorFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const DistrictCollectorFields = forwardRef<DistrictCollectorFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [authorization, setAuthorization] = useState('');
  const [authorizationComment, setAuthorizationComment] = useState('');
  const [officialOrderFile, setOfficialOrderFile] = useState<File | null>(null);
  const [orderType, setOrderType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const dcEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'districtcollector');
      
      if (dcEntry?.data) {
        const data = dcEntry.data;
        if (data.authorization) setAuthorization(data.authorization);
        if (data.authorizationComment) setAuthorizationComment(data.authorizationComment);
        if (data.orderType) setOrderType(data.orderType);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('authorization', authorization);
      formData.append('authorizationComment', authorizationComment);
      formData.append('orderType', orderType);
      if (officialOrderFile) formData.append('officialOrder', officialOrderFile);

      const response = await fetch('/api/role-data/districtcollector/save', {
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
      formData.append('role', 'districtcollector');
      formData.append('authorization', authorization);
      formData.append('authorizationComment', authorizationComment);
      formData.append('orderType', orderType);
      if (officialOrderFile) formData.append('officialOrder', officialOrderFile);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-indigo-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
        <FaCrown />
        👑 District Collector - Final Authorization
      </h2>

      {/* District-Level Final Authorization */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-200 mb-3">1. District-Level Final Authorization</h3>
        <select
          value={authorization}
          onChange={(e) => setAuthorization(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Decision</option>
          <option value="authorize">✅ Authorize</option>
          <option value="reject">❌ Reject</option>
          <option value="send_back">⬅️ Send Back for Corrections</option>
        </select>
        <textarea
          value={authorizationComment}
          onChange={(e) => setAuthorizationComment(e.target.value)}
          placeholder="Add final comment..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-white resize-none"
        />
      </div>

      {/* Publish Official Orders */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-200 mb-3">2. Publish Official Orders (GO / Memo)</h3>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-white mb-3"
        >
          <option value="">Select Order Type</option>
          <option value="government_order">📜 Government Order (GO)</option>
          <option value="memo">📝 Memo</option>
          <option value="permission_letter">📄 Permission Letter</option>
        </select>
        <label className="text-sm text-indigo-300/70 mb-2 flex items-center gap-2">
          <FaUpload />
          Upload Official Document (Stored on Blockchain)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setOfficialOrderFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-200"
        />
        {officialOrderFile && (
          <p className="mt-2 text-sm text-green-400">✅ {officialOrderFile.name}</p>
        )}
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
        <p className="text-sm text-indigo-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

DistrictCollectorFields.displayName = 'DistrictCollectorFields';
export default DistrictCollectorFields;
