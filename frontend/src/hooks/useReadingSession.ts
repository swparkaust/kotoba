import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api";

export function useReadingSession(itemId: string) {
  const [elapsed, setElapsed] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [newCards, setNewCards] = useState<Array<{ word: string; definition_ja: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef(0);
  const wordsReadRef = useRef(0);
  const newCardsRef = useRef(newCards);

  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { wordsReadRef.current = wordsRead; }, [wordsRead]);
  useEffect(() => { newCardsRef.current = newCards; }, [newCards]);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const pause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const addGlossCard = useCallback((word: string, definitionJa: string) => {
    setNewCards((prev) => prev.some(c => c.word === word) ? prev : [...prev, { word, definition_ja: definitionJa }]);
  }, []);

  const saveSession = useCallback(async (sessionType: "reading" | "listening", progressPct: number) => {
    try {
      await api.post(`/library/${itemId}/record_session`, {
        session_type: sessionType,
        duration_seconds: elapsedRef.current,
        words_read: wordsReadRef.current,
        progress_pct: progressPct,
        new_srs_cards: newCardsRef.current,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save reading session");
    }
  }, [itemId]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return { elapsed, wordsRead, setWordsRead, start, pause, addGlossCard, saveSession, error, newCardCount: newCards.length };
}
