import { generateImageContent, generateVideoWithVeo as generateVideoWithVeoClient } from "../api/client";
import { ContentIdea } from "./viralAgentService";
import { BlogPost } from "../pages/BlogPage";

/**
 * Edits an image using a text prompt via the secure API client.
 */
export const editImageWithPrompt = (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
    return generateImageContent(base64Data, mimeType, prompt, "image editing");
};

/**
 * Upscales an image using a text prompt via the secure API client.
 */
export const upscaleImage = (
  base64Data: string,
  mimeType: string,
  factor: number
): Promise<string> => {
  const prompt = `Upscale this image to ${factor}x its original resolution. Enhance details and clarity while preserving the original content.`;
  return generateImageContent(base64Data, mimeType, prompt, "upscaling");
};

/**
 * Removes the background from an image via the secure API client.
 */
export const removeImageBackground = (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const prompt = "Remove the background of this image completely, leaving only the main subject with a transparent background. The output must be a PNG with an alpha channel.";
  return generateImageContent(base64Data, mimeType, prompt, "background removal");
};

/**
 * Applies the artistic style of one image to another via the secure API client.
 */
export const applyStyleTransfer = async (
  contentBase64: string,
  contentMimeType: string,
  styleBase64: string,
  styleMimeType: string,
): Promise<string> => {
    const prompt = "Apply the artistic style of the second image (the style image) to the first image (the content image). Transfer the textures, color palette, and overall aesthetic while preserving the recognizable shapes and composition of the content image.";
    return generateImageContent(contentBase64, contentMimeType, prompt, "style transfer", styleBase64, styleMimeType);
};

/**
 * Generates a video from a text prompt using the Google Veo model via the secure API client.
 */
export const generateVideoWithVeo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    resolution: '720p' | '1080p',
    onProgress: (message: string) => void
): Promise<string> => {
    return generateVideoWithVeoClient(prompt, aspectRatio, resolution, onProgress);
};

/**
 * Generates a blog post by calling the secure, validating backend endpoint.
 * @param idea The content idea to expand into a blog post.
 * @returns A promise that resolves to a BlogPost object.
 */
export const generateBlogPost = async (idea: ContentIdea): Promise<BlogPost> => {
    const response = await fetch('http://localhost:3010/api/generate/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate blog post on server.');
    }

    const { blogPost } = await response.json();
    return blogPost;
};
