"use client";

import { useState, useCallback } from "react";

interface AuthenticReaderProps {
  source: {
    title: string;
    body_text: string;
    attribution: string;
    scaffolding: {
      glosses: Array<{ word: string; reading: string; definition_ja: string; example_sentence: string }>;
      comprehension_questions: Array<{ question_ja: string; expected_answer_ja: string }>;
    };
  };
}

export function AuthenticReader({ source }: AuthenticReaderProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [expandedGlosses, setExpandedGlosses] = useState<Set<number>>(new Set());

  const toggleAnswer = useCallback((index: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleGloss = useCallback((index: number) => {
    setExpandedGlosses((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div data-testid="authentic-reader" className="space-y-6">
      <h2 className="text-xl font-medium text-stone-800">{source.title}</h2>
      <div data-testid="authentic-text" className="text-lg leading-relaxed text-stone-700 bg-white rounded-xl p-6 border border-stone-100">
        {source.body_text}
      </div>

      <div data-testid="authentic-gloss" className="space-y-2">
        <h3 className="text-sm font-medium text-stone-600">Vocabulary</h3>
        {source.scaffolding.glosses.map((g, i) => (
          <button
            key={i}
            onClick={() => toggleGloss(i)}
            className="w-full text-left text-sm bg-amber-50 rounded-lg p-2 hover:bg-amber-100 transition-colors"
          >
            <div>
              <strong>{g.word}</strong>（{g.reading}）: {g.definition_ja}
            </div>
            {expandedGlosses.has(i) && g.example_sentence && (
              <p className="text-xs text-stone-500 mt-1 pl-2 border-l-2 border-amber-200">
                {g.example_sentence}
              </p>
            )}
          </button>
        ))}
      </div>

      <div data-testid="authentic-questions" className="space-y-3">
        <h3 className="text-sm font-medium text-stone-600">Comprehension</h3>
        {source.scaffolding.comprehension_questions.map((q, i) => (
          <div key={i} className="bg-stone-50 rounded-lg p-3">
            <p className="text-sm font-medium text-stone-700">{i + 1}. {q.question_ja}</p>
            <button
              data-testid={`question-reveal-${i}`}
              onClick={() => toggleAnswer(i)}
              className="text-xs text-orange-600 hover:text-orange-800 mt-1"
            >
              {revealedAnswers.has(i) ? "Hide answer" : "Show answer"}
            </button>
            {revealedAnswers.has(i) && (
              <p data-testid={`question-answer-${i}`} className="text-sm text-green-700 mt-1 pl-2 border-l-2 border-green-200">
                {q.expected_answer_ja}
              </p>
            )}
          </div>
        ))}
      </div>

      <p data-testid="authentic-source" className="text-xs text-stone-400">{source.attribution}</p>
    </div>
  );
}
