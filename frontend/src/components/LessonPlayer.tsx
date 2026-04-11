"use client";

import { useEffect } from "react";
import { ExerciseRenderer } from "./ExerciseRenderer";
import { Lesson } from "@/hooks/useLesson";

interface LessonPlayerProps {
  lesson: Lesson | null;
  currentExercise: number;
  onAnswer: (exerciseId: string, answer: string) => void;
  onComplete: () => void;
}

export function LessonPlayer({ lesson, currentExercise, onAnswer, onComplete }: LessonPlayerProps) {
  const exercises = lesson?.exercises || [];
  const isComplete = currentExercise >= exercises.length;
  const exercise = exercises[currentExercise];

  useEffect(() => {
    if (isComplete && exercises.length > 0) {
      onComplete();
    }
  }, [isComplete, exercises.length, onComplete]);

  if (isComplete) {
    return (
      <div data-testid="lesson-complete" className="text-center py-12 space-y-4">
        <p className="text-4xl">🎉</p>
        <p className="text-lg font-medium text-stone-800">Lesson complete!</p>
        <p className="text-sm text-stone-500">
          You finished {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="lesson-player" className="space-y-6">
      <div data-testid="exercise-progress" className="text-sm text-stone-500 text-center">
        {currentExercise + 1} / {exercises.length}
      </div>
      {exercise && (
        <ExerciseRenderer
          exercise={exercise}
          onAnswer={(answer) => onAnswer(String(exercise.id), answer)}
        />
      )}
    </div>
  );
}
