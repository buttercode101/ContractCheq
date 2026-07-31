import React from 'react';
import { Shield, Lock, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Language } from '../../types';
import Button from './Button';

interface HeaderProps {
  lang: Language;
  onLangChange: (l: Language) => void;
  onVaultOpen: () => void;
  onSettingsOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ lang, onLangChange, onVaultOpen, onSettingsOpen }) => {
  const languages: Language[] = ['en', 'af', 'zu'];
  const labels: Record<Language, string> = { en: 'EN', af: 'AF', zu: 'ZU' };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-white/[0.06]">
      <div className="shell flex items-center justify-between h-16">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-lime rounded-xl flex items-center justify-center text-cream shadow-lg shadow-lime/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink leading-none">ContractCheq</h1>
            <span className="text-[8px] font-black text-lime uppercase tracking-[0.2em]">South Africa</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onVaultOpen} title="Legal Vault" className="rounded-xl">
            <Lock className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSettingsOpen} title="Risk Thresholds" className="rounded-xl">
            <Settings className="w-4 h-4" />
          </Button>
          <div className="h-5 w-px bg-white/[0.06] mx-1" />
          <div className="flex bg-surface p-0.5 rounded-xl border border-white/[0.06]">
            {languages.map(l => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  lang === l
                    ? 'bg-lime text-cream shadow-sm scale-105'
                    : 'text-mute hover:text-ink'
                }`}
              >
                {labels[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;