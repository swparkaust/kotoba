import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface LibraryItem {
  id: number;
  title: string;
  item_type: string;
  difficulty_level: number;
  body_text: string;
  audio_url: string | null;
  word_count: number;
  glosses: Array<{ word: string; reading?: string; definition_ja: string }>;
  listening_tips: string[];
  comprehension_questions: string[];
  estimated_comprehension?: number;
}

export interface ReadingStats {
  total_reading_minutes: number;
  total_listening_minutes: number;
  total_words_read: number;
  items_started: number;
  items_completed: number;
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = useCallback(async (languageCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = languageCode || "ja";
      const data = await api.get(`/library?recommended=true&language_code=${code}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load library");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load library");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get("/library/reading_stats");
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reading stats");
    }
  }, []);

  return { items, stats, loading, error, fetchRecommended, fetchByLevel, fetchStats };
}
