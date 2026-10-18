import { spawn } from "node:child_process";
import type { VideoDimensions } from "./types.js";

export async function probeVideo(filePath: string): Promise<VideoDimensions> {
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "json",
      filePath,
    ]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(`ffprobe failed: ${stderr}`)));
  });

  const parsed = JSON.parse(output) as { streams?: Array<{ width?: number; height?: number }> };
  const stream = parsed.streams?.[0];
  if (!stream?.width || !stream.height) throw new Error("Could not determine source video dimensions.");
  return { width: stream.width, height: stream.height };
}
