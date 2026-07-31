import React from 'react';
import { motion } from 'motion/react';
import { X, Lock } from 'lucide-react';
import { SavedAnalysis } from '../../types';
import Button from './Button';

interface VaultModalProps {
  show: boolean;
  savedAnalyses: SavedAnalysis[];
  onClose: () => void;
  onLoad: (item: SavedAnalysis) => void;
  onDelete: (id: number) => void;
}

const VaultModal: React.FC<VaultModalProps> = ({ show, savedAnalyses, onClose, onLoad, onDelete }) => {
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
        className="bg-surface border border-white/[0.06] rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-elevated rounded-xl flex items-center justify-center text-lime">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink">Legal Vault</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Lock className="w-8 h-8 text-mute mx-auto" />
            <p className="text-mute font-bold uppercase tracking-widest text-xs">Your vault is empty</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin">
            {savedAnalyses.map(item => (
              <div key={item.id} className="p-4 bg-elevated rounded-xl border border-white/[0.04] flex justify-between items-center hover:border-white/[0.08] transition-all">
                <div>
                  <p className="text-xs font-semibold text-ink">Analysis from {new Date(item.timestamp).toLocaleDateString()}</p>
                  <p className="text-[9px] text-mute font-bold">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-risk-high hover:bg-risk-high-bg" onClick={() => onDelete(item.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                  <Button size="sm" onClick={() => onLoad(item)}>Load</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default VaultModal;