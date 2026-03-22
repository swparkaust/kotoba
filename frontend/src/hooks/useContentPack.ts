import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useContentPack() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdate = useCallback(async (currentVersion: number, languageCode?: string) => {
    setError(null);
    try {
      const code = languageCode || "ja";
      const data = await api.get(`/content_packs/check_update?language_code=${code}&current_version=${currentVersion}`);
      setUpdateAvailable(data.update_available);
      setLatestVersion(data.latest_version);
    } catch (e: any) {
      setError(e?.message || "Failed to check for updates");
    }
  }, []);

  return { updateAvailable, latestVersion, error, checkForUpdate };
}
