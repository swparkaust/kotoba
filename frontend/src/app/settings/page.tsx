"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { NotificationSettings } from "@/components/NotificationSettings";

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState("09:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/profile").then((data) => {
      setNotifEnabled(data?.notifications_enabled || false);
      setNotifTime(data?.notification_time || "09:00");
    }).catch((e) => {
      setError(e?.message || "Failed to load settings");
    }).finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async (enabled: boolean) => {
    const previous = notifEnabled;
    setNotifEnabled(enabled);
    try {
      await api.patch("/profile", { notifications_enabled: enabled });
    } catch {
      setNotifEnabled(previous); // Revert on failure
      setError("Failed to update notification setting");
    }
  }, [notifEnabled]);

  const handleTimeChange = useCallback(async (time: string) => {
    setNotifTime(time);
    try {
      await api.patch("/profile", { notification_time: time });
    } catch {
      setError("Failed to update notification time");
    }
  }, []);

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Settings</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <NotificationSettings
        enabled={notifEnabled}
        time={notifTime}
        onToggle={handleToggle}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
}
