"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useWriting } from "@/hooks/useWriting";
import { WritingExercise } from "@/components/WritingExercise";
import { WritingFeedback } from "@/components/WritingFeedback";

interface Exercise {
  id: number;
  content: {
    prompt: string;
    hints?: string[];
  };
}

export default function WritingPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { feedback, submitting, submitWriting } = useWriting();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercise() {
      try {
        const exercises = await api.get(`/exercises?lesson_id=${lessonId}&exercise_type=writing`);
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

  const handleSubmit = async (text: string) => {
    if (!exercise) return;
    await submitWriting(String(exercise.id), text);
  };

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
        <p className="text-stone-500 text-center">No writing exercise found for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Writing</h1>

      {exercise.content.hints && exercise.content.hints.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
          {exercise.content.hints.map((hint, i) => (
            <p key={i}>Hint: {hint}</p>
          ))}
        </div>
      )}

      <WritingExercise
        prompt={exercise.content.prompt}
        onSubmit={handleSubmit}
        disabled={submitting}
      />

      {submitting && (
        <p className="text-sm text-stone-500 text-center">Evaluating your writing...</p>
      )}

      {feedback && (
        <WritingFeedback
          score={feedback.score}
          grammarFeedback={feedback.grammar_feedback}
          naturalnessFeedback={feedback.naturalness_feedback}
          suggestions={feedback.suggestions}
        />
      )}
    </div>
  );
}
