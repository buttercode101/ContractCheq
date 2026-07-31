import React from 'react';
import { motion } from 'motion/react';
import { X, Settings } from 'lucide-react';
import { RiskThresholds } from '../../types';
import Button from './Button';

interface SettingsModalProps {
  show: boolean;
  thresholds: RiskThresholds;
  onChange: (t: RiskThresholds) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ show, thresholds, onChange, onClose }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-cream/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-white/[0.06] rounded-[2.5rem] shadow-2xl max-w-md w-full p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-elevated rounded-xl flex items-center justify-center text-lime">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-ink">Risk Thresholds</h3>
        </div>
        <p className="text-mute text-sm mb-8 font-medium italic">Customize how risk levels are assigned based on the AI's 0-100 score.</p>

        <div className="space-y-8 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-mute uppercase tracking-widest">Low Risk Max</p>
              <span className="px-2.5 py-1 bg-risk-low-bg text-risk-low rounded-full text-[9px] font-bold">{thresholds.lowMax}</span>
            </div>
            <input type="range" min={10} max={50} step={5} value={thresholds.lowMax}
              onChange={e => onChange({ ...thresholds, lowMax: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-lime" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-mute uppercase tracking-widest">Medium Risk Max</p>
              <span className="px-2.5 py-1 bg-risk-medium-bg text-risk-medium rounded-full text-[9px] font-bold">{thresholds.mediumMax}</span>
            </div>
            <input type="range" min={55} max={90} step={5} value={thresholds.mediumMax}
              onChange={e => onChange({ ...thresholds, mediumMax: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-lime" />
          </div>
        </div>

        <Button className="w-full" onClick={onClose}>Apply Changes</Button>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;