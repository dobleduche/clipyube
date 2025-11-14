
// server/workers/captionWorker.ts
import { Worker } from "bullmq";
import { redisConnection as connection, captionQueue } from '../queues';
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";

let ai: OpenAI | null = null;

// Lazy-initialization of the OpenAI client for this worker.
// This prevents the worker import from crashing the server on startup if the key is missing.
const getOpenAiClient = (): OpenAI => {
    if (ai) {
        return ai; // Return cached client
    }
    
    if (process.env.OPENAI_API_KEY) {
        ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return ai;
    }
    
    // If we reach here, the key is missing.
    throw new Error("OpenAI API client is not initialized for the caption worker. Please ensure OPENAI_API_KEY is set.");
};

function log(tenant: string, type: "info" | "success" | "error", message: string) {
    console.log(`[CAPTION_WORKER:${tenant}] [${type}] ${message}`);
}

console.log('Starting Caption Worker...');

new Worker(captionQueue.name, async (job) => {
    const { tenant, id, src } = job.data as any;
    log(tenant, "info", "Captioning start");

    const tempFilePath = path.join('/tmp', `caption-video-${id}.tmp`);

    // The getOpenAiClient() call inside the try/catch block will now handle initialization and throw if the key is missing.
    // This check is performed before the potentially long file download.
    try {
        getOpenAiClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : "Configuration error";
        log(tenant, "error", `Captioning failed: ${message}`);
        throw e; // Fail the job immediately
    }

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
        const client = getOpenAiClient(); // Get the initialized client
        const resp = await client.audio.transcriptions.create({
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
}, { connection, concurrency: 2 });
