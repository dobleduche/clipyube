// server/workers/pipelineWorker.ts
import { Worker } from "bullmq";
import { redisConnection, renderQueue, publishQueue } from "../queues";
import { renderDraft, publishDraft } from "../services/pipeline";
import * as db from "../db";

interface PipelineJobData {
  draftId: string;
}

const log = (type: "info" | "success" | "error", msg: string) => {
  const entry = `[PIPELINE_WORKER] [${new Date().toISOString()}] [${type}] ${msg}`;
  console.log(entry);
  db.addAutomationLog(entry, type);
};

console.log(`[${new Date().toISOString()}] Pipeline Workers Online…`);

// ───────────────────────────────────────────
// RENDER WORKER
// ───────────────────────────────────────────
new Worker<PipelineJobData>(
  renderQueue.name,
  async (job) => {
    const { draftId } = job.data;

    if (!draftId) {
      throw new Error(`Render worker received invalid draftId for job ${job.id}`);
    }

    log("info", `Render start → job ${job.id}, draft ${draftId}`);

    try {
      await renderDraft(draftId);

      await publishQueue.add("publish-video", { draftId });

      log(
        "success",
        `Render complete → job ${job.id}, enqueued publish for draft ${draftId}`
      );
    } catch (err: any) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      log("error", `Render failed → job ${job.id}, draft ${draftId}: ${msg}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Rendering is heavy
  }
);

// ───────────────────────────────────────────
// PUBLISH WORKER
// ───────────────────────────────────────────
new Worker<PipelineJobData>(
  publishQueue.name,
  async (job) => {
    const { draftId } = job.data;

    if (!draftId) {
      throw new Error(
        `Publish worker received invalid draftId for job ${job.id}`
      );
    }

    log("info", `Publish start → job ${job.id}, draft ${draftId}`);

    try {
      await publishDraft(draftId);

      log(
        "success",
        `Publish complete → job ${job.id}, draft ${draftId}`
      );
    } catch (err: any) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      log("error", `Publish failed → job ${job.id}, draft ${draftId}: ${msg}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Publishing is light
  }
);
