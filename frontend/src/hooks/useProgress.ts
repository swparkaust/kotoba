import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface LearnerProgress {
  id: number;
  lesson_id: number;
  status: string;
  score: number | null;
  completed_at: string | null;
  attempts_count: number;
}

export interface JlptComparison {
  jlpt_label: string;
  percentage: number;
  completed_levels: number;
}

export function useProgress() {
  const [progress, setProgress] = useState<LearnerProgress[]>([]);
  const [jlptData, setJlptData] = useState<JlptComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/progress");
      setProgress(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJlptComparison = useCallback(async (languageCode?: string) => {
    const code = languageCode || "ja";
    try {
      const data = await api.get(`/progress/jlpt_comparison?language_code=${code}`);
      setJlptData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load JLPT data");
    }
  }, []);

  return { progress, jlptData, loading, error, fetchProgress, fetchJlptComparison };
}
