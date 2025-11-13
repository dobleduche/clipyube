// runway.ts
import RunwayML, { TaskFailedError } from '@runwayml/sdk';

type ProgressFn = (message: string) => void;

/**
 * Generates a short video using Runway Gen-4 Turbo.
 * Requires: process.env.RUNWAY_API_KEY
 * Returns: direct URL to the generated video.
 */
export const generateVideoWithRunway = async (
  prompt: string,
  onProgress: ProgressFn
): Promise<string> => {
  if (!process.env.RUNWAY_API_KEY) {
    throw new Error('RUNWAY_API_KEY is not set');
  }

  // Any valid image URL or data URI works. Replace with your own source/frame when available.
  // (Runway’s image_to_video requires an input image; SDK handles upload/URL) :contentReference[oaicite:0]{index=0}
  const promptImage =
    'https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_(cropped).jpg';

  onProgress('Starting Runway image-to-video task (gen4_turbo)…');

  const client = new RunwayML({
    apiKey: process.env.RUNWAY_API_KEY,
    // version is optional; the SDK defaults to the latest if unset
    version: (process.env.RUNWAY_API_KEY as any) || '2024-11-06',
  });

  try {
    // Create the task and wait for completion
    const task = await client.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage,               // URL or data URI (base64)
        promptText: prompt,        // your text guidance
        ratio: '1280:720',         // 16:9 (see docs for valid ratios)
        duration: 5,               // seconds (typical 5–10s clips)
      })
      .waitForTaskOutput();        // SDK polls until finished :contentReference[oaicite:1]{index=1}

    // The SDK returns an object with output URLs (first is the final mp4)
    if (!task?.output?.[0]) {
      throw new Error('Runway task completed without an output URL');
    }

    const videoUrl = task.output[0];
    onProgress('Video generation complete.');
    return videoUrl;
  } catch (err: any) {
    if (err instanceof TaskFailedError) {
      // Includes full task details from Runway (useful for logging)
      onProgress('Runway task failed.');
      throw new Error(
        `Runway generation failed: ${JSON.stringify(err.taskDetails)}`
      );
    }
    onProgress('Runway API error.');
    throw err;
  }
};
