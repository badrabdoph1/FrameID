"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Sparkles, type LucideIcon } from "lucide-react";

type SmartTipConfig = {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  accentColor: string;
  glowColor: string;
  targetSelector?: string;
};

const SMART_TIPS_STORAGE_KEY = "frameid:smart-tips-seen";

export function useSmartTip(config: SmartTipConfig | null) {
  const [dismissed, setDismissed] = useState(false);
  const [showing, setShowing] = useState(false);

  const seenTips = useMemo(() => {
    try {
      const raw = window.localStorage.getItem(SMART_TIPS_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  useEffect(() => {
    if (!config) return;
    if (seenTips.has(config.id)) return;
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

export function SmartTip({ config }: { config: SmartTipConfig | null }) {
  const { showing, dismissed, dismiss } = useSmartTip(config);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

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

  if (!config || !showing) return null;

  const Icon = config.icon ?? Sparkles;
  const closing = dismissed;

  return (
    <>
      {config.targetSelector ? <SmartTipSpotlight selector={config.targetSelector} glowColor={config.glowColor} /> : null}
      <div className={`fixed inset-0 z-40 pointer-events-none ${closing ? "smart-tip-overlay-out" : "smart-tip-overlay-in"}`} />
      <div className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 ${closing ? "smart-tip-card-out" : "smart-tip-card-in"}`}>
        <div
          ref={cardRef}
          className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.14] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-5"
          style={{
            background: `linear-gradient(145deg, rgba(14,18,26,0.94) 0%, rgba(10,13,20,0.97) 100%)`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 80px ${config.glowColor}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${config.glowColor} 0%, transparent 70%)`,
            }}
          />
          <div className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl" style={{ background: `conic-gradient(from 0deg, transparent 0%, ${config.accentColor}40 25%, transparent 50%, ${config.accentColor}20 75%, transparent 100%)`, animation: "smart-tip-border-spin 4s linear infinite", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor", padding: "1px" }} />

          <div className="relative flex items-start gap-3">
            <div className="smart-tip-icon-entrance relative shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-xl blur-lg" style={{ background: config.glowColor, opacity: 0.6 }} />
              <div className="relative grid size-10 place-items-center rounded-xl sm:size-11" style={{ background: `${config.accentColor}18` }}>
                <Icon className="size-5 sm:size-5.5" style={{ color: config.accentColor }} aria-hidden />
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="smart-tip-stagger text-sm font-black text-[#fff7e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-base">{config.title}</h3>
              <p className="smart-tip-stagger mt-1 text-xs font-bold leading-5 text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-sm">{config.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="smart-tip-stagger mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br py-2.5 text-xs font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5 sm:rounded-2xl sm:py-3 sm:text-sm"
            style={{
              background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}dd)`,
              boxShadow: `0 8px 24px ${config.glowColor}`,
              animationDelay: "0.5s",
            }}
          >
            <Check className="size-3.5 sm:size-4" aria-hidden />
            فهمت
          </button>

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="smart-tip-shimmer absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}60, transparent)` }} />
          </div>
        </div>
      </div>
    </>
  );
}

function SmartTipSpotlight({ selector, glowColor }: { selector: string; glowColor: string }) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

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

  if (!targetRect) return null;

  const pad = 12;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 smart-tip-spotlight-in">
      <div
        className="absolute rounded-2xl border-2 transition-all duration-700 ease-out"
        style={{
          left: targetRect.left - pad,
          top: targetRect.top - pad,
          width: targetRect.width + pad * 2,
          height: targetRect.height + pad * 2,
          borderColor: glowColor,
          boxShadow: `0 0 24px ${glowColor}, 0 0 48px ${glowColor}40, inset 0 0 24px ${glowColor}20`,
          animation: "smart-tip-spotlight-pulse 2.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}
