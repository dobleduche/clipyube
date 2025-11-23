
// This file acts as the client-side bridge to the secure backend API.
// It makes fetch requests to the server, which then handles the direct
// interaction with external services like Google Gemini.
import { ContentIdea } from '../services/viralAgentService';
import { BlogPost } from '../pages/BlogPage';
import { Settings } from '../context/SettingsContext';
import { initialBlogPosts } from '../data/blogData';


const API_BASE_URL = 'http://localhost:3009';

/**
 * A generic helper to call the backend's image generation endpoint.
 */
export const generateImageContent = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  operationDescription: string,
  styleBase64?: string,
  styleMimeType?: string
): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            base64Data,
            mimeType,
            prompt,
            operationDescription,
            styleBase64,
            styleMimeType,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to perform ${operationDescription}`);
    }

    const data = await response.json();
    return data.imageUrl;
};

/**
 * Calls the backend to search for images based on a prompt.
 */
export const searchImagesRequest = async (prompt: string): Promise<{ images: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/search-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for images.');
    }

    return response.json();
};

/**
 * Simulates generating a video with the Runway API via the backend.
 */
export const generateVideoWithRunway = async (
    prompt: string,
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress('Simulating Runway generation via backend...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    onProgress('This is a mock response.');
    return 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
};

/**
 * Calls the backend to run the viral agent for content discovery.
 */
export const runDiscoveryAgent = async (niche: string, platforms: string[]): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/discovery/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platforms }),
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run discovery agent');
    }
    return response.json();
};

/**
 * Sends a video URL to the backend to be ingested into the processing pipeline.
 */
export const ingestClip = async (url: string, tenant: string = 'default'): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/clips/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tenant }),
    });
};

// --- New/Refactored Functions ---

export const generateBlogPostRequest = async (idea: ContentIdea): Promise<{blogPost: BlogPost}> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const details = errorData.details ? ` Details: ${errorData.details.join(', ')}` : '';
        throw new Error((errorData.error || 'Failed to generate blog post from server.') + details);
    }
    
    const data = await response.json();
    if (!data.blogPost) {
        throw new Error("Server returned no content for the blog post.");
    }
    return data;
};

export const getBlogPostsRequest = async (): Promise<BlogPost[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/blog`);
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        return await response.json();
    } catch (error) {
        console.warn('Backend unreachable. Returning mock blog posts.');
        return initialBlogPosts;
    }
};

export const deleteBlogPostRequest = async (slug: string): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}/api/blog/${slug}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete blog post on server.');
    }
    return response;
};

export const runViralAgentRequest = async (
    niche: string,
    platforms: string[],
    geo: string,
): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/discovery/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platforms, geo }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dispatch discovery agent.');
    }

    return response.json();
};

export const getSettingsRequest = async (): Promise<Settings> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/automation/settings`);
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        return await response.json();
    } catch (error) {
        console.warn('Backend unreachable. Returning default settings.');
        return {
            profileName: '',
            defaultNiche: 'AI Technology',
            twitterHandle: '',
            automationInterval: 3600000, // 1 hour
            watermarkDefaults: {
                type: 'text',
                text: 'Clip-Yube',
                font: 'Oswald',
                fontSize: 48,
                color: '#ffffff',
                opacity: 0.7,
                position: 'bottom-right',
            },
            userTier: 'free',
            billing: {
                plan: 'Free Plan',
                nextBillingDate: '',
            },
            newsletter: {
                email: true,
                inApp: true,
            }
        };
    }
};

export const saveSettingsRequest = async (newSettings: Partial<Settings>): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/automation/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
    });
};

export const getAutomationStatusRequest = (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/automation/status`);
};

export const getAutomationLogsRequest = (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/automation/logs`);
};

export const startAutomationRequest = (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/automation/start`, { method: 'POST' });
};

export const stopAutomationRequest = (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/automation/stop`, { method: 'POST' });
};

export const getHealthRequest = (): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/health`);
};

export const generateTextRequest = (prompt: string): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/generate/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
};

export const generateYouTubeDescriptionRequest = async (title: string, content: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/youtube-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate YouTube description.');
    }

    const data = await response.json();
    return data.description;
};
