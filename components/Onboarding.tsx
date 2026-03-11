
import React from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, Zap, Lock, Scale, ArrowRight } from 'lucide-react';
import Button from './Button';

interface OnboardingProps {
  onClose: (dontShowAgain: boolean) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [dontShow, setDontShow] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 sm:p-10">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col sm:flex-row border border-slate-100"
      >
        
        {/* Visual Hero Sidebar */}
        <div className="sm:w-2/5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-12 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Shield className="w-6 h-6 text-blue-300" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-[0.9]">
              Don't Sign <br />
              <span className="text-blue-300">Blindly.</span>
            </h2>
            <p className="text-blue-100/80 text-md font-medium leading-relaxed max-w-[240px]">
              The easiest way to check South African contracts for hidden risks and legal traps.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-16 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 mb-4">
                <Zap className="w-3 h-3" />
                Welcome to ContractCheck
              </div>
              <h4 className="text-4xl font-black text-slate-900 tracking-tight">How it works</h4>
            </div>

            <div className="space-y-10">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-6 group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-lg mb-1 uppercase tracking-tight">Your data is private</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">We don't save your files. Everything is checked privately in your browser using local encryption.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-6 group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-lg mb-1 uppercase tracking-tight">We know SA Law</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">The AI is tuned for South African consumer rights (CPA), privacy rules (POPIA), and labor laws.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-6 group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-lg mb-1 uppercase tracking-tight">Smart Suggestions</h5>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Get clear advice on how to change unfair terms before you sign, with estimated financial exposure.</p>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all" />
                <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-[0.2em]">Don't show this again</span>
              </label>
              
              <Button size="lg" className="w-full sm:w-auto px-12" onClick={() => onClose(dontShow)} icon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
