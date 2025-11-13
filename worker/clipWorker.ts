import { Worker } from "bullmq";
import IORedis from "ioredis";
import { redis, CHANNEL, INBOX } from "lib/redis";
import { Q_AUTOMATION, Q_TRANSCODE, Q_THUMBNAIL, Q_CAPTION, transcodeQ, thumbQ, captionQ } from "lib/queues";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

const conn = new IORedis(process.env.REDIS_URL!);
const r = redis(); r.connect().catch(()=>{});
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function log(tenant:string, type:"info"|"success"|"error", message:string) {
  r.publish(CHANNEL, JSON.stringify({ timestamp:new Date().toISOString(), type, message, tenant }));
}

async function dequeueInbox(tenant:string) {
  const url = await r.rPop(INBOX(tenant)); // FIFO
  return url as string | null;
}

// --- AUTOMATION: pull from inbox and fan-out jobs
new Worker(Q_AUTOMATION, async (job) => {
  const tenant = (job.data as any).tenant || "default";
  const next = await dequeueInbox(tenant);
  if (!next) { log(tenant,"info","No new clips in inbox."); return; }

  const id = `${Date.now()}`;
  log(tenant,"info",`Ingested → ${next}`);

  await transcodeQ.add("transcode", { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });
  await thumbQ.add("thumbnail",     { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });
  await captionQ.add("caption",     { tenant, id, src: next }, { removeOnComplete: 500, removeOnFail: 100 });

}, { connection: conn });

// --- TRANSCODE
new Worker(Q_TRANSCODE, async (job) => {
  const { tenant, id, src } = job.data as { tenant:string; id:string; src:string };
  const out = path.resolve(`/tmp/clipyube_${id}.mp4`);
  log(tenant,"info",`Transcode start: ${src}`);
  await new Promise<void>((resolve, reject) => {
    ffmpeg(src).videoCodec("libx264").audioCodec("aac").size("?x1080").outputOptions(["-preset veryfast","-crf 23"])
      .on("end", resolve).on("error", reject).save(out);
  });
  log(tenant,"success",`Transcode done: ${out}`);
}, { connection: conn, concurrency: 2 }); // Limit concurrency for CPU-intensive tasks

// --- THUMBNAIL (grab at 1s)
new Worker(Q_THUMBNAIL, async (job) => {
  const { tenant, id, src } = job.data as any;
  const outDir = `/tmp/thumbs_${id}`;
  fs.mkdirSync(outDir, { recursive: true });
  log(tenant,"info","Thumbnail start");
  await new Promise<void>((resolve, reject) => {
    ffmpeg(src).on("end", resolve).on("error", reject).screenshots({ timestamps: ["00:00:01"], filename: "thumb-%i.png", folder: outDir, size:"640x?" });
  });
  log(tenant,"success",`Thumbnail saved: ${outDir}`);
}, { connection: conn });

// --- CAPTION via OpenAI Whisper
new Worker(Q_CAPTION, async (job) => {
  const { tenant, id, src } = job.data as any;
  log(tenant,"info","Captioning start");
  try {
    // For remote URLs, you may need to download to tmp first; if local path, pass as file
    const resp = await ai.audio.transcriptions.create({ file: src, model: "whisper-1" });
    // Persist resp.text to DB; demo logs only
    const transcript = resp.text || "[No transcript found]";
    log(tenant,"success",`Transcript: ${transcript.slice(0,80)}…`);
  } catch(e) {
    const message = e instanceof Error ? e.message : "Unknown error during transcription";
    log(tenant, "error", `Captioning failed: ${message}`);
    throw e; // Re-throw to mark job as failed
  }
}, { connection: conn });

console.log("ClipYube workers started.");