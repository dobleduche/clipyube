// server/workers/generationWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, generationQueue, renderQueue, thumbnailQueue, queuesReady } from '../queues.js';
import { buildDrafts } from '../services/generation.js';
import * as db from '../db/index.js';

if (!queuesReady || !redisConnection || !generationQueue || !renderQueue || !thumbnailQueue) {
  console.warn('[GenerationWorker] Skipping initialization because Redis queues are not ready.');
} else {
  const redisConnectionInstance = redisConnection;
  const generationQueueInstance = generationQueue;
  const renderQueueInstance = renderQueue;
  const thumbnailQueueInstance = thumbnailQueue;

interface GenerationJobData {
  // Add any job-specific data if needed (currently unused)
}

interface Draft {
  id: string;
  // Add other fields as needed from services/generation.ts
}

console.log(`[${new Date().toISOString()}] Starting Generation Worker...`);

new Worker<GenerationJobData, void, string>(generationQueueInstance.name, async (job) => {
  db.addAutomationLog(`[${new Date().toISOString()}] Generation worker processing job ${job.id} to build drafts...`);
  try {
    const newDrafts = await buildDrafts() as Draft[];

    if (newDrafts && newDrafts.length > 0) {
      for (const draft of newDrafts) {
        if (!draft.id || typeof draft.id !== 'string') {
          throw new Error(`Invalid draft ID in newDrafts: ${JSON.stringify(draft)}`);
        }
        await renderQueueInstance.add('render-video', { draftId: draft.id });
        await thumbnailQueueInstance.add('generate-thumbnail', { draftId: draft.id });
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
  connection: redisConnectionInstance,
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
}
