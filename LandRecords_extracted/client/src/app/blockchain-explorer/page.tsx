'use client';
import { useState, useEffect } from 'react';

interface Transaction {
  action: string;
  timestamp: string;
  transactionId: string;
  officialId: string;
  officialName: string;
  designation: string;
  remarks: string;
}

interface Application {
  Key: string;
  Record: {
    applicationId: string;
    createdAt: string;
    status: string;
    ownerName?: string;
    surveyNumber?: string;
    history: Transaction[];
  };
}

export default function BlockchainExplorer() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_FABRIC_API_URL || 'http://localhost:3001';
      const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'clerk1', password: 'clerk123' })
      });
      const loginData = await loginRes.json();
      const token = loginData.token;
      const res = await fetch(`${apiUrl}/api/land/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setApplications(data.data);
      else setError('Failed to fetch blockchain data');
    } catch (err) {
      setError('Cannot connect to blockchain network');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const ts = parseInt(timestamp);
    const date = ts > 1e10 ? new Date(ts) : new Date(ts * 1000);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return '#22c55e';
    if (s === 'rejected') return '#ef4444';
    return '#f59e0b';
  };

  const getActionColor = (action: string) => {
    if (action === 'created') return '#3b82f6';
    if (action === 'forwarded') return '#8b5cf6';
    if (action === 'approved') return '#22c55e';
    if (action === 'rejected') return '#ef4444';
    return '#6b7280';
  };

  const filtered = applications.filter(app =>
    app.Key.toLowerCase().includes(search.toLowerCase()) ||
    app.Record?.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    app.Record?.surveyNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalTxns = applications.reduce((sum, app) => sum + (app.Record?.history?.length || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace' }}>
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>
              ⛓️ Blockchain Transaction Explorer
            </h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '13px' }}>
              E-Land Records — Hyperledger Fabric Network
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/" style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>🏠 Home</a>
            <button onClick={fetchData} style={{ background: '#0ea5e9', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Applications', value: applications.length, icon: '📋', color: '#3b82f6' },
            { label: 'Total Transactions', value: totalTxns, icon: '🔗', color: '#8b5cf6' },
            { label: 'Approved', value: applications.filter(a => a.Record?.status === 'approved').length, icon: '✅', color: '#22c55e' },
            { label: 'Pending', value: applications.filter(a => a.Record?.status !== 'approved' && a.Record?.status !== 'rejected').length, icon: '⏳', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: `1px solid ${stat.color}33` }}>
              <div style={{ fontSize: '24px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <input type="text" placeholder="🔍 Search by Receipt No, Owner Name, or Survey Number..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px', marginBottom: '24px', boxSizing: 'border-box' }}
        />

        {loading && <div style={{ textAlign: 'center', color: '#38bdf8', padding: '40px' }}>⛓️ Loading blockchain data...</div>}
        {error && <div style={{ textAlign: 'center', color: '#ef4444', padding: '40px' }}>❌ {error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div>
            <h2 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Applications on Blockchain ({filtered.length})
            </h2>
            {filtered.map(app => (
              <div key={app.Key} onClick={() => setSelected(selected?.Key === app.Key ? null : app)} style={{
                background: selected?.Key === app.Key ? '#1e3a5f' : '#1e293b',
                border: `1px solid ${selected?.Key === app.Key ? '#3b82f6' : '#334155'}`,
                borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '14px' }}>{app.Key}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                      👤 {app.Record?.ownerName || 'N/A'} | 📍 Survey: {app.Record?.surveyNumber || 'N/A'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                      🔗 {app.Record?.history?.length || 0} transactions on chain | Click to view
                    </div>
                  </div>
                  <span style={{
                    background: getStatusColor(app.Record?.status) + '22',
                    color: getStatusColor(app.Record?.status),
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'
                  }}>
                    {app.Record?.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No applications found</div>
            )}
          </div>

          {selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Transaction History ({selected.Record?.history?.length} txns)
                </h2>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
              </div>
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
                <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{selected.Key}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                  👤 {selected.Record?.ownerName} | 📍 {selected.Record?.surveyNumber}
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                  Created: {formatTime(selected.Record?.createdAt)}
                </div>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {selected.Record?.history?.map((txn, i) => (
                  <div key={i} style={{
                    background: '#1e293b', border: `1px solid ${getActionColor(txn.action)}33`,
                    borderLeft: `4px solid ${getActionColor(txn.action)}`,
                    borderRadius: '8px', padding: '14px', marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ background: getActionColor(txn.action) + '22', color: getActionColor(txn.action), padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {txn.action}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Step #{i + 1}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                      🔑 <span style={{ color: '#38bdf8' }}>{txn.transactionId}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      👤 <strong>{txn.officialName}</strong> ({txn.designation})
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      🕐 {formatTime(txn.timestamp)}
                    </div>
                    {txn.remarks && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', background: '#0f172a', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                        💬 {txn.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
