// server/videoWorkers.ts
import { Worker } from "bullmq";
import { spawn } from "child_process";
import path from "path";
import { redisConnection } from "./queues";

// Small helper to run ffmpeg and wrap it in a Promise
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", ...args], { stdio: "inherit" });

    ff.on("error", (err) => {
      console.error("[ffmpeg] spawn error:", err);
      reject(err);
    });

    ff.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

// Example temp path helper
function tmpPath(fileName: string) {
  const dir = process.env.CLIPYUBE_TMP_DIR || "/tmp";
  return path.join(dir, fileName);
}

/**
 * TRANSCODE WORKER
 * Queue name matches your createQueue("transcode")
 */
export const transcodeWorker = new Worker(
  "transcode",
  async (job) => {
    const { url, tenantId = "default", clipId } = job.data as {
      url: string;
      tenantId?: string;
      clipId?: string;
    };

    if (!url) throw new Error("Missing url in transcode job");
    const id = clipId || Date.now().toString();
    const outputPath = tmpPath(`${id}-transcoded.mp4`);

    console.log("[transcode] start", { url, outputPath });

    await runFfmpeg([
      "-i",
      url,
      "-vf",
      "scale=-2:720",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      outputPath,
    ]);

    console.log("[transcode] done", { outputPath });

    // TODO: enqueue thumbnail + caption jobs here if you want chaining:
    // thumbnailQueue.add("thumbnail", { tenantId, clipId: id, inputPath: outputPath });
    // captionQueue.add("caption", { tenantId, clipId: id, inputPath: outputPath });

    return { outputPath };
  },
  { connection: redisConnection }
);

/**
 * THUMBNAIL WORKER
 */
export const thumbnailWorker = new Worker(
  "thumbnail",
  async (job) => {
    const { inputPath, clipId } = job.data as {
      inputPath: string;
      clipId?: string;
    };
    if (!inputPath) throw new Error("Missing inputPath for thumbnail job");

    const id = clipId || Date.now().toString();
    const thumbPath = tmpPath(`${id}-thumb.jpg`);

    console.log("[thumbnail] start", { inputPath, thumbPath });

    await runFfmpeg([
      "-ss",
      "00:00:01",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      thumbPath,
    ]);

    console.log("[thumbnail] saved", { thumbPath });
    return { thumbPath };
  },
  { connection: redisConnection }
);
