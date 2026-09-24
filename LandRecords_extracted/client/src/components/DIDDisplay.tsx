'use client';
import { useState } from 'react';

interface DIDDisplayProps {
  did?: string;
  compact?: boolean;
}

export default function DIDDisplay({ did, compact = false }: DIDDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!did) return null;

  const copyDID = () => {
    navigator.clipboard.writeText(did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5">
        <span className="text-indigo-400 text-xs">🔑</span>
        <span className="text-indigo-300 text-xs font-mono truncate max-w-[200px]">{did}</span>
        <button onClick={copyDID} className="text-indigo-400 hover:text-white text-xs">
          {copied ? '✅' : '📋'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🔑</span>
        <div>
          <p className="text-indigo-300 font-bold text-sm">
            Decentralized Identity (DID)
          </p>
          <p className="text-indigo-400/60 text-xs">
            Your permanent blockchain identity
          </p>
        </div>
      </div>
      <div className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between gap-2">
        <p className="text-indigo-200 font-mono text-xs break-all">{did}</p>
        <button
          onClick={copyDID}
          className="shrink-0 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg text-xs transition-all"
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
      </div>
      <p className="text-indigo-400/60 text-xs mt-2">
        🔒 Cryptographically generated • Stored on Hyperledger Fabric • Cannot be forged
      </p>
    </div>
  );
}
