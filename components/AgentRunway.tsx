import React from 'react';

type Agent = { id:string; name:string; model:string; status:"idle"|"running"|"done"|"error"; task:string; progress:number; };

const AgentStatusIndicator: React.FC<{ status: Agent['status'] }> = ({ status }) => {
    switch (status) {
        case 'running':
            return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" title="Running"></div>;
        case 'done':
            return <div className="w-3 h-3 rounded-full bg-green-500" title="Done"></div>;
        case 'error':
            return <div className="w-3 h-3 rounded-full bg-red-500" title="Error"></div>;
        case 'idle':
        default:
            return <div className="w-3 h-3 rounded-full bg-slate-600" title="Idle"></div>;
    }
};

const AgentRunway: React.FC<{ agents: Agent[] }> = ({ agents }) => {
    return (
        <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {agents.map((agent, index) => (
                    <React.Fragment key={agent.id}>
                        <div className="flex-shrink-0 w-48 bg-black/30 p-3 rounded-lg text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <AgentStatusIndicator status={agent.status} />
                                <h4 className="font-semibold text-sm text-white truncate">{agent.name}</h4>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                                <div
                                    className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${agent.progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-400 h-4 truncate">{agent.status === 'running' ? `${agent.progress}%` : agent.status}</p>
                        </div>
                        {index < agents.length - 1 && (
                            <div className="w-6 h-px bg-slate-600"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default AgentRunway;
