"use client";

import { useState, useCallback } from "react";

interface ContrastiveGrammarExerciseProps {
  set: {
    cluster_name: string;
    patterns: Array<{ pattern: string; usage_ja: string; example_sentences: string[] }>;
    exercises: Array<{ context: string; correct: string; options: string[] }>;
  };
  onAnswer: (answer: string) => void;
}

export function ContrastiveGrammarExercise({ set, onAnswer }: ContrastiveGrammarExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const exercise = set.exercises[currentIndex];
  const isCorrect = selectedAnswer === exercise?.correct;

  const handleAnswer = useCallback(
    (opt: string) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(opt);
      setShowFeedback(true);
      onAnswer(opt);
    },
    [selectedAnswer, onAnswer]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < set.exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentIndex, set.exercises.length]);

  return (
    <div data-testid="contrastive-grammar" className="space-y-6">
      <h2 className="text-lg font-medium text-stone-800">{set.cluster_name}</h2>
      <div data-testid="contrastive-patterns" className="space-y-4">
        {set.patterns.map((p, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-100 p-4">
            <p className="font-medium text-orange-600">{p.pattern}</p>
            <p className="text-sm text-stone-600 mt-1">{p.usage_ja}</p>
            {p.example_sentences.map((ex, j) => (
              <p key={j} className="text-sm text-stone-500 mt-1 pl-2 border-l-2 border-stone-200">{ex}</p>
            ))}
          </div>
        ))}
      </div>

      {exercise && (
        <div data-testid="contrastive-exercise" className="bg-stone-50 rounded-xl p-4">
          <p className="text-xs text-stone-400 mb-2">
            Question {currentIndex + 1} of {set.exercises.length}
          </p>
          <p className="text-stone-700 mb-3">{exercise.context}</p>
          <div className="flex gap-2">
            {exercise.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAnswer !== null}
                className={`rounded-lg border px-4 py-2 transition-colors ${
                  selectedAnswer === null
                    ? "border-stone-200 text-stone-700 hover:bg-orange-50"
                    : opt === exercise.correct
                    ? "border-green-400 bg-green-50 text-green-700"
                    : opt === selectedAnswer
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-stone-200 text-stone-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFeedback && (
        <div
          data-testid="contrastive-feedback"
          className={`rounded-xl p-4 ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          <p className="font-medium">{isCorrect ? "正解！" : `不正解 — 正しい答えは「${exercise?.correct}」です`}</p>
          {!isCorrect && set.patterns[0] && (
            <p className="text-sm mt-1">{set.patterns[0].usage_ja}</p>
          )}
          {currentIndex < set.exercises.length - 1 && (
            <button onClick={handleNext} className="mt-2 text-sm underline">
              Next question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
