// server/workers/transcodeWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, transcodeQueue } from '../queues';
import ffmpeg from "fluent-ffmpeg";
import path from "node:path";

function log(tenant: string, type: "info" | "success" | "error", message: string) {
    console.log(`[TRANSCODE_WORKER:${tenant}] [${type}] ${message}`);
}

console.log('Starting Transcode Worker...');

new Worker(transcodeQueue.name, async (job) => {
    const { tenant, id, src } = job.data as { tenant: string; id: string; src: string };
    const out = path.resolve(`/tmp/clipyube_${id}.mp4`);
    log(tenant, "info", `Transcode start: ${src}`);
    
    await new Promise<void>((resolve, reject) => {
        ffmpeg(src)
            .videoCodec("libx264")
            .audioCodec("aac")
            .size("?x1080")
            .outputOptions(["-preset veryfast", "-crf 23"])
            .on("end", resolve)
            .on("error", reject)
            .save(out);
    });

    log(tenant, "success", `Transcode done: ${out}`);
}, { connection, concurrency: 2 }); // Limit concurrency for CPU-intensive tasks
