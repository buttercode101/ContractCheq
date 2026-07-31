import React from 'react';
import { motion } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
import { AnalysisResult } from '../../types';
import { PRE_ANALYZED_SAMPLES } from '../../constants';
import UploadZone from './UploadZone';
import type { ChangeEvent, DragEvent } from 'react';

interface HeroSectionProps {
  isDragging: boolean;
  error: string | null;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: (key: string) => void;
}

const sampleKeys = Object.keys(PRE_ANALYZED_SAMPLES);

const HeroSection: React.FC<HeroSectionProps> = ({
  isDragging, error, onDragOver, onDragLeave, onDrop, onFileSelect, onLoadSample
}) => (
  <motion.div
    key="hero"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="space-y-16 py-10"
  >
    {/* Hero Text */}
    <div className="text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[10px] font-bold text-lime uppercase tracking-widest"
      >
        <Zap className="w-3 h-3" />
        AI-Powered Legal Triage
      </motion.div>
      <h2 className="font-display text-5xl sm:text-7xl md:text-8xl font-semibold text-ink tracking-tighter leading-[0.9] max-w-4xl mx-auto">
        Know your risks <span className="text-lime">before</span> you sign.
      </h2>
      <p className="text-mute max-w-2xl mx-auto text-lg leading-relaxed">
        Spot unfair terms and legal traps in South African leases, job offers, or sales agreements using AI tailored for local law.
      </p>
    </div>

    {/* Upload Zone */}
    <UploadZone
      isDragging={isDragging}
      error={error}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onFileSelect={onFileSelect}
    />

    {/* Demo Cards */}
    <div className="grid md:grid-cols-2 gap-5">
      {sampleKeys.map((key, i) => (
        <motion.button
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          onClick={() => onLoadSample(key)}
          className="card-elevated p-8 text-left hover:border-lime/30 hover:shadow-xl hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-full cursor-pointer"
        >
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
              PRE_ANALYZED_SAMPLES[key].overall_risk === 'HIGH'
                ? 'bg-risk-high-bg text-risk-high border-risk-high/20'
                : 'bg-risk-medium-bg text-risk-medium border-risk-medium/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                PRE_ANALYZED_SAMPLES[key].overall_risk === 'HIGH' ? 'bg-risk-high' : 'bg-risk-medium'
              }`} />
              {key} Demo
            </span>
            <h4 className="font-display text-2xl font-semibold text-ink mt-5 leading-tight">Common {key} Risks</h4>
            <p className="text-mute text-sm mt-3 leading-relaxed">See how ContractCheq identifies problematic clauses in a standard South African {key}.</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-lime font-bold uppercase text-[10px] tracking-widest group-hover:translate-x-1.5 transition-transform">
            View Demo <ArrowRight className="w-3 h-3" />
          </div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default HeroSection;