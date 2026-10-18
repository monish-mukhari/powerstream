import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { buildFfmpegCommands } from "./ffmpeg/build-command.js";
import { generateMasterPlaylist } from "./ffmpeg/master-playlist.js";
import { probeVideo } from "./ffmpeg/probe-video.js";
import { downloadObject, uploadHlsDirectory } from "./storage.js";

const prisma = new PrismaClient();

async function runCommand(executable: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["ignore", "inherit", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr = `${stderr}${text}`.slice(-8_000);
    });
    child.on("error", reject);
    child.on("close", (code) => code === 0
      ? resolve()
      : reject(new Error(`FFmpeg exited with code ${code}. ${stderr}`)));
  });
}

export async function processVideo(videoId: string): Promise<void> {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), `reelhouse-${videoId}-`));
  const sourcePath = path.join(temporaryRoot, "source");
  const hlsRoot = path.join(temporaryRoot, "hls");

  try {
    const video = await prisma.video.update({
      where: { id: videoId },
      data: { status: "PROCESSING", errorMessage: null },
    });

    await mkdir(hlsRoot, { recursive: true });
    await downloadObject(video.rawKey, sourcePath);
    const dimensions = await probeVideo(sourcePath);
    const commands = buildFfmpegCommands(sourcePath, hlsRoot, dimensions);
    if (!commands.length) throw new Error("Source video is smaller than the minimum 360p rendition.");

    for (const command of commands) {
      await mkdir(path.join(hlsRoot, command.rendition.name), { recursive: true });
      await runCommand(command.executable, command.args);
    }

    const masterPlaylist = generateMasterPlaylist(commands.map((command) => command.rendition));
    await writeFile(path.join(hlsRoot, "master.m3u8"), masterPlaylist, "utf8");
    await uploadHlsDirectory(hlsRoot, videoId);

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "READY", hlsPath: `videos/${videoId}/master.m3u8`, errorMessage: null },
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function markVideoFailed(videoId: string, reason: string): Promise<void> {
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "FAILED", errorMessage: reason.slice(0, 2_000) },
  });
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
