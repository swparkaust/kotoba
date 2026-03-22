import { useEffect, useRef, useCallback } from "react";

export function useActionCable<T>(channel: string, onReceived: (data: T) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onReceivedRef = useRef(onReceived);

  useEffect(() => { onReceivedRef.current = onReceived; }, [onReceived]);

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_CABLE_URL;
    if (!url) return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ command: "subscribe", identifier: JSON.stringify({ channel }) }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ping" || msg.type === "welcome" || msg.type === "confirm_subscription") return;
        if (msg.message) onReceivedRef.current(msg.message as T);
      } catch {
        // Ignore unparseable messages
      }
    };

    ws.onerror = () => {
      // Will trigger onclose, which handles reconnection
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [channel]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
