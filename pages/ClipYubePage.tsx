import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import AgentRunway from "../components/AgentRunway";
import BuildGate from "../components/BuildGate";
import UpgradeButton from "../components/UpgradeButton";
import ClipTimeline from "../components/ClipTimeline";
import { ingestClip } from "../api/client";
import { PlayIcon } from "../components/Icons";
import Loader from "../components/Loader";

type AgentStatus = "idle" | "running" | "done" | "error";

type Agent = {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  task: string;
  progress: number;
};

// Updated agent list to match the new, real pipeline
const initialAgents: Agent[] = [
  { id: "a1", name: "Ingest", model: "redis", status: "idle", task: "Waiting for clip", progress: 0 },
  { id: "a2", name: "Transcode", model: "ffmpeg", status: "idle", task: "Standardize format", progress: 0 },
  { id: "a3", name: "Thumbnail", model: "ffmpeg", status: "idle", task: "Generate keyframe", progress: 0 },
  { id: "a4", name: "Caption", model: "whisper", status: "idle", task: "Transcribe audio", progress: 0 },
  // Placeholder agents to show the rest of the pipeline
  { id: "a5", name: "HookFinder", model: "gpt", status: "idle", task: "Identify viral moments", progress: 0 },
  { id: "a6", name: "Renderer", model: "ffmpeg", status: "idle", task: "Assemble final clip", progress: 0 },
];

const TENANT_ID = "default"; // Hardcoded tenant for this demo

const ClipYubePage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [segments, setSegments] = useState<{ start: number; end: number; label: string }[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [urlInput, setUrlInput] = useState(
    "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
  );
  const [error, setError] = useState<string | null>(null);

  const overall = useMemo(
    () =>
      agents.length === 0
        ? 0
        : Math.round(
            agents.reduce((sum, agent) => sum + agent.progress, 0) /
              agents.length
          ),
    [agents]
  );

  const updateAgentStatus = useCallback(
    (agentName: string, status: AgentStatus, progress?: number) => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.name.toLowerCase() === agentName.toLowerCase()) {
            const newProgress =
              progress !== undefined
                ? progress
                : status === "done"
                ? 100
                : agent.progress;

            return { ...agent, status, progress: newProgress };
          }
          return agent;
        })
      );
    },
    []
  );

  const resetPipelineState = useCallback(() => {
    setAgents(initialAgents.map((a) => ({ ...a, status: "idle", progress: 0 })));
    setSegments([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isPipelineRunning) return;

    const eventSource = new EventSource(`/api/clips/logs/${TENANT_ID}`);
    console.log("Connecting to SSE log stream…");

    eventSource.onmessage = (event) => {
      let log: { message: string; type?: string } | null = null;

      try {
        log = JSON.parse(event.data);
      } catch (e) {
        console.warn("Non-JSON log from SSE:", event.data);
        return; // ignore malformed lines instead of crashing the UI
      }

      const message = (log?.message || "").toLowerCase();

      // Update agent statuses based on log messages
      if (message.startsWith("ingested")) {
        updateAgentStatus("Ingest", "done", 100);
      } else if (message.startsWith("transcode start")) {
        updateAgentStatus("Transcode", "running", 50);
      } else if (message.startsWith("transcode done")) {
        updateAgentStatus("Transcode", "done", 100);
      } else if (message.startsWith("thumbnail start")) {
        updateAgentStatus("Thumbnail", "running", 50);
      } else if (message.startsWith("thumbnail saved")) {
        updateAgentStatus("Thumbnail", "done", 100);
      } else if (message.startsWith("captioning start")) {
        updateAgentStatus("Caption", "running", 50);
      } else if (message.startsWith("transcript:")) {
        updateAgentStatus("Caption", "done", 100);

        // Simulate the rest of the pipeline for the UI
        setTimeout(() => updateAgentStatus("HookFinder", "running", 50), 500);

        setTimeout(() => {
          updateAgentStatus("HookFinder", "done", 100);
          setSegments([{ start: 1, end: 3, label: "Identified Hook" }]);
        }, 1000);

        setTimeout(() => updateAgentStatus("Renderer", "running", 50), 1500);

        setTimeout(() => {
          updateAgentStatus("Renderer", "done", 100);
          setIsPipelineRunning(false); // End of pipeline
        }, 2000);
      }

      if (log?.type === "error") {
        setError(log.message);
        setIsPipelineRunning(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Connection to the processing engine was lost.");
      eventSource.close();
      setIsPipelineRunning(false);
    };

    return () => {
      console.log("Closing SSE connection.");
      eventSource.close();
    };
  }, [isPipelineRunning, updateAgentStatus]);

  const handleStartPipeline = useCallback(async () => {
    if (!urlInput.trim()) {
      setError("Please enter a video URL.");
      return;
    }

    resetPipelineState();
    setIsPipelineRunning(true);
    updateAgentStatus("Ingest", "running", 50);

    try {
      const response = await ingestClip(urlInput, TENANT_ID);
      if (!response.ok) {
        let errMessage = "Failed to submit URL to the pipeline.";
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          // ignore JSON parsing error, keep fallback message
        }
        throw new Error(errMessage);
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(message);
      updateAgentStatus("Ingest", "error", 0);
      setIsPipelineRunning(false);
    }
  }, [TENANT_ID, resetPipelineState, updateAgentStatus, urlInput]);

  const handleUpgrade = useCallback(async () => {
    setIsRedirecting(true);
    try {
      // TODO: replace this with a real backend call to create a Stripe session.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const response = { url: "https://stripe.com/checkout/dummy-session-url" };

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("Checkout session URL not received.");
      }
    } catch (error) {
      console.error("Failed to create Stripe checkout session:", error);
      alert("Could not proceed to payment. Please try again later.");
      setIsRedirecting(false);
    }
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto text-white">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-oswald text-gradient-cyan-sanguine text-center sm:text-left">
          ClipYube – Viral Clip Engine
        </h1>
        <UpgradeButton onClick={handleUpgrade} disabled={isRedirecting}>
          {isRedirecting ? "Redirecting..." : "Upgrade to Pro"}
        </UpgradeButton>
      </div>

      <div className="bg-slate-900/40 p-4 rounded-2xl mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter a public video URL to process"
            className="flex-grow p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={isPipelineRunning}
          />
          <button
            onClick={handleStartPipeline}
            disabled={isPipelineRunning || !urlInput.trim()}
            className="flex items-center justify-center gap-2 bg-cyan-600/80 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            {isPipelineRunning ? (
              <>
                <Loader /> Processing…
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" /> Start Pipeline
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
        )}
      </div>

      <AgentRunway agents={agents} />

      <div className="mt-8 space-y-6">
        <BuildGate
          percent={overall}
          onUpgrade={handleUpgrade}
          isRedirecting={isRedirecting}
        >
          {segments.length > 0 && <ClipTimeline segments={segments} />}

          <div className="rounded-2xl p-6 bg-slate-900/40 border border-white/10 mt-4">
            <h3 className="font-semibold mb-2 text-white">Preview</h3>
            <div className="h-60 rounded-xl bg-black/40 grid place-items-center text-white/60 text-center px-4">
              {overall >= 100
                ? "Your clip is ready!"
                : "Rendered clip preview will appear here once the pipeline completes."}
            </div>
          </div>
        </BuildGate>
      </div>
    </div>
  );
};

export default ClipYubePage;
