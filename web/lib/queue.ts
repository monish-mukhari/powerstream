import { Queue } from "bullmq";
import { env } from "@/lib/env";
import { redisConnection } from "@/lib/redis";

export const ENCODE_QUEUE_NAME = "video-encoding";

const globalForQueue = globalThis as unknown as { encodeQueue?: Queue };

export const encodeQueue = globalForQueue.encodeQueue ?? new Queue(ENCODE_QUEUE_NAME, {
  connection: redisConnection(env.redisUrl),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

if (process.env.NODE_ENV !== "production") globalForQueue.encodeQueue = encodeQueue;
