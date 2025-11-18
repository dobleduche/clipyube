import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSettings } from "../context/SettingsContext";
import {
  RocketIcon,
  PlayIcon,
  StopIcon,
  TrendingUpIcon,
  DocumentTextIcon,
} from "../components/Icons";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../components/Loader";
import {
  getAutomationStatusRequest,
  getAutomationLogsRequest,
  startAutomationRequest,
  stopAutomationRequest,
} from "../api/client";

const MotionDiv = motion.div;

type PipelineStatusValue = "pending" | "active" | "complete";

type AutomationLog = {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
};

// Pipeline Stage Component
const PipelineStage: React.FC<{
  name: string;
  status: PipelineStatusValue;
  icon: React.ReactNode;
}> = ({ name, status, icon }) => {
  const statusClasses: Record<PipelineStatusValue, string> = {
    pending: "bg-slate-700/50 text-slate-400",
    active:
      "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500 animate-pulse",
    complete: "bg-green-500/20 text-green-300 ring-1 ring-green-500",
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${statusClasses[status]}`}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold">{name}</span>
    </MotionDiv>
  );
};

const AutomationDashboardPage: React.FC = () => {
  const { settings } = useSettings();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For button clicks
  const [error, setError] = useState<string | null>(null);

  const getLogColorClass = useCallback(
    (type: AutomationLog["type"]) => {
      switch (type) {
        case "success":
          return "text-green-400";
        case "error":
          return "text-red-400";
        default:
          return "text-slate-400";
      }
    },
    []
  );

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        getAutomationStatusRequest(),
        getAutomationLogsRequest(),
      ]);

      if (statusRes.ok) {
        try {
          const statusData = await statusRes.json();
          setIsRunning(Boolean(statusData.isRunning));
        } catch (e) {
          console.warn("Failed to parse status response JSON:", e);
        }
      }

      if (logsRes.ok) {
        try {
          const logsData = (await logsRes.json()) as AutomationLog[];
          setLogs(Array.isArray(logsData) ? logsData : []);
        } catch (e) {
          console.warn("Failed to parse logs response JSON:", e);
        }
      }
    } catch (e) {
      console.error("Status fetch failed:", e);
      setError(
        "Failed to connect to the automation engine. Is the server running?"
      );
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const extractErrorMessage = async (res: Response) => {
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        return data.error;
      }
    } catch {
      // ignore JSON parse errors, fall through to default
    }
    return "Request failed. Please try again.";
  };

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await startAutomationRequest();
      if (!res.ok) {
        const msg = await extractErrorMessage(res);
        throw new Error(msg);
      }
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start automation");
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const handleStop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await stopAutomationRequest();
      if (!res.ok) {
        const msg = await extractErrorMessage(res);
        throw new Error(msg);
      }
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop automation");
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  const pipelineStatus = useMemo<{
    discovery: PipelineStatusValue;
    drafting: PipelineStatusValue;
    ready: PipelineStatusValue;
  }>(() => {
    if (!isRunning || logs.length === 0) {
      return {
        discovery: "pending",
        drafting: "pending",
        ready: "pending",
      };
    }

    const hasFoundIdea = logs.some((log) =>
      log.message.includes("Found new items")
    );
    const hasGeneratedPost = logs.some((log) =>
      log.message.includes("Successfully created draft")
    );
    const hasFinished = logs.some((log) =>
      log.message.includes("Successfully published")
    ); // Assuming publish step exists

    if (hasFinished) {
      return {
        discovery: "complete",
        drafting: "complete",
        ready: "complete",
      };
    }
    if (hasGeneratedPost) {
      return {
        discovery: "complete",
        drafting: "complete",
        ready: "active", // Ready to publish
      };
    }
    if (hasFoundIdea) {
      return {
        discovery: "complete",
        drafting: "active",
        ready: "pending",
      };
    }
    return {
      discovery: "active",
      drafting: "pending",
      ready: "pending",
    };
  }, [logs, isRunning]);

  const intervalMinutes =
    typeof settings.automationInterval === "number"
      ? settings.automationInterval / 60000
      : 15; // fallback

  // 🔢 Metrics derived from logs
  const metrics = useMemo(() => {
    if (!logs.length) {
      return {
        ideasToday: 0,
        draftsGenerated: 0,
        postsPublished: 0,
        errors24h: 0,
      };
    }

    const now = new Date();
    const todayString = now.toDateString();
    const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;

    let ideasToday = 0;
    let draftsGenerated = 0;
    let postsPublished = 0;
    let errors24h = 0;

    for (const log of logs) {
      const ts = new Date(log.timestamp);
      const tsTime = ts.getTime();
      const isToday = ts.toDateString() === todayString;

      if (isToday && log.message.includes("Found new items")) {
        ideasToday += 1;
      }
      if (log.message.includes("Successfully created draft")) {
        draftsGenerated += 1;
      }
      if (log.message.includes("Successfully published")) {
        postsPublished += 1;
      }
      if (log.type === "error" && tsTime >= dayAgo) {
        errors24h += 1;
      }
    }

    return { ideasToday, draftsGenerated, postsPublished, errors24h };
  }, [logs]);

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
        {isRunning && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Live Pipeline Status
            </h3>
            <div className="flex items-start justify-around">
              <PipelineStage
                name="Discovery"
                status={pipelineStatus.discovery}
                icon={<TrendingUpIcon />}
              />
              <div
                className={`flex-grow h-1 rounded-full mt-8 mx-4 transition-colors duration-500 ${
                  pipelineStatus.drafting !== "pending"
                    ? "bg-green-500"
                    : "bg-slate-700"
                }`}
              />
              <PipelineStage
                name="Drafting"
                status={pipelineStatus.drafting}
                icon={<DocumentTextIcon />}
              />
              <div
                className={`flex-grow h-1 rounded-full mt-8 mx-4 transition-colors duration-500 ${
                  pipelineStatus.ready !== "pending"
                    ? "bg-green-500"
                    : "bg-slate-700"
                }`}
              />
              <PipelineStage
                name="Ready"
                status={pipelineStatus.ready}
                icon={<RocketIcon />}
              />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <RocketIcon />
            <div>
              <h3 className="text-xl font-bold text-white">
                Content Engine Status
              </h3>
              <p
                className={`font-semibold ${
                  isRunning ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {isRunning ? "Running" : "Stopped"}
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

        {error && (
          <p className="text-red-400 text-center mt-4">{error}</p>
        )}

        {isRunning && (
          <div className="mt-4 pt-4 border-t border-white/10 text-sm text-slate-300 text-center">
            <p>
              The engine is running for the niche{" "}
              <strong className="text-cyan-400">
                {settings.defaultNiche}
              </strong>{" "}
              and will check for new content ideas every{" "}
              <strong className="text-cyan-400">{intervalMinutes} minutes</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-4 font-oswald">
          Activity Log
        </h3>

        {/* 📊 Metrics chips */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs sm:text-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Ideas found today</span>
            <span className="font-semibold text-cyan-300">
              {metrics.ideasToday}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Drafts generated</span>
            <span className="font-semibold text-emerald-300">
              {metrics.draftsGenerated}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Posts published</span>
            <span className="font-semibold text-indigo-300">
              {metrics.postsPublished}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-300">Errors (last 24h)</span>
            <span className="font-semibold text-red-300">
              {metrics.errors24h}
            </span>
          </div>
        </div>

        <div className="h-96 overflow-y-auto bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2 flex flex-col-reverse">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <p key={index} className="whitespace-pre-wrap">
                <span className="text-slate-500 mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={getLogColorClass(log.type)}>
                  {log.message}
                </span>
              </p>
            ))
          ) : (
            <p className="text-slate-500">
              No activity yet. Start the engine to see logs.
            </p>
          )}
        </div>
      </div>

      {/* 🧬 Timeline strip & badge */}
      <div className="mt-8 text-center text-[0.7rem] text-slate-500">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 border border-white/10">
          <span className="text-slate-400 font-semibold">v0.1</span>
          <span className="h-px w-6 bg-slate-600" />
          <span className="text-slate-300">Internal tool</span>
          <span className="h-px w-6 bg-slate-600" />
          <span className="text-slate-300">Public beta</span>
          <span className="h-px w-6 bg-slate-600" />
          <span className="text-slate-300">Full automation engine</span>
          <span className="h-px w-6 bg-slate-600" />
          <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
            Built with <span className="font-semibold">gnidoC terceS</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboardPage;
