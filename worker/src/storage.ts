import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3 = new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  forcePathStyle: env.s3ForcePathStyle,
  credentials: { accessKeyId: env.s3AccessKey, secretAccessKey: env.s3SecretKey },
});

export async function downloadObject(key: string, destination: string): Promise<void> {
  const response = await s3.send(new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }));
  if (!response.Body) throw new Error(`Object ${key} has no body.`);
  await pipeline(response.Body as Readable, createWriteStream(destination));
}

function objectMetadata(fileName: string) {
  if (fileName.endsWith(".m3u8")) {
    return { contentType: "application/vnd.apple.mpegurl", cacheControl: "public, max-age=60" };
  }
  if (fileName.endsWith(".ts")) {
    return { contentType: "video/mp2t", cacheControl: "public, max-age=31536000, immutable" };
  }
  return { contentType: "application/octet-stream", cacheControl: "public, max-age=31536000, immutable" };
}

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(absolute) : [absolute];
  }));
  return nested.flat();
}

export async function uploadHlsDirectory(directory: string, videoId: string): Promise<void> {
  const files = await filesBelow(directory);
  await Promise.all(files.map(async (file) => {
    const relative = path.relative(directory, file).split(path.sep).join("/");
    const { contentType, cacheControl } = objectMetadata(file);
    await s3.send(new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: `videos/${videoId}/${relative}`,
      Body: createReadStream(file),
      ContentType: contentType,
      CacheControl: cacheControl,
    }));
  }));
}
