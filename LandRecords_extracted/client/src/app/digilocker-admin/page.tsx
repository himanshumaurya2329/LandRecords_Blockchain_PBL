'use client';
import { useState } from 'react';

export default function DigiLockerAdmin() {
  const [citizenAadhar, setCitizenAadhar] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [documentType, setDocumentType] = useState<'aadhaar_card' | 'land_deed'>('aadhaar_card');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchCitizen = async () => {
    if (!citizenAadhar) return;
    try {
      setSearching(true);
      const res = await fetch(`/api/digilocker-vault?aadhar=${citizenAadhar}`);
      const data = await res.json();
      if (data.success) setUploadedDocs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const uploadDocument = async () => {
    if (!file || !citizenAadhar || !citizenName || !citizenEmail) {
      setError('Please fill all fields and select a file');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Save to DigiLocker vault (no IPFS yet - uploaded only when citizen approves)
      const vaultRes = await fetch('/api/digilocker-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenAadhar,
          citizenName,
          citizenEmail,
          documentType,
          fileData: base64,
          fileName: file.name,
          uploadedBy: 'government_authority'
        })
      });
      const vaultData = await vaultRes.json();

      if (vaultData.success) {
        setMessage('✅ Document saved to DigiLocker vault! Will be uploaded to IPFS when citizen approves official request.');
        setFile(null);
        searchCitizen();
      } else {
        setError(vaultData.error || 'Failed to save document');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #1e3a8a)', padding: '20px 24px', borderBottom: '1px solid #1e3a8a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>🏛️ DigiLocker — Authority Panel</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>Upload verified documents for citizens</p>
          </div>
          <a href="/" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>🏠 Home</a>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Upload Form */}
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', color: '#38bdf8', fontSize: '16px' }}>📤 Upload Document for Citizen</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Citizen Aadhaar Number *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={citizenAadhar} onChange={e => setCitizenAadhar(e.target.value)}
                  placeholder="Enter 12-digit Aadhaar"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px' }} />
                <button onClick={searchCitizen} disabled={searching}
                  style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  {searching ? '...' : '🔍'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Citizen Full Name *</label>
              <input value={citizenName} onChange={e => setCitizenName(e.target.value)}
                placeholder="Enter citizen full name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Citizen Email *</label>
              <input value={citizenEmail} onChange={e => setCitizenEmail(e.target.value)}
                placeholder="Enter citizen email"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Document Type *</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value as any)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px' }}>
                <option value="aadhaar_card">Aadhaar Card</option>
                <option value="land_deed">Land Deed</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Upload PDF Document *</label>
              <input type="file" accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
              {file && <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '6px' }}>✅ {file.name} selected</div>}
            </div>

            {error && <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>❌ {error}</div>}
            {message && <div style={{ background: '#22c55e22', border: '1px solid #22c55e', color: '#22c55e', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', wordBreak: 'break-all' }}>{message}</div>}

            <button onClick={uploadDocument} disabled={loading}
              style={{ width: '100%', background: loading ? '#334155' : '#1d4ed8', border: 'none', color: 'white', padding: '12px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
              {loading ? '⏳ Uploading to IPFS...' : '📤 Upload to DigiLocker'}
            </button>
          </div>

          {/* Uploaded Documents */}
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', color: '#38bdf8', fontSize: '16px' }}>📁 Documents in Vault</h2>
            {uploadedDocs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div>Search by Aadhaar to see documents</div>
              </div>
            ) : (
              uploadedDocs.map((doc, i) => (
                <div key={i} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #22c55e33' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '14px' }}>
                      {doc.documentType === 'aadhaar_card' ? '🪪 Aadhaar Card' : '📜 Land Deed'}
                    </span>
                    <span style={{ background: '#22c55e22', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>✅ VERIFIED</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>File: {doc.fileName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
                    {doc.ipfsHash && <span>IPFS: <span style={{ color: '#38bdf8' }}>{doc.ipfsHash}</span></span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Uploaded: {new Date(doc.verifiedAt).toLocaleString('en-IN')}
                  </div>
                  {doc.ipfsHash && (
                  <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank"
                    style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: '#38bdf8', textDecoration: 'none' }}>
                    🔗 View on IPFS →
                  </a>
                )}

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
