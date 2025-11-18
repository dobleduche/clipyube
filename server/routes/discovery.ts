// server/routes/discovery.ts
import express, { Request, Response } from "express";
import { discoveryQueue } from "../queues";

export const router = express.Router();

// POST /api/discovery/run
router.post("/run", async (req: Request, res: Response) => {
  try {
    const { niche, platforms, geo = "US" } = req.body;

    if (
      !niche ||
      typeof niche !== "string" ||
      !Array.isArray(platforms) ||
      platforms.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Invalid payload. Required: niche:string, platforms:string[].",
      });
    }

    await discoveryQueue.add(
      "on-demand-discovery",
      { niche, platforms, geo },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 500,
        removeOnFail: 200,
      }
    );

    return res.status(202).json({
      ok: true,
      message:
        "Discovery job accepted. Your trending topics will be processed in the background.",
    });
  } catch (err: any) {
    console.error("Discovery enqueue error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to enqueue discovery job.",
    });
  }
});
