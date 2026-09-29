import React from 'react';

interface Owner {
  name: string;
  sharePercent: number;
}

interface OwnershipPieChartProps {
  owners: Owner[];
}

// Fixed color palette for owners
const COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];

export default function OwnershipPieChart({ owners }: OwnershipPieChartProps) {
  if (!owners || owners.length === 0) return null;

  const total = owners.reduce((sum, o) => sum + (Number(o.sharePercent) || 0), 0);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Ownership Distribution</h3>
        <span className={`text-xs font-bold ${Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
          Total: {total}%
        </span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-full h-6 flex rounded-full overflow-hidden bg-gray-200">
        {owners.map((owner, index) => {
          const share = Number(owner.sharePercent) || 0;
          if (share <= 0) return null;
          return (
            <div
              key={index}
              style={{ width: `${share}%` }}
              className={`h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 ${COLORS[index % COLORS.length]}`}
              title={`${owner.name}: ${share}%`}
            >
              {share >= 10 ? `${share}%` : ''}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {owners.map((owner, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${COLORS[index % COLORS.length]}`}></div>
            <div className="text-xs text-gray-600">
              <span className="font-semibold text-gray-800">{owner.name || 'Unnamed'}</span> ({owner.sharePercent}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
