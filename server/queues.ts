// server/queues.ts
// FIX: Changed JobOptions to JobsOptions
import { Queue, JobsOptions, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// --- Fault-Tolerant Initialization ---
// Export queue variables, which will be undefined if initialization fails.
export let discoveryQueue: Queue;
export let generationQueue: Queue;
export let thumbnailQueue: Queue;
export let renderQueue: Queue;
export let publishQueue: Queue;
export let automationQueue: Queue;
export let transcodeQueue: Queue;
export let captionQueue: Queue;
export let redisConnection: IORedis;

// This flag indicates if the queues are operational.
export let queuesReady = false;

// FIX: Moved defaultQueueOptions outside the try block so it's accessible to other functions.
let defaultQueueOptions: QueueOptions;

try {
  // Configure Redis connection
  redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Important for BullMQ
  });

  redisConnection.on('error', (err) => {
    if (queuesReady) { // If it was connected before
        console.error('[Queues] Redis connection lost. Queuing will be paused.', err.message);
    }
    queuesReady = false;
  });

  redisConnection.on('connect', () => {
    if (!queuesReady) {
        console.log('[Queues] Redis connection established.');
        // This is a good place to re-verify queue health if needed in a more complex setup.
    }
  });

  // Assign inside try block after connection is established
  defaultQueueOptions = {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  };

  // Initialize all queues
  discoveryQueue = new Queue('discovery', defaultQueueOptions);
  generationQueue = new Queue('generation', defaultQueueOptions);
  thumbnailQueue = new Queue('thumbnail', defaultQueueOptions);
  renderQueue = new Queue('render', defaultQueueOptions);
  publishQueue = new Queue('publish', defaultQueueOptions);
  automationQueue = new Queue('automation', defaultQueueOptions);
  transcodeQueue = new Queue('transcode', defaultQueueOptions);
  captionQueue = new Queue('caption', defaultQueueOptions);
  
  queuesReady = true;
  console.log('[Queues] Successfully initialized BullMQ queues.');

} catch (error) {
  console.error('[Queues] CRITICAL: Failed to initialize BullMQ queues. This is likely due to a Redis connection issue. Queue-dependent features will be unavailable.', error);
  queuesReady = false;
}
// --- End Fault-Tolerant Initialization ---


// Function to schedule the main automation task
export async function scheduleAutomation(intervalMs: number): Promise<void> {
  if (!queuesReady || !discoveryQueue || !defaultQueueOptions) {
    const msg = '[Scheduler] Cannot schedule automation, queues are not ready.';
    console.error(msg);
    throw new Error(msg);
  }

  const jobName = 'automated-discovery-cycle';
  try {
    const repeatableJobs = await discoveryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === jobName) {
        await discoveryQueue.removeRepeatableByKey(job.key);
      }
    }

    await discoveryQueue.add(
      jobName,
      {}, // No data needed, worker will fetch settings
      { repeat: { every: intervalMs }, ...(defaultQueueOptions.defaultJobOptions as JobsOptions) }
    );
    console.log(`[Scheduler] Automation job scheduled to run every ${intervalMs / 1000} seconds.`);
  } catch (error) {
    console.error('[Scheduler] Failed to schedule automation job:', error);
    throw error;
  }
}

// Function to remove the automation schedule
export async function removeAutomationSchedule(): Promise<void> {
    if (!queuesReady || !discoveryQueue) {
        console.warn('[Scheduler] Cannot remove schedule, queues are not ready.');
        return;
    }
  const jobName = 'automated-discovery-cycle';
  try {
    const repeatableJobs = await discoveryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === jobName) {
        await discoveryQueue.removeRepeatableByKey(job.key);
      }
    }
    console.log('[Scheduler] Automation schedule removed.');
  } catch (error) {
    console.error('[Scheduler] Failed to remove automation schedule:', error);
    throw error;
  }
}