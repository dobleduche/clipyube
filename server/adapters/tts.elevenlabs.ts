// server/adapters/tts.elevenlabs.ts
import { ElevenLabsClient } from "elevenlabs-node";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const textToSpeech = async (
  text: string,
  fileId: string,
  voiceId: string = "EXAVITQu4vr4xnSDxMaL" // ElevenLabs "Rachel" default
): Promise<string> => {

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY not set in environment.");
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // Where the audio file will be stored temporarily
  const outPath = path.join(os.tmpdir(), `tts_${fileId}.mp3`);

  console.log(`[TTS] Generating speech for ${fileId}...`);

  // Call ElevenLabs Text → Speech API
  const audioBuffer = await client.textToSpeech.convert({
    text,
    voice: voiceId,
    model_id: "eleven_multilingual_v2",
    stability: 0.4,
    style: 0.6,
  });

  // Save audio file
  await fs.writeFile(outPath, Buffer.from(audioBuffer));

  console.log(`[TTS] Audio generated: ${outPath}`);

  return outPath;
};
