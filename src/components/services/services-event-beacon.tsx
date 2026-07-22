"use client";

import { useEffect } from "react";

export function ServicesEventBeacon({ event }: { event: { name: string; idempotencyKey: string; productId?: string; offeringId?: string; attributionId?: string; properties?: Record<string, unknown> } }) {
  useEffect(() => {
    void fetch("/api/services/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  }, [event]);
  return null;
}
