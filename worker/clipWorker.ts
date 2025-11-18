// server/workers/clipWorker.ts
import { Worker } from "bullmq";
import { redisConnection, automationQueue, transcodeQueue, thumbQueue, captionQueue } from "../queues";
import * as db from "../db";
import IORedis from "ioredis";

// --------------------------------------
// REDIS CONNECTION FOR INBOX POP
// --------------------------------------
const r = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

function log(tenant: string, type: "info" | "success" | "error", message: string) {
  console.log(`[CLIP_WORKER:${tenant}] [${type.toUpperCase()}] ${message}`);
}

const INBOX = (t = "default") => `clipyube:${t}:inbox`;

// Pop one URL from inbox list
async function dequeueInbox(tenant: string): Promise<string | null> {
  try {
    return await r.rpop(INBOX(tenant));
  } catch (err) {
    log(tenant, "error", "Failed to dequeue inbox item.");
    console.error(err);
    return null;
  }
}

console.log("🚀 Clip Worker started and listening for automation jobs...");

// --------------------------------------
// MAIN WORKER
// --------------------------------------
new Worker(
  automationQueue.name,
  async (job) => {
    const { tenant = "default" } = job.data;

    // Pull next URL from Redis inbox
    const nextUrl = await dequeueInbox(tenant);

    if (!nextUrl) {
      log(tenant, "info", "Inbox empty. Nothing to process.");
      return;
    }

    const clipId = `clip_${Date.now()}`;
    log(tenant, "info", `Ingested → ${nextUrl}`);

    // Save small entry to DB for side tracking (OPTIONAL)
    db.addItem("sources", {
      id: clipId,
      tenant,
      url: nextUrl,
      status: "ingested",
      created_at: new Date().toISOString(),
    });

    // --------------------------------------
    // QUEUE PROCESSING PIPELINE
    // --------------------------------------
    await transcodeQueue.add(
      "transcode",
      { tenant, id: clipId, src: nextUrl },
      { removeOnComplete: 200, removeOnFail: 50 }
    );

    await thumbQueue.add(
      "thumbnail",
      { tenant, id: clipId, src: nextUrl },
      { removeOnComplete: 200, removeOnFail: 50 }
    );

    await captionQueue.add(
      "caption",
      { tenant, id: clipId, src: nextUrl },
      { removeOnComplete: 200, removeOnFail: 50 }
    );

    log(tenant, "success", `Queued clip ${clipId} for transcode → thumbnail → caption pipeline.`);
  },
  { connection: redisConnection }
);
