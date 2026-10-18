import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET ?? "streaming";
const endpoint = process.env.S3_ENDPOINT ?? "http://minio:9000";
const accessKeyId = process.env.S3_ACCESS_KEY ?? "minioadmin";
const secretAccessKey = process.env.S3_SECRET_KEY ?? "minioadmin";

const s3 = new S3Client({
  endpoint,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }),
    }),
  );

  console.log(`Bucket '${bucket}' is ready with public playback.`);
}

main().catch((error) => {
  console.error("Bucket initialization failed", error);
  process.exit(1);
});
