// server/queues.ts
import { Queue, QueueOptions, JobsOptions } from "bullmq";
import IORedis from "ioredis";

// -----------------------------------------
// Redis Connection
// -----------------------------------------
export const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

redisConnection.on("error", (err) => {
  console.error(
    "[Redis] Connection error. Queue processing may be degraded:",
    err
  );
});

// -----------------------------------------
// Shared Queue Defaults
// -----------------------------------------
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 200,
  removeOnFail: 100,
};

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions,
};

// -----------------------------------------
// Queue Factory
// -----------------------------------------
const createQueue = (name: string): Queue => {
  return new Queue(name, defaultQueueOptions);
};

// -----------------------------------------
// Unified Queue List
// -----------------------------------------
export const discoveryQueue = createQueue("discovery");
export const generationQueue = createQueue("generation");
export const renderQueue = createQueue("render");
export const publishQueue = createQueue("publish");

export const automationQueue = createQueue("automation");
export const transcodeQueue = createQueue("transcode");
export const captionQueue = createQueue("caption");
export const thumbnailQueue = createQueue("thumbnail");

// -----------------------------------------
// Automation Scheduler (repeat discovery)
// -----------------------------------------
export async function scheduleAutomation(intervalMs: number): Promise<void> {
  const jobName = "automated-discovery-cycle";

  const existing = await discoveryQueue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === jobName) {
      await discoveryQueue.removeRepeatableByKey(job.key);
    }
  }

  await discoveryQueue.add(
    jobName,
    {},
    {
      repeat: { every: intervalMs },
      ...defaultJobOptions,
    }
  );

  console.log(
    `[Scheduler] Next cycle running every ${intervalMs / 1000} seconds`
  );
}

export async function removeAutomationSchedule(): Promise<void> {
  const jobName = "automated-discovery-cycle";

  const existing = await discoveryQueue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === jobName) {
      await discoveryQueue.removeRepeatableByKey(job.key);
    }
  }

  console.log("[Scheduler] Discovery cycle removed");
}
