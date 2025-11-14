// server/workers/automationWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, automationQueue, transcodeQueue, thumbQueue, captionQueue } from '../queues';
import * as db from '../db';

const r = connection.duplicate();
r.connect().catch(() => {});

function log(tenant: string, type: "info" | "success" | "error", message: string) {
    // This worker is for a different pipeline, so it logs differently.
    // In a real app, logging should be unified.
    console.log(`[CLIP_WORKER:${tenant}] [${type}] ${message}`);
}

const INBOX = (t = "default") => `clipyube:${t}:inbox`;

async function dequeueInbox(tenant: string) {
    const url = await r.rpop('INBOX(tenant)');
    return url as string | null;
}

console.log('Starting Clip Automation Worker...');

new Worker(automationQueue.name, async (job) => {
    const tenant = (job.data as any).tenant || "default";
    const next = await dequeueInbox(tenant);
    if (!next) {
        log(tenant, "info", "No new clips in inbox.");
        return;
    }

    const id = `${Date.now()}`;
    log(tenant, "info", `Ingested → ${next}`);

    await transcodeQueue.add("transcode", { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });
    await thumbQueue.add("thumbnail", { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });
    await captionQueue.add("caption", { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });

}, { connection });