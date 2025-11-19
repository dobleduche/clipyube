// server/services/pipeline.ts
import * as db from '../db';
import * as youtubeAdapter from '../adapters/youtube';
import * as ttsAdapter from '../adapters/tts';
import * as videoAdapter from '../adapters/video';

// Define interfaces for type safety
interface Draft {
  id: string;
  title?: string;
  script_md: string;
  status: 'generated' | 'rendering' | 'ready' | 'render-failed' | 'published' | 'publish-failed';
  assets?: {
    audioPath?: string;
    videoPath?: string;
  };
}

interface Publish {
  id: string;
  draft_id: string;
  channel: string;
  external_id: string;
  status: string;
}

interface YouTubeUploadResult {
  id: string;
  url: string;
}

/**
 * Finds a draft, generates TTS audio, then renders a video using ffmpeg.
 */
export const renderDraft = async (draftId: string): Promise<void> => {
  console.log(`PIPELINE: Starting render process for draft: ${draftId}`);
  const draft = await db.findItemById('drafts', draftId) as Draft | undefined;
  if (!draft || draft.status !== 'generated') {
    throw new Error(`Draft ${draftId} not found or not in 'generated' state.`);
  }

  draft.status = 'rendering';
  try {
    // 1. Generate TTS from script
    const audioPath = await ttsAdapter.textToSpeech(draft.script_md, draft.id);
    if (!audioPath || typeof audioPath !== 'string') {
      throw new Error('TTS adapter returned invalid audio path.');
    }

    // 2. Render video using audio and script
    const videoPath = await videoAdapter.renderVideo(audioPath, draft.script_md, draft.id);
    if (!videoPath || typeof videoPath !== 'string') {
      throw new Error('Video adapter returned invalid video path.');
    }

    // 3. Save asset paths to draft and persist
    draft.assets = { ...draft.assets, audioPath, videoPath };
    draft.status = 'ready';
    await db.updateItem('drafts', draftId, draft); // Assume updateItem exists
    console.log(`PIPELINE: Render complete for draft: "${draft.title || draftId}"`);
  } catch (error) {
    draft.status = 'render-failed';
    await db.updateItem('drafts', draftId, draft); // Persist failed state
    console.error(`PIPELINE: Failed to render draft ${draftId}:`, error instanceof Error ? error.message : error);
    throw error;
  }
};

/**
 * Finds a ready draft and publishes it to a platform.
 */
export const publishDraft = async (draftId: string): Promise<void> => {
  console.log(`PIPELINE: Starting publish process for draft: ${draftId}`);
  const draft = await db.findItemById('drafts', draftId) as Draft | undefined;
  if (!draft || draft.status !== 'ready') {
    throw new Error(`Draft ${draftId} not found or not in 'ready' state.`);
  }

  try {
    console.log(`PIPELINE: Publishing draft: "${draft.title || draftId}" to YouTube...`);
    if (!draft.assets?.videoPath) {
      throw new Error(`Draft ${draftId} is missing rendered video path.`);
    }

    const result = await youtubeAdapter.uploadVideo(draft.assets.videoPath, {
      title: draft.title || `Clipyube Draft ${draftId}`,
      description: draft.script_md.substring(0, 500),
      tags: ['ai', 'automation', 'clipyube'],
    }) as YouTubeUploadResult;

    if (!result.id || !result.url) {
      throw new Error('YouTube upload returned invalid result.');
    }

    const newPublish: Publish = {
      id: `pub_${Date.now()}`,
      draft_id: draft.id,
      channel: 'youtube',
      external_id: result.id,
      status: 'live',
    };
    await db.addItem('publishes', newPublish);
    draft.status = 'published';
    await db.updateItem('drafts', draftId, draft); // Persist published state
    console.log(`PIPELINE: Successfully published to ${result.url}`);
  } catch (error) {
    draft.status = 'publish-failed';
    await db.updateItem('drafts', draftId, draft); // Persist failed state
    console.error(`PIPELINE: Failed to publish draft "${draft.title || draftId}":`, error instanceof Error ? error.message : error);
    throw error;
  }
};
