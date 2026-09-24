'use client';
import { useState, useEffect } from 'react';

interface Props {
  aadharNumber: string;
  receiptNumber: string;
  officialId: string;
  officialName: string;
  designation: string;
}

export default function DigiLockerRequestPanel({ aadharNumber, receiptNumber, officialId, officialName, designation }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'approved' | 'rejected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');

  useEffect(() => {
    if (receiptNumber && officialId) checkExistingRequest();
    // Auto-refresh every 10 seconds when waiting
    const interval = setInterval(() => {
      if (receiptNumber && officialId) checkExistingRequest();
    }, 10000);
    return () => clearInterval(interval);
  }, [receiptNumber, officialId]);

  const checkExistingRequest = async () => {
    try {
      const res = await fetch('/api/digilocker/request?receiptNumber=' + receiptNumber);
      const data = await res.json();
      if (data.requests && data.requests.length > 0) {
        const req = data.requests[0];
        if (req.status === 'pending') setStatus('sent');
        else if (req.status === 'approved') { setStatus('approved'); setIpfsHash(req.ipfsHash); }
        else if (req.status === 'rejected') setStatus('rejected');
      }
    } catch (e) {}
  };

  const handleRequest = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/digilocker/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadharNumber,
          receiptNumber,
          officialId,
          officialName,
          designation,
          documentType: 'land_deed'
        })
      });
      const data = await res.json();
      if (res.ok || res.status === 200) {
        setStatus('sent');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send request');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Failed to send request');
    }
  };

  return (
    <div className="bg-slate-800/70 p-5 rounded-xl border border-green-500/30 mt-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-white font-semibold">DigiLocker Document</span>
          <p className="text-gray-400 text-sm mt-1">Request verified land deed from citizen DigiLocker vault</p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'idle' && (
            <button
              onClick={handleRequest}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-200 hover:text-white rounded-lg transition-all border border-green-500/30"
            >
              Request DigiLocker Access
            </button>
          )}
          {status === 'loading' && (
            <span className="px-4 py-2 text-yellow-300 text-sm">Sending request...</span>
          )}
          {status === 'sent' && (
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 text-sm">
              Waiting for citizen approval
            </span>
          )}
          {status === 'approved' && (
            <a
              href={'/api/documents/view?hash=' + ipfsHash}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-200 hover:text-white rounded-lg transition-all"
            >
              View Approved Document
            </a>
          )}
          {status === 'rejected' && (
            <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 text-sm">
              Citizen rejected request
            </span>
          )}
          {status === 'error' && (
            <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
