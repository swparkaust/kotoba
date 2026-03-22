"use client";

interface WritingFeedbackProps {
  score: number;
  grammarFeedback: string;
  naturalnessFeedback: string;
  suggestions: string[];
}

export function WritingFeedback({ score, grammarFeedback, naturalnessFeedback, suggestions }: WritingFeedbackProps) {
  return (
    <div data-testid="writing-feedback" className="space-y-4 rounded-xl bg-green-50 border border-green-100 p-4">
      <div data-testid="writing-score" className="text-2xl font-bold text-green-700">{score}</div>
      <div data-testid="writing-grammar" className="text-sm text-stone-700">{grammarFeedback}</div>
      <div data-testid="writing-naturalness" className="text-sm text-stone-700">{naturalnessFeedback}</div>
      <div data-testid="writing-suggestions" className="space-y-1">
        {suggestions.map((s, i) => (
          <p key={i} className="text-sm text-stone-600">• {s}</p>
        ))}
      </div>
    </div>
  );
}
