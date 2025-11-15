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
  imageBase64: string,
  imageMimeType: string,
  aspectRatio: '16:9' | '9:16',
  onProgress: ProgressFn
): Promise<string> => {
  if (!process.env.RUNWAY_API_KEY) {
    throw new Error('RUNWAY_API_KEY is not set. This key is required for video generation and should be configured in your environment.');
  }

  const promptImage = `data:${imageMimeType};base64,${imageBase64}`;

  onProgress('Starting Runway image-to-video task (gen4_turbo)…');

  const client = new RunwayML({
    apiKey: process.env.RUNWAY_API_KEY,
  });

  try {
    // Create the task and wait for completion
    const task = await client.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage,               // URL or data URI (base64)
        promptText: prompt,        // your text guidance
        ratio: aspectRatio === '16:9' ? '1280:720' : '720:1280',
        duration: 5,               // seconds (typical 5–10s clips)
      })
      .waitForTaskOutput();        // SDK polls until finished

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