import { env } from "@/lib/env";

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export type UploadInput = {
  courseId: string;
  title: string;
  position: number;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export function validateUploadInput(value: unknown): UploadInput {
  if (!value || typeof value !== "object") throw new Error("Invalid upload request.");
  const input = value as Record<string, unknown>;
  const position = Number(input.position);
  const fileSize = Number(input.fileSize);

  if (typeof input.courseId !== "string" || !input.courseId) throw new Error("Choose a course.");
  if (typeof input.title !== "string" || input.title.trim().length < 2 || input.title.length > 120) {
    throw new Error("Video title must be 2–120 characters.");
  }
  if (!Number.isInteger(position) || position < 1) throw new Error("Position must be a positive integer.");
  if (typeof input.fileName !== "string" || !input.fileName) throw new Error("A file is required.");
  if (typeof input.fileType !== "string" || !ALLOWED_VIDEO_TYPES.has(input.fileType)) {
    throw new Error("Only MP4, MOV, and WebM videos are supported.");
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > env.maxUploadBytes) {
    throw new Error(`Video must be smaller than ${Math.floor(env.maxUploadBytes / 1024 / 1024)} MB.`);
  }

  return {
    courseId: input.courseId,
    title: input.title.trim(),
    position,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize,
  };
}

export function fileExtension(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]{1,8}$/.test(extension) ? extension : "bin";
}
