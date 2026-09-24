'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaClipboardList } from 'react-icons/fa';

export interface ClerkFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const ClerkFields = forwardRef<ClerkFieldsHandle, { application: any; onUpdate: any }>(
  ({ application, onUpdate }, ref) => {
  const [documentIntakeStatus, setDocumentIntakeStatus] = useState('');
  const [initialVerificationChecklist, setInitialVerificationChecklist] = useState({
    applicationFormComplete: false,
    requiredDocumentsAttached: false,
    feesSubmitted: false,
    signaturePresent: false,
  });
  const [intakeNotes, setIntakeNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const clerkEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'clerk');
      
      if (clerkEntry?.data) {
        const data = clerkEntry.data;
        if (data.documentIntakeStatus) setDocumentIntakeStatus(data.documentIntakeStatus);
        if (data.initialVerificationChecklist) setInitialVerificationChecklist(data.initialVerificationChecklist);
        if (data.intakeNotes) setIntakeNotes(data.intakeNotes);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await fetch('/api/role-data/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application._id,
          role: 'clerk',
          documentIntakeStatus,
          initialVerificationChecklist,
          intakeNotes,
        }),
      });

      if (response.ok) {
        if (onUpdate) onUpdate();
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

  // Expose save function through ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getFormData: (applicationId: string) => {
      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('role', 'clerk');
      formData.append('documentIntakeStatus', documentIntakeStatus);
      formData.append('initialVerificationChecklist', JSON.stringify(initialVerificationChecklist));
      formData.append('intakeNotes', intakeNotes);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-sky-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-sky-300 mb-4 flex items-center gap-2">
        <FaClipboardList />
        📋 Clerk - Application Intake
      </h2>

      {/* Document Intake Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sky-200 mb-3">1. Document Intake Status</h3>
        <select
          value={documentIntakeStatus}
          onChange={(e) => setDocumentIntakeStatus(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-sky-500/20 rounded-lg text-white"
        >
          <option value="">Select Intake Status</option>
          <option value="received">✅ Documents Received</option>
          <option value="incomplete">⚠️ Incomplete Submission</option>
          <option value="rejected">❌ Rejected at Intake</option>
        </select>
      </div>

      {/* Initial Verification Checklist */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sky-200 mb-3">2. Initial Verification Checklist</h3>
        <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          {Object.entries({
            applicationFormComplete: 'Application Form Complete',
            requiredDocumentsAttached: 'All Required Documents Attached',
            feesSubmitted: 'Application Fees Submitted',
            signaturePresent: 'Applicant Signature Present',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={initialVerificationChecklist[key as keyof typeof initialVerificationChecklist]}
                onChange={(e) => setInitialVerificationChecklist({
                  ...initialVerificationChecklist,
                  [key]: e.target.checked
                })}
                className="w-5 h-5 rounded border-sky-500/30 bg-slate-900/50 text-sky-500 focus:ring-2 focus:ring-sky-500/50"
              />
              <span className="text-white group-hover:text-sky-200 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Intake Notes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sky-200 mb-3">3. Intake Notes</h3>
        <textarea
          value={intakeNotes}
          onChange={(e) => setIntakeNotes(e.target.value)}
          placeholder="Add any intake notes or observations..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-sky-500/20 rounded-lg text-white resize-none"
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Data will be saved automatically when you click "Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

ClerkFields.displayName = 'ClerkFields';
export default ClerkFields;
