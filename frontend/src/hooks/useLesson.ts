import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/lessons/${lessonId}`);
      setLesson(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const submitAnswer = useCallback(async (exerciseId: string, answer: string) => {
    try {
      return await api.post(`/exercises/${exerciseId}/submit`, { answer });
    } catch (e: any) {
      setError(e?.message || "Failed to submit answer");
      return null;
    }
  }, []);

  const nextExercise = useCallback(() => {
    setCurrentExercise((prev) => prev + 1);
  }, []);

  return { lesson, loading, error, currentExercise, fetchLesson, submitAnswer, nextExercise };
}
