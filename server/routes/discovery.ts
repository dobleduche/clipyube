// server/routes/discovery.ts
import express from 'express';
import { discoveryQueue } from '../queues';

export const router = express.Router();

// POST /api/discovery/run
// This endpoint now enqueues a job instead of running the discovery synchronously.
// FIX: Use express.Request and express.Response for correct types.
router.post('/run', async (req: express.Request, res: express.Response) => {
    try {
        const { niche, platforms, geo = 'US' } = req.body;
        if (!niche || !platforms) {
            return res.status(400).json({ error: 'Niche and platforms are required.' });
        }

        // Add a job to the queue for background processing.
        await discoveryQueue.add('on-demand-discovery', { niche, platforms, geo });

        res.status(202).json({ message: 'Discovery agent has been dispatched. Results will be processed in the background.' });
    } catch (error) {
        console.error('Discovery enqueue error:', error);
        res.status(500).json({ error: 'Failed to enqueue discovery job.' });
    }
});