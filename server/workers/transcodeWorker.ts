import { Worker } from "bullmq";
import { redisConnection as connection } from "../queues";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "child_process";

interface TranscodeJobData {
  tenant: string;
  id: string;
  src: string;
}

const log = (
  tenant: string,
  type: "info" | "success" | "error",
  message: string
) => {
  console.log(
    `[TRANSCODE_WORKER:${tenant}] [${new Date().toISOString()}] [${type}] ${message}`
  );
};
const clipThumbnailQueue = new Queue<ClipThumbnailJobData>("clip-thumbnail", {
  connection: redisConnection,
  });
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", ...args], { stdio: "inherit" });

    ff.on("error", (err) => {
      console.error("[ffmpeg] spawn error:", err);
      reject(err);
    });

    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

console.log(`[${new Date().toISOString()}] Transcode Worker Online…`);

export const transcodeWorker = new Worker<TranscodeJobData>(
  "transcode",
  async (job) => {
    const { tenant, id, src } = job.data;

    const tempDir = os.tmpdir();
    const outFile = path.join(tempDir, `clipyube_${id}.mp4`);

    log(tenant, "info", `Starting transcode job ${job.id} → ${src}`);

    await fs.mkdir(tempDir, { recursive: true }).catch(() => {});

    try {
      await runFfmpeg([
        "-i",
        src,
        "-vf",
        "scale=-2:1080",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        outFile,
      ]);

      log(tenant, "success", `Transcoding complete → ${outFile}`);
await clipThumbnailQueue.add("make-thumb", {
  tenant,          // e.g. "default"
  id,              // clip id
  inputPath: outFile,
  timeSec: 1,      // optional
});
      return { outFile };
    } catch (err) {
      const msg =
        err instanceof Error
          ? `${err.message}\nStack: ${err.stack}`
          : String(err);

      log(tenant, "error", `Transcode failed for job ${job.id}: ${msg}`);
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);
