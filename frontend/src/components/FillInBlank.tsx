"use client";

import { useState } from "react";

interface FillInBlankProps {
  prompt: string;
  onSubmit: (answer: string) => void;
}

export function FillInBlank({ prompt, onSubmit }: FillInBlankProps) {
  const [value, setValue] = useState("");

  return (
    <div data-testid="fill-blank" className="space-y-4">
      <p className="text-lg text-stone-700">{prompt}</p>
      <input
        data-testid="blank-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-stone-200 p-3 text-lg text-center"
        placeholder="..."
      />
      <button
        data-testid="blank-submit"
        onClick={() => onSubmit(value)}
        disabled={!value.trim()}
        className="w-full rounded-xl bg-orange-500 py-3 text-white disabled:opacity-50"
      >
        Check
      </button>
    </div>
  );
}
