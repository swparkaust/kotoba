"use client";

import { useState, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";

interface AudioPlayerProps {
  src: string;
  label?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

export function AudioPlayer({ src, label }: AudioPlayerProps) {
  const { play, stop } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2); // default 1x

  const handlePlay = useCallback(() => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      play(src, SPEEDS[speedIndex]);
      setPlaying(true);
    }
  }, [src, play, stop, playing, speedIndex]);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((prev) => (prev + 1) % SPEEDS.length);
  }, []);

  return (
    <div data-testid="audio-player" className="flex items-center gap-3">
      <button
        data-testid="audio-play-btn"
        onClick={handlePlay}
        className={`rounded-full w-12 h-12 flex items-center justify-center transition-colors ${
          playing
            ? "bg-orange-200 text-orange-700 animate-pulse"
            : "bg-orange-100 text-orange-600 hover:bg-orange-200"
        }`}
      >
        {playing ? "⏸" : "▶"}
      </button>
      {label && <span className="text-sm text-stone-600">{label}</span>}
      <button
        data-testid="audio-speed-btn"
        onClick={cycleSpeed}
        className="text-xs text-stone-400 hover:text-stone-600 bg-stone-100 rounded px-2 py-1"
      >
        {SPEEDS[speedIndex]}x
      </button>
    </div>
  );
}
