
import { generateImageContent, generateVideoWithVeo as generateVideoWithVeoClient, generateTextContent } from "../api/client";
import { ContentIdea } from "./viralAgentService";
import { BlogPost } from "../pages/BlogPage";
import { sanitizeHtml } from "../utils/sanitize";

/**
 * Edits an image using a text prompt via the secure API client.
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to a data URL (base64) of the edited image.
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
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param factor The upscaling factor (e.g., 2 for 2x).
 * @returns A promise that resolves to a data URL (base64) of the upscaled image.
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
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to a data URL (base64) of the image with the background removed.
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
 * @param contentBase64 The base64-encoded content image data.
 * @param contentMimeType The MIME type of the content image.
 * @param styleBase64 The base64-encoded style image data.
 * @param styleMimeType The MIME type of the style image.
 * @returns A promise that resolves to a data URL (base64) of the stylized image.
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
 * Generates a blog post from a content idea using the Gemini Pro model via the secure API client.
 * @param idea The content idea to expand into a blog post.
 * @returns A promise that resolves to a BlogPost object with sanitized HTML content.
 */
export const generateBlogPost = async (idea: ContentIdea): Promise<BlogPost> => {
    const prompt = `
        You are an expert content creator, SEO specialist, and blogger with deep knowledge in the given topic.
        Your task is to write a comprehensive, in-depth, and engaging blog post based on the following idea.

        **CRITICAL REQUIREMENTS:**
        1.  **Length:** The blog post must be substantial and detailed, with a minimum word count of 1000 words.
        2.  **Backlinks:** You must include at least 3-5 relevant and authoritative backlinks to external websites. These links should provide genuine value to the reader (e.g., links to studies, high-quality tutorials, official documentation, or reputable news sources). The links must be embedded naturally within the text using HTML anchor tags (\`<a>\`). For example: \`<a href="https://example.com" target="_blank" rel="noopener noreferrer">useful external resource</a>\`. Do not link to competitor products.
        3.  **Formatting:** The output must be a single block of clean HTML, without any markdown or extra text before or after the HTML. Use appropriate semantic HTML tags like \`<p>\`, \`<h3>\`, \`<h4>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, and \`<strong>\`.
        4.  **Title:** Do not include a main title tag (\`<h1>\` or \`<h2>\`) as it will be added externally. You can use \`<h3>\` for main section headings.
        5.  **Structure:** The post should be well-structured with an introduction, multiple sections with clear headings, and a concluding summary.

        **CONTENT IDEA:**
        - **Title:** "${idea.title}"
        - **Brief:** "${idea.brief}"
        - **Keywords:** ${idea.keywords.join(', ')}

        Now, write the blog post following all the above instructions.
    `;

    try {
        const rawContent = await generateTextContent(prompt);
        const sanitizedContent = sanitizeHtml(rawContent);
        
        const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        return {
            slug,
            title: idea.title,
            author: 'AI Agent',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Generic placeholder
            snippet: idea.brief,
            content: sanitizedContent,
        };
    } catch (error) {
         console.error(`Error in blog generation service:`, error);
         throw error; // Re-throw the error to be handled by the caller
    }
};
