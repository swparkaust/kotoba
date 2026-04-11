"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { RealAudioPlayer } from "@/components/RealAudioPlayer";
import { LibraryItem } from "@/hooks/useLibrary";

export default function ListenPage() {
  const params = useParams();
  const itemId = params.itemId as string;
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/library/${itemId}`)
      .then(setItem)
      .catch((e) => setError(e?.message || "Failed to load item"));
  }, [itemId]);

  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!item) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">{item.title}</h1>
      <RealAudioPlayer
        audioUrl={item.audio_url || ""}
        transcription={item.body_text || ""}
        scaffolding={{
          glosses: item.glosses || [],
          listening_tips: item.listening_tips || [],
          comprehension_questions: item.comprehension_questions || [],
        }}
      />
    </div>
  );
}
