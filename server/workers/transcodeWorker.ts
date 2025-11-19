// server/workers/transcodeWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, transcodeQueue } from '../queues';
import Ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises"; // Use promises API

interface TranscodeJobData {
  tenant: string;
  id: string;
  src: string;
}

function log(tenant: string, type: "info" | "success" | "error", message: string) {
  console.log(`[TRANSCODE_WORKER:${tenant}] [${new Date().toISOString()}] [${type}] ${message}`);
}

console.log(`[${new Date().toISOString()}] Starting Transcode Worker...`);

new Worker<TranscodeJobData, void, string>(transcodeQueue.name, async (job) => {
  const { tenant, id, src } = job.data;
  const out = path.join(os.tmpdir(), `clipyube_${id}.mp4`);
  log(tenant, "info", `Transcode start for job ${job.id}: ${src}`);

  await fs.mkdir(os.tmpdir(), { recursive: true }); // Ensure temp dir exists

  try {
    await new Promise<void>((resolve, reject) => {
      Ffmpeg(src)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("?x1080")
        .outputOptions(["-preset veryfast", "-crf 23"])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(out);
    });

    log(tenant, "success", `Transcode done for job ${job.id}: ${out}`);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\nStack: ${error.stack}` : "Unknown error";
    log(tenant, "error", `Transcode failed for job ${job.id}: ${message}`);
    throw error;
  } finally {
    try {
      await fs.unlink(out).catch(() => {}); // Silent fail on cleanup if file doesn't exist
    } catch (e) {
      log(tenant, "error", `Failed to clean up temp file ${out} for job ${job.id}: ${e instanceof Error ? e.message : e}`);
    }
  }
}, {
  connection,
  concurrency: 2, // Limit concurrency for CPU-intensive tasks
  // FIX: Removed invalid 'settings' property. Retry logic is handled by defaultJobOptions on the queue.
});
