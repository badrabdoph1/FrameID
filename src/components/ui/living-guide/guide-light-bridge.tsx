"use client";

import { useEffect, useState } from "react";
import type { CardPlacement } from "@/lib/living-guide/types";
import { ACCENT } from "@/lib/living-guide/types";

export function GuideLightBridge({
  active,
  targetSelector,
  cardPosition,
  placement,
}: {
  active: boolean;
  targetSelector: string;
  cardPosition: { x: number; y: number };
  placement: CardPlacement;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="lg-bridge pointer-events-none fixed inset-0 z-40"
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        style={{ position: "fixed", inset: 0 }}
      >
        <BridgePath
          targetSelector={targetSelector}
          cardPosition={cardPosition}
          placement={placement}
        />
      </svg>
    </div>
  );
}

function BridgePath({
  targetSelector,
  cardPosition,
  placement,
}: {
  targetSelector: string;
  cardPosition: { x: number; y: number };
  placement: CardPlacement;
}) {
  const [path, setPath] = useState("");

  useEffect(() => {
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY =
      placement === "below"
        ? rect.bottom
        : placement === "above"
          ? rect.top
          : rect.top + rect.height / 2;

    const cardX = cardPosition.x + 120;
    const cardY = cardPosition.y;

    const midX = (targetX + cardX) / 2;
    const midY = (targetY + cardY) / 2;

    const d = `M ${targetX} ${targetY} Q ${midX} ${midY} ${cardX} ${cardY}`;
    setPath(d);
  }, [targetSelector, cardPosition, placement]);

  if (!path) return null;

  return (
    <path
      d={path}
      fill="none"
      stroke={ACCENT}
      strokeWidth="1.5"
      strokeLinecap="round"
      className="lg-bridge-path"
      pathLength="1"
    />
  );
}
