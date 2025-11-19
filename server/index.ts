import dotenv from "dotenv";
dotenv.config();

// FIX: Changed to default import to use explicit types like express.Request and avoid global type conflicts.
import express from "express";
import cors from "cors";

// Router Imports
import { router as generate } from "./routes/generate";
import { router as discovery } from "./routes/discovery";
import { router as publish } from "./routes/publish";
import { router as clips } from "./routes/clips";
import { router as automation } from "./routes/automation";
import { router as blog } from "./routes/blog";

/**
 * Dynamically imports and initializes all BullMQ workers.
 * This ensures that all background job processors are running.
 */
const bootWorkers = () => {
  const workerPaths = [
    "./workers/automationWorker",
    "./workers/captionWorker",
    "./workers/discoveryWorker",
    "./workers/generationWorker",
    "./workers/pipelineWorker",
    "./workers/transcodeWorker",
    "./workers/thumbnailWorker",
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve generated assets statically
app.use("/generated", express.static("generated"));

// API Routes
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);
app.use("/api/automation", automation);
app.use("/api/blog", blog);

// Health Check Endpoint
// FIX: Used express.Request and express.Response to avoid type conflicts.
app.get("/api/health", (_req: express.Request, res: express.Response) => res.status(200).json({ status: "ok" }));

// Generic Error Handler
// FIX: Correctly typed ErrorRequestHandler arguments to ensure type safety.
const errorHandler: express.ErrorRequestHandler = (err, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as any).status || 500;
  const message = err.message || "Internal Server Error";
  console.error("[Server] Error:", { status, message, stack: err.stack });
  res.status(status).json({ ok: false, error: message });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
if (!process.env.PORT) {
  console.warn("[Server] PORT not set in .env, using default 3001");
}

app.listen(port, () => {
  console.log(`[Server] API up and running on http://localhost:${port}`);
  bootWorkers();
});