// server/routes/publish.ts
import express, { Request, Response } from 'express';

export const router = express.Router();

// POST /api/publish/youtube
router.post('/youtube', async (req: Request, res: Response) => {
    try {
        const { draftId, title, description } = req.body;

        if (!draftId) return res.status(400).json({ error: "draftId is required." });

        console.log(
            `[PUBLISH] Queue YouTube upload → draftId=${draftId}, title="${title}"`
        );

        res.status(202).json({
            ok: true,
            message: "YouTube upload has been queued.",
            external_id: `yt_${Date.now()}`,
        });
    } catch (err: any) {
        console.error("[PUBLISH] YouTube handler error:", err);
        res.status(500).json({ error: err.message || "Internal error." });
    }
});

// POST /api/publish/cms
router.post('/cms', async (req: Request, res: Response) => {
    try {
        const { draftId, content } = req.body;

        if (!draftId) return res.status(400).json({ error: "draftId is required." });

        console.log(`[PUBLISH] Queue CMS publish → draftId=${draftId}`);

        res.status(202).json({
            ok: true,
            message: "CMS publish has been queued.",
            post_url: `https://example.com/blog/post-${Date.now()}`,
        });
    } catch (err: any) {
        console.error("[PUBLISH] CMS handler error:", err);
        res.status(500).json({ error: err.message || "Internal error." });
    }
});
