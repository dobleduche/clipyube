// server/routes/blog.ts
// FIX: Changed import to default express and use explicit types to avoid global type conflicts.
import express from 'express';
import * as db from '../db';

export const router = express.Router();

/**
 * GET /api/blog
 * Retrieves all blog posts from the database.
 */
// FIX: Used express.Request and express.Response for correct typing.
router.get('/', (_req: express.Request, res: express.Response) => {
    try {
        // The posts are stored newest first, so we reverse for chronological display if needed,
        // but for now, returning as-is is fine (newest first).
        const posts = db.getTable('blogPosts');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * DELETE /api/blog/:slug
 * Deletes a blog post by its slug.
 */
// FIX: Used express.Request and express.Response for correct typing.
router.delete('/:slug', (req: express.Request, res: express.Response) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: 'Slug is required.' });
        }
        
        const posts = db.getTable('blogPosts');
        const initialLength = posts.length;
        
        // Filter out the post to be deleted
        const updatedPosts = posts.filter(p => p.slug !== slug);

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