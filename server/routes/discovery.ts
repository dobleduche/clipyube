import { Router } from 'express';
import { runDiscovery } from '../services/discovery';

export const router = Router();

// POST /api/discovery/run
router.post('/run', async (req, res) => {
    try {
        const { niche, platforms } = req.body;
        if (!niche || !platforms) {
            return res.status(400).json({ error: 'Niche and platforms are required.' });
        }
        // In a real app, this service would do the crawling.
        // Here, we're just simulating it and returning mock data.
        const discoveries = await runDiscovery(niche, platforms);
        res.json(discoveries);
    } catch (error) {
        console.error('Discovery run error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});
