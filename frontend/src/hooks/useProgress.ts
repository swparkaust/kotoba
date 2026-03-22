import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useProgress() {
  const [progress, setProgress] = useState<any[]>([]);
  const [jlptData, setJlptData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/progress");
      setProgress(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJlptComparison = useCallback(async (languageCode?: string) => {
    const code = languageCode || "ja";
    try {
      const data = await api.get(`/progress/jlpt_comparison?language_code=${code}`);
      setJlptData(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load JLPT data");
    }
  }, []);

  return { progress, jlptData, loading, error, fetchProgress, fetchJlptComparison };
}
