"use client";

import Hls, { Events, ErrorTypes } from "hls.js";
import { useEffect, useRef, useState } from "react";

type Quality = { index: number; height: number };

export function HlsPlayer({ playbackUrl, title }: { playbackUrl: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nativePlayback, setNativePlayback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const ready = () => setLoading(false);
    const nativeError = () => { setLoading(false); setError("This video couldn't be loaded."); };
    video.addEventListener("playing", ready);
    video.addEventListener("canplay", ready);
    video.addEventListener("error", nativeError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      setNativePlayback(true);
      video.src = playbackUrl;
      return () => {
        video.removeEventListener("playing", ready);
        video.removeEventListener("canplay", ready);
        video.removeEventListener("error", nativeError);
      };
    }
    if (!Hls.isSupported()) { setLoading(false); setError("HLS playback is not supported by this browser."); return; }

    const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
    hlsRef.current = hls;
    hls.loadSource(playbackUrl);
    hls.attachMedia(video);
    hls.on(Events.MANIFEST_PARSED, () => {
      setQualities(hls.levels.map((level, index) => ({ index, height: level.height })));
      setLoading(false);
      void video.play().catch(() => undefined);
    });
    hls.on(Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      setLoading(false);
      setError(data.type === ErrorTypes.NETWORK_ERROR ? "Network error while loading the stream." : "The video stream could not be decoded.");
    });
    return () => {
      hls.destroy();
      hlsRef.current = null;
      video.removeEventListener("playing", ready);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("error", nativeError);
    };
  }, [playbackUrl]);

  function changeQuality(level: number) {
    setSelectedLevel(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-[#09090b]">
      <video ref={videoRef} className="size-full" controls playsInline aria-label={title} />
      {loading ? <div className="absolute inset-0 grid place-items-center bg-[#09090b]"><span className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-[#e11d48]" /></div> : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-[#09090b] p-6 text-center">
          <div><p className="text-sm text-white">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-[#e11d48] px-4 py-2 text-xs font-semibold text-white">↻ Retry</button></div>
        </div>
      ) : null}
      {!nativePlayback && qualities.length ? (
        <label className="absolute bottom-12 right-3 flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
          <span className="sr-only">Quality</span>
          <select className="bg-transparent font-semibold outline-none" value={selectedLevel} onChange={(event) => changeQuality(Number(event.target.value))}>
            <option className="text-black" value={-1}>Auto</option>
            {qualities.map((quality) => <option className="text-black" key={quality.index} value={quality.index}>{quality.height}p</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}
