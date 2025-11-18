import React from 'react';

interface BuildGateProps {
    percent: number;
    onUpgrade: () => void;
    children: React.ReactNode;
    isRedirecting?: boolean;
}

const BuildGate: React.FC<BuildGateProps> = ({ percent, onUpgrade, children, isRedirecting = false }) => {
    const freeTierLimit = 50; // Free tier allows up to 50% progress.

    if (percent < freeTierLimit) {
        return <>{children}</>;
    }

    return (
        <div className="text-center bg-slate-900/40 backdrop-blur-lg border border-amber-400/50 p-8 rounded-2xl shadow-2xl">
            <h3 className="text-2xl font-bold text-amber-400 mb-3">Free Preview Limit Reached</h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
                You've seen the power of the first few agents. To complete the full clip generation process and unlock your video, please upgrade to Pro.
            </p>
            <button
                onClick={onUpgrade}
                disabled={isRedirecting}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
            >
                {isRedirecting ? 'Redirecting...' : 'Upgrade to Unlock Full Video'}
            </button>
        </div>
    );
};

export default BuildGate;
