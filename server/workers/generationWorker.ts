// server/workers/generationWorker.ts
import { Worker, JobsOptions } from "bullmq";
import {
  redisConnection,
  generationQueue,
  renderQueue,
  thumbnailQueue,
} from "../queues";
import { buildDrafts } from "../services/generation";
import * as db from "../db";

interface Draft {
  id: string;
  [key: string]: unknown;
}

interface GenerationJobData {
  // Extend later if you want job-level config
}

const log = (type: "info" | "success" | "error", msg: string) => {
  const line = `[GENERATION_WORKER] [${new Date().toISOString()}] [${type}] ${msg}`;
  console.log(line);
  db.addAutomationLog(line, type);
};

console.log(`[${new Date().toISOString()}] Generation Worker Online…`);

const jobOpts: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 500,
  removeOnFail: 100,
};

new Worker<GenerationJobData, void>(
  generationQueue.name,
  async (job) => {
    log("info", `Processing job ${job.id} — building drafts…`);

    try {
      const drafts = (await buildDrafts()) as Draft[];

      if (!drafts || drafts.length === 0) {
        log("info", `Job ${job.id}: No new drafts generated.`);
        return;
      }

      for (const draft of drafts) {
        if (!draft.id) {
          throw new Error(
            `Invalid draft object returned: ${JSON.stringify(draft)}`
          );
        }

        await renderQueue.add("render-video", { draftId: draft.id }, jobOpts);
        await thumbnailQueue.add(
          "generate-thumbnail",
          { draftId: draft.id },
          jobOpts
        );
      }

      log(
        "success",
        `Job ${job.id}: Enqueued ${drafts.length} render + thumbnail jobs.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      log("error", `Job ${job.id} failed: ${message}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
