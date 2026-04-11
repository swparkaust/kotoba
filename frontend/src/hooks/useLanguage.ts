import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
}

export function useLanguage() {
  const [languageCode, setLanguageCode] = useState<string>("ja");
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/profile").then((data) => {
      if (data?.active_language_code) setLanguageCode(data.active_language_code);
    }).catch((e) => {
      setError(e?.message || "Failed to load profile");
    });
    api.get("/languages").then((data) => {
      setAvailableLanguages(Array.isArray(data) ? data : []);
    }).catch((e) => {
      setError(e?.message || "Failed to load languages");
    });
  }, []);

  const switchLanguage = useCallback(async (code: string) => {
    try {
      await api.patch("/profile", { active_language_code: code });
      setLanguageCode(code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to switch language");
    }
  }, []);

  return { languageCode, availableLanguages, error, switchLanguage };
}
