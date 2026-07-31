import React from 'react';
import { motion } from 'motion/react';
import { X, Scale } from 'lucide-react';
import { AnalysisResult } from '../../types';
import { JARGON_EXPLANATIONS } from '../../constants';
import Badge from './Badge';
import Button from './Button';

interface CompareModalProps {
  show: boolean;
  selectedIndices: number[];
  analysis: AnalysisResult | null;
  onClose: () => void;
}

const JargonText: React.FC<{ text: string }> = ({ text }) => {
  const jargonKeys = Object.keys(JARGON_EXPLANATIONS);
  const regex = new RegExp(`(\\b(?:${jargonKeys.join('|')})\\b)`, 'g');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const explanation = JARGON_EXPLANATIONS[part];
        if (explanation) {
          return (
            <span key={i} className="border-b border-dotted border-lime/40 text-lime font-semibold cursor-help">
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const CompareModal: React.FC<CompareModalProps> = ({ show, selectedIndices, analysis, onClose }) => {
  if (!show || !analysis || selectedIndices.length !== 2) return null;

  const clauses = selectedIndices.map(idx => analysis.risks[idx]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-cream/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-white/[0.06] w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/[0.06] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-lime rounded-xl flex items-center justify-center text-cream">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-ink">Side-by-Side View</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid md:grid-cols-2 gap-8">
          {clauses.map((c, idx) => c ? (
            <div key={idx} className="space-y-6">
              <div className="flex justify-between items-start">
                <Badge level={c.risk_level} label={`${c.risk_level} threat`} />
                <span className="text-[9px] font-bold text-mute uppercase">#{selectedIndices[idx] + 1} (Score: {c.riskScore})</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-lime leading-tight">{c.act_reference}</h3>
              <div className="bg-elevated p-5 rounded-2xl italic text-sub border border-white/[0.04] leading-relaxed text-sm font-medium">
                &ldquo;{c.clause_quote}&rdquo;
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-lime/5 rounded-xl border border-lime/10">
                  <h4 className="text-[9px] font-bold text-lime uppercase tracking-widest mb-2">Analysis</h4>
                  <p className="text-sm leading-relaxed text-sub"><JargonText text={c.why_risky} /></p>
                </div>
                <div className="p-4 bg-risk-low-bg rounded-xl border border-risk-low/20">
                  <h4 className="text-[9px] font-bold text-risk-low uppercase tracking-widest mb-2">What to do</h4>
                  <p className="text-sm font-semibold text-ink">{c.what_to_do}</p>
                </div>
              </div>
            </div>
          ) : null)}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompareModal;