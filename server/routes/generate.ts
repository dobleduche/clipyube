import express from 'express';
import * as llm from '../adapters/llm';
import { GoogleGenAI } from '@google/genai';
import * as analysisService from '../services/analysisService';
import { sanitizeHtml } from '../../utils/sanitize';

export const router = express.Router();

// In-memory store for video generation tasks
const videoTasks: { [key: string]: any } = {};

// POST /api/generate/text - Generic text generation
// FIX: Use express.Request and express.Response for correct types.
router.post('/text', async (req: express.Request, res: express.Response) => {
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

// POST /api/generate/blog
// New endpoint with server-side validation
// FIX: Use express.Request and express.Response for correct types.
router.post('/blog', async (req: express.Request, res: express.Response) => {
    try {
        const { idea } = req.body;
        if (!idea) {
            return res.status(400).json({ error: 'Content idea is required.' });
        }

        const prompt = `
            You are an expert content creator and SEO specialist. Write a comprehensive, engaging blog post (minimum 1000 words) based on this idea:
            Title: "${idea.title}"
            Brief: "${idea.brief}"
            Keywords: ${idea.keywords.join(', ')}
            The output must be a single block of clean HTML, including <p>, <h3>, <h4>, <ul>, <ol>, <li>, <strong>, and at least 3 authoritative <a> backlinks. Do not include a main <h1> or <h2> title.
        `;
        
        const rawContent = await llm.generateTextContent(prompt, 2); // Allow for retries
        const sanitizedContent = sanitizeHtml(rawContent);

        // Server-side validation
        const validation = analysisService.validateBlogPost(sanitizedContent, idea.keywords);
        if (!validation.isValid) {
            // Log this failure for manual review
            console.warn(`Blog post failed validation for title "${idea.title}". Reasons: ${validation.reasons.join(', ')}`);
            // Here you could trigger a regeneration automatically or just fail
            return res.status(500).json({ 
                error: 'Generated content failed quality checks.',
                details: validation.reasons 
            });
        }
        
        const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const blogPost = {
            slug,
            title: idea.title,
            author: 'AI Agent',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            snippet: idea.brief,
            content: sanitizedContent,
            ...validation.metadata
        };
        
        res.json({ blogPost });

    } catch (error) {
        console.error('Blog generation error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});


// POST /api/generate/image
// FIX: Use express.Request and express.Response for correct types.
router.post('/image', async (req: express.Request, res: express.Response) => {
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
// FIX: Use express.Request and express.Response for correct types.
router.post('/video', async (req: express.Request, res: express.Response) => {
    try {
        const { prompt, aspectRatio, resolution } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required for video generation.' });
        }
        
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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
// FIX: Use express.Request and express.Response for correct types.
router.get('/video/stream/:taskId', async (req: express.Request, res: express.Response) => {
    const { taskId } = req.params;
    const task = videoTasks[taskId];

    if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
    }

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
        
        task.finalDownloadLink = downloadLink;
        sendEvent({ finalUrl: `/api/generate/download/${taskId}` });

    } catch (error) {
        console.error(`Error in SSE for task ${taskId}:`, error);
        sendEvent({ error: (error as Error).message });
    } finally {
        res.end();
        setTimeout(() => delete videoTasks[taskId], 60000);
    }
});

// GET /api/generate/download/:taskId
// FIX: Use express.Request and express.Response for correct types.
router.get('/download/:taskId', async (req: express.Request, res: express.Response) => {
    const { taskId } = req.params;
    const task = videoTasks[taskId];

    if (!task || !task.finalDownloadLink) {
        return res.status(404).json({ error: 'Download link not found or expired.' });
    }

    try {
        const downloadUrlWithKey = `${task.finalDownloadLink}&key=${process.env.API_KEY}`;
        const videoResponse = await fetch(downloadUrlWithKey);

        if (!videoResponse.ok || !videoResponse.body) {
            throw new Error(`Failed to fetch video from source: ${videoResponse.statusText}`);
        }

        res.setHeader('Content-Type', videoResponse.headers.get('Content-Type') || 'video/mp4');
        res.setHeader('Content-Length', videoResponse.headers.get('Content-Length') || '');
        
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