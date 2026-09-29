import React from 'react';
import { FaCheckCircle, FaClock } from 'react-icons/fa';

interface ConsentStatusBadgeProps {
  status: 'pending' | 'approved';
}

export default function ConsentStatusBadge({ status }: ConsentStatusBadgeProps) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        <FaCheckCircle className="w-3 h-3" />
        Consented
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
      <FaClock className="w-3 h-3" />
      Pending Consent
    </span>
  );
}
