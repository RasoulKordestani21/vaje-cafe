"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/utils/format";

function formatMediaTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return toPersianDigits(`${m}:${s.toString().padStart(2, "0")}`);
}

interface GalleryVideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  compact?: boolean;
}

export default function GalleryVideoPlayer({
  src,
  className,
  autoPlay = false,
  compact = false,
}: GalleryVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (autoPlay) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
    setProgress(0);
  }, [src, autoPlay]);

  const bumpControls = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  const toggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
      setShowControls(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ratio = 1 - clickRatio;
    v.currentTime = ratio * duration;
    setProgress(v.currentTime);
  };

  const playBtnSize = compact ? "w-10 h-10" : "w-16 h-16 sm:w-20 sm:h-20";
  const playIconSize = compact ? 18 : 32;

  return (
    <div
      className={cn("relative bg-black group", className)}
      onMouseMove={bumpControls}
      onTouchStart={bumpControls}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn(
          "w-full h-full object-cover",
          !compact && "max-h-[75vh] object-contain"
        )}
        playsInline
        onTimeUpdate={() => videoRef.current && setProgress(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onClick={toggle}
      />

      {!playing && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity"
          aria-label="پخش"
        >
          <div
            className={cn(
              "rounded-full bg-[#186244] flex items-center justify-center shadow-xl ring-4 ring-white/15 hover:scale-105 transition-transform",
              playBtnSize
            )}
          >
            <Play size={playIconSize} className="text-white fill-white ml-0.5" />
          </div>
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
          compact ? "px-2 pb-2 pt-6" : "px-4 pb-3 pt-10",
          playing && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div
          role="slider"
          className={cn(
            "relative bg-white/20 rounded-full overflow-hidden cursor-pointer mb-2",
            compact ? "h-1 mb-1.5" : "h-1.5 mb-3"
          )}
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 end-0 bg-[#186244] rounded-full transition-[width] duration-100"
            style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex items-center justify-between text-white/90 text-xs">
          <button
            type="button"
            onClick={toggle}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label={playing ? "توقف" : "پخش"}
          >
            {playing ? (
              <Pause size={compact ? 14 : 18} />
            ) : (
              <Play size={compact ? 14 : 18} className="fill-white" />
            )}
          </button>
          <span dir="ltr" className="tabular-nums text-white/70 text-[10px] sm:text-xs">
            {formatMediaTime(progress)} / {formatMediaTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
