import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = useCallback(async (languageCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = languageCode || "ja";
      const data = await api.get(`/library?recommended=true&language_code=${code}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load library");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByLevel = useCallback(async (levelMin: number, levelMax: number, itemType?: string, languageCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = languageCode || "ja";
      let url = `/library?language_code=${code}&level_min=${levelMin}&level_max=${levelMax}`;
      if (itemType) url += `&item_type=${itemType}`;
      const data = await api.get(url);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load library");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get("/library/reading_stats");
      setStats(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load reading stats");
    }
  }, []);

  return { items, stats, loading, error, fetchRecommended, fetchByLevel, fetchStats };
}
