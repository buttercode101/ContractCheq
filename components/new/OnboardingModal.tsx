import React from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, Zap, Lock, Scale, ArrowRight } from 'lucide-react';
import Button from './Button';

interface OnboardingModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [dontShow, setDontShow] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-cream/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-surface border border-white/[0.06] rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col sm:flex-row"
      >
        {/* Left panel */}
        <div className="sm:w-[35%] bg-gradient-to-br from-lime/20 via-lime/10 to-cream p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-lime/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime/5 rounded-full -ml-24 -mb-24 blur-3xl" />
          <div className="relative space-y-5">
            <div className="w-10 h-10 bg-lime/10 backdrop-blur rounded-xl flex items-center justify-center border border-lime/10">
              <Shield className="w-5 h-5 text-lime" />
            </div>
            <h2 className="font-display text-4xl font-semibold text-ink leading-[0.9]">
              Don't Sign<br />
              <span className="text-lime">Blindly.</span>
            </h2>
            <p className="text-mute text-sm leading-relaxed max-w-[200px]">
              The easiest way to check SA contracts for hidden risks.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 p-8 sm:p-10 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime/10 text-lime rounded-full text-[9px] font-bold uppercase tracking-widest border border-lime/10 mb-4">
              <Zap className="w-3 h-3" />
              Welcome to ContractCheq
            </div>
            <h4 className="font-display text-3xl font-semibold text-ink mb-8">How it works</h4>

            <div className="space-y-8">
              {[
                { icon: Lock, title: 'Your data is private', desc: 'Everything is checked in your browser using local encryption. No server storage.' },
                { icon: Scale, title: 'We know SA Law', desc: 'The AI is tuned for South African consumer rights (CPA), privacy rules (POPIA), and labor laws.' },
                { icon: CheckCircle2, title: 'Smart Suggestions', desc: 'Get clear advice on how to change unfair terms before you sign, with estimated financial exposure.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-elevated border border-white/[0.04] flex items-center justify-center text-mute group-hover:bg-lime/10 group-hover:text-lime transition-all duration-300">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-ink text-sm mb-0.5">{item.title}</h5>
                    <p className="text-mute text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)}
                  className="w-5 h-5 rounded border-white/[0.12] bg-surface text-lime focus:ring-lime transition-all" />
                <span className="text-[9px] font-bold text-mute group-hover:text-ink transition-colors uppercase tracking-[0.15em]">
                  Don't show again
                </span>
              </label>
              <Button size="lg" className="w-full sm:w-auto px-10" onClick={() => onClose(dontShow)}>
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;