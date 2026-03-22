"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";
import { SpeakingExercise } from "@/components/SpeakingExercise";
import { SpeakingFeedback } from "@/components/SpeakingFeedback";

interface Exercise {
  id: number;
  content: {
    prompt: string;
    target_text: string;
    hints?: string[];
  };
}

export default function SpeakingPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { feedback, submitting, submitSpeech } = useSpeechRecorder();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercise() {
      try {
        const exercises = await api.get(`/exercises?lesson_id=${lessonId}&exercise_type=speaking`);
        const list = Array.isArray(exercises) ? exercises : [];
        if (list.length > 0) {
          setExercise(list[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadExercise();
  }, [lessonId]);

  const handleResult = useCallback(
    async (transcription: string) => {
      if (!exercise) return;
      await submitSpeech(
        String(exercise.id),
        transcription,
        exercise.content.target_text
      );
    },
    [exercise, submitSpeech]
  );

  const handleSkip = useCallback(() => {
    // Could navigate to next exercise or back
    window.history.back();
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <p className="text-stone-500 text-center">Loading exercise...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <p className="text-stone-500 text-center">No speaking exercise found for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Speaking</h1>

      {exercise.content.prompt && (
        <p className="text-stone-600">{exercise.content.prompt}</p>
      )}

      <SpeakingExercise
        targetText={exercise.content.target_text}
        onResult={handleResult}
        onSkip={handleSkip}
      />

      {submitting && (
        <p className="text-sm text-stone-500 text-center">Evaluating your speech...</p>
      )}

      {feedback && (
        <SpeakingFeedback
          score={feedback.accuracy_score}
          notes={feedback.pronunciation_notes}
          problemSounds={feedback.problem_sounds}
        />
      )}
    </div>
  );
}
