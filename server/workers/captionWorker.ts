// server/workers/captionWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, captionQueue, queuesReady } from '../queues.js';
import OpenAI from "openai";
// FIX: Import createWriteStream and createReadStream from `fs`, not `fs/promises`.
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises"; // Use promises API
import path from "node:path";
import os from "node:os";
import http from "node:http";
import https from "node:https";

let ai: OpenAI | null = null;

// Lazy-initialization of the OpenAI client for this worker.
const getOpenAiClient = (): OpenAI => {
  if (ai) return ai; // Return cached client

  if (process.env.OPENAI_API_KEY) {
    ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return ai;
  }

  throw new Error("OpenAI API client is not initialized for the caption worker. Please ensure OPENAI_API_KEY is set.");
};

if (!queuesReady || !connection || !captionQueue) {
  console.warn('[CaptionWorker] Skipping initialization because Redis queues are not ready.');
} else {
  const captionQueueInstance = captionQueue;

interface JobData {
  tenant: string;
  id: string;
  src: string;
}

function log(tenant: string, type: "info" | "success" | "error", message: string) {
  console.log(`[CAPTION_WORKER:${tenant}] [${new Date().toISOString()}] [${type}] ${message}`);
}

  console.log(`[${new Date().toISOString()}] Starting Caption Worker...`);

  new Worker<JobData, void, string>(captionQueueInstance.name, async (job) => {
  const { tenant, id, src } = job.data;
  log(tenant, "info", `Captioning start for job ${job.id}`);

  const tempFilePath = path.join(os.tmpdir(), `caption-video-${id}.tmp`);

  // Initialize OpenAI client and validate before processing
  let client: OpenAI;
  try {
    client = getOpenAiClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration error";
    log(tenant, "error", `Captioning failed: ${message}`);
    throw e; // Fail the job immediately
  }

  // Download file
  await fs.mkdir(os.tmpdir(), { recursive: true }); // Ensure temp dir exists
  const fileStream = createWriteStream(tempFilePath);
  const protocol = src.startsWith('https') ? https : http;

  try {
    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
      protocol.get(src, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to download file: Status Code ${res.statusCode}`));
        } else {
          resolve(res);
        }
      }).on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => resolve());
      fileStream.on('error', (err) => reject(err));
    });

    // Transcribe
    // FIX: Use a ReadStream for the file, which satisfies the `Uploadable` type.
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: "whisper-1",
    });
    const transcript = transcription.text || "[No transcript found]";
    log(tenant, "success", `Transcript for job ${job.id}: ${transcript.slice(0, 80)}…`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error during transcription";
    log(tenant, "error", `Captioning failed for job ${job.id}: ${message}`);
    throw e;
  } finally {
    try {
      await fs.unlink(tempFilePath).catch(() => {}); // Silent fail on cleanup
    } catch (e) {
      log(tenant, "error", `Failed to clean up temp file ${tempFilePath}: ${e instanceof Error ? e.message : e}`);
    }
  }
  }, {
    connection,
    concurrency: 2,
    // Retry logic is handled by defaultJobOptions on the queue.
  });
}
