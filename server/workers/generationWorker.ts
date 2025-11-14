// server/workers/generationWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, generationQueue, renderQueue, thumbnailQueue } from '../queues';
import { buildDrafts } from '../services/generation';
import * as db from '../db';

console.log('Starting Generation Worker...');

new Worker(generationQueue.name, async job => {
    db.addAutomationLog('Generation worker processing job to build drafts...');
    try {
        const newDrafts = await buildDrafts();
        if (newDrafts && newDrafts.length > 0) {
            // After drafting, trigger render and thumbnail jobs for each new draft
            for (const draft of newDrafts) {
                await renderQueue.add('render-video', { draftId: draft.id });
                await thumbnailQueue.add('generate-thumbnail', { draftId: draft.id });
            }
            db.addAutomationLog(`Enqueued ${newDrafts.length} render and thumbnail jobs.`);
        } else {
             db.addAutomationLog('No new drafts were created in this run.');
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        db.addAutomationLog(`Generation worker job failed: ${message}`, 'error');
        throw error;
    }
}, { connection: redisConnection });
