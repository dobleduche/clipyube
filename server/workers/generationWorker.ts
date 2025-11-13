import { Worker } from 'bullmq';
import { redisConnection, renderQueue } from '../queues';
import { buildDrafts } from '../services/generation';

console.log('Starting Generation Worker...');

new Worker('generation', async job => {
    console.log('GENERATION WORKER: Processing job to build drafts...');
    try {
        const newDrafts = await buildDrafts();
        if (newDrafts && newDrafts.length > 0) {
            // After drafting, trigger render jobs for each new draft
            for (const draft of newDrafts) {
                await renderQueue.add('render-video', { draftId: draft.id });
            }
            console.log(`GENERATION WORKER: Added ${newDrafts.length} jobs to render queue.`);
        } else {
             console.log('GENERATION WORKER: No new drafts were created in this run.');
        }
    } catch (error) {
        console.error('GENERATION WORKER: Job failed', error);
        throw error;
    }
}, { connection: redisConnection });