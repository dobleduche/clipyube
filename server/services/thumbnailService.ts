// server/services/thumbnailService.ts
import * as db from '../db';
import * as llm from '../adapters/llm';
import { addAutomationLog } from '../db';

/**
 * Generates a thumbnail for a given draft.
 * 1. Finds the draft.
 * 2. Creates a prompt for an image model based on the draft's title/hook.
 * 3. Calls the LLM to generate an image.
 * 4. Saves the thumbnail metadata.
 */
export const generateThumbnail = async (draftId: string): Promise<any> => {
    const draft = db.findItemById('drafts', draftId);
    if (!draft) {
        throw new Error(`Draft ${draftId} not found for thumbnail generation.`);
    }

    addAutomationLog(`Generating thumbnail for: "${draft.title}"`);

    try {
        // In a real app, we'd extract the hook. Here we use the title.
        const settings = db.getSettings();
        const hook = draft.title;
        const prompt = `Create a visually stunning, high-contrast, clickable YouTube thumbnail for a video titled "${hook}". Use bold colors, clear imagery, and leave space for text overlays. Do not include any text in the image itself. Style: cinematic, dramatic lighting. Brand elements to incorporate subtly: ${settings.defaultNiche}.`;

        // Generate a base64 data URL for the thumbnail
        // Note: We are generating an image from text only, so we provide a dummy base64 image as the API expects one.
        // A better approach would be to have a dedicated text-to-image model endpoint.
        const dummyPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const thumbnailDataUrl = await llm.generateImageContent(dummyPixel, 'image/png', prompt, 'thumbnail generation');
        
        const newThumbnail = {
            id: `thumb_${Date.now()}`,
            draft_id: draftId,
            url: thumbnailDataUrl, // In a real app, this would be a URL after uploading to S3/GCS
            prompt: prompt,
            status: 'generated'
        };

        db.addItem('thumbnails', newThumbnail);
        
        // Link thumbnail back to the draft
        draft.assets = { ...draft.assets, thumbnail: newThumbnail };

        addAutomationLog(`Successfully generated thumbnail for "${draft.title}"`, 'success');
        return newThumbnail;

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        addAutomationLog(`Failed to generate thumbnail for "${draft.title}": ${message}`, 'error');
        throw error;
    }
};