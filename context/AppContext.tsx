import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { BlogPost } from '../pages/BlogPage';
import { initialBlogPosts } from '../data/blogData';
import { ContentIdea } from '../services/viralAgentService';
import { generateBlogPostRequest } from '../api/client';

type AutomationCommand = {
  type: 'video';
  prompt: string;
} | null;

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

  const generateBlogPost = async (idea: ContentIdea): Promise<string> => {
    const { blogPost: newPost } = await generateBlogPostRequest(idea);

    setBlogPosts(prevPosts => {
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
  
  const value = {
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
