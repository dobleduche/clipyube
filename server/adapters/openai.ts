import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY environment variable not set. OpenAI adapter will not work.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateTextWithOpenAI = async (prompt: string): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
        console.error('Error generating text with OpenAI:', error);
        throw new Error(`OpenAI API Error: ${(error as Error).message}`);
    }
};