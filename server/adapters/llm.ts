import { GoogleGenAI, Modality } from "@google/genai";

// Module-level cache for the client instance. It starts as null.
let aiClientInstance: GoogleGenAI | null = null;

const imageModel = 'gemini-1.5-flash';
const proModel = 'gemini-2.5-pro';

/**
 * Lazily initializes and returns a singleton instance of the GoogleGenAI client.
 * This prevents the server from crashing on startup if the API_KEY is missing.
 * An error will only be thrown when an actual API call is attempted.
 */
const getAiClient = (): GoogleGenAI => {
    // Return the cached instance if it already exists
    if (aiClientInstance) {
        return aiClientInstance;
    }

    // Prioritize GEMINI_API_KEY, fallback to API_KEY for broader compatibility.
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    // If no instance, try to create one
    if (apiKey) {
        // Create the instance and cache it for subsequent calls
        aiClientInstance = new GoogleGenAI({ apiKey });
        return aiClientInstance;
    }

    // If we reach here, the key is missing. Throw a user-friendly error.
    throw new Error("Gemini API client is not initialized. Please ensure either GEMINI_API_KEY or API_KEY environment variable is set correctly on the server.");
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
    const ai = getAiClient();
    const parts: any[] = [
        { inlineData: { data: base64Data, mimeType: mimeType } },
    ];

    if (styleBase64 && styleMimeType) {
        parts.push({ inlineData: { data: styleBase64, mimeType: styleMimeType } });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
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
    const ai = getAiClient();
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await ai.models.generateContent({
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
    const ai = getAiClient();
    const response = await ai.models.generateImages({
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