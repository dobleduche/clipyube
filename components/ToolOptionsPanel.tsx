import React from 'react';
import { ChevronDownIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolOptionsPanelProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  hasPendingChanges?: boolean;
  onApply?: () => void;
  onCancel?: () => void;
}

const MotionDiv = motion.div;

const ToolOptionsPanel: React.FC<ToolOptionsPanelProps> = ({ 
    title, 
    icon, 
    isOpen, 
    onToggle, 
    children, 
    isLoading = false,
    hasPendingChanges,
    onApply,
    onCancel
}) => {
  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
      <button 
        onClick={onToggle} 
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-expanded={isOpen}
        aria-controls={`panel-content-${title.replace(/\s/g, '-')}`}
        disabled={isLoading}
      >
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">{icon}</span>
          <h4 className="text-lg font-semibold text-slate-200">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
            {hasPendingChanges && (
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" title="Unapplied changes"></div>
            )}
            <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
            <MotionDiv
                id={`panel-content-${title.replace(/\s/g, '-')}`}
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="overflow-hidden"
            >
                <div className="p-4 pt-0">
                    {children}
                </div>
                {hasPendingChanges && onApply && onCancel && (
                    <div className="p-4 pt-2 border-t border-white/10 flex justify-end gap-3">
                        <button onClick={onCancel} className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors text-sm">Cancel</button>
                        <button onClick={onApply} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors text-sm">Apply</button>
                    </div>
                )}
            </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolOptionsPanel;
