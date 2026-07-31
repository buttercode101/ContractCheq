import React from 'react';
import { motion } from 'motion/react';
import { Zap, AlertTriangle } from 'lucide-react';
import { HeuristicIssue } from '../../types';

interface LoadingStateProps {
  loadingText: string;
  progress: number;
  heuristicIssues: HeuristicIssue[];
}

const LoadingState: React.FC<LoadingStateProps> = ({ loadingText, progress, heuristicIssues }) => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="py-32 text-center space-y-10"
  >
    {/* Spinner */}
    <div className="relative inline-flex mb-6">
      <div className="w-24 h-24 rounded-[2rem] border-[6px] border-white/[0.04]" />
      <div className="absolute inset-0 w-24 h-24 rounded-[2rem] border-[6px] border-lime border-t-transparent animate-spin" />
    </div>
    <div className="space-y-3">
      <h3 className="font-display text-3xl font-semibold text-ink">{loadingText}</h3>
      <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Our AI is scanning every clause...</p>
    </div>

    {/* Progress bar */}
    <div className="max-w-xs mx-auto h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-lime"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>

    {/* Heuristics */}
    {heuristicIssues.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-4 text-left pt-8"
      >
        <div className="flex items-center gap-2 px-4">
          <Zap className="w-4 h-4 text-risk-medium animate-pulse" />
          <h4 className="font-bold text-mute uppercase tracking-widest text-[9px]">Quick Scan Findings</h4>
        </div>
        <div className="grid gap-3">
          {heuristicIssues.map((issue, idx) => (
            <div key={idx} className="bg-risk-medium-bg border border-risk-medium/20 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 text-risk-medium shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-risk-medium uppercase tracking-tight">Potential {issue.risk_level} Risk</p>
                <p className="text-sm text-sub font-medium italic">&ldquo;{issue.clause}&rdquo;</p>
                <p className="text-xs text-mute">{issue.why_risky}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </motion.div>
);

export default LoadingState;