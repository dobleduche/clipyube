import { Router } from 'express';
import * as llm from '../adapters/llm';
import { GoogleGenAI } from '@google/genai';

export const router = Router();

// In-memory store for video generation tasks
const videoTasks: { [key: string]: any } = {};

// POST /api/generate/text
router.post('/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }
        const text = await llm.generateTextContent(prompt);
        res.json({ text });
    } catch (error) {
        console.error('Text generation error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/generate/image
router.post('/image', async (req, res) => {
    try {
        const { base64Data, mimeType, prompt, operationDescription, styleBase64, styleMimeType } = req.body;
        if (!base64Data || !mimeType || !prompt) {
            return res.status(400).json({ error: 'Missing required fields for image generation.' });
        }
        const imageUrl = await llm.generateImageContent(base64Data, mimeType, prompt, operationDescription, styleBase64, styleMimeType);
        res.json({ imageUrl });
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// POST /api/generate/video
router.post('/video', async (req, res) => {
    try {
        const { prompt, aspectRatio, resolution } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required for video generation.' });
        }
        
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Start the generation but don't wait for it to finish
        const operationPromise = llm.startVideoGeneration(prompt, aspectRatio, resolution);

        videoTasks[taskId] = {
            startTime: Date.now(),
            status: 'queued',
            operationPromise,
            prompt,
        };
        
        res.status(202).json({ taskId });

    } catch (error) {
        console.error('Video generation start error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});


// GET /api/generate/video/stream/:taskId
router.get('/video/stream/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const task = videoTasks[taskId];

    if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: object) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const operation = await task.operationPromise;
        const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        sendEvent({ progress: 'Your video is in the queue. This may take a few minutes...' });
        
        let polledOperation = operation;
        while (!polledOperation.done) {
            sendEvent({ progress: `Rendering video... (${new Date().toLocaleTimeString()})` });
            await new Promise(resolve => setTimeout(resolve, 10000));
            polledOperation = await localAi.operations.getVideosOperation({ operation: polledOperation });
        }

        sendEvent({ progress: 'Video generated! Preparing for download...' });

        const downloadLink = polledOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        // Store the final link to be fetched by the proxy download endpoint
        task.finalDownloadLink = downloadLink;
        
        // Send a proxied URL to the client
        sendEvent({ finalUrl: `/api/generate/download/${taskId}` });

    } catch (error) {
        console.error(`Error in SSE for task ${taskId}:`, error);
        sendEvent({ error: (error as Error).message });
    } finally {
        res.end();
        // Clean up the task after a delay
        setTimeout(() => delete videoTasks[taskId], 60000);
    }
});

// GET /api/generate/download/:taskId
router.get('/download/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const task = videoTasks[taskId];

    if (!task || !task.finalDownloadLink) {
        return res.status(404).json({ error: 'Download link not found or expired.' });
    }

    try {
        const downloadUrlWithKey = `${task.finalDownloadLink}&key=${process.env.API_KEY}`;
        
        // Use node-fetch or a similar library if your environment needs it.
        // The native fetch is available in recent Node.js versions.
        const videoResponse = await fetch(downloadUrlWithKey);

        if (!videoResponse.ok || !videoResponse.body) {
            throw new Error(`Failed to fetch video from source: ${videoResponse.statusText}`);
        }

        res.setHeader('Content-Type', videoResponse.headers.get('Content-Type') || 'video/mp4');
        res.setHeader('Content-Length', videoResponse.headers.get('Content-Length') || '');
        
        // Stream the video body directly to the client response
        const reader = videoResponse.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();

    } catch (error) {
        console.error(`Failed to proxy download for task ${taskId}:`, error);
        res.status(500).send('Failed to download video.');
    }
});
