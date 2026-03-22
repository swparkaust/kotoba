"use client";

interface ReviewSessionProps {
  card: {
    id: string;
    card_type: string;
    card_key: string;
    card_data: { front: string; back: string };
  } | null;
  remaining: number;
  onCorrect: () => void;
  onIncorrect: () => void;
}

export function ReviewSession({ card, remaining, onCorrect, onIncorrect }: ReviewSessionProps) {
  if (!card) {
    return (
      <div data-testid="review-empty" className="text-center py-12">
        <p className="text-stone-500">No cards due for review right now.</p>
      </div>
    );
  }

  return (
    <div data-testid="review-session" className="max-w-md mx-auto space-y-6">
      <div data-testid="review-remaining" className="text-sm text-stone-500 text-center">
        {remaining}
      </div>
      <div data-testid="review-card" className="rounded-2xl bg-white border border-stone-200 p-8 text-center shadow-sm min-h-[200px] flex items-center justify-center">
        <div>
          <p className="text-4xl font-medium text-stone-800 mb-2">{card.card_data.front}</p>
          <p className="text-lg text-stone-500">{card.card_data.back}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          data-testid="review-incorrect"
          onClick={onIncorrect}
          className="flex-1 rounded-xl bg-stone-100 py-3 text-stone-600 hover:bg-stone-200 transition-colors"
        >
          Again
        </button>
        <button
          data-testid="review-correct"
          onClick={onCorrect}
          className="flex-1 rounded-xl bg-green-100 py-3 text-green-700 hover:bg-green-200 transition-colors"
        >
          Good
        </button>
      </div>
    </div>
  );
}
