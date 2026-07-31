import React from 'react';
import { RiskLevel } from '../../types';

interface BadgeProps {
  level: RiskLevel;
  label: string;
}

const styles = {
  HIGH: "bg-risk-high-bg text-risk-high border-risk-high/20",
  MEDIUM: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  LOW: "bg-risk-low-bg text-risk-low border-risk-low/20"
};

const dotStyles = {
  HIGH: "bg-risk-high",
  MEDIUM: "bg-risk-medium",
  LOW: "bg-risk-low"
};

const Badge: React.FC<BadgeProps> = ({ level, label }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${styles[level]}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[level]}`} />
    {label}
  </span>
);

export default Badge;