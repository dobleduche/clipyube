// src/pages/ViralAgentPage.tsx
import React, { useState, useEffect } from "react";
import { runViralAgent, ContentIdea } from "../services/viralAgentService";
import {
  MagicWandIcon,
  TrendingUpIcon,
  GoogleIcon,
  YouTubeIcon,
  TikTokIcon,
} from "../components/Icons";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = [
  { id: "google", name: "Google Trends" },
  { id: "twitter", name: "Twitter" },
  { id: "youtube", name: "YouTube" },
  { id: "tiktok", name: "TikTok" },
];

const AGENT_STATE_KEY = "clipyube-viral-agent-state";

const SourceIcon: React.FC<{ source: string }> = ({ source }) => {
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes("youtube")) return <YouTubeIcon />;
  if (lowerSource.includes("google")) return <GoogleIcon />;
  if (lowerSource.includes("tiktok")) return <TikTokIcon />;
  return <TrendingUpIcon />;
};

interface ContentIdeaCardProps {
  idea: ContentIdea;
}

const ContentIdeaCard: React.FC<ContentIdeaCardProps> = ({ idea }) => {
  const { generateBlogPost, generateVideoFromIdea } = useAppContext();
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  const handleCreateBlog = async () => {
    if (isGeneratingBlog) return;
    setIsGeneratingBlog(true);
    try {
      await generateBlogPost(idea);
    } catch (e) {
      console.error("Blog generation failed from card", e);
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="bg-slate-900/40 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/10 hover:border-cyan-500/50 transition-colors duration-300 flex flex-col group h-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center ring-1 ring-white/10">
          <SourceIcon source={idea.source} />
        </div>
        <span className="text-sm font-semibold text-slate-400">
          {idea.source}
        </span>
      </div>

      <h3 className="text-xl font-bold text-white mb-3 flex-grow group-hover:text-cyan-400 transition-colors">
        {idea.title}
      </h3>

      <p className="text-slate-300 text-sm mb-4">{idea.brief}</p>

      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
          Keywords
        </h4>
        <div className="flex flex-wrap gap-2">
          {idea.keywords.map((keyword) => (
            <span
              key={keyword}
              className="bg-cyan-900/50 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3">
        <button
          onClick={handleCreateBlog}
          disabled={isGeneratingBlog}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600/80 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors text-sm disabled:bg-slate-600 disabled:cursor-wait"
        >
          {isGeneratingBlog ? (
            <>
              <Loader /> Generating...
            </>
          ) : (
            "Create Blog Post"
          )}
        </button>
        <button
          onClick={() => generateVideoFromIdea(idea)}
          className="w-full bg-slate-700/80 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Generate Video
        </button>
      </div>
    </motion.div>
  );
};

const ViralAgentPage: React.FC = () => {
  const { settings } = useSettings();
  const [niche, setNiche] = useState(settings.defaultNiche || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "google",
    "youtube",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [results, setResults] = useState<ContentIdea[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load previous state (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedStateJSON = window.localStorage.getItem(AGENT_STATE_KEY);
      if (!savedStateJSON) return;

      const savedState = JSON.parse(savedStateJSON) as {
        niche?: string;
        results?: ContentIdea[];
      };

      if (!niche && savedState.niche) setNiche(savedState.niche);
      if (savedState.results && Array.isArray(savedState.results)) {
        setResults(savedState.results);
      }
    } catch (e) {
      console.error("Failed to load viral agent state from localStorage", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleRunAgent = async () => {
    if (!niche.trim() || selectedPlatforms.length === 0) {
      setError("Please define your niche and select at least one platform.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgressMessage("");

    try {
      const agentResults = await runViralAgent(
        niche,
        selectedPlatforms,
        setProgressMessage
      );
      setResults(agentResults);

      if (typeof window !== "undefined") {
        try {
          const stateToSave = { niche, results: agentResults };
          window.localStorage.setItem(
            AGENT_STATE_KEY,
            JSON.stringify(stateToSave)
          );
        } catch (e) {
          console.error("Failed to save viral agent state to localStorage", e);
        }
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Agent failed: ${message}`);
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 font-oswald text-gradient-cyan-sanguine">
          Viral Content Agent
        </h2>
        <p className="text-lg text-slate-400">
          Let AI find trending topics and generate your next viral hit.
        </p>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl border border-white/10 mb-12">
        <h3 className="text-2xl font-bold text-white mb-6">Configuration</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label
              htmlFor="niche-input"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              What is your content niche?
            </label>
            <input
              type="text"
              id="niche-input"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., AI technology, home cooking recipes, indie gaming"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Analyze which platforms?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform.id)}
                  disabled={isLoading}
                  className={`p-2 w-full text-sm font-semibold rounded-md transition-colors disabled:opacity-50 ${
                    selectedPlatforms.includes(platform.id)
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

        <div className="mt-6 border-t border-white/10 pt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRunAgent}
            disabled={isLoading || !niche.trim() || selectedPlatforms.length === 0}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-cyan-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-cyan-400 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-[0_0_15px_rgba(var(--cyan-glow),0.4)] hover:shadow-[0_0_25px_rgba(var(--cyan-glow),0.6)] disabled:shadow-none"
          >
            {isLoading ? <Loader /> : <MagicWandIcon />}
            <span>{isLoading ? "Agent is Working..." : "Find Viral Content"}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Analyzing Trends...
            </h3>
            <p className="text-cyan-300 font-mono animate-pulse">
              {progressMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            <h3 className="text-3xl font-bold text-white mb-6 text-center font-oswald">
              Content Ideas
            </h3>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8"
              variants={containerVariants}
            >
              {results.map((idea) => (
                <motion.div key={idea.id} variants={itemVariants}>
                  <ContentIdeaCard idea={idea} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViralAgentPage;
