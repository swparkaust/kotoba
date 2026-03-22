import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useReview() {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDueCards = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      const data = await api.get(`/reviews${query}`);
      setCards(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
    } catch (e: any) {
      setError(e?.message || "Failed to load review cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReview = useCallback(async (cardId: string, correct: boolean) => {
    try {
      await api.post(`/reviews/${cardId}/submit`, { correct });
      setCurrentIndex((prev) => prev + 1);
    } catch (e: any) {
      setError(e?.message || "Failed to submit review");
    }
  }, []);

  return {
    cards,
    currentCard: cards[currentIndex],
    fetchDueCards,
    submitReview,
    remaining: Math.max(0, cards.length - currentIndex),
    loading,
    error,
  };
}
