import React from 'react';
import { RiskLevel, FlaggedClause } from '../types';
import { motion } from 'motion/react';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  label: string;
  clauses?: FlaggedClause[];
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, label, clauses = [] }) => {
  const rotation = (score / 100) * 180 - 90;
  
  const colors = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#10b981'
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner w-full max-w-sm mx-auto">
      <div className="relative w-64 h-36 overflow-hidden">
        {/* Background Track */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="8" 
            strokeLinecap="round"
          />
          {/* Gradient Track */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <motion.path 
            initial={{ strokeDasharray: "0, 200" }}
            animate={{ strokeDasharray: `${(score / 100) * 126}, 200` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="url(#gaugeGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
          />
        </svg>

        {/* Needle */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-1 h-28 -ml-0.5 origin-bottom z-10"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="w-full h-full bg-slate-900 rounded-full shadow-lg relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rounded-full shadow-xl"></div>
          </div>
        </motion.div>
        
        {/* Center Point */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-4 border-slate-900 rounded-full z-20 shadow-lg"></div>
      </div>

      <div className="mt-6 text-center space-y-1">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-6xl font-black text-slate-900 tracking-tighter"
        >
          {Math.round(score)}
        </motion.div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</div>
      </div>

      <div className="absolute -bottom-4 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-lg flex items-center gap-3">
        <div className="flex -space-x-2">
          {clauses.slice(0, 3).map((clause, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 border-white ${clause.risk_level === 'HIGH' ? 'bg-red-500' : clause.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          ))}
        </div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{clauses.length} Issues Found</span>
      </div>
    </div>
  );
};

export default RiskGauge;
