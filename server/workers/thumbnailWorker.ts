// server/workers/thumbnailWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, thumbnailQueue, queuesReady } from '../queues.js';
import { generateThumbnail } from '../services/thumbnailService.js';
import * as db from '../db/index.js';

if (!queuesReady || !redisConnection || !thumbnailQueue) {
  console.warn('[ThumbnailWorker] Skipping initialization because Redis queues are not ready.');
} else {
  const redisConnectionInstance = redisConnection;
  const thumbnailQueueInstance = thumbnailQueue;

interface ThumbnailJobData {
  draftId: string;
}

console.log(`[${new Date().toISOString()}] Starting Thumbnail Worker...`);

new Worker<ThumbnailJobData, void, string>(thumbnailQueueInstance.name, async (job) => {
  const { draftId } = job.data;

  if (!draftId || typeof draftId !== 'string') {
    throw new Error(`Invalid draftId in job ${job.id}: ${draftId}`);
  }

  db.addAutomationLog(`[${new Date().toISOString()}] Thumbnail worker processing job ${job.id} for draft ${draftId}`);
  try {
    await generateThumbnail(draftId);
    db.addAutomationLog(`[${new Date().toISOString()}] Successfully generated thumbnail for job ${job.id} and draft ${draftId}.`, 'success');
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    db.addAutomationLog(`[${new Date().toISOString()}] Thumbnail worker job ${job.id} failed for draft ${draftId}: ${message}`, 'error');
    throw error;
  }
}, {
  connection: redisConnectionInstance,
  concurrency: 2, // Can run a few in parallel as it's API-bound
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
}
