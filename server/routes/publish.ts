// server/routes/publish.ts
// FIX: Changed import to default express and use explicit types to avoid global type conflicts.
import express from 'express';

export const router = express.Router();

// POST /api/publish/youtube
// FIX: Used express.Request and express.Response for correct typing.
router.post('/youtube', (req: express.Request, res: express.Response) => {
    const { draftId, title, description } = req.body;
    console.log(`Received request to publish draft ${draftId} to YouTube with title: ${title}`);
    
    // TODO: Implement actual YouTube upload logic in an adapter
    
    res.status(202).json({ 
        message: 'YouTube upload has been queued.',
        external_id: `yt_${Date.now()}`
    });
});

// POST /api/publish/cms
// FIX: Used express.Request and express.Response for correct typing.
router.post('/cms', (req: express.Request, res: express.Response) => {
    const { draftId, content } = req.body;
    console.log(`Received request to publish draft ${draftId} to CMS.`);
    
    // TODO: Implement actual CMS publishing logic
    
    res.status(202).json({
        message: 'CMS publish has been queued.',
        post_url: `https://example.com/blog/post-${Date.now()}`
    });
});