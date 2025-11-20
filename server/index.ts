
import "dotenv/config"; // Load environment variables before other imports
import express, { Request, Response as ExpressResponse, NextFunction } from "express";
import cors from "cors";

// Router Imports
import { router as generate } from "./routes/generate.ts";
import { router as discovery } from "./routes/discovery.ts";
import { router as publish } from "./routes/publish.ts";
import { router as clips } from "./routes/clips.ts";
import { router as automation } from "./routes/automation.ts";
import { router as blog } from "./routes/blog.ts";

/**
 * Dynamically imports and initializes all BullMQ workers.
 * This ensures that all background job processors are running.
 */
const bootWorkers = () => {
  const workerPaths = [
    "./workers/automationWorker.ts",
    "./workers/captionWorker.ts",
    "./workers/discoveryWorker.ts",
    "./workers/generationWorker.ts",
    "./workers/pipelineWorker.ts",
    "./workers/transcodeWorker.ts",
    "./workers/thumbnailWorker.ts",
  ];

  workerPaths.forEach(async (workerPath) => {
    try {
      await import(workerPath);
      console.log(`[Server] Booted worker: ${workerPath}`);
    } catch (error) {
      console.error(`[Server] Failed to boot worker ${workerPath}:`, error);
    }
  });
};

const app = express();

// Use the cors middleware for robust CORS handling
app.use(cors());

// Body Parsers
app.use(express.json({ limit: "50mb" }) as any);
app.use(express.urlencoded({ limit: "50mb", extended: true }) as any);

// Serve generated assets statically
app.use("/generated", express.static("generated") as any);

// API Routes
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);
app.use("/api/automation", automation);
app.use("/api/blog", blog);

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// Generic Error Handler
const errorHandler = (err: any, _req: Request, res: ExpressResponse, _next: NextFunction) => {
  const status = Number(err.status) || 500;
  const message = err.message || "Internal Server Error";
  console.error("[Server] Error:", { status, message, stack: err.stack });
  res.status(status).json({ ok: false, error: message });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3009;
if (!process.env.PORT) {
  console.warn("[Server] PORT not set in .env, using default 3009");
}

app.listen(port, () => {
  console.log(`[Server] API up and running on http://localhost:${port}`);
  bootWorkers();
});
