"use client";

import { useState, useMemo, useCallback } from "react";
import { TapToGloss } from "./TapToGloss";

interface GlossEntry {
  word: string;
  reading?: string;
  definition_ja: string;
}

interface ImmersiveReaderProps {
  text: string;
  elapsed: number;
  progress: number;
  onWordTap: (word: string) => void;
  glosses?: GlossEntry[];
  onAddSrs?: (word: string) => void;
}

export function ImmersiveReader({
  text,
  elapsed,
  progress,
  onWordTap,
  glosses = [],
  onAddSrs,
}: ImmersiveReaderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [glossPosition, setGlossPosition] = useState<{ x: number; y: number } | null>(null);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // Build a gloss lookup map
  const glossMap = useMemo(() => {
    const map = new Map<string, GlossEntry>();
    for (const g of glosses) {
      map.set(g.word, g);
    }
    return map;
  }, [glosses]);

  // Segment Japanese text into words (using glosses as known word boundaries)
  const segments = useMemo(() => {
    if (glosses.length === 0) {
      // No glosses - split by character
      return text.split("").map((char) => ({ text: char, isGlossed: false }));
    }

    const result: Array<{ text: string; isGlossed: boolean }> = [];
    let remaining = text;

    while (remaining.length > 0) {
      let matched = false;
      // Try to match longest glossed word first
      const sortedWords = [...glossMap.keys()].sort((a, b) => b.length - a.length);
      for (const word of sortedWords) {
        if (remaining.startsWith(word)) {
          result.push({ text: word, isGlossed: true });
          remaining = remaining.slice(word.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        result.push({ text: remaining[0], isGlossed: false });
        remaining = remaining.slice(1);
      }
    }

    return result;
  }, [text, glossMap, glosses.length]);

  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setSelectedWord(word);
      setGlossPosition({ x: rect.left, y: rect.bottom + 4 });
      onWordTap(word);
    },
    [onWordTap]
  );

  const handleCloseGloss = useCallback(() => {
    setSelectedWord(null);
    setGlossPosition(null);
  }, []);

  const activeGloss = selectedWord ? glossMap.get(selectedWord) : null;

  return (
    <div data-testid="immersive-reader" className="min-h-screen bg-amber-50 p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div data-testid="reader-timer" className="text-xs text-stone-400">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-xs text-stone-400">
          {Math.round(progress * 100)}%
        </div>
      </div>

      <div data-testid="reader-text" className="text-lg leading-loose text-stone-700">
        {segments.map((seg, i) => (
          <span
            key={i}
            onClick={(e) => handleWordClick(seg.text, e)}
            className={`cursor-pointer rounded transition-colors ${
              seg.isGlossed
                ? "border-b border-dotted border-orange-300 hover:bg-orange-100"
                : "hover:bg-amber-100"
            } ${selectedWord === seg.text ? "bg-orange-200" : ""}`}
          >
            {seg.text}
          </span>
        ))}
      </div>

      <div data-testid="reader-progress" className="mt-6 w-full bg-stone-200 rounded-full h-1">
        <div
          className="bg-orange-500 h-1 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {activeGloss && glossPosition && (
        <div
          data-testid="reader-gloss-popup"
          className="fixed z-50"
          style={{ left: glossPosition.x, top: glossPosition.y }}
        >
          <TapToGloss
            word={activeGloss.word}
            definition={activeGloss.definition_ja}
            reading={activeGloss.reading}
            onClose={handleCloseGloss}
            onAddSrs={onAddSrs ? () => onAddSrs(activeGloss.word) : undefined}
          />
        </div>
      )}
    </div>
  );
}
