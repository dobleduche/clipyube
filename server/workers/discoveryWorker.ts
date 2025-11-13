import { Worker } from 'bullmq';
import { redisConnection, generationQueue } from '../queues';
import { runDiscovery } from '../services/discovery';

console.log('Starting Discovery Worker...');

new Worker('discovery', async job => {
    const { niche, platforms } = job.data;
    console.log(`DISCOVERY WORKER: Processing job for niche: ${niche}`);
    try {
        const newDiscoveries = await runDiscovery(niche, platforms);
        
        if (newDiscoveries.length > 0) {
            // After discovery, trigger the generation job to process the new finds.
            await generationQueue.add('generate-drafts', {});
            console.log(`DISCOVERY WORKER: Found ${newDiscoveries.length} new items, adding job to generation queue.`);
        } else {
            console.log('DISCOVERY WORKER: No new discoveries found in this run.');
        }
    } catch (error) {
        console.error('DISCOVERY WORKER: Job failed', error);
        throw error; // Let BullMQ handle the failure and potential retries
    }
}, { connection: redisConnection });