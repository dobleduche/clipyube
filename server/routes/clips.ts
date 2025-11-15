// server/routes/clips.ts
import express, { Request, Response } from "express";
import { Redis } from "ioredis"; // Ensure ioredis types are installed
import { Queue } from "bull"; // Adjust based on your queue library (e.g., Bull)
import { redisConnection, automationQueue as automationQ } from "../queues";

export const router = express.Router();

const CHANNEL = "clipyube:events";
const INBOX = (t: string = "default") => `clipyube:${t}:inbox`;

// Reuse a single Redis client
const r: Redis = redisConnection;
(async () => {
  try {
    await r.connect(); // Connect directly without isOpen check
  } catch (err) {
    // Don't crash the process; log and continue (routes will 500 if used)
    console.error("[clips] Redis connect failed:", err);
  }
})();

/**
 * POST /api/clips/ingest
 * Body: { url: string; tenant?: string }
 * Push a clip URL into the inbox and nudge the automation queue.
 */
router.post("/ingest", async (req: Request, res: Response) => {
  const { url, tenant = "default" } = (req.body ?? {}) as { url?: string; tenant?: string };
  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "URL is required" });
  }

  try {
    await r.lpush(INBOX(tenant), url); // Use lpush instead of lPush
    // Nudge the automation worker to process inbox now
    await (automationQ as Queue).add("tick", { tenant }, { removeOnComplete: 1000, removeOnFail: 100 });

    return res.status(202).json({ ok: true, message: "Clip ingested and queued for processing." });
  } catch (error: any) {
    console.error("[clips] Ingest error:", error);
    return res.status(500).json({ ok: false, error: "Failed to queue clip." });
  }
});

/**
 * GET /api/clips/logs/:tenant
 * Server-Sent Events stream for real-time logs filtered by tenant.
 */
router.get("/logs/:tenant", async (req: Request, res: Response) => {
  const { tenant } = req.params;

  // Basic SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Disable proxy buffering (nginx/Cloudflare)
  res.setHeader("X-Accel-Buffering", "no");
  // CORS hint if you need cross-origin SSE
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Flush the headers so the stream starts immediately
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  // Create a dedicated sub connection
  const sub: Redis = r.duplicate();
  try {
    await sub.connect(); // Connect directly without isOpen check
  } catch (err) {
    console.error("[clips] SSE subscriber connect failed:", err);
    res.status(500).end();
    return;
  }

  // Emit a hello event so clients know we're live
  res.write(`event: hello\ndata: ${JSON.stringify({ tenant, ok: true })}\n\n`);

  // FIX: Correctly handle pub/sub messages using an event listener.
  const onMessage = (channel: string, message: string) => {
    if (channel !== CHANNEL) return;
    try {
      const log = JSON.parse(message) as { tenant?: string } & Record<string, unknown>;
      if (!tenant || log.tenant === tenant) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
    } catch (e) {
      console.error("[clips] Bad pub/sub payload:", e);
    }
  };
  
  sub.on('message', onMessage);

  try {
    await sub.subscribe(CHANNEL);
  } catch (err) {
    console.error("[clips] Subscribe failed:", err);
    res.status(500).end();
    sub.off('message', onMessage); // Clean up listener on failure
    try {
      await sub.quit();
    } catch {}
    return;
  }

  // Keep-alive to prevent idle disconnects
  const keepAlive = setInterval(() => {
    res.write(`: keep-alive ${Date.now()}\n\n`);
  }, 20000);

  // Cleanup when client disconnects
  const cleanup = async () => {
    clearInterval(keepAlive);
    sub.off('message', onMessage); // Clean up listener
    try {
      await sub.unsubscribe(CHANNEL);
    } catch {}
    try {
      await sub.quit();
    } catch {}
  };
  
  // The 'close' event on the request object is the most reliable way
  // to detect when the client has disconnected.
  req.on("close", cleanup);
});

export default router;
