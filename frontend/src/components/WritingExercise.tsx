"use client";

import { useState } from "react";

interface WritingExerciseProps {
  prompt: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function WritingExercise({ prompt, onSubmit, disabled }: WritingExerciseProps) {
  const [text, setText] = useState("");

  return (
    <div data-testid="writing-exercise" className="space-y-4">
      <div data-testid="writing-prompt" className="text-lg text-stone-700">
        {prompt}
      </div>
      <textarea
        data-testid="writing-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border border-stone-200 p-4 text-lg min-h-[150px] resize-y"
        placeholder="ここに書いてください..."
      />
      <button
        data-testid="writing-submit"
        onClick={() => onSubmit(text)}
        disabled={!text.trim() || disabled}
        className="w-full rounded-xl bg-orange-500 py-3 text-white hover:bg-orange-400 disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
}
