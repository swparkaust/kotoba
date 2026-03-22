"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { LevelMap } from "@/components/LevelMap";
import { JlptProgressBar } from "@/components/JlptProgressBar";
import { StreakFreeEncouragement } from "@/components/StreakFreeEncouragement";

export default function DashboardPage() {
  const router = useRouter();
  const { languageCode } = useLanguage();
  const [levels, setLevels] = useState<any[]>([]);
  const [jlpt, setJlpt] = useState<any>(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/curriculum?language_code=${languageCode}`).then(setLevels),
      api.get(`/progress/jlpt_comparison?language_code=${languageCode}`).then(setJlpt),
      api.get("/progress").then((data) => {
        setLessonsCompleted((Array.isArray(data) ? data : []).filter((p: any) => p.status === "completed").length);
      }),
    ])
      .catch((e) => setError(e?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [languageCode]);

  const handleSelectLevel = async (levelId: number) => {
    try {
      const level = await api.get(`/curriculum/${levelId}`);
      const units = level.units || [];
      const firstUnit = units[0];
      const firstLesson = firstUnit?.lessons?.[0];
      if (firstLesson) {
        router.push(`/learn/${levelId}/${firstUnit.id}/${firstLesson.id}`);
      }
    } catch {
      setError("Could not load level");
    }
  };

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">ことば</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <StreakFreeEncouragement lessonsCompleted={lessonsCompleted} />
      {jlpt && <JlptProgressBar jlptLabel={jlpt.jlpt_label} percentage={jlpt.percentage} />}
      <LevelMap
        levels={levels}
        currentLevel={jlpt?.completed_levels || 0}
        onSelectLevel={handleSelectLevel}
      />
      <button
        onClick={() => router.push("/placement")}
        className="w-full text-center text-sm text-stone-400 hover:text-orange-600 py-2"
      >
        Take Placement Test — skip to your level
      </button>
    </div>
  );
}
