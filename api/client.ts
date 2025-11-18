// This file acts as the client-side bridge to the secure backend API.
// It makes fetch requests to the server, which then handles the direct
// interaction with external services like Google Gemini, Runway, etc.

import { ContentIdea } from '../services/viralAgentService';
import { BlogPost } from '../pages/BlogPage';
import { Settings } from '../context/SettingsContext';

const API_BASE_URL = 'http://localhost:3001';

/* ============================================================
   IMAGE GENERATION
============================================================ */

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

/* ============================================================
   SEARCH IMAGES
============================================================ */

export const searchImagesRequest = async (
  prompt: string
): Promise<{ images: string[] }> => {
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

/* ============================================================
   RUNWAY MOCK VIDEO GENERATION
============================================================ */

export const generateVideoWithRunway = async (
  prompt: string,
  onProgress: (message: string) => void
): Promise<string> => {
  onProgress('Simulating Runway generation via backend...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  onProgress('This is a mock response.');
  return 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
};

/* ============================================================
   DISCOVERY AGENT (QUEUE)
============================================================ */

export const runDiscoveryAgent = async (
  niche: string,
  platforms: string[],
  geo = 'US'
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/discovery/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ niche, platforms, geo }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to run discovery agent');
  }

  return response.json();
};

/* ============================================================
   CLIP INGESTION
============================================================ */

export const ingestClip = async (
  url: string,
  tenant: string = 'default'
): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/clips/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, tenant }),
  });
};

/* ============================================================
   BLOG GENERATION
============================================================ */

export const generateBlogPostRequest = async (
  idea: ContentIdea
): Promise<{ blogPost: BlogPost }> => {
  const response = await fetch(`${API_BASE_URL}/api/generate/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const details = errorData.details
      ? ` Details: ${errorData.details.join(', ')}`
      : '';
    throw new Error(
      (errorData.error || 'Failed to generate blog post from server.') + details
    );
  }

  const data = await response.json();
  if (!data.blogPost) {
    throw new Error('Server returned no content for the blog post.');
  }

  return data;
};

/* ============================================================
   BLOG CRUD
============================================================ */

export const getBlogPostsRequest = async (): Promise<BlogPost[]> => {
  const response = await fetch(`${API_BASE_URL}/api/blog`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch blog posts from server.');
  }
  return response.json();
};

export const deleteBlogPostRequest = async (
  slug: string
): Promise<Response> => {
  const response = await fetch(`${API_BASE_URL}/api/blog/${slug}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete blog post on server.');
  }
  return response;
};

/* ============================================================
   VIRAL AGENT REQUEST (UPDATED TO MATCH runViralAgent.ts)
============================================================ */

export const runViralAgentRequest = async ({
  niche,
  platforms,
  geo,
}: {
  niche: string;
  platforms: string[];
  geo: string;
}): Promise<{ message: string }> => {
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

/* ============================================================
   SETTINGS
============================================================ */

export const getSettingsRequest = async (): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/api/automation/settings`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch settings from server.');
  }
  return response.json();
};

export const saveSettingsRequest = async (
  newSettings: Partial<Settings>
): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/automation/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSettings),
  });
};

/* ============================================================
   AUTOMATION
============================================================ */

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

/* ============================================================
   HEALTH CHECK + TEXT GENERATION
============================================================ */

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
