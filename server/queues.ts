// server/queues.ts
import { Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

// In a real app, connection details would come from environment variables.
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Important for BullMQ
});

// Reusable function to create queues with the shared connection
const createQueue = (name: string) => new Queue(name, { connection });

// Define and export all application queues
export const discoveryQueue = createQueue('discovery');
export const generationQueue = createQueue('generation');
export const thumbnailQueue = createQueue('thumbnail');
export const renderQueue = createQueue('render');
export const publishQueue = createQueue('publish');

// Queues from the original clip pipeline
export const automationQueue = createQueue("clipyube:automation");
export const transcodeQueue  = createQueue("clipyube:transcode");
export const thumbQueue      = createQueue("clipyube:thumbnail"); // Note: different from thumbnailQueue for ideas
export const captionQueue    = createQueue("clipyube:caption");


// Function to schedule the main automation task
export async function scheduleAutomation(intervalMs: number) {
    const jobName = 'automated-discovery-cycle';
    // Remove old repeatable job before adding a new one to prevent duplicates
    const repeatableJobs = await discoveryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        if (job.name === jobName) {
            await discoveryQueue.removeRepeatableByKey(job.key);
        }
    }

    await discoveryQueue.add(
        jobName,
        {}, // No data needed, worker will fetch settings
        { repeat: { every: intervalMs } }
    );
    console.log(`[Scheduler] Automation job scheduled to run every ${intervalMs / 1000} seconds.`);
}

export async function removeAutomationSchedule() {
    const jobName = 'automated-discovery-cycle';
    const repeatableJobs = await discoveryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        if (job.name === jobName) {
            await discoveryQueue.removeRepeatableByKey(job.key);
        }
    }
    console.log('[Scheduler] Automation schedule removed.');
}


// Export the connection for workers to use
export const redisConnection = connection;