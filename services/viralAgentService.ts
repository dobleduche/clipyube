import { generateTextContent } from "../api/client";

export type ContentIdea = {
    id: string;
    source: string;
    title: string;
    brief: string;
    keywords: string[];
};

/**
 * Calls the Gemini API to generate viral content ideas.
 * @param niche The user-provided content niche.
 * @param platforms The platforms to analyze.
 * @param onProgress A callback to update the UI with progress messages.
 * @returns A promise that resolves with an array of content ideas.
 */
export const runViralAgent = async (
    niche: string,
    platforms: string[],
    onProgress: (message: string) => void
): Promise<ContentIdea[]> => {
    onProgress("Initializing viral agent...");

    const prompt = `
        You are a world-class viral content strategist and SEO expert.
        Your task is to generate 4 unique, high-potential content ideas based on a given niche and a list of platforms to analyze.

        The response MUST be a valid JSON array of objects. Do not include any text, explanation, or markdown formatting like \`\`\`json before or after the JSON array. Your entire response should be only the JSON.

        Each object in the array must have the following structure:
        {
          "source": "string (e.g., 'YouTube Trending', 'Analysis of Google Trends', 'Viral TikTok Concept')",
          "title": "string (A catchy, SEO-friendly title for a video or blog post)",
          "brief": "string (A 2-3 sentence summary of the content idea, explaining the hook and what it's about)",
          "keywords": "string[] (An array of 5-7 relevant SEO keywords)"
        }

        Here is the user's request:
        - Niche: "${niche}"
        - Platforms to analyze: ${platforms.join(', ')}

        Generate the 4 content ideas now.
    `;

    try {
        onProgress("Contacting AI content strategist...");
        const responseJsonString = await generateTextContent(prompt);
        
        onProgress("Parsing AI response...");

        // Clean the response in case the model wraps it in markdown
        const cleanedJson = responseJsonString
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');

        const parsedResults = JSON.parse(cleanedJson) as Omit<ContentIdea, 'id'>[];

        if (!Array.isArray(parsedResults)) {
             throw new Error("AI response was not a valid array.");
        }
        
        // Add unique IDs to each idea
        const resultsWithIds: ContentIdea[] = parsedResults.map(idea => ({
            ...idea,
            id: `idea-${Math.random().toString(36).substr(2, 9)}`
        }));

        onProgress("Analysis complete.");
        return resultsWithIds;

    } catch (error) {
        console.error("Error running viral agent:", error);
        let errorMessage = "Failed to get a valid response from the AI. It might be busy, or the response was malformed.";
        if (error instanceof SyntaxError) {
            errorMessage = "Failed to parse the AI's response. Please try again.";
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
};