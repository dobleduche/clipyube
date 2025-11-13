// server/index.ts
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
// FIX: Removed unused 'ai' and 'scaffold' imports to clean up the file.
import { router as generate } from "./routes/generate";
import { router as discovery } from "./routes/discovery";
import { router as publish } from "./routes/publish";
import { router as clips } from "./routes/clips";

// Boot workers (idempotent)
import "../clipWorker";

// FIX: Declared 'app' before its use to resolve "used before its declaration" errors.
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
// FIX: Removed unused legacy routes for '/api/ai' and '/api/scaffold'.
app.use("/api/generate", generate);
app.use("/api/discovery", discovery);
app.use("/api/publish", publish);
app.use("/api/clips", clips);

// Health check
app.get("/api/health", (_req: Request, res: Response) => res.status(200).json({ status: "ok" }));

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res.status(err?.status || 500).json({ ok: false, error: err?.message ?? "Internal Server Error" });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`API up on :${port}`));

export default app;
