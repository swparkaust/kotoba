"use client";

import { useState, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";

interface ListeningExerciseProps {
  audioSrc: string;
  options: string[];
  onAnswer: (index: number) => void;
}

export function ListeningExercise({ audioSrc, options, onAnswer }: ListeningExerciseProps) {
  const { play, stop } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [playCount, setPlayCount] = useState(0);

  const handlePlay = useCallback(() => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      setPlaying(true);
      setPlayCount((c) => c + 1);
      play(audioSrc);
      // Estimate audio duration, reset playing state after reasonable time
      setTimeout(() => setPlaying(false), 5000);
    }
  }, [audioSrc, play, stop, playing]);

  const handleSelect = useCallback(
    (index: number) => {
      setSelected(index);
      onAnswer(index);
    },
    [onAnswer]
  );

  return (
    <div data-testid="listening-exercise" className="space-y-4">
      <button
        data-testid="listen-btn"
        onClick={handlePlay}
        className={`mx-auto flex items-center gap-2 rounded-xl px-6 py-3 transition-colors ${
          playing
            ? "bg-blue-200 text-blue-800 animate-pulse"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        }`}
      >
        {playing ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            Playing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            Listen {playCount > 0 ? `(${playCount})` : ""}
          </>
        )}
      </button>

      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            data-testid={`listen-option-${i}`}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
            className={`w-full text-left rounded-xl border-2 p-3 transition-colors ${
              selected === i
                ? "border-orange-400 bg-orange-50"
                : "border-stone-200 hover:bg-orange-50 hover:border-orange-200"
            } ${selected !== null && selected !== i ? "opacity-50" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {playCount === 0 && (
        <p className="text-xs text-stone-400 text-center">
          Press listen to hear the audio before answering.
        </p>
      )}
    </div>
  );
}
