// server/routes/blog.ts
import express from 'express';
import * as db from '../db/index.js';
import { type BlogPost } from '../../types/blog.js';

export const router = express.Router();

/**
 * GET /api/blog
 * Retrieves all blog posts from the database.
 */
router.get('/', (_req, res) => {
    try {
        // The posts are stored newest first, so we reverse for chronological display if needed,
        // but for now, returning as-is is fine (newest first).
        const posts = db.getTable('blogPosts') as BlogPost[];
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * DELETE /api/blog/:slug
 * Deletes a blog post by its slug.
 */
router.delete('/:slug', (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: 'Slug is required.' });
        }
        
        const posts = db.getTable('blogPosts');
        const initialLength = posts.length;
        
        // Filter out the post to be deleted
        const updatedPosts = posts.filter((p: BlogPost) => p.slug !== slug);

        if (updatedPosts.length === initialLength) {
            return res.status(404).json({ error: 'Blog post not found.' });
        }
        
        // This is tricky with an in-memory array. The best way is to replace the array.
        // NOTE: This approach is specific to the in-memory store. A real DB would use a DELETE query.
        posts.length = 0; // Clear the original array
        posts.push(...updatedPosts); // Repopulate with the filtered list

        res.status(200).json({ message: 'Blog post deleted successfully.' });

    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});