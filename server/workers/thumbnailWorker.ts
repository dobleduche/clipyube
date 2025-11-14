// server/workers/thumbnailWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, thumbnailQueue } from '../queues';
import { generateThumbnail } from '../services/thumbnailService';
import * as db from '../db';

console.log('Starting Thumbnail Worker...');

new Worker(thumbnailQueue.name, async job => {
    const { draftId } = job.data;
    db.addAutomationLog(`Thumbnail worker processing job for draft ${draftId}`);
    try {
        await generateThumbnail(draftId);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        db.addAutomationLog(`Thumbnail worker job failed for draft ${draftId}: ${message}`, 'error');
        throw error;
    }
}, { connection: redisConnection, concurrency: 2 }); // Can run a few in parallel as it's API-bound
