"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { PageTip } from "@/lib/smart-tips";
import { accentToGlow } from "@/lib/smart-tips";

type SmartTipConfig = PageTip;

const SMART_TIPS_STORAGE_KEY = "frameid:smart-tips-seen";

export function useSmartTip(config: SmartTipConfig | null) {
  const [dismissed, setDismissed] = useState(false);
  const [showing, setShowing] = useState(false);

  const seenTips = useMemo(() => {
    try {
      const raw = window.localStorage.getItem(SMART_TIPS_STORAGE_KEY);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set<string>(parsed);
      return new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  useEffect(() => {
    if (!config) return;
    if (config.showOnce && seenTips.has(config.id)) return;
    const timer = window.setTimeout(() => setShowing(true), 400);
    return () => window.clearTimeout(timer);
  }, [config, seenTips]);

  const dismiss = useCallback(() => {
    if (!config) return;
    setShowing(false);
    setDismissed(true);
    try {
      const raw = window.localStorage.getItem(SMART_TIPS_STORAGE_KEY);
      const seen = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
      seen.add(config.id);
      window.localStorage.setItem(SMART_TIPS_STORAGE_KEY, JSON.stringify(Array.from(seen)));
    } catch {
    }
  }, [config]);

  return { showing, dismissed, dismiss };
}

export function resetSmartTips() {
  try {
    window.localStorage.removeItem(SMART_TIPS_STORAGE_KEY);
  } catch {
  }
}

const placementClasses: Record<string, string> = {
  center: "fixed inset-0 flex items-center justify-center p-4",
  top: "fixed inset-x-0 top-0 flex justify-center px-4 pt-4 sm:pt-6",
  bottom: "fixed inset-x-0 bottom-0 flex justify-center px-4 pb-4 sm:pb-6",
  left: "fixed inset-y-0 left-0 flex items-center pl-4 pr-8",
  right: "fixed inset-y-0 right-0 flex items-center pr-4 pl-8",
};

const animationClasses: Record<string, string> = {
  "float-up": "smart-tip-float-up",
  fade: "smart-tip-fade",
  zoom: "smart-tip-zoom",
  "slide-right": "smart-tip-slide-right",
  "slide-left": "smart-tip-slide-left",
  bounce: "smart-tip-bounce",
  sparkle: "smart-tip-sparkle",
  check: "smart-tip-check",
};

export function SmartTip({ config }: { config: SmartTipConfig | null }) {
  const { showing, dismissed, dismiss } = useSmartTip(config);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (!showing || !cardRef.current) return;
    function onMove(e: MouseEvent) {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [showing]);

  const isDismissing = dismissed;

  useEffect(() => {
    if (isDismissing) {
      const timer = setTimeout(() => setHintVisible(false), 250);
      return () => clearTimeout(timer);
    }
    setHintVisible(true);
  }, [isDismissing]);

  if (!config || !showing) return null;

  const glow = config.glowColor ?? accentToGlow(config.accent);
  const Icon = config.icon ?? Sparkles;
  const BtnIcon = config.buttonIcon ?? Sparkles;
  const placementClass = placementClasses[config.placement] ?? placementClasses.center;
  const animationClass = animationClasses[config.animation] ?? animationClasses["float-up"];

  return (
    <>
      {config.hintTarget && hintVisible ? <SmartHint selector={config.hintTarget} glow={glow} cardRef={cardRef} dismissing={isDismissing} /> : null}
      <div className={`fixed inset-0 z-40 pointer-events-none ${isDismissing ? "smart-tip-overlay-out" : "smart-tip-overlay-in"}`} />
      <div className={`${placementClass} z-50 ${isDismissing ? "smart-tip-card-out" : animationClass}`}>
        <div
          ref={cardRef}
          className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.14] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-5"
          style={{
            background: `linear-gradient(145deg, rgba(14,18,26,0.94) 0%, rgba(10,13,20,0.97) 100%)`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 80px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${glow} 0%, transparent 70%)`,
            }}
          />

          <div className="relative flex items-start gap-3">
            <div className="smart-tip-icon-entrance relative shrink-0">
              <div
                className="absolute inset-0 rounded-xl blur-lg"
                style={{ background: glow, opacity: 0.5 }}
              />
              <div
                className="relative grid size-10 place-items-center rounded-xl sm:size-11"
                style={{ background: `${config.accent}18` }}
              >
                <Icon className="size-5 sm:size-5.5" style={{ color: config.accent }} aria-hidden />
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="smart-tip-stagger text-sm font-black text-[#fff7e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-base">
                {config.title}
              </h3>
              <p className="smart-tip-stagger mt-1 text-xs font-bold leading-5 text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-sm">
                {config.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="smart-tip-stagger mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br py-2.5 text-xs font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5 sm:rounded-2xl sm:py-3 sm:text-sm"
            style={{
              background: `linear-gradient(135deg, ${config.accent}, ${config.accent}dd)`,
              boxShadow: `0 8px 24px ${glow}`,
              animationDelay: "0.5s",
            }}
          >
            <BtnIcon className="size-3.5 sm:size-4" aria-hidden />
            {config.button}
          </button>
        </div>
      </div>
    </>
  );
}

function SmartHint({ selector, glow, cardRef, dismissing: isHintDismissing }: { selector: string; glow: string; cardRef: React.RefObject<HTMLDivElement | null>; dismissing: boolean }) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [selector]);

  useEffect(() => {
    if (!cardRef.current) return;
    const update = () => {
      setCardRect(cardRef.current!.getBoundingClientRect());
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(cardRef.current);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cardRef]);

  if (!targetRect) return null;

  const cardCenterX = cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2;
  const cardCenterY = cardRect ? cardRect.top + cardRect.height / 2 : window.innerHeight / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const dx = targetCenterX - cardCenterX;
  const dy = targetCenterY - cardCenterY;
  const angle = Math.atan2(dy, dx);

  const arrowOffset = 14;
  const arrowTipX = targetCenterX - Math.cos(angle) * arrowOffset;
  const arrowTipY = targetCenterY - Math.sin(angle) * arrowOffset;

  const lineOffset = 28;
  const originX = cardCenterX + Math.cos(angle) * lineOffset;
  const originY = cardCenterY + Math.sin(angle) * lineOffset;

  const markerId = `arrowhead-${glow.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      className={`pointer-events-none fixed inset-0 z-30 smart-hint-svg${isHintDismissing ? ' smart-hint-dismissing' : ''}`}
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 Z" fill={glow} />
        </marker>
      </defs>
      <line
        className="smart-hint-line"
        x1={originX}
        y1={originY}
        x2={arrowTipX}
        y2={arrowTipY}
        stroke={glow}
        strokeWidth="1.5"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
      <circle
        className="smart-hint-origin"
        cx={originX}
        cy={originY}
        r="3"
        fill={glow}
        filter="blur(1px)"
      />
    </svg>
  );
}