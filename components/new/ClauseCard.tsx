import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Scale, CheckCircle2, Info, FileText, AlertTriangle } from 'lucide-react';
import { FlaggedClause } from '../../types';
import { JARGON_EXPLANATIONS } from '../../constants';
import Badge from './Badge';

interface ClauseCardProps {
  clause: FlaggedClause;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  privateNote: string;
  onToggleSelect: () => void;
  onHover: (idx: number | null) => void;
  onNoteChange: (note: string) => void;
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
            <span key={i} className="relative group cursor-help border-b border-dotted border-lime/40 text-lime font-semibold">
              {part}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-elevated border border-white/[0.08] text-ink text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl leading-relaxed scale-95 group-hover:scale-100 origin-bottom backdrop-blur-xl">
                <span className="block font-bold mb-1 border-b border-white/[0.06] pb-1 text-lime uppercase tracking-widest text-[9px]">{part}</span>
                {explanation}
              </span>
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const ClauseCard: React.FC<ClauseCardProps> = ({
  clause, index, isSelected, isHovered, isHighlighted, privateNote,
  onToggleSelect, onHover, onNoteChange
}) => {
  const riskColors = {
    HIGH: 'bg-risk-high',
    MEDIUM: 'bg-risk-medium',
    LOW: 'bg-risk-low',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`card-elevated overflow-hidden transition-all duration-300 ${
        isSelected ? 'ring-2 ring-lime shadow-xl scale-[1.01]' : ''
      } ${isHighlighted ? 'ring-2 ring-lime ring-offset-2 ring-offset-cream scale-[1.015]' : ''}`}
    >
      {/* Color bar */}
      <div className={`h-2 w-full ${riskColors[clause.risk_level]}`} />

      <div className="p-6 md:p-8 space-y-6">
        {/* Top row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Badge level={clause.risk_level} label={`${clause.risk_level} threat`} />
            <button
              onClick={onToggleSelect}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                isSelected ? 'bg-lime border-lime text-cream' : 'border-white/[0.12] text-transparent hover:border-lime/50'
              }`}
              title="Select for comparison"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[9px] font-bold text-mute uppercase whitespace-nowrap tabular-nums">
            Score: {clause.riskScore}/100
          </span>
        </div>

        {/* Act reference */}
        <h4 className="font-display text-xl font-semibold text-ink leading-tight">{clause.act_reference}</h4>

        {/* Clause quote */}
        <div className="bg-surface border border-white/[0.04] rounded-2xl p-5 italic text-sub leading-relaxed text-sm font-medium">
          &ldquo;{clause.clause_quote}&rdquo;
        </div>

        {/* Analysis + Recommendation */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-[9px] font-bold text-mute uppercase tracking-widest flex items-center gap-1.5">
              <Search className="w-3 h-3" /> Risk Analysis
            </h5>
            <p className="text-sm text-sub leading-relaxed"><JargonText text={clause.why_risky} /></p>
          </div>
          <div className="space-y-3">
            <h5 className="text-[9px] font-bold text-lime uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-3 h-3" /> Recommendation
            </h5>
            <div className="p-4 bg-lime/5 rounded-xl border border-lime/10 text-ink text-sm font-semibold leading-relaxed">
              {clause.what_to_do}
            </div>
          </div>
        </div>

        {/* Financial exposure */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.04]">
          <span className="text-[9px] font-bold text-mute uppercase tracking-widest">Exposure</span>
          <span className="text-[10px] font-semibold text-sub italic flex items-center gap-1.5">
            <Info className="w-3 h-3 text-mute" />
            {clause.financial_exposure.description}
          </span>
        </div>

        {/* Private annotation */}
        <div className="pt-4 border-t border-white/[0.04] space-y-3">
          <h5 className="text-[9px] font-bold text-lime uppercase tracking-widest flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Private Note
          </h5>
          <textarea
            value={privateNote || ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Type your notes here... (Stored locally on your device)"
            className="w-full bg-surface border border-white/[0.06] rounded-xl p-4 text-sm font-medium text-sub focus:border-lime/40 focus:ring-1 focus:ring-lime/20 outline-none transition-all placeholder:text-mute/50 resize-none"
            rows={2}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ClauseCard;