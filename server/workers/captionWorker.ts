// server/workers/captionWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, captionQueue } from '../queues';
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function log(tenant: string, type: "info" | "success" | "error", message: string) {
    console.log(`[CAPTION_WORKER:${tenant}] [${type}] ${message}`);
}

console.log('Starting Caption Worker...');

new Worker(captionQueue.name, async (job) => {
    const { tenant, id, src } = job.data as any;
    log(tenant, "info", "Captioning start");

    const tempFilePath = path.join('/tmp', `caption-video-${id}.tmp`);
    const fileStream = fs.createWriteStream(tempFilePath);
    const client = src.startsWith('https') ? https : http;

    await new Promise<void>((resolve, reject) => {
        client.get(src, (response) => {
            const { statusCode } = response;
            if (statusCode !== 200) {
                response.resume();
                fileStream.close(() => fs.unlink(tempFilePath, () => {}));
                return reject(new Error(`Failed to download file: Status Code ${statusCode}`));
            }
            response.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close((err) => err ? reject(err) : resolve()));
            fileStream.on('error', (err) => {
                fs.unlink(tempFilePath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(tempFilePath, () => {});
            reject(err);
        });
    });

    try {
        const resp = await ai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1"
        });
        const transcript = resp.text || "[No transcript found]";
        log(tenant, "success", `Transcript: ${transcript.slice(0, 80)}…`);
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error during transcription";
        log(tenant, "error", `Captioning failed: ${message}`);
        throw e;
    } finally {
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error(`Failed to delete temp file ${tempFilePath}:`, err);
        });
    }
}, { connection, concurrency: 2 }); // Limit concurrency for this intensive task