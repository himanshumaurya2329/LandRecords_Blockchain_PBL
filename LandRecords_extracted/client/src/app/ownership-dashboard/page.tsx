'use client';

import React, { useState } from 'react';
import { FaChartPie, FaExclamationTriangle, FaExchangeAlt } from 'react-icons/fa';
import OwnershipPieChart from '@/components/OwnershipPieChart';
import ConsentStatusBadge from '@/components/ConsentStatusBadge';

export default function OwnershipDashboardPage() {
  const [appId, setAppId] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dispute state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  
  const fetchDetails = async () => {
    if (!appId) return;
    setLoading(true); setError(''); setDetails(null); setShowDispute(false);
    try {
      const res = await fetch(`http://localhost:3001/api/land/${appId}/owners`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setDetails(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const raiseDispute = async () => {
    if (!details || !disputeReason) return;
    setLoading(true);
    try {
      // Hardcode username to primary owner for demo
      const username = details.owners[0]?.ownerId || 'user_portal';
      const res = await fetch(`http://localhost:3001/api/land/${appId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raisedBy: username, reason: disputeReason, username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to raise dispute');
      alert('Dispute raised successfully. Application is now frozen.');
      fetchDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartPie className="text-indigo-600" />
            Ownership Dashboard
          </h2>
          <div className="flex gap-4">
            <input type="text" value={appId} onChange={e => setAppId(e.target.value)} placeholder="Enter Application ID (e.g. APP-101)" className="flex-1 px-4 py-2 border rounded text-black" />
            <button onClick={fetchDetails} className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700">View</button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}

        {details && (
          <div className="space-y-6">
            {details.isDisputed && (
              <div className="bg-red-100 text-red-800 p-4 rounded-xl border border-red-300 font-bold flex items-start gap-3">
                <FaExclamationTriangle className="mt-1 text-red-600 text-xl" />
                <div>
                  <div className="text-lg">APPLICATION FROZEN: Active Dispute</div>
                  <div className="text-sm font-normal mt-1">Reason: {details.disputeDetails?.reason}</div>
                  <div className="text-xs mt-1 text-red-600">Raised by: {details.disputeDetails?.raisedBy}</div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Distribution</h3>
              <OwnershipPieChart owners={details.owners} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Co-Owners List</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User ID</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Share</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {details.owners.map((owner: any, idx: number) => (
                      <tr key={idx}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{owner.name || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{owner.ownerId}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-bold">{owner.sharePercent}%</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <ConsentStatusBadge status={owner.consentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button disabled className="bg-gray-100 text-gray-500 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                <FaExchangeAlt className="text-2xl" />
                <span className="font-bold">Transfer Share</span>
                <span className="text-xs">(Requires completed status)</span>
              </button>
              
              <button onClick={() => setShowDispute(!showDispute)} disabled={details.isDisputed} className="bg-red-50 text-red-700 hover:bg-red-100 p-4 rounded-xl border border-red-200 flex flex-col items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <FaExclamationTriangle className="text-2xl" />
                <span className="font-bold">Raise Dispute</span>
                <span className="text-xs">(Freeze Application)</span>
              </button>
            </div>

            {showDispute && !details.isDisputed && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 mt-4 animate-fade-in">
                <h3 className="text-lg font-bold text-red-700 mb-2">Raise Ownership Dispute</h3>
                <p className="text-sm text-gray-600 mb-4">This will freeze the application. Please provide a clear reason.</p>
                <textarea 
                  value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                  placeholder="e.g. My share percentage is incorrect..."
                  className="w-full border border-gray-300 rounded p-3 mb-4 text-black h-24"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowDispute(false)} className="px-4 py-2 text-gray-600 font-semibold">Cancel</button>
                  <button onClick={raiseDispute} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Submit Dispute</button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
