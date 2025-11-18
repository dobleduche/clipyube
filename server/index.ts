// server/index.ts
import "dotenv/config";
import "./queues";        // ensure redisConnection + queues set up
import "./videoWorkers";  // spins up the Workers and starts processing jobs
import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import helmet from "helmet";

// Routers
import { router as generate } from "./routes/generate";
import { router as discovery } from "./routes/discovery";
import { router as publish } from "./routes/publish";
import { router as clips } from "./routes/clips";
import { router as automation } from "./routes/automation";
import { router as blog } from "./routes/blog";

// ---------------------------------------------
// WORKER BOOT
// ---------------------------------------------
async function bootWorkers() {
  const workers = [
    "./workers/automationWorker",
    "./workers/captionWorker",
    "./workers/discoveryWorker",
    "./workers/generationWorker",
    "./workers/pipelineWorker",
    "./workers/transcodeWorker",
    "./workers/thumbnailWorker",
  ];

  for (const worker of workers) {
    try {
      await import(worker);
      console.log(`[Worker] Booted: ${worker}`);
    } catch (err) {
      console.error(`[Worker] Failed to boot ${worker}:`, err);
    }
  }
}

// ---------------------------------------------
// EXPRESS INIT
// ---------------------------------------------
const app = express();

app.get("/api/clips/logs/:tenantId", sseLogs);

// ---------------------------------------------
// SECURITY MIDDLEWARES
// ---------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite bundles
  })
);

app.use(
  cors({
    origin: "*", // You can tighten later
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ---------------------------------------------
// RATE LIMIT — API ONLY
// ---------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ---------------------------------------------
// API ROUTES
// ---------------------------------------------
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);
app.use("/api/automation", automation);
app.use("/api/blog", blog);

// Health Check
app.get("/api/health", (_req: Request, res: Response) =>
  res.status(200).json({ ok: true, status: "healthy" })
);

// ---------------------------------------------
// FRONTEND SERVING (Vite build)
// ---------------------------------------------
const distDir = path.join(process.cwd(), "dist");
const indexHtmlPath = path.join(distDir, "index.html");

let indexHtmlCache: string | null = null;

// Attempt to load index.html if exists
if (fs.existsSync(indexHtmlPath)) {
  try {
    indexHtmlCache = fs.readFileSync(indexHtmlPath, "utf8");
    console.log("[Server] Cached index.html");
  } catch (err) {
    console.error("[Server] Failed to cache index.html:", err);
  }
}

// Serve static frontend
app.use(express.static(distDir));

// Fallback to index.html for SPA — only when NOT an API route
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not Found" });
  }

  if (indexHtmlCache) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(indexHtmlCache);
  }

  res.sendFile(indexHtmlPath);
});

// ---------------------------------------------
// ERROR HANDLER
// ---------------------------------------------
const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  console.error("[Server Error]", err);
  
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || "Internal Server Error",
  });
};

app.use(errorHandler);

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
const port = Number(process.env.PORT || 3001);

app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  await bootWorkers();
});

// Graceful shutdown
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

export default app;
