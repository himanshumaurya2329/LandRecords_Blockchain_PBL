'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import OwnershipPieChart from '@/components/OwnershipPieChart';

export default function JointApplicationPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Primary owner data + owners array
  const [primaryOwner, setPrimaryOwner] = useState('user_portal');
  const [owners, setOwners] = useState([
    { ownerId: 'user_portal', name: '', aadhar: '', sharePercent: 50 },
    { ownerId: '', name: '', aadhar: '', sharePercent: 50 },
  ]);

  const totalShare = owners.reduce((sum, o) => sum + (Number(o.sharePercent) || 0), 0);
  const isValid = Math.abs(totalShare - 100) < 0.01 && owners.length >= 2 && applicationId.trim() !== '';

  const handleOwnerChange = (index: number, field: string, value: string | number) => {
    const newOwners = [...owners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    setOwners(newOwners);
  };

  const addOwner = () => {
    if (owners.length < 5) {
      setOwners([...owners, { ownerId: '', name: '', aadhar: '', sharePercent: 0 }]);
    }
  };

  const removeOwner = (index: number) => {
    if (owners.length > 2) {
      const newOwners = owners.filter((_, i) => i !== index);
      setOwners(newOwners);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/land/joint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          primaryOwner,
          owners,
          fullName: owners[0].name,
          aadhar: owners[0].aadhar
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      alert('Joint application submitted successfully!');
      router.push('/user-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-indigo-600 py-6 px-8">
          <h2 className="text-2xl font-bold text-white">New Joint Land Registration</h2>
          <p className="text-indigo-100 mt-2">Register a property with multiple co-owners</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
            <input
              type="text"
              required
              placeholder="e.g. APP-2026-001"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Co-Owners Setup</h3>
              <button
                type="button"
                onClick={addOwner}
                disabled={owners.length >= 5}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                <FaPlus /> Add Co-Owner
              </button>
            </div>

            <div className="space-y-4">
              {owners.map((owner, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <div className="absolute top-4 right-4">
                    {index > 1 && (
                      <button type="button" onClick={() => removeOwner(index)} className="text-red-500 hover:text-red-700 p-1">
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-700 mb-3">Owner {index + 1} {index === 0 && '(Primary)'}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">User ID</label>
                      <input
                        type="text" required placeholder="user_portal"
                        value={owner.ownerId}
                        onChange={(e) => handleOwnerChange(index, 'ownerId', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-indigo-500 text-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                      <input
                        type="text" required placeholder="Name"
                        value={owner.name}
                        onChange={(e) => handleOwnerChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-indigo-500 text-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Aadhaar Number</label>
                      <input
                        type="text" required placeholder="XXXX XXXX XXXX"
                        value={owner.aadhar}
                        onChange={(e) => handleOwnerChange(index, 'aadhar', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-indigo-500 text-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Share %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min="1" max="99"
                          value={owner.sharePercent}
                          onChange={(e) => handleOwnerChange(index, 'sharePercent', Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <span className="text-sm font-bold text-gray-700 w-12 text-right">{owner.sharePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <OwnershipPieChart owners={owners} />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all
                ${!isValid || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/30'}`}
            >
              <FaCheck /> {loading ? 'Submitting...' : 'Submit Joint Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
