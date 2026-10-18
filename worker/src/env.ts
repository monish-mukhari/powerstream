function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get databaseUrl() { return required("DATABASE_URL"); },
  get redisUrl() { return required("REDIS_URL"); },
  get s3Endpoint() { return required("S3_ENDPOINT"); },
  get s3Region() { return process.env.S3_REGION ?? "auto"; },
  get s3AccessKey() { return required("S3_ACCESS_KEY"); },
  get s3SecretKey() { return required("S3_SECRET_KEY"); },
  get s3Bucket() { return required("S3_BUCKET"); },
  get s3ForcePathStyle() { return process.env.S3_FORCE_PATH_STYLE !== "false"; },
};
