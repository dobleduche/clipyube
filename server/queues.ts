// server/queues.ts
import { Queue, JobOptions, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// Configure Redis connection with environment variable or default
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Important for BullMQ to handle retries
});

// Add an error handler to prevent the server from crashing if Redis is not available
connection.on('error', (err) => {
  console.error('Could not connect to Redis. Queuing functionality will be unavailable.', err);
});

// Export the connection for workers to use
export const redisConnection = connection;

// Reusable function to create queues with the shared connection
const createQueue = (name: string, options?: QueueOptions): Queue => {
  try {
    return new Queue(name, { connection, ...options });
  } catch (error) {
    console.error(`Failed to create queue '${name}':`, error);
    throw error; // Re-throw to be handled by the caller if critical
  }
};

// Define queue options (e.g., default settings)
const defaultQueueOptions: QueueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: 5000, // 5-second delay between retries
    removeOnComplete: true,
    removeOnFail: 100, // Keep failed jobs for debugging
  },
};

// Create and export all application queues
export const discoveryQueue = createQueue('discovery', defaultQueueOptions);
export const generationQueue = createQueue('generation', defaultQueueOptions);
export const thumbnailQueue = createQueue('thumbnail', defaultQueueOptions);
export const renderQueue = createQueue('render', defaultQueueOptions);
export const publishQueue = createQueue('publish', defaultQueueOptions);

// Queues from the original clip pipeline
export const automationQueue = createQueue('clipyube:automation', defaultQueueOptions);
export const transcodeQueue = createQueue('clipyube:transcode', defaultQueueOptions);
export const thumbQueue = createQueue('clipyube:thumbnail', defaultQueueOptions); // Distinct from thumbnailQueue
export const captionQueue = createQueue('clipyube:caption', defaultQueueOptions);

// Function to schedule the main automation task
export async function scheduleAutomation(intervalMs: number): Promise<void> {
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
      { repeat: { every: intervalMs }, ...defaultQueueOptions.defaultJobOptions }
    );
    console.log(`[Scheduler] Automation job scheduled to run every ${intervalMs / 1000} seconds.`);
  } catch (error) {
    console.error('[Scheduler] Failed to schedule automation job:', error);
    throw error; // Re-throw for upstream handling
  }
}

// Function to remove the automation schedule
export async function removeAutomationSchedule(): Promise<void> {
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
    throw error; // Re-throw for upstream handling
  }
}