// server/workers/discoveryWorker.ts
import { Worker } from 'bullmq';
import { redisConnection, discoveryQueue, generationQueue } from '../queues';
import { runDiscovery } from '../services/discovery';
import * as db from '../db';

interface DiscoveryJobData {
  niche?: string;
  platforms?: string[];
  geo?: string;
}

interface DiscoveryResult {
  id: string;
  topic: string;
  score: number;
  status: string;
  // Add other fields as needed
}

console.log(`[${new Date().toISOString()}] Starting Discovery Worker...`);

new Worker<DiscoveryJobData, void, string>(discoveryQueue.name, async (job) => {
  const { niche: jobNiche, platforms: jobPlatforms, geo: jobGeo } = job.data;

  // Validate and fetch settings
  const settings = await db.getSettings() as { defaultNiche?: string } | undefined;
  if (!settings?.defaultNiche) {
    throw new Error('Default niche not configured in settings.');
  }

  const niche = jobNiche || settings.defaultNiche;
  const platforms = jobPlatforms || ['google', 'youtube', 'tiktok'];
  const geo = jobGeo || 'US';

  if (!niche || typeof niche !== 'string') {
    throw new Error('Niche must be a valid string.');
  }
  if (!Array.isArray(platforms) || platforms.length === 0) {
    throw new Error('Platforms must be a non-empty array.');
  }

  db.addAutomationLog(`[${new Date().toISOString()}] Discovery worker processing job ${job.id} for niche: ${niche}`);
  try {
    const newDiscoveries = await runDiscovery(niche, platforms, geo) as DiscoveryResult[];

    if (newDiscoveries.length > 0) {
      await generationQueue.add('generate-drafts', {});
      db.addAutomationLog(`[${new Date().toISOString()}] Found ${newDiscoveries.length} new items for job ${job.id}, enqueued generation job.`);
    } else {
      db.addAutomationLog(`[${new Date().toISOString()}] No new discoveries found in job ${job.id}.`);
    }
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    db.addAutomationLog(`[${new Date().toISOString()}] Discovery worker job ${job.id} failed: ${message}`, 'error');
    throw error; // Let BullMQ handle retries
  }
}, {
  connection: redisConnection,
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
