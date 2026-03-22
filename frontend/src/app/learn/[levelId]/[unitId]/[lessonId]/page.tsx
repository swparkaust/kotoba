"use client";

import { useEffect, useCallback } from "react";
import { useLesson } from "@/hooks/useLesson";
import { LessonPlayer } from "@/components/LessonPlayer";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const levelId = params.levelId as string;
  const { lesson, loading, currentExercise, fetchLesson, submitAnswer, nextExercise } = useLesson(lessonId);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  const handleComplete = useCallback(async () => {
    // Mark lesson as completed
    await api.patch("/progress", { lesson_id: lessonId, status: "completed" });
    // Navigate back to the level view
    router.push(`/dashboard`);
  }, [lessonId, router]);

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <LessonPlayer
      lesson={lesson}
      currentExercise={currentExercise}
      onAnswer={async (exerciseId, answer) => {
        await submitAnswer(exerciseId, answer);
        nextExercise();
      }}
      onComplete={handleComplete}
    />
  );
}
