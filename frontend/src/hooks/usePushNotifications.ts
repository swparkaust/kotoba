import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await api.post("/push_subscriptions", subscription.toJSON());
      setIsSubscribed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to subscribe to notifications");
    }
  }, []);

  useEffect(() => {
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {});
  }, []);

  return { isSubscribed, error, subscribe };
}
