import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { encodeQueue } from "@/lib/queue";
import { s3 } from "@/lib/storage";
import { ALLOWED_VIDEO_TYPES } from "@/lib/upload-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id: videoId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    courseId?: string;
    title?: string;
    position?: number;
    rawKey?: string;
  } | null;

  if (!body?.courseId || !body.title?.trim() || !Number.isInteger(body.position) || !body.rawKey) {
    return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });
  }
  const position = body.position as number;
  if (!body.rawKey.startsWith(`raw/${videoId}/`)) {
    return NextResponse.json({ error: "Upload key does not match this video." }, { status: 400 });
  }

  try {
    const object = await s3.send(new HeadObjectCommand({ Bucket: env.s3Bucket, Key: body.rawKey }));
    if (!object.ContentLength || object.ContentLength > env.maxUploadBytes) {
      return NextResponse.json({ error: "Uploaded file is empty or exceeds the size limit." }, { status: 400 });
    }
    if (!object.ContentType || !ALLOWED_VIDEO_TYPES.has(object.ContentType)) {
      return NextResponse.json({ error: "Uploaded object has an unsupported content type." }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        id: videoId,
        courseId: body.courseId,
        title: body.title.trim(),
        position,
        rawKey: body.rawKey,
        status: "UPLOADED",
      },
    });

    try {
      await encodeQueue.add("encode-video", { videoId }, { jobId: videoId });
    } catch (queueError) {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "FAILED", errorMessage: "Could not enqueue encoding job." },
      });
      throw queueError;
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Completing upload failed", error);
    const message = error instanceof Error ? error.message : "Could not complete upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
