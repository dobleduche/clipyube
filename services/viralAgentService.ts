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
  const safeNiche = niche?.trim() || 'General';
  const safePlatforms = platforms && platforms.length > 0 ? platforms : ['twitter'];
  const safeGeo = geo || 'US';

  onProgress('Dispatching agent to the discovery queue…');

  const payload = {
    niche: safeNiche,
    platforms: safePlatforms,
    geo: safeGeo,
  };

  try {
    const result = await runViralAgentRequest(payload);

    onProgress('Agent successfully dispatched. Check the Automation Dashboard for live activity.');

    return result;
  } catch (err: any) {
    const msg =
      err?.message ||
      'Failed to dispatch viral agent. Please try again or check your server/automation logs.';

    console.error('[runViralAgent] Error:', err);
    onProgress(`Error: ${msg}`);

    // Re-throw so the caller can show a toast, dialog, etc.
    throw err;
  }
};
