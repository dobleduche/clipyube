// server/index.ts
import "dotenv/config";
// FIX: Use default import to avoid type conflicts with global Request/Response
import express from "express";
import cors from "cors";
import { router as generate } from "./routes/generate";
import { router as discovery } from "./routes/discovery";
import { router as publish } from "./routes/publish";
import { router as clips } from "./routes/clips";
import { router as automation } from "./routes/automation";

// Boot workers (idempotent)
import "./workers/automationWorker";
import "./workers/captionWorker";
import "./workers/discoveryWorker";
import "./workers/generationWorker";
import "./workers/pipelineWorker";
import "./workers/transcodeWorker";
import "./workers/thumbnailWorker";

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true })); // for form bodies

// Serve generated projects
app.use("/generated", express.static("generated"));

// Routes
// FIX: Type errors in router files were causing overloads to fail here. Fixing router files resolves this.
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);
app.use("/api/automation", automation);

// Health check
// FIX: Use express.Request and express.Response to ensure correct types are used.
app.get("/api/health", (_req: express.Request, res: express.Response) => res.status(200).json({ status: "ok" }));

// Central error handler
// FIX: Use express.Request, express.Response, and express.NextFunction for correct error handler signature.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(err?.status || 500).json({ ok: false, error: err?.message ?? "Internal Server Error" });
});

const port = Number(process.env.PORT) || 3010;
app.listen(port, () => console.log(`API up on :${port}`));

export default app;
