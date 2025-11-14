// server/services/pipeline.ts
import * as db from '../db';
import * as youtubeAdapter from '../adapters/youtube';
import * as ttsAdapter from '../adapters/tts';
import * as videoAdapter from '../adapters/video';

/**
 * Finds a draft, generates TTS audio, then renders a video using ffmpeg.
 */
export const renderDraft = async (draftId: string) => {
    console.log(`PIPELINE: Starting render process for draft: ${draftId}`);
    const draft = db.findItemById('drafts', draftId);
    if (!draft || draft.status !== 'generated') {
        throw new Error(`Draft ${draftId} not found or not in 'generated' state.`);
    }

    draft.status = 'rendering';
    try {
        // 1. Generate TTS from script
        const audioPath = await ttsAdapter.textToSpeech(draft.script_md, draft.id);

        // 2. Render video using audio and script
        const videoPath = await videoAdapter.renderVideo(audioPath, draft.script_md, draft.id);
        
        // 3. Save asset paths to draft
        draft.assets = { ...draft.assets, audioPath, videoPath };
        draft.status = 'ready';
        console.log(`PIPELINE: Render complete for draft: "${draft.title}"`);
    } catch (error) {
        draft.status = 'render-failed';
        console.error(`PIPELINE: Failed to render draft ${draftId}`, error);
        throw error;
    }
};

/**
 * Finds a ready draft and publishes it to a platform.
 */
export const publishDraft = async (draftId: string) => {
    console.log(`PIPELINE: Starting publish process for draft: ${draftId}`);
    const draft = db.findItemById('drafts', draftId);
    if (!draft || draft.status !== 'ready') {
        throw new Error(`Draft ${draftId} not found or not in 'ready' state.`);
    }

    try {
        console.log(`PIPELINE: Publishing draft: "${draft.title}" to YouTube...`);
        if (!draft.assets?.videoPath) {
            throw new Error("Draft is missing rendered video path.");
        }

        const result = await youtubeAdapter.uploadVideo(draft.assets.videoPath, {
            title: draft.title,
            description: draft.script_md.substring(0, 500),
            tags: ['ai', 'automation', 'clipyube']
        });

        const newPublish = {
            id: `pub_${Date.now()}`,
            draft_id: draft.id,
            channel: 'youtube',
            external_id: result.id,
            status: 'live',
        };
        db.addItem('publishes', newPublish);
        draft.status = 'published';
        console.log(`PIPELINE: Successfully published to ${result.url}`);
    } catch (error) {
        draft.status = 'publish-failed';
        console.error(`PIPELINE: Failed to publish draft: "${draft.title}"`, error);
        throw error;
    }
};
