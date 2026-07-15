"use client";

import { useLivingGuide } from "@/lib/living-guide/use-living-guide";
import type { GuideMessage } from "@/lib/living-guide/types";
import { GuideCard } from "./guide-card";
import { GuideBreathing } from "./guide-breathing";
import { GuideLightBridge } from "./guide-light-bridge";
import { GuideHint } from "./guide-hint";

export function GuideProvider({ message }: { message: GuideMessage | null }) {
  const guide = useLivingGuide(message);

  if (!message) return null;

  const showCard =
    guide.phase === "visible" ||
    guide.phase === "returning" ||
    guide.phase === "halo-fading" ||
    guide.phase === "card-birth";

  const showBreathing =
    guide.phase === "breathing" ||
    guide.phase === "waiting-breath" ||
    guide.phase === "breathing-again";

  const showBridge = guide.phase === "bridge" || guide.phase === "card-birth";
  const showHint = guide.phase === "hint-only";
  const isInline = message.emergence === "inline";

  if (isInline) {
    return <GuideHint guide={guide} />;
  }

  return (
    <>
      <GuideBreathing
        active={showBreathing}
        targetSelector={message.targetSelector}
      />
      <GuideLightBridge
        active={showBridge}
        targetSelector={message.targetSelector}
        cardPosition={guide.cardPosition}
        placement={guide.placement}
      />
      {showCard ? <GuideCard guide={guide} /> : null}
      {showHint ? <GuideHint guide={guide} /> : null}
    </>
  );
}
