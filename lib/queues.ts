import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";

const conn = new IORedis(process.env.REDIS_URL!);
export const Q_AUTOMATION = "clipyube:automation";
export const Q_TRANSCODE  = "clipyube:transcode";
export const Q_THUMBNAIL  = "clipyube:thumbnail";
export const Q_CAPTION    = "clipyube:caption";

export const automationQ = new Queue(Q_AUTOMATION, { connection: conn });
export const transcodeQ  = new Queue(Q_TRANSCODE,  { connection: conn });
export const thumbQ      = new Queue(Q_THUMBNAIL,  { connection: conn });
export const captionQ    = new Queue(Q_CAPTION,    { connection: conn });

export async function enqueueRepeating(tenant:string, everyMs:number) {
  const opts: JobsOptions = { repeat:{ every: everyMs }, jobId:`auto:${tenant}`, removeOnComplete:1000, removeOnFail:1000 };
  return automationQ.add("tick", { tenant }, opts);
}
export async function removeRepeating(tenant:string) {
  const reps = await automationQ.getRepeatableJobs();
  await Promise.all(reps.filter(j => j.id===`auto:${tenant}`).map(j => automationQ.removeRepeatableByKey(j.key)));
}