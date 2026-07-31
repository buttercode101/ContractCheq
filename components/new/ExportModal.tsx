import React from 'react';
import { motion } from 'motion/react';
import { X, Download } from 'lucide-react';
import { ExportOptions } from '../../types';
import Button from './Button';

interface ExportModalProps {
  show: boolean;
  config: ExportOptions;
  onChange: (c: ExportOptions) => void;
  onExport: () => void;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ show, config, onChange, onExport, onClose }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-cream/80 backdrop-blur-md flex items-center justify-center p-4"
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
            <Download className="w-5 h-5" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-ink">Export Analysis</h3>
        </div>

        <div className="space-y-5 mb-8">
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-mute uppercase tracking-widest">Report Format</p>
            <div className="grid grid-cols-2 gap-2">
              {(['summary', 'full-annotated'] as const).map(mode => (
                <button key={mode}
                  onClick={() => onChange({ ...config, mode })}
                  className={`p-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                    config.mode === mode
                      ? 'bg-lime text-cream border-lime shadow-lg'
                      : 'bg-elevated text-mute border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  {mode === 'summary' ? 'Summary Only' : 'Full Annotated'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'includeRecommendations' as const, label: 'Include Solutions' },
              { key: 'includeNotes' as const, label: 'Include My Notes' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer p-3 bg-elevated rounded-xl hover:bg-white/[0.04] transition-colors">
                <span className="text-[9px] font-bold text-mute uppercase">{label}</span>
                <input type="checkbox" checked={config[key]}
                  onChange={e => onChange({ ...config, [key]: e.target.checked })}
                  className="w-5 h-5 rounded border-white/[0.12] bg-surface text-lime focus:ring-lime" />
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 shadow-lg shadow-lime/20" onClick={onExport}>Save File</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExportModal;