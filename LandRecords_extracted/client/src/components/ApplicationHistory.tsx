'use client';

import { useState } from 'react';
import { FaClock, FaCheckCircle, FaTimesCircle, FaDatabase, FaArrowRight, FaImage, FaFile, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface HistoryEntry {
  transactionId?: string;
  officialId: string;
  officialName: string;
  designation: string;
  action: 'approved' | 'rejected' | 'data_added' | 'forwarded';
  remarks?: string;
  timestamp: string;
  data?: any;
  documents?: Array<{
    fileName: string;
    fileType: 'pdf' | 'image' | 'document';
    ipfsHash: string;
    uploadedAt?: string;
    size?: number;
  }>;
}

interface ApplicationHistoryProps {
  history?: HistoryEntry[];
}

export default function ApplicationHistory({ history }: ApplicationHistoryProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-gray-500/20 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
          <FaClock />
          Application Timeline
        </h2>
        <p className="text-gray-400 text-center py-8">No action history available yet</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <FaCheckCircle className="text-green-400" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-400" />;
      case 'data_added':
        return <FaDatabase className="text-blue-400" />;
      case 'forwarded':
        return <FaArrowRight className="text-yellow-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'border-green-500/30 bg-green-500/10';
      case 'rejected':
        return 'border-red-500/30 bg-red-500/10';
      case 'data_added':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'forwarded':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const renderDataField = (key: string, value: any) => {
    // Handle arrays (photos, documents)
    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-3">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{key}</p>
          <div className="space-y-2">
            {value.map((item: any, idx: number) => {
              // If item is a string (IPFS hash or URL)
              if (typeof item === 'string') {
                const isIpfs = item.startsWith('Qm');
                const isUrl = item.startsWith('http');
                return (
                  <a
                    key={idx}
                    href={isIpfs ? `https://ipfs.io/ipfs/${item}` : item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 p-2 bg-slate-800/50 rounded border border-blue-500/20 hover:border-blue-500/50 transition-all"
                  >
                    {isIpfs ? <FaImage className="text-purple-400" /> : <FaFile className="text-blue-400" />}
                    <span className="truncate">{isIpfs ? `IPFS: ${item.substring(0, 20)}...` : item}</span>
                  </a>
                );
              }
              // If item is an object
              return (
                <div key={idx} className="text-xs text-gray-300 p-2 bg-slate-800/50 rounded border border-slate-600/20">
                  {JSON.stringify(item, null, 2).split('\n').slice(0, 3).join('\n')}...
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="mb-3">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{key}</p>
          <div className="text-xs text-gray-300 p-2 bg-slate-800/50 rounded border border-slate-600/20">
            {Object.entries(value).map(([k, v]: any) => (
              <div key={k} className="flex justify-between py-1">
                <span className="text-gray-400">{k}:</span>
                <span className="text-gray-200 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle primitives
    return (
      <div key={key} className="mb-2 flex justify-between text-xs">
        <span className="text-gray-400 font-semibold uppercase">{key}:</span>
        <span className="text-gray-200">{String(value)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-indigo-500/20 p-6 mb-6">
      {/* Header with Toggle Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
          <FaClock />
          📜 Application Timeline ({history.length} {history.length === 1 ? 'Action' : 'Actions'})
        </h2>
        <button
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${isTimelineOpen
            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/40'
            : 'bg-slate-600/30 text-slate-300 border border-slate-500/30 hover:bg-slate-600/40'
            }`}
        >
          {isTimelineOpen ? (
            <>
              <FaChevronUp size={14} />
              Hide Timeline
            </>
          ) : (
            <>
              <FaChevronDown size={14} />
              View Timeline
            </>
          )}
        </button>
      </div>

      {/* Timeline Content - Conditionally Rendered */}
      {isTimelineOpen && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-linear-to-b from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Timeline items */}
          <div className="space-y-6">
            {history.map((entry, index) => (
              <div key={index} className="relative pl-16">
                {/* Timeline dot */}
                <div className={`absolute left-3 top-3 w-6 h-6 rounded-full border-2 ${getActionColor(entry.action)} flex items-center justify-center z-10`}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content card */}
                <div className={`rounded-xl border-2 ${getActionColor(entry.action)} p-4 hover:scale-[1.02] transition-transform`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-lg">{entry.officialName}</h3>
                      <p className="text-sm text-blue-300">{entry.designation}</p>
                    </div>
                    <div className="text-right">
                      {entry.transactionId && (
                        <p className="text-xs text-purple-300 font-mono mb-1">
                          🔑 TX: {entry.transactionId.substring(0, 16)}...
                        </p>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${entry.action === 'approved' ? 'bg-green-500/20 text-green-300' :
                      entry.action === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        entry.action === 'data_added' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-yellow-500/20 text-yellow-300'
                      }`}>
                      {entry.action.replace('_', ' ')}
                    </span>
                  </div>

                  {entry.remarks && (
                    <p className="text-gray-300 text-sm mb-3 italic">"{entry.remarks}"</p>
                  )}

                  {/* Display uploaded documents if present */}
                  {entry.documents && entry.documents.length > 0 && (
                    <details className="mt-3" open>
                      <summary className="text-sm text-green-300 cursor-pointer hover:text-green-200 font-semibold mb-2">
                        📎 Documents ({entry.documents.length} file{entry.documents.length !== 1 ? 's' : ''})
                      </summary>
                      <div className="mt-2 space-y-2">
                        {entry.documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={`https://ipfs.io/ipfs/${doc.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-green-500/20 hover:border-green-500/50 transition-all"
                          >
                            {doc.fileType === 'image' ? (
                              <FaImage className="text-purple-400 shrink-0" />
                            ) : doc.fileType === 'pdf' ? (
                              <FaFile className="text-red-400 shrink-0" />
                            ) : (
                              <FaFile className="text-blue-400 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{doc.fileName}</p>
                              <p className="text-gray-400 text-xs">
                                {doc.fileType.toUpperCase()} • {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : 'Size unknown'}
                              </p>
                            </div>
                            <div className="text-gray-500 text-xs shrink-0">IPFS ↗</div>
                          </a>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Display role-specific data if present */}
                  {entry.data && Object.keys(entry.data).length > 0 && (
                    <details className="mt-3" open>
                      <summary className="text-sm text-indigo-300 cursor-pointer hover:text-indigo-200 font-semibold mb-2">
                        📋 Data Added ({Object.keys(entry.data).length} fields)
                      </summary>
                      <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        {Object.entries(entry.data).map(([key, value]) => renderDataField(key, value))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
