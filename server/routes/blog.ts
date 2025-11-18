// server/routes/blog.ts
import express, { Request, Response } from 'express';
import * as db from '../db';

export const router = express.Router();

/**
 * GET /api/blog
 * Return all blog posts.
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const posts = db.getTable('blogPosts');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/blog/:slug
 * Remove a blog post by slug.
 */
router.delete('/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required.' });
    }

    const posts = db.getTable('blogPosts');
    const initialLength = posts.length;

    const updated = posts.filter((p) => p.slug !== slug);

    if (updated.length === initialLength) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    posts.length = 0;
    posts.push(...updated);

    res.status(200).json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
