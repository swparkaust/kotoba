"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { JlptProgressBar } from "@/components/JlptProgressBar";
import { JlptComparison } from "@/hooks/useProgress";

export default function ProgressPage() {
  const { languageCode } = useLanguage();
  const [jlpt, setJlpt] = useState<JlptComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronous setState before async fetch is standard loading-state pattern
    setLoading(true);
    api.get(`/progress/jlpt_comparison?language_code=${languageCode}`)
      .then(setJlpt)
      .catch((e) => setError(e?.message || "Failed to load progress"))
      .finally(() => setLoading(false));
  }, [languageCode]);

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Progress</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {jlpt && <JlptProgressBar jlptLabel={jlpt.jlpt_label} percentage={jlpt.percentage} />}
    </div>
  );
}
