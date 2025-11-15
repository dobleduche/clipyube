// server/workers/pipelineWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, renderQueue, publishQueue } from '../queues';
import { renderDraft, publishDraft } from '../services/pipeline';
import * as db from '../db';

interface PipelineJobData {
  draftId: string;
}

console.log(`[${new Date().toISOString()}] Starting Pipeline Workers (Render & Publish)...`);

// Worker for the 'render' queue
new Worker<PipelineJobData, void, string>(renderQueue.name, async (job) => {
  const { draftId } = job.data;

  if (!draftId || typeof draftId !== 'string') {
    throw new Error(`Invalid draftId in job ${job.id}: ${draftId}`);
  }

  db.addAutomationLog(`[${new Date().toISOString()}] Render worker processing job ${job.id} for draft ${draftId}`);
  try {
    await renderDraft(draftId);
    await publishQueue.add('publish-video', { draftId });
    db.addAutomationLog(`[${new Date().toISOString()}] Render successful for job ${job.id}. Enqueued publish job for draft ${draftId}.`);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    db.addAutomationLog(`[${new Date().toISOString()}] Render worker job ${job.id} failed for draft ${draftId}: ${message}`, 'error');
    throw error;
  }
}, {
  connection: redisConnection,
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});

// Worker for the 'publish' queue
new Worker<PipelineJobData, void, string>(publishQueue.name, async (job) => {
  const { draftId } = job.data;

  if (!draftId || typeof draftId !== 'string') {
    throw new Error(`Invalid draftId in job ${job.id}: ${draftId}`);
  }

  db.addAutomationLog(`[${new Date().toISOString()}] Publish worker processing job ${job.id} for draft ${draftId}`);
  try {
    await publishDraft(draftId);
    db.addAutomationLog(`[${new Date().toISOString()}] Successfully published draft ${draftId} for job ${job.id}.`, 'success');
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    db.addAutomationLog(`[${new Date().toISOString()}] Publish worker job ${job.id} failed for draft ${draftId}: ${message}`, 'error');
    throw error;
  }
}, {
  connection: redisConnection,
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
