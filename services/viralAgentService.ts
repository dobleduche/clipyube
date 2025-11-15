import { runViralAgentRequest } from '../api/client';

export type ContentIdea = {
    id: string;
    source: string;
    title: string;
    brief: string;
    keywords: string[];
};

/**
 * Calls the backend to enqueue a viral content discovery job.
 * @param niche The user-provided content niche.
 * @param platforms The platforms to analyze.
 * @param geo The target country code (e.g., 'US').
 * @param onProgress A callback to update the UI with progress messages.
 * @returns A promise that resolves with a success message from the server.
 */
export const runViralAgent = async (
    niche: string,
    platforms: string[],
    geo: string,
    onProgress: (message: string) => void
): Promise<{ message: string }> => {
    onProgress("Dispatching agent to the discovery queue...");

    const result = await runViralAgentRequest(niche, platforms, geo);

    onProgress("Agent successfully dispatched.");
    return result;
};
