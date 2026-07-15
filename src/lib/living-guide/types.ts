export type GuideMessage = {
  id: string;
  routes: string[];
  title: string;
  description: string;
  titleShort: string;
  descriptionShort: string;
  actionLabel: string;
  actionHref?: string;
  suppressLabel: string;
  targetSelector: string;
  emergence: "from-target" | "from-grid" | "from-toolbar" | "inline";
  personality: "ignition" | "cascade" | "reflection" | "threshold" | "assembly";
  delay: {
    minAfterLoad: number;
    maxAfterLoad: number;
    secondBreathWindow: number;
    cardAfterBreath: number;
  };
  hesitationDelay: number;
  priority: number;
  audience: "all" | "guest" | "authenticated";
  version: number;
};

export type JourneyPace = "fast" | "normal" | "slow";

export type VisitLevel = "first" | "returning" | "familiar";

export type JourneyState = {
  visitedPages: string[];
  dismissedMessages: string[];
  seenMessages: string[];
  visitCount: Record<string, number>;
  lastAction: string | null;
  lastTimestamp: number;
  pace: JourneyPace;
  entryPoint: string;
  sessionStartTime: number;
  interactionCount: number;
};

export type GuidePhase =
  | "idle"
  | "waiting-layout"
  | "breathing"
  | "waiting-breath"
  | "breathing-again"
  | "bridge"
  | "card-birth"
  | "visible"
  | "returning"
  | "halo-fading"
  | "cancelled"
  | "suppressed"
  | "hint-only";

export type CardPlacement = "above" | "below" | "start" | "end";

export type SafeZoneResult = {
  placement: CardPlacement;
  x: number;
  y: number;
  fits: boolean;
};

export const ACCENT = "#f3cf73";
export const ACCENT_RGB = "243,207,115";

export const DEFAULT_JOURNEY_STATE: JourneyState = {
  visitedPages: [],
  dismissedMessages: [],
  seenMessages: [],
  visitCount: {},
  lastAction: null,
  lastTimestamp: 0,
  pace: "normal",
  entryPoint: "",
  sessionStartTime: 0,
  interactionCount: 0,
};
