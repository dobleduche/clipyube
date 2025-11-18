// lib/queues.ts
import { Queue, Worker, JobsOptions } from "bullmq";
import { redis as connection } from "./redis";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

type ClipJobData = {
  tenantId: string;
  clipId: string;
  url?: string;          // original URL
  inputPath?: string;    // transcoded video path
  audioPath?: string;    // extracted audio path
  transcript?: string;   // text transcript
  startSec?: number;     // chosen hook start
  endSec?: number;       // chosen hook end
};

// Queues
export const ingestQueue = new Queue<ClipJobData>("ingest", { connection });
export const transcodeQueue = new Queue<ClipJobData>("transcode", { connection });
export const thumbnailQueue = new Queue<ClipJobData>("thumbnail", { connection });
export const captionQueue = new Queue<ClipJobData>("caption", { connection });
export const hookFinderQueue = new Queue<ClipJobData>("hookfinder", { connection });
export const renderQueue = new Queue<ClipJobData>("renderer", { connection });

// ---------- Helpers ----------

function tmpPath(clipId: string, suffix: string) {
  const dir = process.env.CLIPYUBE_TMP_DIR || "/tmp";
  return path.join(dir, `${clipId}-${suffix}`);
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", ...args], { stdio: "inherit" });
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function log(tenantId: string, type: "info" | "success" | "error", message: string) {
  await connection.xadd(
    `logs:${tenantId}`,
    "*",
    "type",
    type,
    "message",
    message
  );
}

// ---------- AI helpers ----------

async function transcribeAudioWhisper(audioPath: string): Promise<string> {
  if (!openai) throw new Error("OPENAI_API_KEY not set for transcription");

  const file = fs.createReadStream(audioPath);
  const resp = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  // @ts-ignore – OpenAI SDK types; adjust if needed
  return resp.text as string;
}

type HookSegment = { startSec: number; endSec: number; label: string };

async function findHookSegment(transcript: string): Promise<HookSegment> {
  if (!openai) {
    // fallback simple rule if you haven't set a key yet
    return { startSec: 1, endSec: 5, label: "Auto-selected intro hook" };
  }

  const prompt = `
You are a short-form content editor. Given this transcript, pick ONE strong 3–10 second hook segment.
Return ONLY JSON like: {"startSec": 12, "endSec": 18, "label": "Quick benefit statement"}.

Transcript:
${transcript}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { startSec: 1, endSec: 5, label: "Auto-selected hook" };
  }

  return {
    startSec: Number(parsed.startSec) || 1,
    endSec: Number(parsed.endSec) || 5,
    label: typeof parsed.label === "string" ? parsed.label : "Hook",
  };
}

// ---------- Workers (pipeline) ----------

// 1) INGEST: log + hand off to transcode
export const ingestWorker = new Worker<ClipJobData>(
  "ingest",
  async (job) => {
    const { tenantId, clipId, url } = job.data;
    if (!url) throw new Error("Missing URL in ingest job");

    await log(tenantId, "info", `ingested ${url}`);

    // push to transcode
    await transcodeQueue.add(
      "transcode",
      { tenantId, clipId, url },
      { attempts: 3 }
    );
    return { ok: true };
  },
  { connection }
);

// 2) TRANSCODE: URL → standard MP4 + audio track
export const transcodeWorker = new Worker<ClipJobData>(
  "transcode",
  async (job) => {
    const { tenantId, clipId, url } = job.data;
    if (!url) throw new Error("Missing URL in transcode job");

    const videoPath = tmpPath(clipId, "transcoded.mp4");
    const audioPath = tmpPath(clipId, "audio.m4a");

    await log(tenantId, "info", "transcode start");

    // Transcode video (720p H.264)
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
      videoPath,
    ]);

    // Extract audio for transcription
    await runFfmpeg([
      "-i",
      videoPath,
      "-vn",
      "-acodec",
      "aac",
      "-b:a",
      "128k",
      audioPath,
    ]);

    await log(tenantId, "info", "transcode done");

    // Kick off thumbnail + caption in parallel
    const nextData = { tenantId, clipId, inputPath: videoPath, audioPath };

    await Promise.all([
      thumbnailQueue.add("thumbnail", nextData, { attempts: 3 }),
      captionQueue.add("caption", nextData, { attempts: 3 }),
    ]);
  },
  { connection }
);

// 3) THUMBNAIL: grab a frame
export const thumbnailWorker = new Worker<ClipJobData>(
  "thumbnail",
  async (job) => {
    const { tenantId, clipId, inputPath } = job.data;
    if (!inputPath) throw new Error("Missing inputPath in thumbnail job");

    const thumbPath = tmpPath(clipId, "thumb.jpg");

    await log(tenantId, "info", "thumbnail start");

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

    await log(tenantId, "info", "thumbnail saved");
    return { thumbPath };
  },
  { connection }
);

// 4) CAPTION: transcribe → log transcript → hand off to HookFinder
export const captionWorker = new Worker<ClipJobData>(
  "caption",
  async (job) => {
    const { tenantId, clipId, audioPath, inputPath } = job.data;
    if (!audioPath) throw new Error("Missing audioPath in caption job");

    await log(tenantId, "info", "captioning start");

    const transcript = await transcribeAudioWhisper(audioPath);

    // front-end listens for this log prefix to mark Caption stage as done
    await log(tenantId, "info", `transcript: ${transcript.slice(0, 200)}...`);

    // hand off to HookFinder
    await hookFinderQueue.add(
      "hookfinder",
      { tenantId, clipId, transcript, inputPath },
      { attempts: 3 }
    );
  },
  { connection }
);

// 5) HOOKFINDER: find best segment → send to renderer
export const hookFinderWorker = new Worker<ClipJobData>(
  "hookfinder",
  async (job) => {
    const { tenantId, clipId, transcript, inputPath } = job.data;
    if (!transcript || !inputPath)
      throw new Error("Missing transcript or inputPath in hookfinder job");

    await log(tenantId, "info", "hookfinder analyzing");

    const hook = await findHookSegment(transcript);

    await log(
      tenantId,
      "success",
      `hookfinder done: ${hook.label} (${hook.startSec}s–${hook.endSec}s)`
    );

    await renderQueue.add(
      "renderer",
      {
        tenantId,
        clipId,
        inputPath,
        startSec: hook.startSec,
        endSec: hook.endSec,
      },
      { attempts: 3 }
    );
  },
  { connection }
);

// 6) RENDERER: cut final segment
export const renderWorker = new Worker<ClipJobData>(
  "renderer",
  async (job) => {
    const { tenantId, clipId, inputPath, startSec, endSec } = job.data;
    if (!inputPath || startSec == null || endSec == null) {
      throw new Error("Missing render parameters");
    }

    const outPath = tmpPath(clipId, "final.mp4");
    const duration = Math.max(0.5, endSec - startSec);

    await log(tenantId, "info", "renderer starting");

    await runFfmpeg([
      "-ss",
      String(startSec),
      "-t",
      String(duration),
      "-i",
      inputPath,
      "-c",
      "copy",
      outPath,
    ]);

    await log(tenantId, "success", "renderer done");

    // At this point you could upload outPath to S3 and store URL in DB.
    return { outPath };
  },
  { connection }
);
