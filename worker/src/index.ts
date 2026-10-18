import "dotenv/config";
import { Worker } from "bullmq";
import { env } from "./env.js";
import { disconnectPrisma, markVideoFailed, processVideo } from "./process-video.js";
import { redisConnection } from "./redis.js";

const QUEUE_NAME = "video-encoding";

const worker = new Worker<{ videoId: string }>(
  QUEUE_NAME,
  async (job) => {
    console.log(`[encode] Starting ${job.data.videoId}, attempt ${job.attemptsMade + 1}`);
    await processVideo(job.data.videoId);
    console.log(`[encode] Ready ${job.data.videoId}`);
  },
  {
    connection: redisConnection(env.redisUrl),
    concurrency: 1,
    lockDuration: 120_000,
  },
);

worker.on("failed", async (job, error) => {
  if (!job) return;
  const allowedAttempts = job.opts.attempts ?? 1;
  console.error(`[encode] Failed ${job.data.videoId}: ${error.message}`);
  if (job.attemptsMade >= allowedAttempts) {
    await markVideoFailed(job.data.videoId, error.message);
  }
});

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}; shutting down.`);
  await worker.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

console.log(`[worker] Waiting for jobs on ${QUEUE_NAME}.`);
