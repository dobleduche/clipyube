// server/workers/pipelineWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, renderQueue, publishQueue } from '../queues';
import { renderDraft, publishDraft } from '../services/pipeline';
import * as db from '../db';

console.log('Starting Pipeline Workers (Render & Publish)...');

// Worker for the 'render' queue
new Worker(renderQueue.name, async job => {
    const { draftId } = job.data;
    db.addAutomationLog(`Render worker processing job for draft ${draftId}`);
    try {
        await renderDraft(draftId);
        // After rendering is complete, trigger the publish job
        await publishQueue.add('publish-video', { draftId });
        db.addAutomationLog(`Render successful. Enqueued publish job for draft ${draftId}.`);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        db.addAutomationLog(`Render worker failed for draft ${draftId}: ${message}`, 'error');
        throw error;
    }
}, { connection: redisConnection });


// Worker for the 'publish' queue
new Worker(publishQueue.name, async job => {
    const { draftId } = job.data;
    db.addAutomationLog(`Publish worker processing job for draft ${draftId}`);
    try {
        await publishDraft(draftId);
        db.addAutomationLog(`Successfully published draft ${draftId}.`, 'success');
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        db.addAutomationLog(`Publish worker failed for draft ${draftId}: ${message}`, 'error');
        throw error;
    }
}, { connection: redisConnection });
