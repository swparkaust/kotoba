"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { LibraryBrowser } from "@/components/LibraryBrowser";

export default function LibraryPage() {
  const { languageCode } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/library?language_code=${languageCode}`)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || "Failed to load library"))
      .finally(() => setLoading(false));
  }, [languageCode]);

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Library</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <LibraryBrowser items={items} />
    </div>
  );
}
