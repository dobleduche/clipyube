import { Worker } from 'bullmq';
import { redisConnection, publishQueue } from '../queues';
import { renderDraft, publishDraft } from '../services/pipeline';

console.log('Starting Pipeline Workers (Render & Publish)...');

// Worker for the 'render' queue
new Worker('render', async job => {
    const { draftId } = job.data;
    console.log(`RENDER WORKER: Processing job to render draft ${draftId}`);
    try {
        await renderDraft(draftId);
        // After rendering is complete, trigger the publish job
        await publishQueue.add('publish-video', { draftId });
        console.log(`RENDER WORKER: Render successful. Added job to publish queue for draft ${draftId}.`);
    } catch (error) {
        console.error(`RENDER WORKER: Job failed for draft ${draftId}`, error);
        throw error;
    }
}, { connection: redisConnection });


// Worker for the 'publish' queue
new Worker('publish', async job => {
    const { draftId } = job.data;
    console.log(`PUBLISH WORKER: Processing job to publish draft ${draftId}`);
    try {
        await publishDraft(draftId);
        console.log(`PUBLISH WORKER: Successfully published draft ${draftId}.`);
    } catch (error) {
        console.error(`PUBLISH WORKER: Job failed for draft ${draftId}`, error);
        throw error;
    }
}, { connection: redisConnection });