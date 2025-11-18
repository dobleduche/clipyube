// app/api/clips/logs/[tenantId]/route.ts
import { redis } from "@/lib/redis";

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string } }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastId = "$";

      while (true) {
        const data = await redis.xread(
          { block: 5000, count: 50 },
          { key: `logs:${params.tenantId}`, id: lastId }
        );

        if (data) {
          for (const [, entries] of data) {
            for (const [id, fields] of entries) {
              lastId = id;
              const payload = {
                type: fields.type as string,
                message: fields.message as string,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
              );
            }
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
