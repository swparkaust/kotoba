"use client";

import { useState } from "react";

interface ReviewFilterProps {
  onApply: (filters: { card_type?: string; level_min?: number; level_max?: number; time_budget?: number }) => void;
  stats: { total: number; active: number; burned: number; due_now: number; due_today: number };
}

export function ReviewFilter({ onApply, stats }: ReviewFilterProps) {
  const [cardType, setCardType] = useState("");
  const [levelMin, setLevelMin] = useState("");
  const [levelMax, setLevelMax] = useState("");
  const [timeBudget, setTimeBudget] = useState("");

  const handleApply = () => {
    onApply({
      card_type: cardType || undefined,
      level_min: levelMin ? parseInt(levelMin) : undefined,
      level_max: levelMax ? parseInt(levelMax) : undefined,
      time_budget: timeBudget ? parseInt(timeBudget) : undefined,
    });
  };

  return (
    <div data-testid="review-filter" className="space-y-4 p-4 bg-stone-50 rounded-xl">
      <div data-testid="review-stats" className="flex gap-4 text-sm text-stone-600">
        <span>Total: {stats.total}</span>
        <span>Due: {stats.due_now}</span>
        <span>Burned: {stats.burned}</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        <select
          data-testid="filter-type-select"
          value={cardType}
          onChange={(e) => setCardType(e.target.value)}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="kanji">Kanji</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="grammar">Grammar</option>
          <option value="writing">Writing</option>
          <option value="speaking">Speaking</option>
        </select>
        <input
          data-testid="filter-level-min"
          type="number"
          placeholder="Level min"
          value={levelMin}
          onChange={(e) => setLevelMin(e.target.value)}
          className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          data-testid="filter-level-max"
          type="number"
          placeholder="Level max"
          value={levelMax}
          onChange={(e) => setLevelMax(e.target.value)}
          className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          data-testid="filter-time-budget"
          type="number"
          placeholder="Minutes"
          value={timeBudget}
          onChange={(e) => setTimeBudget(e.target.value)}
          className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <button
          data-testid="filter-apply"
          onClick={handleApply}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-400"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
