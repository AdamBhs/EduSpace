import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SSE_URL =
  (import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000") +
  "/notifications/api/notifications/stream";

export function useNotificationStream() {
  const queryClient = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`);
    sourceRef.current = es;

    es.addEventListener("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    });

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      es.close();
      sourceRef.current = null;
    };
  }, [queryClient]);
}
