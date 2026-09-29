'use client';

import React, { useState } from 'react';
import { FaChartPie, FaExclamationTriangle, FaExchangeAlt, FaCheckCircle, FaTimes } from 'react-icons/fa';
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

  // Transfer Share state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFromOwnerId, setTransferFromOwnerId] = useState('');
  const [transferToOwnerId, setTransferToOwnerId] = useState('');
  const [transferToName, setTransferToName] = useState('');
  const [transferToAadhar, setTransferToAadhar] = useState('');
  const [transferShare, setTransferShare] = useState<number>(0);
  const [transferNocVerified, setTransferNocVerified] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAppId = params.get('appId');
      if (urlAppId) {
        setAppId(urlAppId);
        fetchDetailsById(urlAppId);
      }
    }
  }, []);

  const fetchDetailsById = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true); setError(''); setDetails(null); setShowDispute(false); setShowTransfer(false);
    try {
      // Try MongoDB first (always available)
      const res = await fetch(`/api/land-requests/by-receipt?receipt=${encodeURIComponent(targetId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application not found');
      // Normalize to expected shape with owners array
      setDetails({
        applicationId: data.receiptNumber,
        status: data.status,
        ownershipType: data.ownershipType || 'single',
        owners: data.owners || [],
        isDisputed: data.isDisputed || false,
        allConsentsGiven: data.allConsentsGiven ?? true,
        disputeDetails: data.disputeDetails || null,
        surveyNumber: data.surveyNumber,
        area: data.area,
        ownerName: data.ownerName,
      });
    } catch (err: any) {
      // Fallback to fabric-api if MongoDB fails
      try {
        const res2 = await fetch(`http://localhost:3001/api/land/${targetId}/owners`);
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || 'Failed to fetch');
        setDetails(data2.data);
      } catch (err2: any) {
        setError(`Could not load application: ${err2.message || err.message}. Make sure the Application ID is correct.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = () => fetchDetailsById(appId);

  const raiseDispute = async () => {
    if (!details || !disputeReason) return;
    setLoading(true);
    try {
      // Update dispute status in MongoDB
      const res = await fetch(`/api/land-requests/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiptNumber: appId,
          reason: disputeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to fabric-api
        const res2 = await fetch(`http://localhost:3001/api/land/${appId}/dispute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raisedBy: 'user_portal', reason: disputeReason, username: 'user_portal' })
        });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || 'Failed to raise dispute');
      }
      alert('Dispute raised successfully. Application is now frozen.');
      fetchDetails();
      setShowDispute(false);
      setDisputeReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferShare = async () => {
    if (!details || !transferFromOwnerId || !transferToOwnerId || transferShare <= 0) return;
    if (!transferNocVerified) {
      alert('Please verify the NOC before proceeding with the transfer.');
      return;
    }
    setTransferLoading(true);
    try {
      const fromOwner = details.owners.find((o: any) => o.ownerId === transferFromOwnerId);
      if (!fromOwner) throw new Error('From-owner not found');
      if (transferShare > fromOwner.sharePercent) throw new Error(`Cannot transfer more than ${fromOwner.sharePercent}%`);

      const res = await fetch(`http://localhost:3001/api/land/${appId}/transfer-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromOwnerId: transferFromOwnerId,
          toOwnerId: transferToOwnerId,
          sharePercent: transferShare,
          newOwnerData: { name: transferToName, aadhar: transferToAadhar },
          username: transferFromOwnerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');
      alert(`Share transfer successful! ${transferShare}% transferred to ${transferToName}.`);
      setShowTransfer(false);
      setTransferFromOwnerId(''); setTransferToOwnerId(''); setTransferToName('');
      setTransferToAadhar(''); setTransferShare(0); setTransferNocVerified(false);
      fetchDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const isCompleted = details?.status === 'completed' || details?.ownershipType === 'joint';
  const canTransfer = isCompleted && !details?.isDisputed;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span><strong>Where to find Application ID?</strong> Check the <strong>Track Status</strong> tab in your User Dashboard to copy your Receipt Number / Application ID.</span>
          </div>
          <a href="/user-dashboard" className="font-bold underline text-indigo-700 hover:text-indigo-900 whitespace-nowrap">
            User Dashboard →
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartPie className="text-indigo-600" />
            Ownership Dashboard
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchDetails()}
              placeholder="Enter Application ID (e.g. APP-101)"
              className="flex-1 px-4 py-2 border rounded text-black"
            />
            <button
              onClick={fetchDetails}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'View'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}

        {details && (
          <div className="space-y-6">

            {details.isDisputed && (
              <div className="bg-red-100 text-red-800 p-4 rounded-xl border border-red-300 font-bold flex items-start gap-3">
                <FaExclamationTriangle className="mt-1 text-red-600 text-xl shrink-0" />
                <div>
                  <div className="text-lg">APPLICATION FROZEN: Active Dispute</div>
                  <div className="text-sm font-normal mt-1">Reason: {details.disputeDetails?.reason}</div>
                  <div className="text-xs mt-1 text-red-600">Raised by: {details.disputeDetails?.raisedBy}</div>
                  <div className="text-xs mt-2 text-red-500 italic">Awaiting resolution by District Collector</div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Distribution</h3>
              <OwnershipPieChart owners={details.owners} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Co-Owners List</h3>
              <p className="text-xs text-gray-500 mb-4">
                Consent Status is fetched live from the database.
                {details.allConsentsGiven
                  ? ' ✅ All consents received — application can proceed.'
                  : ' ⏳ Waiting for all co-owners to give consent.'}
              </p>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aadhaar</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Share</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {details.owners.map((owner: any, idx: number) => {
                      const aadhar = owner.aadhar || '';
                      const maskedAadhar = aadhar.length >= 8
                        ? aadhar.slice(0,4) + ' **** ' + aadhar.slice(-4)
                        : aadhar || '—';
                      const status = owner.consentStatus || 'pending';
                      const consented = status === 'consented' || status === 'approved';
                      return (
                        <tr key={idx} className={consented ? 'bg-green-50/40' : ''}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {owner.name || '—'}
                            {idx === 0 && (
                              <span className="ml-2 inline-block text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                                Primary
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono text-xs">{maskedAadhar}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-bold">{owner.sharePercent}%</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {consented ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                <FaCheckCircle className="text-green-600" /> Consented
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                ⏳ Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowTransfer(true)}
                disabled={!canTransfer}
                title={
                  details.isDisputed ? 'Transfers blocked: active dispute' :
                  !isCompleted ? 'Available only after registration is completed' : ''
                }
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                  canTransfer
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-500 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <FaExchangeAlt className="text-2xl" />
                <span className="font-bold">Transfer Share</span>
                <span className="text-xs text-center">
                  {details.isDisputed ? 'Frozen (dispute active)' :
                   !isCompleted ? '(Requires completed status)' : 'Transfer your share %'}
                </span>
              </button>

              <button
                onClick={() => setShowDispute(!showDispute)}
                disabled={details.isDisputed}
                className="bg-red-50 text-red-700 hover:bg-red-100 p-4 rounded-xl border border-red-200 flex flex-col items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaExclamationTriangle className="text-2xl" />
                <span className="font-bold">Raise Dispute</span>
                <span className="text-xs">{details.isDisputed ? '(Already active)' : '(Freeze Application)'}</span>
              </button>
            </div>

            {showDispute && !details.isDisputed && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                <h3 className="text-lg font-bold text-red-700 mb-2">Raise Ownership Dispute</h3>
                <p className="text-sm text-gray-600 mb-4">This will freeze the application. Please provide a clear reason.</p>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="e.g. My share percentage is incorrect - should be 50% not 30%..."
                  className="w-full border border-gray-300 rounded p-3 mb-4 text-black h-24"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowDispute(false)} className="px-4 py-2 text-gray-600 font-semibold">Cancel</button>
                  <button
                    onClick={raiseDispute}
                    disabled={!disputeReason.trim() || loading}
                    className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showTransfer && details && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaExchangeAlt className="text-indigo-600" /> Transfer Ownership Share
              </h3>
              <button onClick={() => setShowTransfer(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transfer From (Your Owner ID) <span className="text-red-500">*</span></label>
                <select
                  value={transferFromOwnerId}
                  onChange={e => setTransferFromOwnerId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                >
                  <option value="">Select your owner ID</option>
                  {details.owners.map((o: any, i: number) => (
                    <option key={i} value={o.ownerId}>{o.ownerId} ({o.name || 'Owner'}) - {o.sharePercent}%</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Share % to Transfer <span className="text-red-500">*</span>
                  {transferFromOwnerId && (
                    <span className="ml-2 text-xs text-indigo-600">
                      (Max: {details.owners.find((o: any) => o.ownerId === transferFromOwnerId)?.sharePercent || 0}%)
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={details.owners.find((o: any) => o.ownerId === transferFromOwnerId)?.sharePercent || 100}
                    value={transferShare}
                    onChange={e => setTransferShare(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="w-14 text-center font-bold text-gray-800 text-lg">{transferShare}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Buyer User ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={transferToOwnerId}
                  onChange={e => setTransferToOwnerId(e.target.value)}
                  placeholder="e.g. user_buyer_123"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Buyer Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={transferToName}
                    onChange={e => setTransferToName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Buyer Aadhaar <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={transferToAadhar}
                    onChange={e => setTransferToAadhar(e.target.value)}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black"
                  />
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all ${transferNocVerified ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferNocVerified}
                    onChange={e => setTransferNocVerified(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">NOC (No Objection Certificate) Verified</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      I confirm all co-owners have signed the NOC for this transfer and it is legally compliant.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleTransferShare}
                  disabled={
                    transferLoading || !transferFromOwnerId || !transferToOwnerId ||
                    !transferToName || !transferToAadhar || transferShare <= 0 || !transferNocVerified
                  }
                  className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    transferLoading || !transferFromOwnerId || !transferToOwnerId || !transferToName || !transferToAadhar || transferShare <= 0 || !transferNocVerified
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                  }`}
                >
                  <FaCheckCircle />
                  {transferLoading ? 'Transferring...' : `Transfer ${transferShare}% Share`}
                </button>
                <button
                  onClick={() => setShowTransfer(false)}
                  className="px-6 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
