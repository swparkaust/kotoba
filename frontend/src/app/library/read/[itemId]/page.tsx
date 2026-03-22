"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ImmersiveReader } from "@/components/ImmersiveReader";
import { useReadingSession } from "@/hooks/useReadingSession";

export default function ReadPage() {
  const params = useParams();
  const itemId = params.itemId as string;
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { elapsed, wordsRead, start, pause, addGlossCard, setWordsRead, saveSession } = useReadingSession(itemId);

  const progress = useMemo(() => {
    if (!item?.word_count || item.word_count === 0) return 0;
    return Math.min(1.0, wordsRead / item.word_count);
  }, [wordsRead, item?.word_count]);

  // Keep a ref to the latest progress so cleanup always has the current value
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    api.get(`/library/${itemId}`)
      .then(setItem)
      .catch((e) => setError(e?.message || "Failed to load item"));
  }, [itemId]);

  useEffect(() => {
    start();
    return () => {
      pause();
      saveSession("reading", progressRef.current);
    };
  }, [start, pause, saveSession]);

  const handleWordTap = (word: string) => {
    addGlossCard(word, "");
    setWordsRead((prev: number) => prev + 1);
  };

  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!item) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <ImmersiveReader
      text={item.body_text || ""}
      elapsed={elapsed}
      progress={progress}
      onWordTap={handleWordTap}
      glosses={item.glosses || []}
    />
  );
}
