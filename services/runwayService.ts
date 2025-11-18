// server/adapters/runway.ts
import RunwayML, { TaskFailedError } from '@runwayml/sdk';

type ProgressFn = (message: string) => void;

/**
 * Generate a short video using Runway Gen-4 Turbo.
 * Returns: direct URL to generated MP4.
 */
export const generateVideoWithRunway = async (
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  aspectRatio: '16:9' | '9:16',
  onProgress: ProgressFn
): Promise<string> => {
  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY missing in environment');
  }

  const client = new RunwayML({ apiKey });

  const promptImage = `data:${imageMimeType};base64,${imageBase64}`;

  onProgress('Runway Gen-4 Turbo ➜ Task started…');

  try {
    const task = await client.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage,
        promptText: prompt,
        ratio: aspectRatio === '16:9' ? '1280:720' : '720:1280',
        duration: 5,
      })
      .waitForTaskOutput();

    if (!task?.output?.[0]) {
      throw new Error('Runway returned no output video URL');
    }

    const videoUrl = task.output[0];
    onProgress('Runway task complete ✔');
    return videoUrl;
  } catch (err: any) {
    if (err instanceof TaskFailedError) {
      onProgress('Runway task failed ✖');
      throw new Error(
        `Runway task failed: ${JSON.stringify(err.taskDetails)}`
      );
    }

    onProgress('Runway API error ✖');
    throw err;
  }
};
