// server/workers/thumbnailWorker.ts  (automation thumbnails)
import { Worker } from "bullmq";
import { redisConnection, thumbnailQueue } from "../queues";
import { generateThumbnail } from "../services/thumbnailService";
import * as db from "../db";

interface ThumbnailJobData {
  draftId: string;
}

const log = (type: "info" | "success" | "error", msg: string) => {
  const entry = `[THUMB_WORKER] [${new Date().toISOString()}] [${type}] ${msg}`;
  console.log(entry);
  db.addAutomationLog(entry, type);
};

console.log(`[${new Date().toISOString()}] Thumbnail Worker Online…`);

new Worker<ThumbnailJobData>(
  thumbnailQueue.name,
  async (job) => {
    const { draftId } = job.data;

    if (!draftId) {
      throw new Error(
        `thumbnailWorker received invalid draftId for job ${job.id}`
      );
    }

    log("info", `Processing job ${job.id} → draft ${draftId}`);

    try {
      await generateThumbnail(draftId);
      log(
        "success",
        `Thumbnail generated for job ${job.id} → draft ${draftId}`
      );
    } catch (err: any) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);

      log(
        "error",
        `Thumbnail failed for job ${job.id} → draft ${draftId}: ${msg}`
      );
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // thumbnail generation is lightweight
  }
);
