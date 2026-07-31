import React, { useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Lock, Download, FileText, Signature, Stamp, PenTool, CheckCircle2, Info, Search, Scale, BookOpen } from 'lucide-react';
import { AnalysisResult, RiskLevel, RiskThresholds } from '../../types';
import { JARGON_EXPLANATIONS } from '../../constants';
import RiskGauge from './RiskGauge';
import ClauseCard from './ClauseCard';
import DocumentViewer from './DocumentViewer';
import Badge from './Badge';
import Button from './Button';

interface ResultsDashboardProps {
  analysis: AnalysisResult;
  rawText: string;
  thresholds: RiskThresholds;
  selectedIndices: number[];
  hoveredIndex: number | null;
  activeHighlight: number | null;
  privateNotes: Record<number, string>;
  onReset: () => void;
  onSaveToVault: () => void;
  onExportOpen: () => void;
  onToggleSelect: (idx: number) => void;
  onHover: (idx: number | null) => void;
  onScrollTo: (idx: number) => void;
  onNoteChange: (idx: number, note: string) => void;
  onCompareOpen: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis, rawText, thresholds, selectedIndices, hoveredIndex, activeHighlight,
  privateNotes, onReset, onSaveToVault, onExportOpen,
  onToggleSelect, onHover, onScrollTo, onNoteChange, onCompareOpen
}) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const adjustedAnalysis = useMemo(() => {
    const getLevel = (score: number): RiskLevel => {
      if (score <= thresholds.lowMax) return 'LOW';
      if (score <= thresholds.mediumMax) return 'MEDIUM';
      return 'HIGH';
    };

    return {
      ...analysis,
      overall_risk: getLevel(analysis.overallRiskScore),
      risks: analysis.risks.map(r => ({
        ...r,
        risk_level: getLevel(r.riskScore)
      }))
    };
  }, [analysis, thresholds]);

  // Recalculate card refs
  const setCardRef = (idx: number) => (el: HTMLDivElement | null) => { cardRefs.current[idx] = el; };

  const handleScrollTo = (idx: number) => {
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Action Bar */}
      <div className="glass-panel p-3 rounded-2xl flex flex-wrap justify-between items-center gap-3 sticky top-20 z-30">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <ArrowRight className="w-4 h-4 mr-1.5 rotate-180" /> New Analysis
        </Button>
        <div className="flex gap-2">
          {selectedIndices.length === 2 && (
            <Button size="sm" onClick={onCompareOpen} className="animate-pulse">
              Compare Selected ({selectedIndices.length})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onSaveToVault}>
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Save to Vault
          </Button>
          <Button size="sm" variant="outline" onClick={onExportOpen}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface p-8 flex flex-col md:flex-row gap-8 items-center"
          >
            <RiskGauge score={adjustedAnalysis.overallRiskScore} level={adjustedAnalysis.overall_risk}
              label={`${adjustedAnalysis.overall_risk} risk`} clauses={adjustedAnalysis.risks} />
            <div className="space-y-4 flex-1 text-center md:text-left">
              <h3 className="font-display text-3xl font-semibold text-ink">AI Audit Result</h3>

              {/* Metadata badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {adjustedAnalysis.document_type && (
                  <span className="px-3 py-1.5 bg-lime/5 border border-lime/10 rounded-lg flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-lime" />
                    <span className="text-[9px] font-bold text-lime uppercase">{adjustedAnalysis.document_type}</span>
                  </span>
                )}
                {adjustedAnalysis.signatures_detected && (
                  <span className="px-3 py-1.5 bg-risk-low-bg border border-risk-low/20 rounded-lg flex items-center gap-1.5">
                    <Signature className="w-3 h-3 text-risk-low" />
                    <span className="text-[9px] font-bold text-risk-low uppercase">Signatures</span>
                  </span>
                )}
                {adjustedAnalysis.stamps_detected && (
                  <span className="px-3 py-1.5 bg-lime/5 border border-lime/10 rounded-lg flex items-center gap-1.5">
                    <Stamp className="w-3 h-3 text-lime" />
                    <span className="text-[9px] font-bold text-lime uppercase">Stamps</span>
                  </span>
                )}
                {adjustedAnalysis.handwriting_detected && (
                  <span className="px-3 py-1.5 bg-risk-medium-bg border border-risk-medium/20 rounded-lg flex items-center gap-1.5">
                    <PenTool className="w-3 h-3 text-risk-medium" />
                    <span className="text-[9px] font-bold text-risk-medium uppercase">Handwriting</span>
                  </span>
                )}
              </div>

              <p className="text-sub leading-relaxed font-medium">{adjustedAnalysis.overall_summary}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="px-5 py-3 bg-elevated rounded-xl border border-white/[0.06]">
                  <p className="text-[8px] font-bold text-lime uppercase tracking-widest mb-0.5">Financial Exposure (Est)</p>
                  <p className="text-lg font-bold text-ink">
                    R{(adjustedAnalysis.financial_exposure_estimate.low ?? 0).toLocaleString()} – R{(adjustedAnalysis.financial_exposure_estimate.high ?? 0).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-2 bg-lime/5 rounded-xl text-[9px] font-bold text-lime uppercase tracking-widest border border-lime/10 flex items-center gap-1.5 self-center">
                  <CheckCircle2 className="w-3 h-3" /> POPIA Verified
                </span>
              </div>
            </div>
          </motion.div>

          {/* Flagged Clauses */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-bold text-mute uppercase tracking-widest text-[9px]">Flagged Issues</h4>
              <span className="text-[9px] font-bold text-mute uppercase tracking-widest">Select two to compare</span>
            </div>
            {adjustedAnalysis.risks.map((clause, idx) => (
              <div key={idx} ref={setCardRef(idx)}>
                <ClauseCard
                  clause={clause}
                  index={idx}
                  isSelected={selectedIndices.includes(idx)}
                  isHovered={hoveredIndex === idx}
                  isHighlighted={activeHighlight === idx}
                  privateNote={privateNotes[idx] || ''}
                  onToggleSelect={() => onToggleSelect(idx)}
                  onHover={onHover}
                  onNoteChange={(note) => onNoteChange(idx, note)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-6 sticky top-28">
          <DocumentViewer
            text={rawText}
            clauses={adjustedAnalysis.risks}
            hoveredIndex={hoveredIndex}
            onHover={onHover}
            onScrollTo={handleScrollTo}
          />

          <div className="card-elevated p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-full -mr-16 -mt-16" />
            <h5 className="text-[9px] font-bold text-lime uppercase tracking-[0.2em] mb-5 relative z-10">SA Law Knowledge Base</h5>
            <div className="grid gap-2 relative z-10">
              {Object.keys(JARGON_EXPLANATIONS).map(key => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-help border border-white/[0.03]">
                  <div className="w-7 h-7 rounded-lg bg-lime/10 flex items-center justify-center text-[9px] font-bold text-lime">{key[0]}</div>
                  <div className="text-[9px] font-semibold text-mute uppercase tracking-widest">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsDashboard;