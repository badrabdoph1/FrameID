"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type TourState = {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
};

type GuidanceState = {
  showWelcomeTour: boolean;
  showNextAction: boolean;
  showGrowthSuggestions: boolean;
  dismissedSuggestions: string[];
};

type GuidanceContextType = {
  tour: TourState & {
    next: () => void;
    prev: () => void;
    complete: () => void;
    skip: () => void;
    restart: () => void;
  };
  state: GuidanceState;
  actions: {
    dismissSuggestion: (id: string) => void;
    resetSuggestions: () => void;
    hideNextAction: () => void;
    showNextAction: () => void;
  };
  analytics: {
    track: (event: GuidanceEvent) => void;
  };
};

type GuidanceEvent = {
  type: "tour_start" | "tour_complete" | "tour_skip" | "action_click" | "suggestion_click" | "suggestion_dismiss";
  metadata?: Record<string, unknown>;
};

const GuidanceContext = createContext<GuidanceContextType | null>(null);

const STORAGE_KEYS = {
  tourCompleted: "frameid:welcome-tour-completed",
  tourSkippedAt: "frameid:welcome-tour-skipped-at",
  dismissedSuggestions: "frameid:dismissed-suggestions",
  nextActionHidden: "frameid:next-action-hidden",
};

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function GuidanceProvider({ children, totalSteps = 4 }: { children: ReactNode; totalSteps?: number }) {
  const [tourState, setTourState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    totalSteps,
  });

  const [guidanceState, setGuidanceState] = useState<GuidanceState>({
    showWelcomeTour: false,
    showNextAction: true,
    showGrowthSuggestions: true,
    dismissedSuggestions: [],
  });

  useEffect(() => {
    const tourCompleted = getStoredValue(STORAGE_KEYS.tourCompleted, false);
    const dismissedSuggestions = getStoredValue<string[]>(STORAGE_KEYS.dismissedSuggestions, []);
    const nextActionHidden = getStoredValue(STORAGE_KEYS.nextActionHidden, false);

    setGuidanceState({
      showWelcomeTour: !tourCompleted,
      showNextAction: !nextActionHidden,
      showGrowthSuggestions: true,
      dismissedSuggestions,
    });

    if (!tourCompleted) {
      setTourState(prev => ({ ...prev, isActive: true }));
    }
  }, []);

  const track = useCallback((event: GuidanceEvent) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Guidance Analytics]", event);
    }
  }, []);

  const tourActions = {
    next: useCallback(() => {
      setTourState(prev => {
        if (prev.currentStep < prev.totalSteps - 1) {
          return { ...prev, currentStep: prev.currentStep + 1 };
        }
        return prev;
      });
    }, []),

    prev: useCallback(() => {
      setTourState(prev => {
        if (prev.currentStep > 0) {
          return { ...prev, currentStep: prev.currentStep - 1 };
        }
        return prev;
      });
    }, []),

    complete: useCallback(() => {
      setStoredValue(STORAGE_KEYS.tourCompleted, true);
      setTourState(prev => ({ ...prev, isActive: false }));
      setGuidanceState(prev => ({ ...prev, showWelcomeTour: false }));
      track({ type: "tour_complete", metadata: { step: tourState.currentStep } });
    }, [track, tourState.currentStep]),

    skip: useCallback(() => {
      setStoredValue(STORAGE_KEYS.tourCompleted, true);
      setStoredValue(STORAGE_KEYS.tourSkippedAt, Date.now());
      setTourState(prev => ({ ...prev, isActive: false }));
      setGuidanceState(prev => ({ ...prev, showWelcomeTour: false }));
      track({ type: "tour_skip", metadata: { step: tourState.currentStep } });
    }, [track, tourState.currentStep]),

    restart: useCallback(() => {
      setStoredValue(STORAGE_KEYS.tourCompleted, false);
      setTourState({ isActive: true, currentStep: 0, totalSteps });
      setGuidanceState(prev => ({ ...prev, showWelcomeTour: true }));
      track({ type: "tour_start", metadata: { restarted: true } });
    }, [track, totalSteps]),
  };

  const guidanceActions = {
    dismissSuggestion: useCallback((id: string) => {
      setGuidanceState(prev => {
        const updated = { ...prev, dismissedSuggestions: [...prev.dismissedSuggestions, id] };
        setStoredValue(STORAGE_KEYS.dismissedSuggestions, updated.dismissedSuggestions);
        return updated;
      });
      track({ type: "suggestion_dismiss", metadata: { suggestionId: id } });
    }, [track]),

    resetSuggestions: useCallback(() => {
      setStoredValue(STORAGE_KEYS.dismissedSuggestions, []);
      setGuidanceState(prev => ({ ...prev, dismissedSuggestions: [] }));
    }, []),

    hideNextAction: useCallback(() => {
      setStoredValue(STORAGE_KEYS.nextActionHidden, true);
      setGuidanceState(prev => ({ ...prev, showNextAction: false }));
    }, []),

    showNextAction: useCallback(() => {
      setStoredValue(STORAGE_KEYS.nextActionHidden, false);
      setGuidanceState(prev => ({ ...prev, showNextAction: true }));
    }, []),
  };

  const value: GuidanceContextType = {
    tour: {
      ...tourState,
      ...tourActions,
    },
    state: guidanceState,
    actions: guidanceActions,
    analytics: { track },
  };

  return <GuidanceContext.Provider value={value}>{children}</GuidanceContext.Provider>;
}

export function useGuidance(): GuidanceContextType {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error("useGuidance must be used within a GuidanceProvider");
  }
  return context;
}
