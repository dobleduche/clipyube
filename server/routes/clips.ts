// server/routes/clips.ts
import express from "express";
// FIX: Corrected module imports to point to the right location.
import { redisConnection, automationQueue as automationQ } from "../queues";

export const router = express.Router();

// FIX: Define missing constants that were previously in a non-existent file.
const CHANNEL = "clipyube:events";
const INBOX = (t = "default") => `clipyube:${t}:inbox`;

// Reuse a single Redis client
// FIX: Use the imported redisConnection instance directly instead of calling a non-existent function.
const r = redisConnection;
(async () => {
  try {
    if (!r.isOpen) await r.connect();
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
// FIX: Added explicit Request/Response types to handler to resolve type conflicts.
router.post("/ingest", async (req: express.Request, res: express.Response) => {
  const { url, tenant = "default" } = (req.body ?? {}) as { url?: string; tenant?: string };
  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "URL is required" });
  }

  try {
    await r.lPush(INBOX(tenant), url);
    // Nudge the automation worker to process inbox now
    await automationQ.add("tick", { tenant }, { removeOnComplete: 1000, removeOnFail: 100 });

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
// FIX: Added explicit Request/Response types to handler to resolve type conflicts.
router.get("/logs/:tenant", async (req: express.Request, res: express.Response) => {
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
  const sub = r.duplicate();
  try {
    if (!sub.isOpen) await sub.connect();
  } catch (err) {
    console.error("[clips] SSE subscriber connect failed:", err);
    res.status(500).end();
    return;
  }

  // Emit a hello event so clients know we're live
  res.write(`event: hello\ndata: ${JSON.stringify({ tenant, ok: true })}\n\n`);

  const onMessage = (message: string) => {
    try {
      const log = JSON.parse(message) as { tenant?: string } & Record<string, unknown>;
      if (!tenant || log.tenant === tenant) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
    } catch (e) {
      console.error("[clips] Bad pub/sub payload:", e);
    }
  };

  try {
    await sub.subscribe(CHANNEL, onMessage);
  } catch (err) {
    console.error("[clips] Subscribe failed:", err);
    res.status(500).end();
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
    try {
      await sub.unsubscribe(CHANNEL);
    } catch {}
    try {
      await sub.quit();
    } catch {}
  };
  
  // The 'close' event on the request object is the most reliable way
  // to detect when the client has disconnected.
  // FIX: Explicitly typing 'req' as express.Request provides the '.on' method, fixing the error.
  req.on("close", cleanup);
});

export default router;
