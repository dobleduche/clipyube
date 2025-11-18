// server/services/thumbnailService.ts
import * as db from '../db';
// FIX: Import addAutomationLog to make it available in this module.
import { addAutomationLog } from '../db';
import * as llm from '../adapters/llm';

/**
 * Generates a thumbnail for a given draft.
 * 1. Finds the draft.
 * 2. Creates a prompt for an image model based on the draft's title/hook.
 * 3. Calls the LLM to generate an image.
 * 4. Saves the thumbnail metadata.
 */
export const generateThumbnail = async (draftId: string): Promise<Thumbnail> => {
  const draft = await db.findItemById('drafts', draftId) as Draft | undefined;
  if (!draft) {
    throw new Error(`Draft ${draftId} not found for thumbnail generation.`);
  }

  addAutomationLog(`Generating thumbnail for: "${draft.title || draftId}"`);

  try {
    // In a real app, we'd extract the hook or use a specific field. Here we use the title.
    const settings = await db.getSettings(); // Assume async
    const hook = draft.title || 'Untitled Draft';
    const prompt = `Create a visually stunning, high-contrast, clickable YouTube thumbnail for a video titled "${hook}". Use bold colors, clear imagery, and leave space for text overlays. Do not include any text in the image itself. Style: cinematic, dramatic lighting. Brand elements to incorporate subtly: ${settings.defaultNiche || 'general'}.`;

    // Generate a base64 data URL for the thumbnail
    // Note: The dummy 1x1 pixel is a placeholder. A real implementation should use a text-to-image model
    // (e.g., Stable Diffusion via an API) and upload the result to S3/GCS.
    const dummyPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const thumbnailDataUrl = await llm.generateImageContent(dummyPixel, 'image/png', prompt, 'thumbnail generation');
    if (!thumbnailDataUrl || typeof thumbnailDataUrl !== 'string') {
      throw new Error('LLM returned invalid thumbnail data.');
    }

    const newThumbnail: Thumbnail = {
      id: `thumb_${Date.now()}`,
      draft_id: draftId,
      url: thumbnailDataUrl, // In a real app, this would be a URL after uploading to S3/GCS
      prompt,
      status: 'generated',
    };

    await db.addItem('thumbnails', newThumbnail);

    // Link thumbnail back to the draft and persist
    draft.assets = { ...draft.assets, thumbnail: newThumbnail };
    await db.updateItem('drafts', draftId, draft); // Persist draft update

    addAutomationLog(`Successfully generated thumbnail for "${draft.title || draftId}"`, 'success');
    return newThumbnail;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    addAutomationLog(`Failed to generate thumbnail for "${draft.title || draftId}": ${message}`, 'error');
    // Persist failure state if draft was modified
    if (draft.assets?.thumbnail) {
      await db.updateItem('drafts', draftId, draft);
    }
    throw error;
  }
};

// Define interfaces for type safety
interface Draft {
  id: string;
  title?: string;
  assets?: {
    thumbnail?: Thumbnail;
    // Other asset fields as needed
  };
  // Other draft fields as needed
}

interface Thumbnail {
  id: string;
  draft_id: string;
  url: string;
  prompt: string;
  status: 'generated' | 'failed';
}
