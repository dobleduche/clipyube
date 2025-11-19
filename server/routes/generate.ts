// FIX: Changed import to default express and use explicit types to avoid global type conflicts.
import express from 'express';
import * as llm from '../adapters/llm';
import * as analysisService from '../services/analysisService';
import { sanitizeHtml } from '../../utils/sanitize';
import * as db from '../db';
import { BlogPost } from '../../pages/BlogPage';
import { ContentIdea } from '../../services/viralAgentService';

export const router = express.Router();

// POST /api/generate/text
// FIX: Used express.Request and express.Response for correct typing.
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
// FIX: Used express.Request and express.Response for correct typing.
router.post('/blog', async (req: express.Request, res: express.Response) => {
  try {
    const { idea }: { idea: ContentIdea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: 'Content idea is required.' });
    }

    const prompt = `
      You are an expert content creator and SEO specialist writing for a 7-minute read time. Your task is to write a comprehensive, engaging blog post of approximately 1400 words based on this grounded idea:
      Title: "${idea.title}"
      Brief/Summary of Source Material: "${idea.brief}"
      Keywords to include naturally: ${idea.keywords.join(', ')}
      
      The output must be a single block of clean, well-structured HTML. Use tags like <p>, <h3>, <h4>, <ul>, <ol>, <li>, and <strong>.
      Crucially, you must include at least 3 authoritative <a> backlinks to relevant, real-world sources that support the content.
      Do not include a main <h1> or <h2> title tag in your output.
    `;

    const rawContent = await llm.generateTextContent(prompt, 2); // Allow for retries
    const sanitizedContent = sanitizeHtml(rawContent);

    const validation = analysisService.validateBlogPost(sanitizedContent, idea.keywords);
    if (!validation.isValid) {
      console.warn(
        `Blog post failed validation for title "${idea.title}". Reasons: ${validation.reasons.join(', ')}`
      );
      return res.status(500).json({
        error: 'Generated content failed quality checks.',
        details: validation.reasons,
      });
    }

    const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const blogPost: BlogPost = {
      slug,
      title: idea.title,
      author: 'AI Agent',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      snippet: idea.brief,
      content: sanitizedContent,
      ...validation.metadata,
    };

    const existingPosts = db.getTable('blogPosts');
    if (!existingPosts.some((p) => p.slug === blogPost.slug)) {
      existingPosts.unshift(blogPost);
    } else {
      const index = existingPosts.findIndex((p) => p.slug === blogPost.slug);
      if (index !== -1) {
        existingPosts[index] = blogPost;
      }
    }

    res.json({ blogPost });
  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/generate/image
// FIX: Used express.Request and express.Response for correct typing.
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

// POST /api/generate/search-images
// FIX: Used express.Request and express.Response for correct typing.
router.post('/search-images', async (req: express.Request, res: express.Response) => {
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