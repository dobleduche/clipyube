import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { BlogPost } from '../pages/BlogPage';
import { ContentIdea } from '../services/viralAgentService';
import {
  generateBlogPostRequest,
  getBlogPostsRequest,
  deleteBlogPostRequest,
} from '../api/client';

type AutomationCommand =
  | {
      type: 'video';
      prompt: string;
    }
  | null;

interface AppContextType {
  route: string;
  blogPosts: BlogPost[];
  automation: AutomationCommand;
  navigateTo: (newRoute: string) => void;
  generateBlogPost: (idea: ContentIdea) => Promise<string>;
  generateVideoFromIdea: (idea: ContentIdea) => void;
  clearAutomation: () => void;
  deleteBlogPost: (slug: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Safe helper for initial route (avoids window on server)
const getInitialRoute = () => {
  if (typeof window === 'undefined') return '/';
  return window.location.hash || '/';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [route, setRoute] = useState<string>(getInitialRoute);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [automation, setAutomation] = useState<AutomationCommand>(null);

  // Hash routing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      setRoute(window.location.hash || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch posts from the server on initial load
  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        const posts = await getBlogPostsRequest();
        if (!cancelled) {
          setBlogPosts(posts);
        }
      } catch (error) {
        console.error('Failed to fetch blog posts from server:', error);
        // In the future you could set an error state and show UI feedback
      }
    };

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const navigateTo = (newRoute: string) => {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, 0);
    window.location.hash = newRoute;
  };

  const generateBlogPost = async (idea: ContentIdea): Promise<string> => {
    const { blogPost: newPost } = await generateBlogPostRequest(idea);

    setBlogPosts((prevPosts) => {
      const exists = prevPosts.some((p) => p.slug === newPost.slug);
      if (exists) {
        return prevPosts.map((p) => (p.slug === newPost.slug ? newPost : p));
      }
      return [newPost, ...prevPosts];
    });

    navigateTo(`#/blog/${newPost.slug}`);
    return newPost.slug;
  };

  const deleteBlogPost = async (slug: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this blog post? This cannot be undone.'
      );
      if (!confirmed) return;
    }

    try {
      await deleteBlogPostRequest(slug);
      setBlogPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      if (typeof window !== 'undefined') {
        alert(`Error deleting post: ${(error as Error).message}`);
      }
    }
  };

  const generateVideoFromIdea = (idea: ContentIdea) => {
    setAutomation({ type: 'video', prompt: idea.brief });
    navigateTo('#/editor');
  };

  const clearAutomation = () => {
    setAutomation(null);
  };

  const value: AppContextType = {
    route,
    blogPosts,
    automation,
    navigateTo,
    generateBlogPost,
    generateVideoFromIdea,
    clearAutomation,
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
