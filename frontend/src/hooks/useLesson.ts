import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface Exercise {
  id: number;
  position: number;
  exercise_type: string;
  content: {
    prompt?: string;
    options?: string[];
    correct_answer?: string;
    image_url?: string;
    audio_src?: string;
    character?: string;
    picture_options?: Array<{ imageUrl: string; label: string }>;
    correct_index?: number;
    hints?: string[];
  };
  difficulty?: string;
}

interface ContentAsset {
  id: number;
  asset_type: string;
  url: string;
}

export interface Lesson {
  id: number;
  position: number;
  title: string;
  skill_type: string;
  objectives: string[];
  content_status: string;
  exercises: Exercise[];
  content_assets: ContentAsset[];
  progress_status: string;
  score: number | null;
}

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/lessons/${lessonId}`);
      setLesson(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const submitAnswer = useCallback(async (exerciseId: string, answer: string) => {
    try {
      return await api.post(`/exercises/${exerciseId}/submit`, { answer });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
      return null;
    }
  }, []);

  const nextExercise = useCallback(() => {
    setCurrentExercise((prev) => prev + 1);
  }, []);

  return { lesson, loading, error, currentExercise, fetchLesson, submitAnswer, nextExercise };
}
