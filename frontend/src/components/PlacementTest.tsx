"use client";

interface PlacementTestProps {
  question?: { prompt: string; options: string[] };
  result?: { recommended_level: number; overall_score: number };
  onAnswer?: (answer: string) => void;
  onAccept?: (level: number) => void;
}

export function PlacementTest({ question, result, onAnswer, onAccept }: PlacementTestProps) {
  return (
    <div data-testid="placement-test" className="max-w-md mx-auto space-y-6">
      {result ? (
        <div data-testid="placement-result" className="text-center space-y-4">
          <p className="text-lg text-stone-700">Recommended: Level {result.recommended_level}</p>
          <button
            data-testid="placement-accept"
            onClick={() => onAccept?.(result.recommended_level)}
            className="rounded-xl bg-orange-500 px-6 py-3 text-white"
          >
            Start at Level {result.recommended_level}
          </button>
        </div>
      ) : question ? (
        <div data-testid="placement-question" className="space-y-4">
          <p className="text-lg text-stone-700">{question.prompt}</p>
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onAnswer?.(opt)}
                className="w-full text-left rounded-xl border border-stone-200 p-3 hover:bg-orange-50"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div data-testid="placement-question" className="text-center text-stone-500">
          Loading...
        </div>
      )}
    </div>
  );
}
