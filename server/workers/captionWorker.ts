// server/workers/captionWorker.ts
import { Worker } from "bullmq";
import { captionQueue, redisConnection } from "../queues";
import OpenAI from "openai";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import https from "node:https";

interface CaptionJob {
  tenant: string;
  id: string;
  src: string; // can be a remote URL or a local file path
}

let client: OpenAI | null = null;

const getClient = () => {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing — caption worker cannot run.");
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

// Send logs both to console and to Redis stream for SSE
const log = (
  tenant: string,
  type: "info" | "success" | "error",
  msg: string
) => {
  const line = `[CAPTION_WORKER:${tenant}] [${new Date().toISOString()}] [${type}] ${msg}`;
  console.log(line);

  // Fire-and-forget; don't block worker on logging
  void redisConnection
    .xadd(`logs:${tenant}`, "*", "type", type, "message", msg)
    .catch((err) => {
      console.error("[CAPTION_WORKER] Failed to write log to Redis:", err);
    });
};

console.log(`[${new Date().toISOString()}] Caption Worker Online…`);

export const captionWorker = new Worker<CaptionJob>(
  captionQueue.name,
  async (job) => {
    const { tenant, id, src } = job.data;

    log(tenant, "info", `Beginning caption task → job ${job.id}`);
    // 🔑 This is what your UI listens for to mark Caption as "running"
    log(tenant, "info", "captioning start");

    const tempFile = path.join(os.tmpdir(), `caption-${id}.mp4`);
    let openai: OpenAI;

    try {
      openai = getClient();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      log(tenant, "error", msg);
      throw err;
    }

    await fs.mkdir(os.tmpdir(), { recursive: true });

    // Decide whether we need to download or just use local path
    let localPath = src;

    if (src.startsWith("http://") || src.startsWith("https://")) {
      // Remote URL → download to tmp
      const fileStream = createWriteStream(tempFile);
      const proto = src.startsWith("https") ? https : http;

      try {
        const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
          proto
            .get(src, (response) => {
              if (response.statusCode !== 200) {
                response.resume();
                reject(
                  new Error(
                    `Download failed: HTTP ${response.statusCode} for ${src}`
                  )
                );
              } else {
                resolve(response);
              }
            })
            .on("error", reject);
        });

        await new Promise<void>((resolve, reject) => {
          res.pipe(fileStream);
          fileStream.on("finish", resolve);
          fileStream.on("error", reject);
        });

        localPath = tempFile;
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        log(
          tenant,
          "error",
          `Caption job ${job.id} failed during download → ${msg}`
        );
        throw err;
      }
    }

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(localPath),
        model: "whisper-1",
      });

      const text = transcription.text || "";
      log(
        tenant,
        "success",
        `Transcription OK for job ${job.id}: ${text.slice(0, 100)}…`
      );

      // 🔑 This exact prefix is what your UI uses to mark Caption as "done"
      log(tenant, "info", `transcript: ${text}`);

      // TODO: enqueue HookFinder or save transcript to DB if needed
      return { transcript: text };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      log(tenant, "error", `Caption job ${job.id} failed → ${msg}`);
      throw err;
    } finally {
      // Cleanup only the temp file we created, not arbitrary local src
      if (localPath === tempFile) {
        await fs.unlink(tempFile).catch(() => {});
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);
