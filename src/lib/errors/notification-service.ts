"use client";

import type { Notification, UserError } from "./types";

type Listener = (notification: Notification) => void;

class NotificationService {
  private listeners = new Set<Listener>();
  private lastEmit = new Map<string, number>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(notification: Notification): void {
    this.listeners.forEach((l) => l(notification));
  }

  private getGroupKey(title: string): string {
    return title;
  }

  private shouldGroup(key: string): boolean {
    const now = Date.now();
    const last = this.lastEmit.get(key);
    if (last && now - last < 3000) {
      return true;
    }
    this.lastEmit.set(key, now);
    return false;
  }

  success(title: string, description?: string, duration?: number, requestId?: string): void {
    const groupKey = this.getGroupKey(title);
    this.emit({
      id: crypto.randomUUID(),
      type: "success",
      title,
      description,
      duration: duration ?? 4000,
      groupKey,
      requestId,
    });
  }

  error(
    title: string,
    description?: string,
    error?: UserError,
    duration?: number,
    requestId?: string,
  ): void {
    this.emit({
      id: crypto.randomUUID(),
      type: "error",
      title,
      description,
      error,
      duration: duration ?? 8000,
      requestId,
    });
  }

  warning(title: string, description?: string, duration?: number, requestId?: string): void {
    const groupKey = this.getGroupKey(title);
    this.emit({
      id: crypto.randomUUID(),
      type: "warning",
      title,
      description,
      duration: duration ?? 5000,
      groupKey,
      requestId,
    });
  }

  info(title: string, description?: string, duration?: number, requestId?: string): void {
    const groupKey = this.getGroupKey(title);
    this.emit({
      id: crypto.randomUUID(),
      type: "info",
      title,
      description,
      duration: duration ?? 6000,
      groupKey,
      requestId,
    });
  }
}

export const notify = new NotificationService();
