"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CardPlacement,
  GuideMessage,
  GuidePhase,
  JourneyState,
  SafeZoneResult,
  VisitLevel,
} from "./types";
import { ACCENT } from "./types";
import {
  getVisitLevel,
  hasProgressedBeyond,
  incrementVisitCount,
  isMessageSuppressed,
  loadJourneyState,
  markMessageDismissed,
  markMessageSeen,
  recordPageVisit,
  saveJourneyState,
} from "./journey-state";
import {
  createBehaviorDetector,
  type BehaviorDetector,
} from "./behavior-detector";

const MIN_CARD_WIDTH = 240;
const MIN_CARD_HEIGHT = 120;
const CARD_MARGIN = 16;

export type LivingGuideResult = {
  phase: GuidePhase;
  message: GuideMessage | null;
  visitLevel: VisitLevel;
  placement: CardPlacement;
  cardPosition: { x: number; y: number };
  accent: string;
  dismiss: (suppress: boolean) => void;
  cancel: () => void;
  triggerReward: (element: HTMLElement) => void;
};

export function useLivingGuide(
  message: GuideMessage | null,
): LivingGuideResult {
  const [phase, setPhase] = useState<GuidePhase>("idle");
  const [placement, setPlacement] = useState<CardPlacement>("below");
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [journeyState, setJourneyState] = useState<JourneyState>(() =>
    loadJourneyState(),
  );

  const detectorRef = useRef<BehaviorDetector | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const cancelledRef = useRef(false);
  const phaseRef = useRef<GuidePhase>("idle");

  phaseRef.current = phase;

  const visitLevel = useMemo(() => {
    if (!message) return "first";
    return getVisitLevel(message.id);
  }, [message]);

  const isReady = useMemo(() => {
    if (!message) return false;
    if (isMessageSuppressed(message.id)) return false;
    if (hasProgressedBeyond(message.id, journeyState)) return false;
    if (
      message.audience === "guest" &&
      journeyState.visitedPages.includes("/signup")
    )
      return false;
    return true;
  }, [message, journeyState]);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      if (!cancelledRef.current) fn();
    }, ms);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const clearAllTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
  }, []);

  const cancelAll = useCallback(() => {
    cancelledRef.current = true;
    clearAllTimers();
    detectorRef.current?.stopHesitationWatch();
    if (phaseRef.current !== "idle" && phaseRef.current !== "suppressed") {
      setPhase("cancelled");
      requestAnimationFrame(() => {
        setPhase("idle");
        cancelledRef.current = false;
      });
    }
  }, [clearAllTimers]);

  const calculateSafeZone = useCallback(
    (targetEl: HTMLElement): SafeZoneResult => {
      const targetRect = targetEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const fixedElements = document.querySelectorAll(
        "[data-guide-collision], nav[class*='fixed'], [data-preview-toolbar]",
      );
      const obstacles: DOMRect[] = [];
      fixedElements.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) obstacles.push(rect);
      });

      const clearElements = document.querySelectorAll(
        "[data-guide-keep-clear]",
      );
      clearElements.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) obstacles.push(rect);
      });

      const cardW = Math.min(MIN_CARD_WIDTH, vw - CARD_MARGIN * 2);
      const cardH = MIN_CARD_HEIGHT;

      const candidates: Array<{
        placement: CardPlacement;
        x: number;
        y: number;
      }> = [
        {
          placement: "below",
          x: targetRect.left + targetRect.width / 2 - cardW / 2,
          y: targetRect.bottom + 12,
        },
        {
          placement: "above",
          x: targetRect.left + targetRect.width / 2 - cardW / 2,
          y: targetRect.top - cardH - 12,
        },
        {
          placement: "end",
          x: targetRect.right + 12,
          y: targetRect.top + targetRect.height / 2 - cardH / 2,
        },
        {
          placement: "start",
          x: targetRect.left - cardW - 12,
          y: targetRect.top + targetRect.height / 2 - cardH / 2,
        },
      ];

      for (const candidate of candidates) {
        const cardRect = {
          left: candidate.x,
          top: candidate.y,
          right: candidate.x + cardW,
          bottom: candidate.y + cardH,
        };

        if (cardRect.left < 0 || cardRect.right > vw) continue;
        if (cardRect.top < 0 || cardRect.bottom > vh) continue;

        let collides = false;
        for (const obs of obstacles) {
          if (
            cardRect.left < obs.right &&
            cardRect.right > obs.left &&
            cardRect.top < obs.bottom &&
            cardRect.bottom > obs.top
          ) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          return { ...candidate, fits: true };
        }
      }

      return {
        placement: "below",
        x: Math.max(
          CARD_MARGIN,
          Math.min(
            targetRect.left + targetRect.width / 2 - cardW / 2,
            vw - cardW - CARD_MARGIN,
          ),
        ),
        y: targetRect.bottom + 12,
        fits: false,
      };
    },
    [],
  );

  const waitForLayout = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }, []);

  const waitForElement = useCallback(
    (selector: string): Promise<HTMLElement | null> => {
      return new Promise((resolve) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          resolve(el);
          return;
        }

        const observer = new MutationObserver(() => {
          const found = document.querySelector(selector) as HTMLElement | null;
          if (found) {
            observer.disconnect();
            resolve(found);
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        scheduleTimer(() => {
          observer.disconnect();
          resolve(null);
        }, 5000);
      });
    },
    [scheduleTimer],
  );

  const startSequence = useCallback(async () => {
    if (!message || cancelledRef.current) return;

    const currentPhase = phaseRef.current;
    if (currentPhase !== "idle") return;

    setPhase("waiting-layout");
    await waitForLayout();
    if (cancelledRef.current) return;

    const targetEl = await waitForElement(message.targetSelector);
    if (!targetEl || cancelledRef.current) return;

    const zone = calculateSafeZone(targetEl);
    setPlacement(zone.placement);
    setCardPosition({ x: zone.x, y: zone.y });

    if (visitLevel === "familiar") {
      setPhase("hint-only");
      return;
    }

    const signals = detectorRef.current?.getSignals();
    const isFast = signals?.pace === "fast";
    const isReturning = visitLevel === "returning";

    const breathingDelay = isFast
      ? message.delay.minAfterLoad
      : isReturning
        ? message.delay.minAfterLoad * 0.6
        : message.delay.minAfterLoad;

    setPhase("breathing");

    scheduleTimer(() => {
      if (cancelledRef.current) return;

      if (message.emergence === "inline") {
        setPhase("hint-only");
        return;
      }

      setPhase("waiting-breath");

      scheduleTimer(() => {
        if (cancelledRef.current) return;
        setPhase("breathing-again");

        scheduleTimer(() => {
          if (cancelledRef.current) return;
          setPhase("bridge");

          scheduleTimer(() => {
            if (cancelledRef.current) return;
            setPhase("card-birth");

            scheduleTimer(() => {
              if (cancelledRef.current) return;
              setPhase("visible");
              markMessageSeen(message.id);
              incrementVisitCount(message.id);
            }, 800);
          }, 500);
        }, message.delay.cardAfterBreath);
      }, message.delay.secondBreathWindow > 0 ? message.delay.secondBreathWindow : 0);
    }, breathingDelay);
  }, [message, visitLevel, waitForLayout, waitForElement, calculateSafeZone, scheduleTimer]);

  useEffect(() => {
    if (!message || !isReady) return;

    cancelledRef.current = false;
    const detector = createBehaviorDetector();
    detectorRef.current = detector;

    const updatedState = recordPageVisit(
      typeof window !== "undefined" ? window.location.pathname : "",
      journeyState,
    );
    setJourneyState(updatedState);
    saveJourneyState(updatedState);

    if (message.hesitationDelay > 0) {
      detector.setHesitationCallback((hesitating) => {
        if (hesitating && phaseRef.current === "idle") {
          setPhase("hint-only");
        }
      });
      detector.startHesitationWatch(message.hesitationDelay);
    } else {
      startSequence();
    }

    const cancelHandler = () => {
      if (
        phaseRef.current !== "idle" &&
        phaseRef.current !== "visible" &&
        phaseRef.current !== "suppressed" &&
        phaseRef.current !== "cancelled"
      ) {
        cancelAll();
      }
    };

    const interactionHandler = () => {
      detector.recordInteraction();
      if (
        phaseRef.current !== "idle" &&
        phaseRef.current !== "visible" &&
        phaseRef.current !== "suppressed" &&
        phaseRef.current !== "cancelled"
      ) {
        cancelAll();
      }
    };

    window.addEventListener("scroll", cancelHandler, { passive: true });
    window.addEventListener("click", interactionHandler, { passive: true });
    window.addEventListener("touchstart", cancelHandler, { passive: true });
    window.addEventListener("keydown", cancelHandler, { passive: true });

    const cleanup = () => {
      window.removeEventListener("scroll", cancelHandler);
      window.removeEventListener("click", interactionHandler);
      window.removeEventListener("touchstart", cancelHandler);
      window.removeEventListener("keydown", cancelHandler);
      detector.destroy();
      clearAllTimers();
    };

    return cleanup;
  }, [message, isReady, journeyState, startSequence, cancelAll, clearAllTimers]);

  const dismiss = useCallback(
    (suppress: boolean) => {
      if (!message) return;
      if (suppress) {
        markMessageDismissed(message.id);
        setPhase("suppressed");
      } else {
        setPhase("returning");
      }
      scheduleTimer(() => {
        setPhase("halo-fading");
        scheduleTimer(() => {
          setPhase("idle");
        }, 800);
      }, 300);
    },
    [message, scheduleTimer],
  );

  const cancel = useCallback(() => {
    cancelAll();
  }, [cancelAll]);

  const triggerReward = useCallback((element: HTMLElement) => {
    element.classList.add("lg-reward-trigger");
    setTimeout(() => {
      element.classList.remove("lg-reward-trigger");
    }, 600);
  }, []);

  return {
    phase,
    message,
    visitLevel,
    placement,
    cardPosition,
    accent: ACCENT,
    dismiss,
    cancel,
    triggerReward,
  };
}
