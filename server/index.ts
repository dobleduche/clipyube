// server/index.ts
import "dotenv/config";
// FIX: Add explicit type imports for Express handlers
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import { router as generate } from "./routes/generate";
import { router as discovery } from "./routes/discovery";
import { router as publish } from "./routes/publish";
import { router as clips } from "./routes/clips";
import { router as automation } from "./routes/automation";
import { router as blog } from "./routes/blog";

// Boot workers (idempotent) with error handling
const bootWorkers = () => {
  const workers = [
    "./workers/automationWorker",
    "./workers/captionWorker",
    "./workers/discoveryWorker",
    "./workers/generationWorker",
    "./workers/pipelineWorker",
    "./workers/transcodeWorker",
    "./workers/thumbnailWorker",
  ];

  workers.forEach((worker) => {
    import(worker)
      .then(() => {
        console.log(`[Server] Booted worker: ${worker}`);
      })
      .catch((error) => {
        console.error(`[Server] Failed to boot worker ${worker}:`, error);
      });
  });
};

const app = express();

// Middlewares
// Use a simple, permissive CORS configuration to allow all origins.
// This resolves the "Failed to fetch" errors by ensuring the browser
// permits requests from the frontend to the backend server.
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true })); // for form bodies

// Serve generated projects
app.use("/generated", express.static("generated"));

// Routes
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);
app.use("/api/automation", automation);
app.use("/api/blog", blog);

// Health check
// FIX: Use imported Request and Response types
app.get("/api/health", (_req: Request, res: Response) =>
  res.status(200).json({ status: "ok" })
);

// Central error handler
// FIX: Use imported types for the error handler
const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  console.error("[Server] Error:", { status, message, stack: err.stack });
  res.status(status).json({ ok: false, error: message });
};
app.use(errorHandler);

// Validate environment and start server
const port = Number(process.env.PORT) || 3001;
if (!process.env.PORT) {
  console.warn("[Server] PORT not set in .env, using default 3001");
}

app.listen(port, () => {
  console.log(`API up on :${port}`);
  bootWorkers(); // Boot workers after server starts
});

export default app;
