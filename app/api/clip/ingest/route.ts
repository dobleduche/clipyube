// app/api/clip/ingest/route.ts
import { ingestQueue } from "@/lib/queues";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { url, tenantId = "default" } = await req.json();

    if (!url || typeof url !== "string") {
      return Response.json(
        { error: "Missing or invalid video URL" },
        { status: 400 }
      );
    }

    const clipId = crypto.randomUUID();

    await ingestQueue.add(
      "ingest",
      { url, tenantId, clipId },
      { attempts: 3 }
    );

    return Response.json({ ok: true, clipId });
  } catch (err) {
    console.error("[clips/ingest] Error:", err);
    return Response.json(
      { error: "Failed to enqueue ingest job" },
      { status: 500 }
    );
  }
}
