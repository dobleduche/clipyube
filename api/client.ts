// This file acts as the client-side bridge to the secure backend API.
// It makes fetch requests to the server, which then handles the direct
// interaction with external services like Google Gemini.

const API_BASE_URL = 'api.clipyube.info';

/**
 * A generic helper to call the backend's image generation endpoint.
 */
export const generateImageContent = async (
  base64Data: string,
  mimeType: string,
  prompt: string,
  operationDescription: string,
  styleBase64?: string,
  styleMimeType?: string
): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            base64Data,
            mimeType,
            prompt,
            operationDescription,
            styleBase64,
            styleMimeType,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to perform ${operationDescription}`);
    }

    const data = await response.json();
    return data.imageUrl;
};

/**
 * Calls the backend to generate text content using the Gemini Pro model.
 */
export const generateTextContent = async (prompt: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/generate/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate text content');
    }
    const data = await response.json();
    return data.text;
};

/**
 * Generates a video by starting a task on the backend and listening for progress via SSE.
 */
export const generateVideoWithVeo = (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    resolution: '720p' | '1080p',
    onProgress: (message: string) => void
): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Start the video generation task on the server
            const startResponse = await fetch(`${API_BASE_URL}/api/generate/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, aspectRatio, resolution }),
            });

            if (!startResponse.ok) {
                const errorData = await startResponse.json();
                throw new Error(errorData.error || 'Failed to start video generation task.');
            }

            const { taskId } = await startResponse.json();

            // 2. Connect to the SSE stream for progress updates
            const eventSource = new EventSource(`${API_BASE_URL}/api/generate/video/stream/${taskId}`);
            
            eventSource.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                
                if (data.progress) {
                    onProgress(data.progress);
                }

                if (data.finalUrl) {
                    onProgress("Download started...");
                    // 3. The backend provides a proxied download URL. Fetch it to get the video blob.
                    try {
                        const videoResponse = await fetch(`${API_BASE_URL}${data.finalUrl}`);
                        if (!videoResponse.ok) throw new Error("Failed to download final video.");
                        const videoBlob = await videoResponse.blob();
                        resolve(URL.createObjectURL(videoBlob));
                    } catch (fetchError) {
                        reject(fetchError);
                    } finally {
                        eventSource.close();
                    }
                }

                if (data.error) {
                    reject(new Error(data.error));
                    eventSource.close();
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource failed:", err);
                reject(new Error("Connection to the video generation stream was lost."));
                eventSource.close();
            };

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Simulates generating a video with the Runway API via the backend.
 */
export const generateVideoWithRunway = async (
    prompt: string,
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress('Simulating Runway generation via backend...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    onProgress('This is a mock response.');
    return 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
};

/**
 * Calls the backend to run the viral agent for content discovery.
 */
export const runDiscoveryAgent = async (niche: string, platforms: string[]): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/discovery/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platforms }),
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run discovery agent');
    }
    return response.json();
};

/**
 * Sends a video URL to the backend to be ingested into the processing pipeline.
 */
export const ingestClip = async (url: string, tenant: string = 'default'): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/clips/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tenant }),
    });
};