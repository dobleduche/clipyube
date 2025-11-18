import type { Request, Response } from "express";
import { redisConnection } from "../queues";

export async function sseLogs(req: Request, res: Response) {
  const tenant = req.params.tenantId || "default";
  const redisKey = `logs:${tenant}`;

  // Required SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let cursor = "$"; // "$" = start from new messages only

  const timer = setInterval(async () => {
    try {
      const reply = await redisConnection.xread(
        "BLOCK",
        0,
        "STREAMS",
        redisKey,
        cursor
      );

      if (reply) {
        const [_, entries] = reply[0];

        for (const [id, fields] of entries) {
          cursor = id;

          const obj: any = {};
          for (let i = 0; i < fields.length; i += 2) {
            obj[fields[i]] = fields[i + 1];
          }

          // Send to frontend as SSE
          res.write(`data: ${JSON.stringify(obj)}\n\n`);
        }
      }
    } catch (e) {
      console.error("SSE error:", e);
    }
  }, 50);

  req.on("close", () => {
    clearInterval(timer);
    res.end();
  });
}
