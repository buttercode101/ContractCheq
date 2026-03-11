
import React from 'react';
import { RiskLevel } from '../types';

interface BadgeProps {
  level: RiskLevel;
  label: string;
}

const Badge: React.FC<BadgeProps> = ({ level, label }) => {
  const styles = {
    HIGH: "bg-red-50 text-red-700 border-red-200/50 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.1)]",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200/50 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)]",
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)]"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${
        level === 'HIGH' ? 'bg-red-500' : level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
      }`}></span>
      {label}
    </span>
  );
};

export default Badge;
