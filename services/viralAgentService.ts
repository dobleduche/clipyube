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

    const response = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platforms, geo }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to dispatch discovery agent.');
    }

    onProgress("Agent successfully dispatched.");
    return response.json();
};