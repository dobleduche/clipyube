import { createClient } from "redis";
let c: ReturnType<typeof createClient> | null = null;
export const redis = () => (c ??= createClient({ url: process.env.REDIS_URL! }).on("error",console.error));
export const CHANNEL = "clipyube:logs";
export const RUN_KEY  = (t="default") => `clipyube:${t}:running`;
export const JOBCFG   = (t="default") => `clipyube:${t}:jobcfg`;
export const INBOX    = (t="default") => `clipyube:${t}:inbox`;   // LPUSH url/filepath