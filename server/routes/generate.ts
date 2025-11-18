// server/routes/generate.ts
import express, { Request, Response } from 'express';
import * as llm from '../adapters/llm';
import * as analysisService from '../services/analysisService';
import { sanitizeHtml } from '../../utils/sanitize';
import * as db from '../db';

export const router = express.Router();

/* ---------------------------------------------
   TEXT GENERATION
--------------------------------------------- */
router.post('/text', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        const text = await llm.generateTextContent(prompt);
        res.json({ text });
    } catch (error: any) {
        console.error('Text generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/* ---------------------------------------------
   BLOG GENERATION
--------------------------------------------- */
router.post('/blog', async (req: Request, res: Response) => {
    try {
        const { idea } = req.body;
        if (!idea) {
            return res.status(400).json({ error: 'Content idea is required.' });
        }

        const prompt = `
            You are an expert content creator and SEO specialist writing for a 7-minute read.
            Produce a comprehensive ~1400-word blog post in clean semantic HTML.
            No <h1> or <h2>.
            
            Title: "${idea.title}"
            Summary: "${idea.brief}"
            Keywords: ${idea.keywords.join(', ')}

            Requirements:
            - Must include at least 3 real authoritative <a href="..."> links.
            - Must use <p>, <h3>, <h4>, <ul>, <ol>, <li>, <strong>.
            - Must be high-quality, factual, and engaging.
        `;

        const raw = await llm.generateTextContent(prompt, 2);
        const sanitized = sanitizeHtml(raw);

        const validation = analysisService.validateBlogPost(sanitized, idea.keywords);

        if (!validation.isValid) {
            console.warn(
                `⛔ Blog post failed validation: ${validation.reasons.join(', ')}`
            );

            return res.status(500).json({
                error: 'Generated content failed quality checks.',
                details: validation.reasons,
            });
        }

        const slug = idea.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const blogPost = {
            slug,
            title: idea.title,
            author: 'AI Agent',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            image:
                'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            snippet: idea.brief,
            content: sanitized,
            ...validation.metadata,
        };

        const posts = db.getTable('blogPosts');

        const existingIndex = posts.findIndex((p: any) => p.slug === slug);

        if (existingIndex === -1) {
            posts.unshift(blogPost);
        } else {
            posts[existingIndex] = blogPost;
        }

        res.json({ blogPost });
    } catch (error: any) {
        console.error('Blog generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/* ---------------------------------------------
   IMAGE GENERATION
--------------------------------------------- */
router.post('/image', async (req: Request, res: Response) => {
    try {
        const {
            base64Data,
            mimeType,
            prompt,
            operationDescription,
            styleBase64,
            styleMimeType,
        } = req.body;

        if (!base64Data || !mimeType || !prompt) {
            return res.status(400).json({
                error: 'Missing required fields for image generation.',
            });
        }

        const imageUrl = await llm.generateImageContent(
            base64Data,
            mimeType,
            prompt,
            operationDescription,
            styleBase64,
            styleMimeType
        );

        res.json({ imageUrl });
    } catch (error: any) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/* ---------------------------------------------
   IMAGE SEARCH
--------------------------------------------- */
router.post('/search-images', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({
                error: 'Prompt is required for image search.',
            });
        }

        const images = await llm.generateImages(prompt, 4);
        res.json({ images });
    } catch (error: any) {
        console.error('Image search error:', error);
        res.status(500).json({ error: error.message });
    }
});
