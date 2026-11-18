'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiKey, FiLock } from 'react-icons/fi';

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
      <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-1.5">
        <FiKey className="text-teal-500 text-xs" aria-hidden="true" />
        <span className="text-teal-700 text-xs font-mono truncate max-w-[200px]">{did}</span>
        <button
          type="button"
          onClick={copyDID}
          className="text-teal-700 hover:text-teal-900 text-xs"
          aria-label={copied ? 'DID copied' : 'Copy DID'}
          title={copied ? 'Copied' : 'Copy DID'}
        >
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
        </button>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiKey className="text-teal-700 text-xl" aria-hidden="true" />
        <div>
          <p className="text-slate-800 font-semibold text-sm">Decentralized identity (DID)</p>
          <p className="text-slate-500 text-xs">Your permanent blockchain identity</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between gap-2 border border-slate-200">
        <p className="text-slate-700 font-mono text-xs break-all">{did}</p>
        <button
          type="button"
          onClick={copyDID}
          className="shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs transition-all inline-flex items-center gap-1.5"
        >
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy DID'}
        </button>
      </div>
      <p className="text-slate-500 text-xs mt-2 inline-flex items-center gap-1.5">
        <FiLock aria-hidden="true" /> Cryptographically generated, stored on Hyperledger Fabric
      </p>
    </section>
  );
}
