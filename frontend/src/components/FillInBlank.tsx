"use client";

import { useState, useCallback } from "react";

interface FillInBlankProps {
  prompt: string;
  correctAnswer?: string;
  onSubmit: (answer: string) => void;
}

export function FillInBlank({ prompt, correctAnswer, onSubmit }: FillInBlankProps) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);

  const isCorrect = checked && correctAnswer !== undefined && value.trim() === correctAnswer.trim();

  const handleContinue = useCallback(() => {
    onSubmit(value);
  }, [onSubmit, value]);

  return (
    <div data-testid="fill-blank" className="space-y-4">
      <p className="text-lg text-stone-700">{prompt}</p>
      <input
        data-testid="blank-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={checked}
        className={`w-full rounded-xl border p-3 text-lg text-center ${
          checked
            ? isCorrect
              ? "border-green-400 bg-green-50"
              : "border-red-400 bg-red-50"
            : "border-stone-200"
        }`}
        placeholder="..."
      />
      {!checked && (
        <button
          data-testid="blank-submit"
          onClick={() => setChecked(true)}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-orange-500 py-3 text-white disabled:opacity-50"
        >
          Check
        </button>
      )}
      {checked && (
        <>
          <div
            data-testid="blank-feedback"
            className={`rounded-xl p-3 text-center ${
              isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isCorrect ? "正解！" : correctAnswer ? `正しい答えは「${correctAnswer}」です` : "不正解"}
          </div>
          <button
            data-testid="blank-continue"
            onClick={handleContinue}
            className="w-full rounded-xl bg-orange-500 py-3 text-white font-medium hover:bg-orange-600 transition-colors"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
