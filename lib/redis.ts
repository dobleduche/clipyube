// clipyube/lib/redis.ts
import { createClient } from 'redis';

const url = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = createClient({ url });

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

(async () => {
  await redis.connect();
})();
