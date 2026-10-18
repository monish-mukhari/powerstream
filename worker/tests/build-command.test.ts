import assert from "node:assert/strict";
import test from "node:test";
import { buildFfmpegCommands, selectRenditions } from "../src/ffmpeg/build-command.js";

test("a 1080p source creates all requested renditions", () => {
  const renditions = selectRenditions({ width: 1920, height: 1080 });
  assert.deepEqual(renditions.map((rendition) => rendition.name), ["360p", "720p", "1080p"]);
  assert.deepEqual(renditions.map(({ width, height }) => [width, height]), [[640, 360], [1280, 720], [1920, 1080]]);
});

test("renditions larger than the source are skipped", () => {
  const renditions = selectRenditions({ width: 854, height: 480 });
  assert.deepEqual(renditions.map((rendition) => rendition.name), ["360p"]);
});

test("commands align four-second HLS segments and keyframes", () => {
  const [command] = buildFfmpegCommands("source.mp4", "output", { width: 1280, height: 720 });
  assert.ok(command.args.includes("expr:gte(t,n_forced*4)"));
  assert.ok(command.args.includes("-hls_time"));
  assert.equal(command.args[command.args.indexOf("-hls_time") + 1], "4");
  assert.ok(command.args.includes("vod"));
});
