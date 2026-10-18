import type { Rendition } from "./types.js";

export function generateMasterPlaylist(renditions: Rendition[]): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3", "#EXT-X-INDEPENDENT-SEGMENTS"];
  for (const rendition of renditions) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${rendition.videoBitrate + rendition.audioBitrate},RESOLUTION=${rendition.width}x${rendition.height}`,
      `${rendition.name}/index.m3u8`,
    );
  }
  return `${lines.join("\n")}\n`;
}
