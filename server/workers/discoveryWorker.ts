// server/workers/discoveryWorker.ts
import { Worker } from "bullmq";
import {
  redisConnection,
  discoveryQueue,
  generationQueue,
} from "../queues";
import { runDiscovery } from "../services/discovery";
import * as db from "../db";

interface DiscoveryJobData {
  niche?: string;
  platforms?: string[];
  geo?: string;
}

interface DiscoveryResult {
  id: string;
  topic: string;
  score: number;
  status: string;
  [key: string]: any;
}

const log = (type: "info" | "success" | "error", msg: string) => {
  const line = `[DISCOVERY_WORKER] [${new Date().toISOString()}] [${type}] ${msg}`;
  console.log(line);
  db.addAutomationLog(line, type);
};

console.log(
  `[${new Date().toISOString()}] Discovery Worker Online…`
);

new Worker<DiscoveryJobData>(
  discoveryQueue.name,
  async (job) => {
    const { niche: jobNiche, platforms: jobPlatforms, geo: jobGeo } = job.data;

    const settings = db.getSettings();
    const niche = jobNiche || settings.defaultNiche;
    const platforms = jobPlatforms || ["google", "youtube", "tiktok"];
    const geo = jobGeo || "US";

    if (!niche) throw new Error("Niche is required.");
    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new Error("Platforms must be a non-empty array.");
    }

    log(
      "info",
      `Job ${job.id}: Running discovery → niche="${niche}", geo="${geo}", platforms=[${platforms.join(
        ", "
      )}]`
    );

    try {
      const discoveries: DiscoveryResult[] = await runDiscovery(
        niche,
        platforms,
        geo
      );

      if (discoveries.length > 0) {
        await generationQueue.add("generate-drafts", {});
        log(
          "success",
          `Job ${job.id}: Found ${discoveries.length} new topics → Enqueued generation job.`
        );
      } else {
        log("info", `Job ${job.id}: No new discoveries.`);
      }
    } catch (err: any) {
      const message =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      log("error", `Job ${job.id} FAILED → ${message}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
