import {
  generateImageContent,
  searchImagesRequest,
} from "../api/client";

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
 * Upscales an image to the desired factor.
 */
export const upscaleImage = (
  base64Data: string,
  mimeType: string,
  factor: number
): Promise<string> => {
  const prompt = `Upscale this image to ${factor}x its original resolution. Enhance details and clarity while preserving all original content.`;
  return generateImageContent(base64Data, mimeType, prompt, "upscaling");
};

/**
 * Removes the background cleanly while preserving the subject.
 */
export const removeImageBackground = (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const prompt =
    "Remove the background completely, leaving only the main subject. Output must be a PNG with a full alpha channel.";
  return generateImageContent(
    base64Data,
    mimeType,
    prompt,
    "background removal"
  );
};

/**
 * Transfers the style of one image onto another.
 */
export const applyStyleTransfer = (
  contentBase64: string,
  contentMimeType: string,
  styleBase64: string,
  styleMimeType: string
): Promise<string> => {
  const prompt =
    "Apply the style of the second image to the first image. Preserve shapes and composition while transferring colors, texture, and artistic tone.";
  return generateImageContent(
    contentBase64,
    contentMimeType,
    prompt,
    "style transfer",
    styleBase64,
    styleMimeType
  );
};

/**
 * Searches for images using Google Imagen via backend API.
 */
export const searchImages = async (prompt: string): Promise<string[]> => {
  const { images } = await searchImagesRequest(prompt);
  return images;
};
