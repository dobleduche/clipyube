import { generateImageContent, searchImagesRequest } from "../api/client";

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
 * Searches for images from a text prompt using the Google Imagen model via the secure API client.
 * Returns an array of base64 strings (without the data URL prefix).
 */
export const searchImages = async (prompt: string): Promise<string[]> => {
    const result = await searchImagesRequest(prompt);
    return result.images;
};
