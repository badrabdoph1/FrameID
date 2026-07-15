"use client";

import { useCallback } from "react";

export function useGuideReward() {
  const triggerReward = useCallback((element: HTMLElement) => {
    element.classList.add("lg-reward-trigger");
    const timer = setTimeout(() => {
      element.classList.remove("lg-reward-trigger");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { triggerReward };
}
