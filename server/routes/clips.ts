// server/routes/clips.ts
import express, { Request, Response } from "express";
import { Redis } from "ioredis";
import { redisConnection, automationQueue as automationQ } from "../queues";

export const router = express.Router();

const CHANNEL = "clipyube:events";
const INBOX = (t: string = "default") => `clipyube:${t}:inbox`;

const r: Redis = redisConnection;

// POST /api/clips/ingest
router.post("/ingest", async (req: Request, res: Response) => {
  const { url, tenant = "default" } = (req.body ?? {}) as {
    url?: string;
    tenant?: string;
  };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "URL is required" });
  }

  try {
    await r.lpush(INBOX(tenant), url);

    await automationQ.add(
      "tick",
      { tenant },
      { removeOnComplete: 1000, removeOnFail: 100 }
    );

    return res
      .status(202)
      .json({ ok: true, message: "Clip ingested and queued for processing." });
  } catch (error: any) {
    console.error("[clips] Ingest error:", error);
    return res.status(500).json({ ok: false, error: "Failed to queue clip." });
  }
});

// GET /api/clips/logs/:tenant
router.get("/logs/:tenant", async (req: Request, res: Response) => {
  const { tenant } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const sub: Redis = r.duplicate();

  res.write(
    `event: hello\ndata: ${JSON.stringify({ tenant, ok: true })}\n\n`
  );

  const onMessage = (channel: string, message: string) => {
    if (channel !== CHANNEL) return;
    try {
      const log = JSON.parse(message);
      if (!tenant || log.tenant === tenant) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
    } catch (e) {
      console.error("[clips] Bad pub/sub payload:", e);
    }
  };

  sub.on("message", onMessage);

  try {
    await sub.subscribe(CHANNEL);
  } catch (err) {
    console.error("[clips] Subscribe failed:", err);
    res.status(500).end();
    sub.off("message", onMessage);
    try {
      await sub.quit();
    } catch {}
    return;
  }

  const keepAlive = setInterval(() => {
    res.write(`: keep-alive ${Date.now()}\n\n`);
  }, 20000);

  const cleanup = async () => {
    clearInterval(keepAlive);
    sub.off("message", onMessage);
    try {
      await sub.unsubscribe(CHANNEL);
    } catch {}
    try {
      await sub.quit();
    } catch {}
  };

  req.on("close", cleanup);
});

export default router;
