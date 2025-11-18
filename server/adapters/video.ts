// server/adapters/video.ts
import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

export interface RenderOptions {
  resolution?: "1080x1920" | "1920x1080"; // vertical / horizontal
  fps?: number;
  brandWatermarkText?: string;           // e.g., "ClipYube"
}

/**
 * Strip markdown and compress whitespace so we can build subtitles.
 */
function normalizeScript(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/[#>*_`~\-]+/g, " ")    // markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // markdown links
    .replace(/<\/?[^>]+>/g, " ")     // any HTML tags
    .replace(/\s+/g, " ")
    .trim();
}

function formatTime(totalSeconds: number): string {
  const ms = Math.floor((totalSeconds % 1) * 1000);
  const secs = Math.floor(totalSeconds) % 60;
  const mins = Math.floor(totalSeconds / 60) % 60;
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

/**
 * Build a simple SRT from the script + audio duration.
 * We split text into segments that roughly cover the full duration.
 */
async function buildSrtFile(
  script: string,
  durationSeconds: number,
  srtPath: string
): Promise<void> {
  const clean = normalizeScript(script);
  if (!clean) {
    await fs.writeFile(
      srtPath,
      "1\n00:00:00,000 --> 00:00:03,000\n[No transcript]\n",
      "utf8"
    );
    return;
  }

  const words = clean.split(" ");
  const SEGMENT_LENGTH_SEC = 3.0;
  const minSegments = Math.max(1, Math.ceil(durationSeconds / SEGMENT_LENGTH_SEC));
  const wordsPerSegment = Math.max(3, Math.ceil(words.length / minSegments));

  const lines: string[] = [];
  let index = 1;
  let cursor = 0;
  let start = 0;

  while (cursor < words.length) {
    const chunk = words.slice(cursor, cursor + wordsPerSegment);
    cursor += wordsPerSegment;

    const end = Math.min(durationSeconds, start + SEGMENT_LENGTH_SEC);
    const text = chunk.join(" ");

    lines.push(
      String(index++),
      `${formatTime(start)} --> ${formatTime(end)}`,
      text,
      "" // blank line between entries
    );

    start = end;
    if (start >= durationSeconds - 0.3) break;
  }

  await fs.writeFile(srtPath, lines.join("\n"), "utf8");
}

/**
 * Probe audio duration via ffmpeg.
 */
function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      const dur = metadata.format?.duration;
      if (!dur || !Number.isFinite(dur)) return resolve(60); // fallback 60s
      resolve(dur);
    });
  });
}

/**
 * Full cinematic renderer:
 * - Takes your audio + script
 * - Uses a soft-blurred cinematic background (solid color base)
 * - Adds brand watermark text (bottom-right)
 * - Burns in subtitles from the script using SRT
 */
export const renderVideo = async (
  audioPath: string,
  script: string,
  outputFileId: string,
  opts: RenderOptions = {}
): Promise<string> => {
  const { resolution = "1080x1920", fps = 30, brandWatermarkText = "ClipYube" } = opts;

  const [widthStr, heightStr] = resolution.split("x");
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  const tmpDir = path.join(os.tmpdir(), "clipyube_cinematic");
  await fs.mkdir(tmpDir, { recursive: true });

  const outputPath = path.join(tmpDir, `clip_${outputFileId}.mp4`);
  const srtPath = path.join(tmpDir, `subs_${outputFileId}.srt`);

  // 1) Get audio duration
  const durationSeconds = await getAudioDuration(audioPath);

  // 2) Build SRT file from the script
  await buildSrtFile(script, durationSeconds, srtPath);

  return new Promise<string>((resolve, reject) => {
    // We use a nullsrc (solid color) as a base cinematic background.
    // This avoids depending on external stock files but still gives a real visual.
    const filter = [
      // Solid color canvas
      `nullsrc=size=${width}x${height}:duration=${durationSeconds}:rate=${fps},` +
        // soft gradient-ish look: blur + slight vignetting via eq
        "format=yuv420p,",
      "eq=contrast=1.08:brightness=0.03:saturation=1.12,",
      "gblur=sigma=6:steps=2,",
      // brand watermark text
      `drawtext=text='${brandWatermarkText.replace(
        /'/g,
        "\\'"
      )}':fontcolor=white@0.9:fontsize=36:borderw=2:x=w-tw-40:y=h-th-40,`,
      // subtitles burned in from SRT
      `subtitles='${srtPath.replace(/\\/g, "/")}'`
    ].join("");

    const cmd = ffmpeg()
      // Background is generated inside filter, so we use the audio as a single real input
      .input(audioPath)
      .audioCodec("aac")
      .videoCodec("libx264")
      .outputOptions([
        "-preset veryfast",
        "-crf 20",
        "-movflags +faststart",
        "-shortest" // cut to shortest (audio vs video)
      ])
      .complexFilter([
        {
          filter: "color",
          options: {
            size: `${width}x${height}`,
            duration: durationSeconds,
            rate: fps,
            color: "#050816" // deep dark blue-ish
          },
          outputs: "base"
        },
        {
          inputs: "base",
          filter: "format",
          options: "yuv420p",
          outputs: "f0"
        },
        {
          inputs: "f0",
          filter: "eq",
          options: "contrast=1.08:brightness=0.03:saturation=1.12",
          outputs: "f1"
        },
        {
          inputs: "f1",
          filter: "gblur",
          options: "sigma=6:steps=2",
          outputs: "f2"
        },
        {
          inputs: "f2",
          filter: "drawtext",
          options: {
            text: brandWatermarkText,
            fontcolor: "white@0.9",
            fontsize: 36,
            borderw: 2,
            x: "w-tw-40",
            y: "h-th-40"
          },
          outputs: "f3"
        },
        {
          // subtitles burned in from SRT file
          // ffmpeg CLI: -vf subtitles=file.srt
          inputs: "f3",
          filter: "subtitles",
          options: srtPath.replace(/\\/g, "/"),
          outputs: "vfinal"
        }
      ], "vfinal")
      .on("end", async () => {
        resolve(outputPath);
      })
      .on("error", async (err) => {
        reject(err);
      })
      .save(outputPath);

    // Nothing else, ffmpeg runs until "end" or "error"
  });
};
