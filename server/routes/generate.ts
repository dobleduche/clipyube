// FIX: Corrected Express type usage to resolve conflicts.
// FIX: Import Request and Response types from express to resolve conflicts with other global types.
import express, { Request, Response } from 'express';
import * as llm from '../adapters/llm';
import * as analysisService from '../services/analysisService';
import { sanitizeHtml } from '../../utils/sanitize';

export const router = express.Router();

// POST /api/generate/text - Generic text generation
// FIX: Use Request and Response types from express.
router.post('/text', async (req: Request, res: Response) => {
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
// FIX: Use Request and Response types from express.
router.post('/blog', async (req: Request, res: Response) => {
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
// FIX: Use Request and Response types from express.
router.post('/image', async (req: Request, res: Response) => {
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

// POST /api/generate/search-images
// FIX: Use Request and Response types from express.
router.post('/search-images', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required for image search.' });
        }
        const images = await llm.generateImages(prompt, 4);
        res.json({ images });
    } catch (error) {
        console.error('Image search error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});
