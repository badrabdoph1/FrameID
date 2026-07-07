"use client";

import type { Notification, NotificationType, UserError } from "./types";

type Listener = (notification: Notification) => void;

class NotificationService {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(notification: Notification): void {
    this.listeners.forEach((l) => l(notification));
  }

  success(title: string, description?: string, duration?: number): void {
    this.emit({
      id: crypto.randomUUID(),
      type: "success",
      title,
      description,
      duration: duration ?? 4000,
    });
  }

  error(
    title: string,
    description?: string,
    error?: UserError,
    duration?: number,
  ): void {
    this.emit({
      id: crypto.randomUUID(),
      type: "error",
      title,
      description,
      error,
      duration: duration ?? 8000,
    });
  }

  warning(title: string, description?: string, duration?: number): void {
    this.emit({
      id: crypto.randomUUID(),
      type: "warning",
      title,
      description,
      duration: duration ?? 5000,
    });
  }

  info(title: string, description?: string, duration?: number): void {
    this.emit({
      id: crypto.randomUUID(),
      type: "info",
      title,
      description,
      duration,
    });
  }
}

export const notify = new NotificationService();
