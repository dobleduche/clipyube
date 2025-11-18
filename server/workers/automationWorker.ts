// server/workers/automationWorker.ts
import { Worker, JobsOptions } from "bullmq";
import {
  redisConnection,
  automationQueue,
  transcodeQueue,
  thumbQueue,
  captionQueue,
} from "../queues";

const r = redisConnection.duplicate();

const log = (
  tenant: string,
  type: "info" | "success" | "error",
  msg: string
) => {
  console.log(`[CLIP_WORKER:${tenant}] [${type}] ${msg}`);
};

const INBOX = (tenant = "default") => `clipyube:${tenant}:inbox`;

const dequeueInbox = async (tenant: string): Promise<string | null> => {
  try {
    return await r.rpop(INBOX(tenant));
  } catch (err: any) {
    log(tenant, "error", `Redis dequeue failed: ${err.message}`);
    return null;
  }
};

const jobOpts: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 500,
  removeOnFail: 100,
};

console.log(`[${new Date().toISOString()}] Automation Worker online…`);

new Worker(
  automationQueue.name,
  async (job) => {
    const tenant = job.data?.tenant || "default";

    const next = await dequeueInbox(tenant);
    if (!next) {
      log(tenant, "info", "Inbox empty.");
      return;
    }

    const id = `${Date.now()}`;
    log(tenant, "info", `Ingested → ${next}`);

    await transcodeQueue.add("transcode", { tenant, id, src: next }, jobOpts);
    await thumbQueue.add("thumbnail", { tenant, id, src: next }, jobOpts);
    await captionQueue.add("caption", { tenant, id, src: next }, jobOpts);

    log(tenant, "success", `Queued transcoder/thumbnail/caption pipeline → ${id}`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 1000,
    },
  }
);
