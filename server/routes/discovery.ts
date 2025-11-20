// server/routes/discovery.ts
import express from 'express';
import { discoveryQueue, queuesReady } from '../queues';

export const router = express.Router();

// POST /api/discovery/run
// This endpoint now enqueues a job instead of running the discovery synchronously.
router.post('/run', async (req, res) => {
    // Add guard clause to check for queue system readiness
    if (!queuesReady || !discoveryQueue) {
        return res.status(503).json({ error: 'Queue system is not available. Please ensure Redis is running and configured.' });
    }

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