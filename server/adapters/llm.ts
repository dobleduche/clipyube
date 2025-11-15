import { GoogleGenAI, Modality } from "@google/genai";

let ai: GoogleGenAI | null = null;

const imageModel = 'gemini-2.5-flash-image';
const proModel = 'gemini-2.5-pro';

/**
 * Helper function to lazily initialize and get the GoogleGenAI client.
 * Throws a user-friendly error if the API key is missing.
 */
const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai; // Return cached client
    }

    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return ai;
    }

    // If we reach here, the key is missing.
    throw new Error("Gemini API client is not initialized. Please ensure the API_KEY environment variable is set correctly on the server.");
};

/**
 * A generic helper to call the Gemini API for image generation on the server.
 */
export const generateImageContent = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  operationDescription: string,
  styleBase64?: string,
  styleMimeType?: string
): Promise<string> => {
  try {
    const localAi = getAiClient();
    const parts: any[] = [
        { inlineData: { data: base64Data, mimeType: mimeType } },
    ];

    if (styleBase64 && styleMimeType) {
        parts.push({ inlineData: { data: styleBase64, mimeType: styleMimeType } });
    }

    parts.push({ text: prompt });

    const response = await localAi.models.generateContent({
      model: imageModel,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (responseParts) {
        for (const part of responseParts) {
            if (part.inlineData) {
              const newMimeType = part.inlineData.mimeType;
              const newBase64Data = part.inlineData.data;
              return `data:${newMimeType};base64,${newBase64Data}`;
            }
        }
    }
    
    throw new Error(`Gemini API did not return an image for ${operationDescription}.`);

  } catch (error) {
    console.error(`Error in LLM adapter for ${operationDescription}:`, error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error during ${operationDescription}: ${error.message}`);
    }
    throw new Error(`An unknown Gemini API error occurred during ${operationDescription}.`);
  }
};

/**
 * Generates text content on the server with retry logic.
 */
export const generateTextContent = async (prompt: string, retries = 1): Promise<string> => {
    const localAi = getAiClient();
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await localAi.models.generateContent({
                model: proModel,
                contents: prompt,
            });
            return response.text.trim();
        } catch (error) {
            console.error(`Error in LLM adapter for text generation (attempt ${i + 1}):`, error);
            lastError = error instanceof Error ? error : new Error('Unknown API error');
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // simple backoff
            }
        }
    }
    throw new Error(`Gemini API Error after ${retries} attempts: ${lastError?.message}`);
};

/**
 * Generates images from a text prompt using Imagen.
 */
export const generateImages = async (prompt: string, numberOfImages: number = 4): Promise<string[]> => {
  try {
    const localAi = getAiClient();
    const response = await localAi.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('Imagen API did not return any images.');
    }

    return response.generatedImages.map(img => img.image.imageBytes);
  } catch (error) {
    console.error(`Error in LLM adapter for image generation:`, error);
    if (error instanceof Error) {
        throw new Error(`Imagen API Error: ${error.message}`);
    }
    throw new Error(`An unknown Imagen API error occurred.`);
  }
};