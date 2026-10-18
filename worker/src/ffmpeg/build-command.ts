import path from "node:path";
import type { FfmpegCommand, Rendition, VideoDimensions } from "./types.js";

const PRESETS = [
  { name: "360p" as const, height: 360, videoBitrate: 800_000 },
  { name: "720p" as const, height: 720, videoBitrate: 2_500_000 },
  { name: "1080p" as const, height: 1080, videoBitrate: 5_000_000 },
];

export function selectRenditions(source: VideoDimensions): Rendition[] {
  return PRESETS
    .filter((preset) => preset.height <= source.height)
    .map((preset) => ({
      ...preset,
      width: Math.max(2, Math.floor((source.width * preset.height) / source.height / 2) * 2),
      audioBitrate: 128_000,
    }));
}

/**
 * Builds one readable FFmpeg invocation per rendition. Every command uses the
 * same four-second segment boundary and forces keyframes at that boundary, so
 * hls.js can switch levels without waiting for a mismatched GOP.
 */
export function buildFfmpegCommands(
  inputPath: string,
  outputRoot: string,
  source: VideoDimensions,
): FfmpegCommand[] {
  return selectRenditions(source).map((rendition) => {
    const outputDirectory = path.join(outputRoot, rendition.name);
    const maxRate = Math.round(rendition.videoBitrate * 1.07);
    const bufferSize = rendition.videoBitrate * 2;

    return {
      rendition,
      executable: "ffmpeg" as const,
      args: [
        "-y",
        "-i", inputPath,
        "-map", "0:v:0",
        "-map", "0:a:0?",
        "-vf", `scale=${rendition.width}:${rendition.height}`,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-b:v", String(rendition.videoBitrate),
        "-maxrate", String(maxRate),
        "-bufsize", String(bufferSize),
        "-c:a", "aac",
        "-b:a", String(rendition.audioBitrate),
        "-ar", "48000",
        "-ac", "2",
        "-force_key_frames", "expr:gte(t,n_forced*4)",
        "-sc_threshold", "0",
        "-hls_time", "4",
        "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments",
        "-hls_segment_filename", path.join(outputDirectory, "segment_%05d.ts"),
        path.join(outputDirectory, "index.m3u8"),
      ],
    };
  });
}
