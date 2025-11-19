// server/workers/generationWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, generationQueue, renderQueue, thumbnailQueue } from '../queues';
import { buildDrafts } from '../services/generation';
import * as db from '../db';

interface GenerationJobData {
  // Add any job-specific data if needed (currently unused)
}

interface Draft {
  id: string;
  // Add other fields as needed from services/generation.ts
}

console.log(`[${new Date().toISOString()}] Starting Generation Worker...`);

new Worker<GenerationJobData, void, string>(generationQueue.name, async (job) => {
  db.addAutomationLog(`[${new Date().toISOString()}] Generation worker processing job ${job.id} to build drafts...`);
  try {
    const newDrafts = await buildDrafts() as Draft[];

    if (newDrafts && newDrafts.length > 0) {
      for (const draft of newDrafts) {
        if (!draft.id || typeof draft.id !== 'string') {
          throw new Error(`Invalid draft ID in newDrafts: ${JSON.stringify(draft)}`);
        }
        await renderQueue.add('render-video', { draftId: draft.id });
        await thumbnailQueue.add('generate-thumbnail', { draftId: draft.id });
      }
      db.addAutomationLog(`[${new Date().toISOString()}] Enqueued ${newDrafts.length} render and thumbnail jobs for job ${job.id}.`);
    } else {
      db.addAutomationLog(`[${new Date().toISOString()}] No new drafts were created in job ${job.id}.`);
    }
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    db.addAutomationLog(`[${new Date().toISOString()}] Generation worker job ${job.id} failed: ${message}`, 'error');
    throw error; // Let BullMQ handle retries
  }
}, {
  connection: redisConnection,
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
