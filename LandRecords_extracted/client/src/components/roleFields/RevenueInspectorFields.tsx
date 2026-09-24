'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';

export interface RevenueInspectorFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const RevenueInspectorFields = forwardRef<RevenueInspectorFieldsHandle, any>(
  ({ application, onUpdate }, ref) => {
  const [taxDuesStatus, setTaxDuesStatus] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxPaidAmount, setTaxPaidAmount] = useState('');
  const [taxReceiptFile, setTaxReceiptFile] = useState<File | null>(null);
  const [taxClearanceStatus, setTaxClearanceStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      const riEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'revenueinspector');
      
      if (riEntry?.data) {
        const data = riEntry.data;
        if (data.taxDuesStatus) setTaxDuesStatus(data.taxDuesStatus);
        if (data.taxAmount) setTaxAmount(data.taxAmount);
        if (data.taxPaidAmount) setTaxPaidAmount(data.taxPaidAmount);
        if (data.taxClearanceStatus) setTaxClearanceStatus(data.taxClearanceStatus);
        if (data.remarks) setRemarks(data.remarks);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('taxDuesStatus', taxDuesStatus);
      formData.append('taxAmount', taxAmount);
      formData.append('taxPaidAmount', taxPaidAmount);
      formData.append('taxClearanceStatus', taxClearanceStatus);
      formData.append('remarks', remarks);
      if (taxReceiptFile) formData.append('taxReceipt', taxReceiptFile);

      const response = await fetch('/api/role-data/revenueinspector/save', {
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
      formData.append('role', 'revenueinspector');
      formData.append('taxDuesStatus', taxDuesStatus);
      formData.append('taxAmount', taxAmount);
      formData.append('taxPaidAmount', taxPaidAmount);
      formData.append('taxClearanceStatus', taxClearanceStatus);
      formData.append('remarks', remarks);
      if (taxReceiptFile) formData.append('taxReceipt', taxReceiptFile);
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-yellow-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
        <FaMoneyBillWave />
        💰 Revenue Inspector - Tax Verification
      </h2>

      {/* Tax Dues Check */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-yellow-200 mb-3">1. Land Tax Dues Check</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-yellow-300/70 block mb-2">Tax Dues Status</label>
            <select
              value={taxDuesStatus}
              onChange={(e) => setTaxDuesStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white"
            >
              <option value="">Select Status</option>
              <option value="cleared">✅ Tax Cleared</option>
              <option value="pending">⏳ Pending Dues</option>
              <option value="partial">⚠️ Partially Paid</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-yellow-300/70 block mb-2">Total Tax Amount</label>
            <input
              type="number"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Tax Status Update */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-yellow-200 mb-3">2. Update Tax Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-yellow-300/70 block mb-2">Tax Paid Amount</label>
            <input
              type="number"
              value={taxPaidAmount}
              onChange={(e) => setTaxPaidAmount(e.target.value)}
              placeholder="Enter paid amount"
              className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="text-sm text-yellow-300/70 block mb-2">Clearance Status</label>
            <select
              value={taxClearanceStatus}
              onChange={(e) => setTaxClearanceStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white"
            >
              <option value="">Select Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending_payment">⏳ Pending Payment</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-yellow-300/70 block mb-2">Upload Tax Receipt (Optional)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setTaxReceiptFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-500/20 file:text-yellow-200"
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="mb-6">
        <label className="text-sm text-yellow-300/70 block mb-2">Remarks</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add tax verification remarks..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-lg text-white resize-none"
        />
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-sm text-yellow-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
  }
);

RevenueInspectorFields.displayName = 'RevenueInspectorFields';
export default RevenueInspectorFields;
