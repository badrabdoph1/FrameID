import type { JourneyPace, JourneyState } from "./types";

export type BehaviorSignals = {
  pace: JourneyPace;
  isHesitating: boolean;
  hasInteracted: boolean;
  interactionDensity: number;
};

const PACE_THRESHOLDS = {
  fast: 5,
  slow: 1,
} as const;

export function createBehaviorDetector() {
  let interactionTimestamps: number[] = [];
  let lastInteractionTime = 0;
  let isHesitating = false;
  let hesitationTimer: ReturnType<typeof setTimeout> | null = null;
  let onHesitationChange: ((hesitating: boolean) => void) | null = null;

  function recordInteraction() {
    const now = Date.now();
    interactionTimestamps.push(now);
    lastInteractionTime = now;

    if (interactionTimestamps.length > 20) {
      interactionTimestamps = interactionTimestamps.slice(-20);
    }

    if (isHesitating) {
      isHesitating = false;
      onHesitationChange?.(false);
    }

    if (hesitationTimer) {
      clearTimeout(hesitationTimer);
      hesitationTimer = null;
    }
  }

  function startHesitationWatch(thresholdMs: number) {
    if (hesitationTimer) clearTimeout(hesitationTimer);
    isHesitating = false;
    hesitationTimer = setTimeout(() => {
      isHesitating = true;
      onHesitationChange?.(true);
    }, thresholdMs);
  }

  function stopHesitationWatch() {
    if (hesitationTimer) {
      clearTimeout(hesitationTimer);
      hesitationTimer = null;
    }
    isHesitating = false;
  }

  function setHesitationCallback(cb: (hesitating: boolean) => void) {
    onHesitationChange = cb;
  }

  function detectPace(): JourneyPace {
    const now = Date.now();
    const recent = interactionTimestamps.filter((t) => now - t < 5000);

    if (recent.length >= PACE_THRESHOLDS.fast) return "fast";
    if (recent.length <= PACE_THRESHOLDS.slow) return "slow";
    return "normal";
  }

  function getInteractionDensity(): number {
    const now = Date.now();
    return interactionTimestamps.filter((t) => now - t < 10000).length;
  }

  function getSignals(): BehaviorSignals {
    return {
      pace: detectPace(),
      isHesitating,
      hasInteracted: lastInteractionTime > 0,
      interactionDensity: getInteractionDensity(),
    };
  }

  function updateJourneyState(state: JourneyState): JourneyState {
    return {
      ...state,
      pace: detectPace(),
    };
  }

  function reset() {
    interactionTimestamps = [];
    lastInteractionTime = 0;
    isHesitating = false;
    if (hesitationTimer) {
      clearTimeout(hesitationTimer);
      hesitationTimer = null;
    }
  }

  function destroy() {
    reset();
    onHesitationChange = null;
  }

  return {
    recordInteraction,
    startHesitationWatch,
    stopHesitationWatch,
    setHesitationCallback,
    detectPace,
    getSignals,
    updateJourneyState,
    reset,
    destroy,
  };
}

export type BehaviorDetector = ReturnType<typeof createBehaviorDetector>;
