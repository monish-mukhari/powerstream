import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/storage";
import { fileExtension, validateUploadInput } from "@/lib/upload-validation";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const input = validateUploadInput(await request.json());
    const course = await prisma.course.findUnique({ where: { id: input.courseId }, select: { id: true } });
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

    const videoId = crypto.randomUUID();
    const rawKey = `raw/${videoId}/source.${fileExtension(input.fileName)}`;
    const command = new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: rawKey,
      ContentType: input.fileType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: env.presignedUrlTtl });

    return NextResponse.json({ videoId, rawKey, uploadUrl, expiresIn: env.presignedUrlTtl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
