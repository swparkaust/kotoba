"use client";

import { useState, useCallback } from "react";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";

interface SpeakingExerciseProps {
  targetText: string;
  onResult: (transcription: string) => void;
  onSkip: () => void;
}

export function SpeakingExercise({ targetText, onResult, onSkip }: SpeakingExerciseProps) {
  const { recording, error: recorderError, startRecording, stopRecording } = useSpeechRecorder();
  const [transcript, setTranscript] = useState<string | null>(null);

  const handleRecord = useCallback(() => {
    setTranscript(null);
    startRecording((text: string) => {
      setTranscript(text);
      onResult(text);
    });
  }, [startRecording, onResult]);

  const handleStop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return (
    <div data-testid="speaking-exercise" className="space-y-6 text-center">
      <p className="text-sm text-stone-500">Read the following aloud:</p>
      <div data-testid="speaking-target" className="text-2xl font-medium text-stone-800 p-6 rounded-xl bg-stone-50">
        {targetText}
      </div>

      {recorderError && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{recorderError}</div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          data-testid="speaking-record-btn"
          onClick={handleRecord}
          disabled={recording}
          className={`rounded-full w-16 h-16 flex items-center justify-center text-white transition-colors ${
            recording ? "bg-red-300 animate-pulse" : "bg-red-500 hover:bg-red-400"
          }`}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
        <button
          data-testid="speaking-stop-btn"
          onClick={handleStop}
          disabled={!recording}
          className="rounded-full bg-stone-200 w-16 h-16 flex items-center justify-center text-stone-600 hover:bg-stone-300 disabled:opacity-30"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      </div>

      {recording && (
        <p className="text-sm text-red-500 animate-pulse">Listening...</p>
      )}

      {transcript && (
        <div data-testid="speaking-transcript" className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-stone-500 mb-1">You said:</p>
          <p className="text-lg text-stone-800">{transcript}</p>
        </div>
      )}

      <button
        data-testid="speaking-skip"
        onClick={onSkip}
        className="text-sm text-stone-400 hover:text-stone-600"
      >
        Skip
      </button>
    </div>
  );
}
