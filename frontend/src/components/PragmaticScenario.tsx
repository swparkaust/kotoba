"use client";

import { useState, useCallback } from "react";

interface PragmaticScenarioProps {
  scenario: {
    title: string;
    situation_ja: string;
    dialogue: Array<{ speaker: string; text: string; implied_meaning: string; tone: string }>;
    choices: Array<{ response: string; consequence: string; score: number }>;
    analysis: { rule: string };
  };
  onChoice: (index: number) => void;
}

export function PragmaticScenario({ scenario, onChoice }: PragmaticScenarioProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleChoice = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      setSelectedIndex(index);
      setShowAnalysis(true);
      onChoice(index);
    },
    [selectedIndex, onChoice]
  );

  const selectedChoice = selectedIndex !== null ? scenario.choices[selectedIndex] : null;
  const bestChoice = scenario.choices.reduce((a, b) => (a.score > b.score ? a : b));
  const isOptimal = selectedChoice?.response === bestChoice.response;

  return (
    <div data-testid="pragmatic-scenario" className="space-y-6">
      <h2 className="text-xl font-medium text-stone-800">{scenario.title}</h2>
      <div data-testid="scenario-situation" className="bg-amber-50 rounded-xl p-4 text-stone-700">
        {scenario.situation_ja}
      </div>
      <div data-testid="scenario-dialogue" className="space-y-3">
        {scenario.dialogue.map((line, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-stone-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-stone-500">{line.speaker}</span>
              <span className="text-xs text-stone-400 italic">{line.tone}</span>
            </div>
            <p className="text-stone-700">{line.text}</p>
            {showAnalysis && line.implied_meaning && (
              <p className="text-xs text-amber-600 mt-1">→ {line.implied_meaning}</p>
            )}
          </div>
        ))}
      </div>
      <div data-testid="scenario-choices" className="space-y-2">
        {scenario.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            disabled={selectedIndex !== null}
            className={`w-full text-left rounded-xl border p-4 transition-colors ${
              selectedIndex === null
                ? "border-stone-200 hover:border-orange-300"
                : i === selectedIndex
                ? choice.score >= bestChoice.score
                  ? "border-green-400 bg-green-50"
                  : "border-amber-400 bg-amber-50"
                : "border-stone-200 opacity-50"
            }`}
          >
            <p>{choice.response}</p>
            {selectedIndex !== null && (
              <p className="text-xs text-stone-500 mt-1">
                {choice.consequence} (Score: {choice.score})
              </p>
            )}
          </button>
        ))}
      </div>
      {showAnalysis && (
        <div
          data-testid="scenario-analysis"
          className={`rounded-xl p-4 ${isOptimal ? "bg-green-50" : "bg-amber-50"}`}
        >
          <p className="font-medium text-stone-800 mb-1">
            {isOptimal ? "素晴らしい！最適な返答です。" : "もっと良い返答がありました。"}
          </p>
          <p className="text-sm text-stone-600">{scenario.analysis.rule}</p>
          {!isOptimal && (
            <p className="text-sm text-stone-600 mt-1">
              Best response: 「{bestChoice.response}」
            </p>
          )}
        </div>
      )}
    </div>
  );
}
