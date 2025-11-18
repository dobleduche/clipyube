// server/workers/clipThumbnailWorker.ts
import { Worker } from "bullmq";
import { redisConnection } from "../queues";
import { spawn } from "child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

interface ClipThumbnailJobData {
  tenant: string;      // e.g. "default"
  id: string;          // clip id
  inputPath: string;   // local path to transcoded video
  timeSec?: number;    // where to grab the frame, default 1s
}

// small helper to call ffmpeg
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", ...args], { stdio: "inherit" });

    ff.on("error", (err) => {
      console.error("[ffmpeg] spawn error:", err);
      reject(err);
    });

    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

// log to console + Redis stream so SSE can pick it up
const log = async (
  tenant: string,
  type: "info" | "success" | "error",
  message: string
) => {
  const line = `[CLIP_THUMB_WORKER:${tenant}] [${new Date().toISOString()}] [${type}] ${message}`;
  console.log(line);

  try {
    await redisConnection.xadd(
      `logs:${tenant}`,
      "*",
      "type",
      type,
      "message",
      message
    );
  } catch (err) {
    console.error("[CLIP_THUMB_WORKER] Failed to write log to Redis:", err);
  }
};

console.log(`[${new Date().toISOString()}] Clip Thumbnail Worker Online…`);

// queue name must match whatever you use when adding jobs, e.g. "clip-thumbnail"
export const clipThumbnailWorker = new Worker<ClipThumbnailJobData>(
  "clip-thumbnail",
  async (job) => {
    const { tenant, id, inputPath, timeSec = 1 } = job.data;

    if (!tenant || !id || !inputPath) {
      throw new Error(
        `clipThumbnailWorker received invalid payload for job ${job.id}`
      );
    }

    const tmpDir = os.tmpdir();
    await fs.mkdir(tmpDir, { recursive: true }).catch(() => {});
    const thumbPath = path.join(tmpDir, `clipyube_thumb_${id}.jpg`);

    await log(tenant, "info", `thumbnail start for clip ${id}`);

    try {
      await runFfmpeg([
        "-ss",
        String(timeSec),
        "-i",
        inputPath,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        thumbPath,
      ]);

      // this message is what your ClipYubePage UI is listening for
      await log(tenant, "info", "thumbnail saved");

      return { thumbPath };
    } catch (err: any) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      await log(
        tenant,
        "error",
        `Thumbnail failed for job ${job.id} → ${msg}`
      );
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);
