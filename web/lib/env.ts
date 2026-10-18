function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

export const env = {
  get databaseUrl() { return required("DATABASE_URL"); },
  get redisUrl() { return required("REDIS_URL"); },
  get adminPassword() { return required("ADMIN_PASSWORD"); },
  get adminSessionSecret() { return required("ADMIN_SESSION_SECRET"); },
  get s3Endpoint() { return required("S3_ENDPOINT"); },
  get s3Region() { return process.env.S3_REGION ?? "auto"; },
  get s3AccessKey() { return required("S3_ACCESS_KEY"); },
  get s3SecretKey() { return required("S3_SECRET_KEY"); },
  get s3Bucket() { return required("S3_BUCKET"); },
  get s3ForcePathStyle() { return process.env.S3_FORCE_PATH_STYLE !== "false"; },
  get cdnBaseUrl() { return required("CDN_BASE_URL").replace(/\/$/, ""); },
  get maxUploadBytes() { return positiveNumber("MAX_UPLOAD_SIZE_MB", 2048) * 1024 * 1024; },
  get presignedUrlTtl() { return positiveNumber("PRESIGNED_URL_TTL_SECONDS", 900); },
};
