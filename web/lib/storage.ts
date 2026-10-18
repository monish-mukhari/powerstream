import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const globalForStorage = globalThis as unknown as { s3?: S3Client };

export const s3 = globalForStorage.s3 ?? new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  forcePathStyle: env.s3ForcePathStyle,
  credentials: {
    accessKeyId: env.s3AccessKey,
    secretAccessKey: env.s3SecretKey,
  },
});

if (process.env.NODE_ENV !== "production") globalForStorage.s3 = s3;
