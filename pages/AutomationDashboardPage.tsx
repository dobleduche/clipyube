
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAppContext } from '../context/AppContext';
import { RocketIcon, PlayIcon, StopIcon, TrendingUpIcon, DocumentTextIcon, LockIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import { getAutomationStatusRequest, getAutomationLogsRequest, startAutomationRequest, stopAutomationRequest } from '../api/client';

const MotionDiv = motion.div;

type PipelineStatusValue = 'pending' | 'active' | 'complete';
type AutomationLog = { timestamp: string; message: string; type: 'info' | 'success' | 'error' };

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
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${statusClasses[status]}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{name}</span>
    </MotionDiv>
  );
};


const AutomationDashboardPage: React.FC = () => {
    const { settings } = useSettings();
    const { openUpgradeModal } = useAppContext();
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [isLoading, setIsLoading] = useState(false); // For button clicks
    const [error, setError] = useState<string | null>(null);
    
    const isFreeTier = settings.userTier === 'free';

    const fetchStatus = useCallback(async () => {
        if (isFreeTier) return; // Don't fetch if locked
        try {
            const [statusRes, logsRes] = await Promise.all([
                getAutomationStatusRequest(),
                getAutomationLogsRequest(),
            ]);
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setIsRunning(statusData.isRunning);
            }
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData);
            }
        } catch (e) {
            setError("Failed to connect to the automation engine. Is the server running?");
        }
    }, [isFreeTier]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleStart = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await startAutomationRequest();
            if (!res.ok) throw new Error(await res.json().then(d => d.error));
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start automation');
        }
        setIsLoading(false);
    };

    const handleStop = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await stopAutomationRequest();
            if (!res.ok) throw new Error(await res.json().then(d => d.error));
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to stop automation');
        }
        setIsLoading(false);
    };

    const getLogColorClass = (type: 'info' | 'success' | 'error') => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const pipelineStatus = useMemo<{
        discovery: PipelineStatusValue;
        drafting: PipelineStatusValue;
        ready: PipelineStatusValue;
    }>(() => {
        if (!isRunning || logs.length === 0) {
            return { discovery: 'pending', drafting: 'pending', ready: 'pending' };
        }
        const hasFoundIdea = logs.some(log => log.message.includes("Found new items"));
        const hasGeneratedPost = logs.some(log => log.message.includes("Successfully created draft"));
        const hasFinished = logs.some(log => log.message.includes("Successfully published")); // Assuming publish step exists

        if (hasFinished) {
            return { discovery: 'complete', drafting: 'complete', ready: 'complete' };
        }
        if (hasGeneratedPost) {
            return { discovery: 'complete', drafting: 'complete', ready: 'active' }; // Ready to publish
        }
        if (hasFoundIdea) {
            return { discovery: 'complete', drafting: 'active', ready: 'pending' };
        }
        return { discovery: 'active', drafting: 'pending', ready: 'pending' };
    }, [logs, isRunning]);
    
    return (
        <div className="max-w-4xl mx-auto py-8 relative">
            {/* Visual Lock Overlay */}
            {isFreeTier && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-3xl border border-white/5">
                    <div className="text-center p-8">
                        <LockIcon className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2 font-oswald">Pro Feature Locked</h3>
                        <p className="text-slate-300 mb-6 max-w-md">
                            The Automation Dashboard allows you to run the Viral Agent 24/7. Upgrade to Pro to unlock this powerful tool.
                        </p>
                        <button 
                            onClick={openUpgradeModal}
                            className="bg-gradient-to-r from-amber-400 to-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:from-amber-500 hover:to-orange-700 transition-all transform hover:scale-105"
                        >
                            Unlock Now
                        </button>
                    </div>
                </div>
            )}
        
            <div className={`text-center mb-12 ${isFreeTier ? 'opacity-30 grayscale' : ''}`}>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
                    Automation Dashboard
                </h2>
                <p className="text-lg text-slate-400">
                    Monitor and control your AI-powered content engine.
                </p>
            </div>

            <div className={`transition-all duration-500 ${isFreeTier ? 'opacity-30 grayscale pointer-events-none blur-sm select-none' : ''}`}>
                <AnimatePresence>
                    {isRunning && (
                         <MotionDiv 
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
                        </MotionDiv>
                    )}
                </AnimatePresence>
                
                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <RocketIcon />
                            <div>
                                <h3 className="text-xl font-bold text-white">Content Engine Status</h3>
                                <p className={`font-semibold ${isRunning ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {isRunning ? 'Running' : 'Stopped'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleStart} 
                                disabled={isRunning || isLoading}
                                className="flex items-center gap-2 bg-green-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading && !isRunning ? <Loader /> : <PlayIcon />} Start
                            </button>
                            <button 
                                onClick={handleStop} 
                                disabled={!isRunning || isLoading}
                                className="flex items-center gap-2 bg-red-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            >
                                 {isLoading && isRunning ? <Loader /> : <StopIcon />} Stop
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    {isRunning && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-slate-300 text-center">
                            <p>The engine is running for the niche "<strong className="text-cyan-400">{settings.defaultNiche}</strong>" and will check for new content ideas every <strong className="text-cyan-400">{settings.automationInterval / 60000} minutes</strong>.</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
                     <h3 className="text-2xl font-bold text-white mb-4 font-oswald">Activity Log</h3>
                     <div className="h-96 overflow-y-auto bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2 flex flex-col-reverse">
                        {logs.length > 0 ? logs.map((log, index) => (
                            <p key={index} className="whitespace-pre-wrap">
                                <span className="text-slate-500 mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={getLogColorClass(log.type)}>{log.message}</span>
                            </p>
                        )) : (
                            <p className="text-slate-500">No activity yet. Start the engine to see logs.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};


export default AutomationDashboardPage;
