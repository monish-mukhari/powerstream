export type VideoDimensions = { width: number; height: number };

export type Rendition = {
  name: "360p" | "720p" | "1080p";
  width: number;
  height: number;
  videoBitrate: number;
  audioBitrate: number;
};

export type FfmpegCommand = {
  rendition: Rendition;
  executable: "ffmpeg";
  args: string[];
};
