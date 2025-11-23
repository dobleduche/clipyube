
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparkleIcon, RocketIcon, SupportIcon } from './Icons';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-slate-900 border border-amber-500/30 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.2)]"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <XIcon />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 mb-4 shadow-lg">
                <SparkleIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 font-oswald">Unlock Pro Power</h2>
              <p className="text-slate-400">Upgrade to Clip-Yube Pro to access advanced tools and unlimited creativity.</p>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="p-2 bg-cyan-500/20 rounded-full text-cyan-400"><RocketIcon className="w-5 h-5"/></div>
                    <div>
                        <h4 className="font-bold text-white">Automated Content Engine</h4>
                        <p className="text-sm text-slate-400">Run your Viral Agent 24/7 on autopilot.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="p-2 bg-purple-500/20 rounded-full text-purple-400"><SupportIcon className="w-5 h-5"/></div>
                    <div>
                        <h4 className="font-bold text-white">Priority Support</h4>
                        <p className="text-sm text-slate-400">Direct line to our engineering team via Live Chat.</p>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => { alert('Redirecting to Stripe...'); onClose(); }}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-600 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
            >
                Upgrade Now - $19/mo
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">Cancel anytime. No questions asked.</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
