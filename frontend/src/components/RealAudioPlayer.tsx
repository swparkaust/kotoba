"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RealAudioPlayerProps {
  audioUrl: string;
  transcription: string;
  scaffolding: {
    glosses?: Array<{ word: string; reading?: string; definition_ja?: string }>;
    comprehension_questions?: string[];
    listening_tips?: string[];
  };
}

export function RealAudioPlayer({ audioUrl, transcription, scaffolding }: RealAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const changeSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextRate = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  const seekTo = useCallback((pct: number) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = pct * duration;
    }
  }, [duration]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div data-testid="real-audio-player" className="space-y-4">
      {/* Player controls */}
      <div className="bg-blue-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            data-testid="real-audio-play"
            onClick={togglePlay}
            className="rounded-full bg-blue-500 w-12 h-12 flex items-center justify-center text-white hover:bg-blue-400"
          >
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            <div
              className="w-full bg-blue-200 rounded-full h-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo((e.clientX - rect.left) / rect.width);
              }}
            >
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-600 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            onClick={changeSpeed}
            className="rounded-lg bg-blue-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-300"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Transcript toggle */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        className="text-sm text-stone-500 hover:text-stone-700"
      >
        {showTranscript ? "Hide transcript" : "Show transcript"}
      </button>

      {showTranscript && (
        <div data-testid="real-audio-transcript" className="bg-stone-50 rounded-xl p-4 text-stone-700 leading-relaxed">
          {transcription}
        </div>
      )}

      {/* Glosses */}
      {scaffolding?.glosses && scaffolding.glosses.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-stone-600">Vocabulary</h4>
          {scaffolding.glosses.map((g, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="font-medium text-stone-800">{g.word}</span>
              {g.reading && <span className="text-stone-400">({g.reading})</span>}
              {g.definition_ja && <span className="text-stone-600">— {g.definition_ja}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Listening tips */}
      {scaffolding?.listening_tips && scaffolding.listening_tips.length > 0 && (
        <div data-testid="real-audio-scaffolding" className="text-sm text-stone-600 bg-amber-50 rounded-lg p-3">
          <h4 className="font-medium mb-1">Listening Tips</h4>
          {scaffolding.listening_tips.map((tip, i) => (
            <p key={i} className="mb-1">• {tip}</p>
          ))}
        </div>
      )}

      {/* Comprehension questions */}
      {scaffolding?.comprehension_questions && scaffolding.comprehension_questions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-stone-600">Comprehension</h4>
          {scaffolding.comprehension_questions.map((q, i) => (
            <p key={i} className="text-sm text-stone-700">
              {i + 1}. {q}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
