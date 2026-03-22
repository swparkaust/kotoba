"use client";

import { useState, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";

interface MultipleChoiceProps {
  prompt: string;
  options: string[];
  correctIndex: number;
  onAnswer: (answer: string) => void;
  imageUrl?: string;
  audioUrl?: string;
}

export function MultipleChoice({ prompt, options, correctIndex, onAnswer, imageUrl, audioUrl }: MultipleChoiceProps) {
  const { play } = useAudio();
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null) return;
      setSelected(index);
      setShowFeedback(true);
      onAnswer(options[index]);
    },
    [selected, onAnswer, options]
  );

  const handlePlayAudio = useCallback(() => {
    if (audioUrl) play(audioUrl);
  }, [audioUrl, play]);

  return (
    <div data-testid="multiple-choice" className="space-y-4">
      <div className="text-center">
        {imageUrl && (
          <img src={imageUrl} alt="" className="mx-auto mb-4 w-48 h-48 object-cover rounded-xl" />
        )}
        <p className="text-2xl font-medium text-stone-800">{prompt}</p>
        {audioUrl && (
          <button
            onClick={handlePlayAudio}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            🔊 Listen
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => (
          <button
            key={index}
            data-testid={`choice-${index}`}
            onClick={() => handleSelect(index)}
            disabled={selected !== null}
            className={`rounded-xl border-2 bg-white p-4 text-lg transition-colors ${
              selected === null
                ? "border-stone-200 text-stone-700 hover:border-orange-300 hover:bg-orange-50"
                : index === correctIndex
                ? "border-green-400 bg-green-50 text-green-700"
                : index === selected
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-stone-200 text-stone-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {showFeedback && (
        <div
          data-testid="choice-feedback"
          className={`rounded-xl p-3 text-center ${
            selected === correctIndex ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {selected === correctIndex ? "正解！" : `正しい答えは「${options[correctIndex]}」です`}
        </div>
      )}
    </div>
  );
}
