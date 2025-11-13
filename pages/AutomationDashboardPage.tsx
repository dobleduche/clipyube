import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { RocketIcon, PlayIcon, StopIcon, TrendingUpIcon, DocumentTextIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

// FIX: Define a type for pipeline status values to be reused.
type PipelineStatusValue = 'pending' | 'active' | 'complete';

// Pipeline Stage Component
const PipelineStage: React.FC<{
  name: string;
  status: PipelineStatusValue;
  icon: React.ReactNode;
}> = ({ name, status, icon }) => {
  const statusClasses = {
    pending: 'bg-slate-700/50 text-slate-400',
    active: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500 animate-pulse',
    complete: 'bg-green-500/20 text-green-300 ring-1 ring-green-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${statusClasses[status]}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{name}</span>
    </motion.div>
  );
};


const AutomationDashboardPage: React.FC = () => {
    const { isAutomationRunning, startAutomation, stopAutomation, automationLogs } = useAppContext();
    const { settings } = useSettings();

    const handleStart = () => {
        startAutomation(settings.automationInterval, settings.defaultNiche);
    };

    const getLogColorClass = (type: 'info' | 'success' | 'error') => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    // FIX: Explicitly type the return value of useMemo to prevent TypeScript from widening the status types to 'string'.
    const pipelineStatus = useMemo<{
        discovery: PipelineStatusValue;
        drafting: PipelineStatusValue;
        ready: PipelineStatusValue;
    }>(() => {
        if (!isAutomationRunning || automationLogs.length === 0) {
            return { discovery: 'pending', drafting: 'pending', ready: 'pending' };
        }
        const hasFoundIdea = automationLogs.some(log => log.message.includes("Found new idea"));
        const hasGeneratedPost = automationLogs.some(log => log.message.includes("Successfully generated blog post"));

        if (hasGeneratedPost) {
            return { discovery: 'complete', drafting: 'complete', ready: 'complete' };
        }
        if (hasFoundIdea) {
            return { discovery: 'complete', drafting: 'active', ready: 'pending' };
        }
        // If it's running but hasn't found an idea yet.
        return { discovery: 'active', drafting: 'pending', ready: 'pending' };
    }, [automationLogs, isAutomationRunning]);
    
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
                    Automation Dashboard
                </h2>
                <p className="text-lg text-slate-400">
                    Monitor and control your AI-powered content engine.
                </p>
            </div>

            <AnimatePresence>
                {isAutomationRunning && (
                     <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg mb-8"
                    >
                        <h3 className="text-xl font-bold text-white mb-6 text-center">Live Pipeline Status</h3>
                        <div className="flex items-start justify-around">
                            <PipelineStage name="Discovery" status={pipelineStatus.discovery} icon={<TrendingUpIcon />} />
                            <div className={`flex-grow h-1 rounded-full mt-8 mx-4 transition-colors duration-500 ${pipelineStatus.drafting !== 'pending' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                            <PipelineStage name="Drafting" status={pipelineStatus.drafting} icon={<DocumentTextIcon />} />
                            <div className={`flex-grow h-1 rounded-full mt-8 mx-4 transition-colors duration-500 ${pipelineStatus.ready !== 'pending' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                             <PipelineStage name="Ready" status={pipelineStatus.ready} icon={<RocketIcon />} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <RocketIcon />
                        <div>
                            <h3 className="text-xl font-bold text-white">Content Engine Status</h3>
                            <p className={`font-semibold ${isAutomationRunning ? 'text-green-400' : 'text-yellow-400'}`}>
                                {isAutomationRunning ? 'Running' : 'Stopped'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleStart} 
                            disabled={isAutomationRunning}
                            className="flex items-center gap-2 bg-green-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <PlayIcon /> Start
                        </button>
                        <button 
                            onClick={stopAutomation} 
                            disabled={!isAutomationRunning}
                            className="flex items-center gap-2 bg-red-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <StopIcon /> Stop
                        </button>
                    </div>
                </div>
                 {isAutomationRunning && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-slate-300 text-center">
                        <p>The engine is running for the niche "<strong className="text-cyan-400">{settings.defaultNiche}</strong>" and will check for new content ideas every <strong className="text-cyan-400">{settings.automationInterval / 60000} minutes</strong>.</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                 <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Activity Log</h3>
                 <div className="h-96 overflow-y-auto bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2 flex flex-col-reverse">
                    {automationLogs.length > 0 ? automationLogs.map((log, index) => (
                        <p key={index} className="whitespace-pre-wrap">
                            <span className="text-slate-500 mr-2">{log.timestamp}</span>
                            <span className={getLogColorClass(log.type)}>{log.message}</span>
                        </p>
                    )) : (
                        <p className="text-slate-500">No activity yet. Start the engine to see logs.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};


export default AutomationDashboardPage;