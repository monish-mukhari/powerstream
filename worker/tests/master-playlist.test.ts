import assert from "node:assert/strict";
import test from "node:test";
import { generateMasterPlaylist } from "../src/ffmpeg/master-playlist.js";

test("master playlist includes exact bandwidth and resolution", () => {
  const playlist = generateMasterPlaylist([
    { name: "360p", width: 640, height: 360, videoBitrate: 800_000, audioBitrate: 128_000 },
    { name: "720p", width: 1280, height: 720, videoBitrate: 2_500_000, audioBitrate: 128_000 },
  ]);

  assert.match(playlist, /BANDWIDTH=928000,RESOLUTION=640x360/);
  assert.match(playlist, /360p\/index\.m3u8/);
  assert.match(playlist, /BANDWIDTH=2628000,RESOLUTION=1280x720/);
  assert.match(playlist, /720p\/index\.m3u8/);
  assert.ok(playlist.endsWith("\n"));
});
