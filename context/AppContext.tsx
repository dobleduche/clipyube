import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback } from 'react';
import { BlogPost } from '../pages/BlogPage';
import { initialBlogPosts } from '../data/blogData';
import { generateBlogPost as generateBlogPostService } from '../services/geminiService';
import { runViralAgent, ContentIdea } from '../services/viralAgentService';

type AutomationCommand = {
  type: 'video';
  prompt: string;
} | null;

type AutomationLog = {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
};

interface AppContextType {
  route: string;
  blogPosts: BlogPost[];
  automation: AutomationCommand;
  isAutomationRunning: boolean;
  automationLogs: AutomationLog[];
  navigateTo: (newRoute: string) => void;
  generateBlogPost: (idea: ContentIdea) => Promise<string>;
  generateVideoFromIdea: (idea: ContentIdea) => void;
  clearAutomation: () => void;
  startAutomation: (interval: number, niche: string) => void;
  stopAutomation: () => void;
  deleteBlogPost: (slug: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BLOG_POSTS_KEY = 'clipyube-blog-posts';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState(window.location.hash || '/');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    try {
      const savedPosts = localStorage.getItem(BLOG_POSTS_KEY);
      return savedPosts ? JSON.parse(savedPosts) : initialBlogPosts;
    } catch (e) {
      console.error("Failed to load blog posts from localStorage", e);
      return initialBlogPosts;
    }
  });
  const [automation, setAutomation] = useState<AutomationCommand>(null);
  
  // Automation State
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const automationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BLOG_POSTS_KEY, JSON.stringify(blogPosts));
    } catch (e) {
      console.error("Failed to save blog posts to localStorage", e);
    }
  }, [blogPosts]);

  const navigateTo = (newRoute: string) => {
    window.scrollTo(0, 0);
    window.location.hash = newRoute;
  };

  const addAutomationLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog: AutomationLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setAutomationLogs(prev => [newLog, ...prev]);
  }, []);

  const generateBlogPost = async (idea: ContentIdea): Promise<string> => {
    const newPost = await generateBlogPostService(idea);
    // FIX: Add a guard clause to handle cases where post generation might fail.
    // This resolves TypeScript errors about 'newPost' being potentially 'void' and makes the function more robust.
    if (!newPost) {
        throw new Error("Failed to generate blog post: Service returned no content.");
    }
    setBlogPosts(prevPosts => {
        // Prevent duplicates
        if (prevPosts.some(p => p.slug === newPost.slug)) return prevPosts;
        return [newPost, ...prevPosts];
    });
    navigateTo(`#/blog/${newPost.slug}`);
    return newPost.slug;
  };

  const deleteBlogPost = (slug: string) => {
    if (window.confirm('Are you sure you want to delete this blog post? This cannot be undone.')) {
        setBlogPosts(prev => prev.filter(p => p.slug !== slug));
    }
  };

  const generateVideoFromIdea = (idea: ContentIdea) => {
    setAutomation({ type: 'video', prompt: idea.brief });
    navigateTo('#/editor');
  };

  const clearAutomation = () => {
    setAutomation(null);
  };
  
  const runAutomationCycle = useCallback(async (niche: string) => {
    addAutomationLog(`Starting new cycle for niche: "${niche}"...`);
    try {
        const ideas = await runViralAgent(niche, ['google', 'youtube'], (progress) => {
            // We can choose to log progress, but it might be too noisy.
            // addAutomationLog(`Agent progress: ${progress}`);
        });

        const existingSlugs = new Set(blogPosts.map(p => p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')));
        const newIdea = ideas.find(idea => {
            const ideaSlug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return !existingSlugs.has(ideaSlug);
        });

        if (newIdea) {
            addAutomationLog(`Found new idea: "${newIdea.title}"`, 'success');
            const newPost = await generateBlogPostService(newIdea);
            // FIX: Add a guard clause to ensure 'newPost' is a valid BlogPost object before proceeding.
            // This resolves TypeScript errors related to 'newPost' being potentially 'void'.
            if (!newPost) {
                addAutomationLog(`Failed to generate blog post for "${newIdea.title}".`, 'error');
                return;
            }
            setBlogPosts(prev => [newPost, ...prev]);
            addAutomationLog(`Successfully generated blog post: "${newPost.title}"`, 'success');

            addAutomationLog(`Queuing video generation for "${newPost.title}"...`);
            // In a real app this would go to a job queue. Here we just log it.
            // The user would see this and could then go to the editor.
            console.log(`Automation triggered video for prompt: ${newIdea.brief}`);
        } else {
            addAutomationLog("No new unique content ideas found. Waiting for next interval.");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        addAutomationLog(`Automation cycle failed: ${message}`, 'error');
    }
  }, [addAutomationLog, blogPosts]);

  const startAutomation = useCallback((interval: number, niche: string) => {
      if (isAutomationRunning) return;
      addAutomationLog("Automation engine started.", 'success');
      setIsAutomationRunning(true);
      // Run immediately, then start interval
      runAutomationCycle(niche);
      const intervalId = window.setInterval(() => {
        runAutomationCycle(niche);
      }, interval);
      automationIntervalRef.current = intervalId;
  }, [isAutomationRunning, addAutomationLog, runAutomationCycle]);

  const stopAutomation = useCallback(() => {
    if (!isAutomationRunning || automationIntervalRef.current === null) return;
    addAutomationLog("Automation engine stopped by user.");
    setIsAutomationRunning(false);
    clearInterval(automationIntervalRef.current);
    automationIntervalRef.current = null;
  }, [isAutomationRunning, addAutomationLog]);

  const value = {
    route,
    blogPosts,
    automation,
    isAutomationRunning,
    automationLogs,
    navigateTo,
    generateBlogPost,
    generateVideoFromIdea,
    clearAutomation,
    startAutomation,
    stopAutomation,
    deleteBlogPost,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};