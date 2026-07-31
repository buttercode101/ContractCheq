import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { RiskLevel, FlaggedClause } from '../../types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  label: string;
  clauses?: FlaggedClause[];
}

const colors: Record<RiskLevel, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, label, clauses = [] }) => {
  const rotation = (score / 100) * 180 - 90;
  const circ = 2 * Math.PI * 40;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-surface rounded-[2rem] border border-white/[0.06] w-full max-w-xs mx-auto">
      {/* SVG Gauge */}
      <svg className="w-48 h-28 overflow-visible" viewBox="0 0 100 50">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="100" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        {/* Active arc */}
        <motion.path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${circ - offset} ${circ}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        {/* Needle */}
        <motion.line
          x1="50" y1="45" x2="50" y2="8"
          stroke="#f7f6f2"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ rotate: -90, transformOrigin: '50px 45px' }}
          animate={{ rotate: rotation, transformOrigin: '50px 45px' }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
        {/* Center dot */}
        <circle cx="50" cy="45" r="4" fill="#f7f6f2" stroke="#0e0f12" strokeWidth="2" />
      </svg>

      {/* Score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-2 text-center"
      >
        <span className="text-5xl font-bold text-ink tracking-tight">{Math.round(score)}</span>
        <p className="text-[9px] font-semibold text-mute uppercase tracking-[0.25em] mt-1">{label}</p>
      </motion.div>

      {/* Issue dots */}
      {clauses.length > 0 && (
        <div className="absolute -bottom-3 bg-cream border border-white/[0.06] px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <div className="flex -space-x-1.5">
            {clauses.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border border-cream ${
                  c.risk_level === 'HIGH' ? 'bg-risk-high' : c.risk_level === 'MEDIUM' ? 'bg-risk-medium' : 'bg-risk-low'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-mute uppercase tracking-widest">{clauses.length} issues</span>
        </div>
      )}
    </div>
  );
};

export default RiskGauge;