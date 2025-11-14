// server/workers/discoveryWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, discoveryQueue, generationQueue } from '../queues';
import { runDiscovery } from '../services/discovery';
import * as db from '../db';

console.log('Starting Discovery Worker...');

new Worker(discoveryQueue.name, async job => {
    const { niche: jobNiche, platforms: jobPlatforms, geo: jobGeo } = job.data;
    
    // Use job data if available (for on-demand runs), otherwise use settings (for scheduled runs)
    const settings = db.getSettings();
    const niche = jobNiche || settings.defaultNiche;
    const platforms = jobPlatforms || ['google', 'youtube', 'tiktok'];
    const geo = jobGeo || 'US';

    db.addAutomationLog(`Discovery worker processing job for niche: ${niche}`);
    try {
        const newDiscoveries = await runDiscovery(niche, platforms, geo);
        
        if (newDiscoveries.length > 0) {
            // After discovery, trigger the generation job to process the new finds.
            // It will process the highest-scoring discovery.
            await generationQueue.add('generate-drafts', {});
            db.addAutomationLog(`Found ${newDiscoveries.length} new items, enqueued generation job.`);
        } else {
            db.addAutomationLog('No new discoveries found in this run.');
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        db.addAutomationLog(`Discovery worker job failed: ${message}`, 'error');
        throw error; // Let BullMQ handle the failure and potential retries
    }
}, { connection: redisConnection });
