
import OpenAI from 'openai';

let openai: OpenAI | null = null;

// Lazy-initialization of the OpenAI client.
// This prevents the server from crashing on startup if the key is missing.
const getOpenAiClient = (): OpenAI => {
    if (openai) {
        return openai; // Return cached client
    }
    
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return openai;
    }
    
    // If we reach here, the key is missing.
    throw new Error("OpenAI API client is not initialized. Please ensure the OPENAI_API_KEY environment variable is set correctly on the server.");
};

export const generateTextWithOpenAI = async (prompt: string): Promise<string> => {
    try {
        const client = getOpenAiClient(); // This will initialize or throw
        const response = await client.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
        console.error('Error generating text with OpenAI:', error);
        throw new Error(`OpenAI API Error: ${(error as Error).message}`);
    }
};
