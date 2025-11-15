import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { BlogPost } from '../pages/BlogPage';
import { ContentIdea } from '../services/viralAgentService';
import { generateBlogPostRequest, getBlogPostsRequest, deleteBlogPostRequest } from '../api/client';

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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState(window.location.hash || '/');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [automation, setAutomation] = useState<AutomationCommand>(null);
  
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch posts from the server on initial load
  useEffect(() => {
    const fetchPosts = async () => {
        try {
            const posts = await getBlogPostsRequest();
            setBlogPosts(posts);
        } catch (error) {
            console.error("Failed to fetch blog posts from server:", error);
            // Optionally, set an error state to show a message to the user
        }
    };
    fetchPosts();
  }, []);


  const navigateTo = (newRoute: string) => {
    window.scrollTo(0, 0);
    window.location.hash = newRoute;
  };

  const generateBlogPost = async (idea: ContentIdea): Promise<string> => {
    const { blogPost: newPost } = await generateBlogPostRequest(idea);

    setBlogPosts(prevPosts => {
        // Add the new post only if it doesn't already exist
        if (prevPosts.some(p => p.slug === newPost.slug)) {
          return prevPosts.map(p => p.slug === newPost.slug ? newPost : p); // Update if exists
        }
        return [newPost, ...prevPosts];
    });

    navigateTo(`#/blog/${newPost.slug}`);
    return newPost.slug;
  };

  const deleteBlogPost = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this blog post? This cannot be undone.')) {
        try {
            await deleteBlogPostRequest(slug);
            setBlogPosts(prev => prev.filter(p => p.slug !== slug));
        } catch (error) {
            console.error("Failed to delete blog post:", error);
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