'use client';

import React, { useState } from 'react';
import { FaCheckCircle, FaUserCheck } from 'react-icons/fa';

export default function ConsentPanelPage() {
  const [appId, setAppId] = React.useState('');
  const [userId, setUserId] = React.useState('');
  const [userAadhar, setUserAadhar] = React.useState('');
  const [details, setDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [consentMsg, setConsentMsg] = React.useState('');
  const [consentLoading, setConsentLoading] = React.useState(false);

  // Auto-load session info and appId from URL
  React.useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          // Use email as userId identifier for the consent system
          setUserId(user.email || '');
          setUserAadhar(user.aadhar || '');
        }
      } catch {}
    };
    loadSession();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAppId = params.get('appId');
      if (urlAppId) setAppId(urlAppId);
    }
  }, []);

  // Auto-fetch when both appId and userId are set from URL
  React.useEffect(() => {
    if (appId && (userId || userAadhar)) {
      fetchDetailsById(appId);
    }
  }, [appId, userId, userAadhar]);

  const fetchDetailsById = async (targetAppId: string) => {
    if (!targetAppId) return;
    setLoading(true);
    setError('');
    setDetails(null);
    setConsentMsg('');

    try {
      // Fetch from MongoDB via Next.js API route (not fabric-api)
      const res = await fetch(`/api/land-requests/by-receipt?receipt=${targetAppId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application not found');
      setDetails(data);
    } catch (err: any) {
      // Fallback: try fabric-api
      try {
        const res2 = await fetch(`http://localhost:3001/api/land/${targetAppId}/owners`);
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || 'Failed to fetch details');
        setDetails(data2.data);
      } catch (err2: any) {
        setError(err2.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = () => fetchDetailsById(appId);

  const grantConsent = async () => {
    if (!details) return;
    setConsentLoading(true);
    setError('');
    try {
      // Update consent in MongoDB
      const res = await fetch(`/api/land-requests/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiptNumber: appId,
          ownerAadhar: userAadhar,
          ownerEmail: userId,
          remarks: 'I digitally consent to this joint ownership registration',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to grant consent');
      setConsentMsg('✅ Consent granted successfully! The clerk has been notified.');
      fetchDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsentLoading(false);
    }
  };

  // Determine if the current user is an owner and needs consent
  const owners: any[] = details?.owners || [];
  const myOwnerByAadhar = owners.find((o: any) => o.aadhar && userAadhar && o.aadhar === userAadhar);
  const myOwnerByEmail = owners.find((o: any) => o.ownerId && userId && o.ownerId === userId);
  const currentUser = myOwnerByAadhar || myOwnerByEmail;
  const needsConsent = currentUser && currentUser.consentStatus !== 'consented' && currentUser.consentStatus !== 'approved';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span><strong>Co-Owner Consent Portal</strong> — Your session is auto-detected. Enter the Application ID shared by the primary applicant and click Find.</span>
          </div>
          <a href="/user-dashboard" className="font-bold underline text-indigo-700 hover:text-indigo-900 whitespace-nowrap">
            User Dashboard →
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUserCheck className="text-indigo-600" />
            Co-Owner Consent Portal
          </h2>

          {userId && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✅ Logged in as: <span className="font-bold">{userId}</span>
              {userAadhar && <span className="ml-2 text-green-600">(Aadhaar: {userAadhar.slice(0,4)}****{userAadhar.slice(-4)})</span>}
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Application ID</label>
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDetails()}
                placeholder="e.g. APP-ABC123"
                className="w-full px-3 py-2 border rounded text-black"
              />
            </div>
          </div>
          <button
            onClick={fetchDetails}
            disabled={loading || !appId}
            className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold w-full hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Find Application'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}
        {consentMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-bold">{consentMsg}</div>}

        {details && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Application {details.receiptNumber || details.applicationId}
            </h3>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 p-2 rounded"><span className="text-slate-500">Survey No:</span> <span className="font-bold">{details.surveyNumber || '-'}</span></div>
              <div className="bg-slate-50 p-2 rounded"><span className="text-slate-500">Area:</span> <span className="font-bold">{details.area || '-'}</span></div>
              <div className="bg-slate-50 p-2 rounded"><span className="text-slate-500">Owner Name:</span> <span className="font-bold">{details.ownerName || '-'}</span></div>
              <div className="bg-slate-50 p-2 rounded"><span className="text-slate-500">Status:</span> <span className="font-bold capitalize">{details.status || '-'}</span></div>
            </div>

            {details.isDisputed && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4 font-bold border border-red-300">
                ⚠️ This application is currently FROZEN due to a dispute.
              </div>
            )}

            <div className="space-y-3 mb-6">
              <p className="text-sm font-bold text-gray-700 mb-2">Co-Owners &amp; Consent Status:</p>
              {(owners.length > 0 ? owners : []).map((owner: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <div className="font-semibold text-gray-800">{owner.name || owner.ownerId}</div>
                    <div className="text-xs text-gray-500">Share: {owner.sharePercent}%</div>
                    {owner.aadhar && <div className="text-xs text-gray-400">Aadhaar: {owner.aadhar.slice(0,4)}****{owner.aadhar.slice(-4)}</div>}
                  </div>
                  <div>
                    {(owner.consentStatus === 'consented' || owner.consentStatus === 'approved') ? (
                      <span className="text-green-600 font-bold text-sm flex items-center gap-1"><FaCheckCircle/> Consented</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-sm">⏳ Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!currentUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                ℹ️ Your account (Aadhaar: {userAadhar || 'not found'}) is not listed as a co-owner on this application.
                Please check the Application ID with the primary applicant.
              </div>
            )}

            {currentUser && needsConsent && !details.isDisputed && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800 mb-1 font-bold">Action Required: Your Consent</p>
                <p className="text-sm text-indigo-700 mb-3">
                  You are listed as co-owner with <strong>{currentUser.sharePercent}%</strong> share.
                  Please review and grant your digital consent to proceed with registration.
                </p>
                <button
                  onClick={grantConsent}
                  disabled={consentLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FaCheckCircle /> {consentLoading ? 'Granting Consent...' : 'Grant Digital Consent'}
                </button>
              </div>
            )}

            {currentUser && !needsConsent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-green-600" />
                  You have already granted your consent for this application.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
