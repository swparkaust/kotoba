"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";

interface ListeningExerciseProps {
  audioSrc: string;
  options: string[];
  correctIndex: number;
  onAnswer: (index: number) => void;
}

export function ListeningExercise({ audioSrc, options, correctIndex, onAnswer }: ListeningExerciseProps) {
  const { play, stop } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (playing) {
      stop();
      setPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    } else {
      setPlaying(true);
      setPlayCount((c) => c + 1);
      play(audioSrc);
      playTimerRef.current = setTimeout(() => setPlaying(false), 5000);
    }
  }, [audioSrc, play, stop, playing]);

  const handleContinue = useCallback(() => {
    onAnswer(selected!);
  }, [selected, onAnswer]);

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
            onClick={() => setSelected(i)}
            disabled={selected !== null}
            className={`w-full text-left rounded-xl border-2 p-3 transition-colors ${
              selected === null
                ? "border-stone-200 hover:bg-orange-50 hover:border-orange-200"
                : i === correctIndex
                ? "border-green-400 bg-green-50"
                : i === selected
                ? "border-red-400 bg-red-50"
                : "border-stone-200 opacity-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <>
          <div
            data-testid="listen-feedback"
            className={`rounded-xl p-3 text-center ${
              selected === correctIndex ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {selected === correctIndex ? "正解！" : `正しい答えは「${options[correctIndex]}」です`}
          </div>
          <button
            data-testid="listen-continue"
            onClick={handleContinue}
            className="w-full rounded-xl bg-orange-500 py-3 text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Continue
          </button>
        </>
      )}

      {playCount === 0 && selected === null && (
        <p className="text-xs text-stone-400 text-center">
          Press listen to hear the audio before answering.
        </p>
      )}
    </div>
  );
}
