// installHook.js
// Advanced postinstall hook for ClipYube
// - Prepares folders (generated, logs)
// - Ensures .env exists (if not, creates a starter)
// - Logs diagnostics to generated/install.log
// - Optionally checks Redis connectivity (non-fatal)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Small helpers ----------
const createdAt = new Date().toISOString();

function logToConsole(msg) {
  console.log(msg);
}

function appendLog(filePath, msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(filePath, line, "utf8");
  } catch (err) {
    console.warn("⚠️ [installHook] Failed to write to log file:", err?.message);
  }
}

// ---------- Paths ----------
const generatedDir = path.join(__dirname, "generated");
const logsDir = path.join(__dirname, "logs");
const installLogFile = path.join(generatedDir, "install.log");
const envFile = path.join(__dirname, ".env");
const envExampleFile = path.join(__dirname, ".env.example");

// ---------- 1) Ensure folders exist ----------
function ensureDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    const msg = `📁 [installHook] Created ${label} directory at: ${dirPath}`;
    logToConsole(msg);
    appendLog(installLogFile, msg);
  } else {
    const msg = `📁 [installHook] ${label} directory exists: ${dirPath}`;
    logToConsole(msg);
    appendLog(installLogFile, msg);
  }
}

ensureDir(generatedDir, "generated");
ensureDir(logsDir, "logs");

// ---------- 2) Ensure .env / .env.example ----------
if (!fs.existsSync(envExampleFile)) {
  const exampleContent = `# ClipYube environment example
# Copy this file to .env and customize values.

# Server
PORT=3009

# Redis
# For Render, this might look like:
# REDIS_URL=rediss://default:password@your-redis-host:6379
REDIS_URL=

# AI Keys (if used by your workers/pipeline)
OPENAI_API_KEY=
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=

# CORS / Frontend
# VITE_API_BASE_URL=https://clipyube.onrender.com
`;
  fs.writeFileSync(envExampleFile, exampleContent, "utf8");
  const msg = "📝 [installHook] Created .env.example with starter values.";
  logToConsole(msg);
  appendLog(installLogFile, msg);
} else {
  const msg = "📝 [installHook] .env.example already exists.";
  logToConsole(msg);
  appendLog(installLogFile, msg);
}

if (!fs.existsSync(envFile)) {
  // Do NOT overwrite a real .env, just create a fresh one if missing
  const msg = "🧪 [installHook] .env not found. Creating a basic .env (you should edit this).";
  logToConsole(msg);
  appendLog(installLogFile, msg);

  const baseEnv = `# Auto-created by installHook on ${createdAt}
PORT=3009
REDIS_URL=
`;
  fs.writeFileSync(envFile, baseEnv, "utf8");
} else {
  const msg = "✅ [installHook] .env already exists, not touching it.";
  logToConsole(msg);
  appendLog(installLogFile, msg);
}

// ---------- 3) Env var sanity check ----------
const requiredEnvKeys = ["PORT", "REDIS_URL"];
const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  const msg =
    "⚠️ [installHook] Missing recommended environment variables: " +
    missingKeys.join(", ");
  logToConsole(msg);
  appendLog(installLogFile, msg);
} else {
  const msg = "🔑 [installHook] Required env vars detected.";
  logToConsole(msg);
  appendLog(installLogFile, msg);
}

const nodeEnvMsg = `🌐 [installHook] NODE_ENV=${process.env.NODE_ENV || "undefined"}`;
logToConsole(nodeEnvMsg);
appendLog(installLogFile, nodeEnvMsg);

// ---------- 4) Optional Redis connectivity check (non-fatal) ----------
async function checkRedis() {
  if (!process.env.REDIS_URL) {
    const msg = "ℹ️ [installHook] REDIS_URL not set; skipping Redis connectivity check.";
    logToConsole(msg);
    appendLog(installLogFile, msg);
    return;
  }

  let Redis;
  try {
    ({ Redis } = await import("ioredis"));
  } catch (err) {
    const msg =
      "⚠️ [installHook] ioredis not installed; cannot test Redis connection. (This will NOT block deploy.)";
    logToConsole(msg);
    appendLog(installLogFile, msg);
    return;
  }

  const msgStart = "🔌 [installHook] Attempting Redis connection test…";
  logToConsole(msgStart);
  appendLog(installLogFile, msgStart);

  try {
    const client = new Redis(process.env.REDIS_URL);
    const pong = await client.ping();
    await client.quit();
    const okMsg = `✅ [installHook] Redis connection OK (PING -> ${pong}).`;
    logToConsole(okMsg);
    appendLog(installLogFile, okMsg);
  } catch (err) {
    const failMsg = `⚠️ [installHook] Redis connection failed: ${
      err?.message || String(err)
    }`;
    logToConsole(failMsg);
    appendLog(installLogFile, failMsg);
    // non-fatal: we do NOT throw
  }
}

// Top-level await is fine in Node ESM
await checkRedis();

const doneMsg = "🎯 [installHook] Completed advanced postinstall checks.\n";
logToConsole(doneMsg);
appendLog(installLogFile, doneMsg);
