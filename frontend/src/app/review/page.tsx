"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ReviewSession } from "@/components/ReviewSession";
import { ReviewFilter } from "@/components/ReviewFilter";

export default function ReviewPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/reviews").then((data) => setCards(Array.isArray(data) ? data : [])),
      api.get("/reviews/stats").then(setStats),
    ])
      .catch((e) => setError(e?.message || "Failed to load reviews"))
      .finally(() => setLoading(false));
  }, []);

  const handleCorrect = async () => {
    const card = cards[currentIndex];
    if (!card) return;
    try {
      await api.post(`/reviews/${card.id}/submit`, { correct: true });
      setCurrentIndex((i) => i + 1);
    } catch {
      setError("Failed to submit review. Please try again.");
    }
  };

  const handleIncorrect = async () => {
    const card = cards[currentIndex];
    if (!card) return;
    try {
      await api.post(`/reviews/${card.id}/submit`, { correct: false });
      setCurrentIndex((i) => i + 1);
    } catch {
      setError("Failed to submit review. Please try again.");
    }
  };

  const handleFilter = async (filters: any) => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.card_type) params.set("card_type", filters.card_type);
      if (filters.time_budget) params.set("time_budget", String(filters.time_budget));
      const data = await api.get(`/reviews?${params.toString()}`);
      setCards(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
    } catch (e: any) {
      setError(e?.message || "Failed to apply filter");
    }
  };

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Review</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {stats.total > 0 && <ReviewFilter onApply={handleFilter} stats={stats} />}
      <ReviewSession
        card={cards[currentIndex] || null}
        remaining={Math.max(0, cards.length - currentIndex)}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
      />
    </div>
  );
}
