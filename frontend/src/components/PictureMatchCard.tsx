"use client";

import { useState } from "react";

interface PictureMatchCardProps {
  options: Array<{ imageUrl: string; label: string }>;
  onSelect: (index: number) => void;
  correctIndex?: number;
}

export function PictureMatchCard({ options, onSelect, correctIndex }: PictureMatchCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleSelect = (index: number) => {
    if (selected !== null) return; // Already answered
    setSelected(index);
    onSelect(index);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const getBorderColor = (index: number) => {
    if (selected === null) return "border-stone-200 hover:border-orange-300";
    if (index === correctIndex) return "border-green-400 bg-green-50";
    if (index === selected && selected !== correctIndex) return "border-red-400 bg-red-50";
    return "border-stone-200 opacity-50";
  };

  return (
    <div data-testid="picture-match" className="grid grid-cols-2 gap-4">
      {options.map((opt, index) => (
        <button
          key={index}
          data-testid={`match-option-${index}`}
          onClick={() => handleSelect(index)}
          disabled={selected !== null}
          className={`rounded-xl border-2 p-4 transition-colors ${getBorderColor(index)}`}
        >
          <div className="w-24 h-24 mx-auto rounded-lg mb-2 overflow-hidden bg-stone-100 flex items-center justify-center">
            {imageErrors.has(index) ? (
              <span className="text-4xl">{opt.label.charAt(0)}</span>
            ) : (
              <img
                src={opt.imageUrl}
                alt={opt.label}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
              />
            )}
          </div>
          <p className="text-center text-stone-700">{opt.label}</p>
        </button>
      ))}
    </div>
  );
}
