"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getJourneyMoments, type JourneyMoment } from "./journey-config";
import {
  consumeJourneyCarry,
  createJourneyCarry,
  isMomentSuppressed,
  suppressMoment,
} from "./journey-memory";
import { JourneyMessage } from "./journey-message";
import { initialJourneyState, journeyReducer, type JourneyPhase } from "./journey-state";
import { trackJourneyEvent } from "./journey-telemetry";
import styles from "./public-living-journey.module.css";

const CARD_WIDTH = 320;
const CARD_HEIGHT = 164;
const MOBILE_GRID_REVEAL = 182;

type Geometry = {
  fixed: boolean;
  cardLeft: number;
  cardTop: number;
  originX: number;
  originY: number;
  connectorLeft: number;
  connectorTop: number;
  connectorWidth: number;
  connectorHeight: number;
  connectorPath: string;
};

type PublicLivingJourneyProps = {
  pathnameOverride?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getGeometry(target: HTMLElement, moment: JourneyMoment): Geometry {
  const rect = target.getBoundingClientRect();
  const visualSource = target.querySelector<HTMLElement>("[data-journey-cta]") ?? target;
  const sourceRect = visualSource.getBoundingClientRect();
  const viewportWidth = window.innerWidth || 390;
  const viewportHeight = window.innerHeight || 844;
  const fixed = moment.id === "preview-use";
  const scrollX = fixed ? 0 : window.scrollX;
  const scrollY = fixed ? 0 : window.scrollY;
  const width = Math.min(CARD_WIDTH, viewportWidth - 32);
  const safeLeft = scrollX + 16;
  const safeRight = scrollX + viewportWidth - width - 16;
  const targetCenterX = scrollX + sourceRect.left + sourceRect.width / 2;
  const targetCenterY = scrollY + sourceRect.top + sourceRect.height / 2;

  let cardLeft = clamp(targetCenterX - width / 2, safeLeft, safeRight);
  let cardTop = scrollY + rect.top - CARD_HEIGHT - 28;

  if (moment.placement === "below" || cardTop < scrollY + 12) {
    cardTop = scrollY + rect.bottom + 28;
  }

  if (moment.placement === "side" && viewportWidth >= 768 && rect.width < viewportWidth * 0.72) {
    const leftCandidate = scrollX + rect.left - width - 32;
    const rightCandidate = scrollX + rect.right + 32;
    cardLeft = leftCandidate >= safeLeft ? leftCandidate : clamp(rightCandidate, safeLeft, safeRight);
    cardTop = clamp(targetCenterY - CARD_HEIGHT / 2, scrollY + 20, scrollY + viewportHeight - CARD_HEIGHT - 20);
  } else if (moment.placement === "side") {
    cardLeft = viewportWidth >= 768 ? scrollX + 32 : safeLeft;
    cardTop = scrollY + clamp(viewportHeight * 0.16, 88, 148);
  }

  if (moment.personality === "prism") {
    if (viewportWidth < 768) {
      cardLeft = safeLeft;
      cardTop = scrollY + rect.top + 10;
    } else {
      cardLeft = clamp(targetCenterX - width - 50, safeLeft, safeRight);
      cardTop = scrollY + rect.top - CARD_HEIGHT - 43;
    }
  }

  if (moment.personality === "assembly") {
    const assemblyAlreadyShifted = target.classList.contains(styles.assemblyOpen);
    cardLeft = clamp(targetCenterX - width / 2, safeLeft, safeRight);
    cardTop = scrollY + rect.top - (assemblyAlreadyShifted ? MOBILE_GRID_REVEAL : 0) + 10;
  }

  cardTop = Math.max(scrollY + 12, cardTop);

  const originX = moment.placement === "side" && rect.width > viewportWidth * 0.72
    ? scrollX + rect.left + rect.width * 0.72
    : targetCenterX;
  const originY = moment.personality === "assembly"
    ? targetCenterY + (target.classList.contains(styles.assemblyOpen) ? 0 : MOBILE_GRID_REVEAL)
    : moment.personality === "prism"
      ? scrollY + rect.top + (viewportWidth < 768 ? MOBILE_GRID_REVEAL : 0)
      : moment.placement === "side" && rect.height > viewportHeight * 0.6
        ? scrollY + rect.top + Math.min(rect.height * 0.34, 260)
        : targetCenterY;
  const cardAnchorX = clamp(originX, cardLeft + 34, cardLeft + width - 34);
  const cardAnchorY = cardTop > originY ? cardTop : cardTop + CARD_HEIGHT;
  const connectorLeft = Math.min(originX, cardAnchorX) - 10;
  const connectorTop = Math.min(originY, cardAnchorY) - 10;
  const connectorWidth = Math.max(Math.abs(originX - cardAnchorX) + 20, 24);
  const connectorHeight = Math.max(Math.abs(originY - cardAnchorY) + 20, 24);
  const startX = originX - connectorLeft;
  const startY = originY - connectorTop;
  const endX = cardAnchorX - connectorLeft;
  const endY = cardAnchorY - connectorTop;
  const bend = Math.max(18, Math.abs(endY - startY) * 0.42);

  return {
    fixed,
    cardLeft,
    cardTop,
    originX,
    originY,
    connectorLeft,
    connectorTop,
    connectorWidth,
    connectorHeight,
    connectorPath: `M ${startX} ${startY} C ${startX} ${startY + (endY > startY ? bend : -bend)}, ${endX} ${endY + (endY > startY ? -bend : bend)}, ${endX} ${endY}`,
  };
}

function getDestinationPath(element: HTMLElement, eventTarget: EventTarget | null): string | null {
  const clicked = eventTarget instanceof Element ? eventTarget.closest("a[href], button") : null;
  const interactive = clicked ?? (element.matches("a[href], button") ? element : null);
  if (!(interactive instanceof HTMLAnchorElement)) return null;

  try {
    return new URL(interactive.href, window.location.origin).pathname;
  } catch {
    return null;
  }
}

function isRelevantActivation(moment: JourneyMoment, target: HTMLElement, eventTarget: EventTarget | null): boolean {
  if (moment.id === "preview-real") return false;
  if (moment.id === "templates-pick") {
    return eventTarget instanceof Element && Boolean(eventTarget.closest("a[href]"));
  }
  return target.matches("a,button") || (eventTarget instanceof Element && Boolean(eventTarget.closest("a,button")));
}

function getEffectSource(target: HTMLElement): HTMLElement {
  return target.querySelector<HTMLElement>("[data-journey-cta], [data-journey-card]") ?? target;
}

export function PublicLivingJourney({ pathnameOverride }: PublicLivingJourneyProps) {
  const appPathname = usePathname();
  const pathname = pathnameOverride ?? appPathname;
  const moments = useMemo(() => getJourneyMoments(pathname), [pathname]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [triggerReady, setTriggerReady] = useState(false);
  const idleUsedRef = useRef(false);
  const carryConsumedRef = useRef(false);
  const currentMoment = moments[activeIndex];
  const reducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    setActiveIndex(0);
    setTarget(null);
    setGeometry(null);
    setTriggerReady(false);
    idleUsedRef.current = false;
    carryConsumedRef.current = false;
    dispatch({ type: "reset" });
  }, [pathname]);

  useEffect(() => {
    if (!currentMoment) return;
    if (isMomentSuppressed(window.localStorage, currentMoment.id)) {
      setActiveIndex((index) => index + 1);
      dispatch({ type: "reset" });
      return;
    }

    const findTarget = () => {
      const element = document.querySelector<HTMLElement>(
        `[data-journey-source="${currentMoment.source}"]`,
      );
      if (element) {
        setTarget(element);
        setGeometry(getGeometry(element, currentMoment));
      }
      return element;
    };

    if (findTarget()) return;
    const observer = new MutationObserver(() => {
      if (findTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [currentMoment]);

  useEffect(() => {
    if (!target || !currentMoment) return;
    const update = () => setGeometry(getGeometry(target, currentMoment));
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resizeObserver?.observe(target);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [currentMoment, target]);

  useEffect(() => {
    if (!currentMoment) return;
    if (currentMoment.trigger === "settled") {
      setTriggerReady(true);
      return;
    }

    const checkProgress = () => {
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      if (scrollable === 0 || window.scrollY / scrollable >= 0.55) {
        setTriggerReady(true);
        window.removeEventListener("scroll", checkProgress);
      }
    };
    checkProgress();
    window.addEventListener("scroll", checkProgress, { passive: true });
    return () => window.removeEventListener("scroll", checkProgress);
  }, [currentMoment]);

  useEffect(() => {
    if (!target || !currentMoment || !triggerReady || state.phase !== "dormant") return;
    const timer = window.setTimeout(() => dispatch({ type: "source-ready" }), 500);
    return () => window.clearTimeout(timer);
  }, [currentMoment, state.phase, target, triggerReady]);

  useEffect(() => {
    if (!currentMoment || !target || state.phase !== "waking") return;
    const timer = window.setTimeout(
      () => {
        setGeometry(getGeometry(target, currentMoment));
        dispatch({ type: "message-ready" });
        trackJourneyEvent("public_journey_moment_seen", currentMoment.id);
      },
      reducedMotion ? 100 : 600,
    );
    return () => window.clearTimeout(timer);
  }, [currentMoment, reducedMotion, state.phase, target]);

  useEffect(() => {
    if (!target || !currentMoment) return;
    const visualSource = getEffectSource(target);
    const effectByPhase: Partial<Record<JourneyPhase, string>> = {
      waking: "wake",
      speaking: "halo",
      dismissing: "halo",
      lingering: "linger",
      rewarding: "reward",
    };
    const effect = effectByPhase[state.phase];
    const classes = [
      styles.sourceWake,
      styles.sourceHalo,
      styles.sourceLinger,
      styles.sourceReward,
    ];
    const layoutClasses = [styles.mobileGridOpen, styles.assemblyOpen];
    visualSource.classList.remove(...classes);
    visualSource.removeAttribute("data-journey-effect");
    target.classList.remove(...layoutClasses);

    const animateWholeSource = currentMoment.personality !== "prism" && currentMoment.id !== "preview-real";
    if (effect && animateWholeSource) {
      const className = effect === "wake"
        ? styles.sourceWake
        : effect === "halo"
          ? styles.sourceHalo
          : effect === "linger"
            ? styles.sourceLinger
            : styles.sourceReward;
      visualSource.classList.add(className);
      visualSource.setAttribute("data-journey-effect", effect);
    }

    const cards = [...target.querySelectorAll<HTMLElement>("[data-journey-card]")];
    if (currentMoment.personality === "prism" && (state.phase === "waking" || state.phase === "speaking")) {
      cards.forEach((card, index) => {
        card.classList.add(styles.cascadeCard);
        card.style.setProperty("--journey-cascade-delay", `${index * 90}ms`);
      });
    }

    const prismIsOpen = currentMoment.personality === "prism"
      && window.innerWidth < 768
      && ["waking", "speaking", "dismissing", "lingering"].includes(state.phase);
    if (prismIsOpen) target.classList.add(styles.mobileGridOpen);
    const assemblyIsOpen = currentMoment.personality === "assembly"
      && ["waking", "speaking", "dismissing", "lingering"].includes(state.phase);
    if (assemblyIsOpen) target.classList.add(styles.assemblyOpen);

    return () => {
      visualSource.classList.remove(...classes);
      visualSource.removeAttribute("data-journey-effect");
      target.classList.remove(...layoutClasses);
      cards.forEach((card) => {
        card.classList.remove(styles.cascadeCard);
        card.style.removeProperty("--journey-cascade-delay");
      });
    };
  }, [currentMoment, state.phase, target]);

  useEffect(() => {
    if (!target || carryConsumedRef.current) return;
    carryConsumedRef.current = true;
    const carry = consumeJourneyCarry(window.sessionStorage, pathname);
    if (!carry) return;
    const visualSource = getEffectSource(target);
    visualSource.classList.add(styles.sourceCarry);
    visualSource.setAttribute("data-journey-carry", carry.fromMoment);
    const timer = window.setTimeout(() => {
      visualSource.classList.remove(styles.sourceCarry);
      visualSource.removeAttribute("data-journey-carry");
    }, reducedMotion ? 160 : 850);
    return () => window.clearTimeout(timer);
  }, [pathname, reducedMotion, target]);

  useEffect(() => {
    if (!target || !currentMoment) return;
    const activate = (event: Event) => {
      const isValidSignupSubmit = currentMoment.id === "signup-create" && event.type === "submit";
      if (!isValidSignupSubmit && !isRelevantActivation(currentMoment, target, event.target)) return;
      const destination = getDestinationPath(target, event.target);
      if (destination && destination !== pathname) {
        createJourneyCarry(window.sessionStorage, {
          fromMoment: currentMoment.id,
          toPath: destination,
        });
      }
      trackJourneyEvent("public_journey_target_activated", currentMoment.id);
      dispatch({ type: "target-activated" });
    };
    const eventSource = currentMoment.id === "signup-create" ? target.closest("form") : target;
    const eventName = currentMoment.id === "signup-create" ? "submit" : "click";
    eventSource?.addEventListener(eventName, activate);
    return () => eventSource?.removeEventListener(eventName, activate);
  }, [currentMoment, pathname, target]);

  useEffect(() => {
    if (state.phase !== "dismissing") return;
    const timer = window.setTimeout(() => dispatch({ type: "message-exited" }), reducedMotion ? 100 : 220);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, state.phase]);

  useEffect(() => {
    if (state.phase !== "lingering" && state.phase !== "rewarding") return;
    const timer = window.setTimeout(
      () => dispatch({ type: "halo-exited" }),
      state.phase === "rewarding" ? 620 : 1_000,
    );
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "complete" || !currentMoment) return;
    const nextMoment = moments[activeIndex + 1];
    if (nextMoment) {
      const timer = window.setTimeout(() => {
        setActiveIndex((index) => index + 1);
        setTarget(null);
        setGeometry(null);
        setTriggerReady(false);
        dispatch({ type: "reset" });
      }, 280);
      return () => window.clearTimeout(timer);
    }

    if (!target || state.targetActivated || idleUsedRef.current) return;
    const timer = window.setTimeout(() => {
      idleUsedRef.current = true;
      const visualSource = getEffectSource(target);
      visualSource.classList.add(styles.sourceIdle);
      visualSource.setAttribute("data-journey-effect", "idle");
      window.setTimeout(() => {
        visualSource.classList.remove(styles.sourceIdle);
        if (visualSource.getAttribute("data-journey-effect") === "idle") {
          visualSource.removeAttribute("data-journey-effect");
        }
      }, 900);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, currentMoment, moments, state.phase, state.targetActivated, target]);

  const dismiss = (shouldSuppress: boolean) => {
    if (!currentMoment) return;
    if (shouldSuppress) {
      suppressMoment(window.localStorage, currentMoment.id);
      trackJourneyEvent("public_journey_moment_suppressed", currentMoment.id);
    }
    trackJourneyEvent("public_journey_message_dismissed", currentMoment.id);
    dispatch({ type: "dismiss" });
  };

  if (!currentMoment || !target || !geometry || typeof document === "undefined") return null;

  const showMessage = state.phase === "speaking" || state.phase === "dismissing";
  const showConnector = showMessage && !reducedMotion;
  const showReward = state.phase === "rewarding";

  return createPortal(
    <div className={styles.layer} aria-hidden={showMessage ? undefined : true}>
      {showConnector ? (
        <svg
          className={`${styles.connector} ${geometry.fixed ? styles.fixedElement : ""} ${state.phase === "dismissing" ? styles.connectorReturning : ""}`}
          style={{
            left: geometry.connectorLeft,
            top: geometry.connectorTop,
            width: geometry.connectorWidth,
            height: geometry.connectorHeight,
          }}
          viewBox={`0 0 ${geometry.connectorWidth} ${geometry.connectorHeight}`}
          aria-hidden
        >
          <path d={geometry.connectorPath} pathLength="1" />
        </svg>
      ) : null}
      {showMessage ? (
        <JourneyMessage
          key={currentMoment.id}
          moment={currentMoment}
          leaving={state.phase === "dismissing"}
          style={{
            left: geometry.cardLeft,
            top: geometry.cardTop,
            position: geometry.fixed ? "fixed" : "absolute",
          }}
          onDismiss={dismiss}
        />
      ) : null}
      {showReward ? (
        <span
          className={`${styles.rewardMark} ${geometry.fixed ? styles.fixedElement : ""}`}
          style={{ left: geometry.originX, top: geometry.originY }}
          aria-hidden
        >
          ✓
        </span>
      ) : null}
    </div>,
    document.body,
  );
}
