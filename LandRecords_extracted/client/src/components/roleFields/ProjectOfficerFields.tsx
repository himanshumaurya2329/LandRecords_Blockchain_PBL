'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaClipboardCheck } from 'react-icons/fa';

export interface ProjectOfficerFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const ProjectOfficerFields = forwardRef<ProjectOfficerFieldsHandle, { application: any; onUpdate: () => void }>(
  ({ application, onUpdate }, ref) => {
  const [reviewSummary, setReviewSummary] = useState('');
  const [eligibilityChecklist, setEligibilityChecklist] = useState({
    landSizeEligible: false,
    purposeEligible: false,
    locationEligible: false,
    ownershipClear: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const poEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'projectofficer');
      
      if (poEntry?.data) {
        const data = poEntry.data;
        if (data.reviewSummary) setReviewSummary(data.reviewSummary);
        if (data.eligibilityChecklist) setEligibilityChecklist(data.eligibilityChecklist);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/projectofficer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          reviewSummary,
          eligibilityChecklist,
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
      formData.append('role', 'projectofficer');
      formData.append('reviewSummary', reviewSummary);
      formData.append('eligibilityChecklist', JSON.stringify(eligibilityChecklist));
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
        <FaClipboardCheck />
        📝 Project Officer Review
      </h2>

      {/* Review Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">1. Application Review Summary</h3>
        <textarea
          value={reviewSummary}
          onChange={(e) => setReviewSummary(e.target.value)}
          placeholder="Enter initial screening remarks and observations..."
          rows={5}
          className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400 resize-none"
        />
      </div>

      {/* Eligibility Checklist */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">2. Basic Eligibility Checklist</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={eligibilityChecklist.landSizeEligible}
              onChange={(e) => setEligibilityChecklist({...eligibilityChecklist, landSizeEligible: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Land Size Meets Project Requirements</span>
          </label>
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={eligibilityChecklist.purposeEligible}
              onChange={(e) => setEligibilityChecklist({...eligibilityChecklist, purposeEligible: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Land Purpose is Eligible</span>
          </label>
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={eligibilityChecklist.locationEligible}
              onChange={(e) => setEligibilityChecklist({...eligibilityChecklist, locationEligible: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Location is Within Project Area</span>
          </label>
          <label className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={eligibilityChecklist.ownershipClear}
              onChange={(e) => setEligibilityChecklist({...eligibilityChecklist, ownershipClear: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <span className="text-white">Ownership Documentation is Clear</span>
          </label>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

ProjectOfficerFields.displayName = 'ProjectOfficerFields';
export default ProjectOfficerFields;
