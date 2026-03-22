import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      await api.post("/push_subscriptions", subscription.toJSON());
      setIsSubscribed(true);
    } catch (e: any) {
      setError(e?.message || "Failed to subscribe to notifications");
    }
  }, []);

  useEffect(() => {
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {}); // Browser may not support push
  }, []);

  return { isSubscribed, error, subscribe };
}
