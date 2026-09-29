'use client';

import React, { useState } from 'react';
import { FaCheckCircle, FaUserCheck } from 'react-icons/fa';

export default function ConsentPanelPage() {
  const [appId, setAppId] = useState('');
  const [userId, setUserId] = useState('user_portal');
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentMsg, setConsentMsg] = useState('');

  const fetchDetails = async () => {
    if (!appId) return;
    setLoading(true);
    setError('');
    setDetails(null);
    setConsentMsg('');

    try {
      const res = await fetch(`http://localhost:3001/api/land/${appId}/owners?username=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch details');
      setDetails(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grantConsent = async () => {
    if (!details) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/land/${appId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId, username: userId, remarks: 'I digitally consent to this joint ownership' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant consent');
      setConsentMsg('Consent granted successfully!');
      fetchDetails(); // Refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = details?.owners?.find((o: any) => o.ownerId === userId);
  const needsConsent = currentUser && currentUser.consentStatus !== 'approved';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUserCheck className="text-indigo-600" />
            Co-Owner Consent Portal
          </h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Your User ID</label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)} className="w-full px-3 py-2 border rounded text-black" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Application ID</label>
              <input type="text" value={appId} onChange={e => setAppId(e.target.value)} placeholder="APP-XXX" className="w-full px-3 py-2 border rounded text-black" />
            </div>
          </div>
          <button onClick={fetchDetails} className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold w-full hover:bg-indigo-700">
            {loading ? 'Searching...' : 'Find My Applications'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}
        {consentMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-bold">{consentMsg}</div>}

        {details && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Application {details.applicationId}</h3>
            
            {details.isDisputed && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4 font-bold border border-red-300">
                ⚠️ This application is currently FROZEN due to a dispute.
              </div>
            )}

            <div className="space-y-3 mb-6">
              {details.owners.map((owner: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <div className="font-semibold text-gray-800">{owner.name || owner.ownerId}</div>
                    <div className="text-xs text-gray-500">Share: {owner.sharePercent}%</div>
                  </div>
                  <div>
                    {owner.consentStatus === 'approved' ? (
                      <span className="text-green-600 font-bold text-sm flex items-center gap-1"><FaCheckCircle/> Approved</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-sm">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {needsConsent && !details.isDisputed ? (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800 mb-3">You are listed as a co-owner. Please review and grant your digital consent to proceed.</p>
                <button onClick={grantConsent} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <FaCheckCircle /> Grant Digital Consent
                </button>
              </div>
            ) : currentUser ? (
              <p className="text-center text-gray-500 font-semibold">You have already consented.</p>
            ) : (
              <p className="text-center text-red-500 font-semibold">You are not listed as an owner on this application.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
