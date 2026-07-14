export type JourneyPhase =
  | "dormant"
  | "waking"
  | "speaking"
  | "dismissing"
  | "lingering"
  | "rewarding"
  | "complete";

export type JourneyState = {
  phase: JourneyPhase;
  targetActivated: boolean;
};

export type JourneyAction =
  | { type: "source-ready" }
  | { type: "message-ready" }
  | { type: "dismiss" }
  | { type: "message-exited" }
  | { type: "halo-exited" }
  | { type: "target-activated" }
  | { type: "reset" };

export const initialJourneyState: JourneyState = {
  phase: "dormant",
  targetActivated: false,
};

export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "source-ready":
      return state.phase === "dormant" ? { ...state, phase: "waking" } : state;
    case "message-ready":
      return state.phase === "waking" ? { ...state, phase: "speaking" } : state;
    case "dismiss":
      return state.phase === "speaking" ? { ...state, phase: "dismissing" } : state;
    case "message-exited":
      return state.phase === "dismissing" ? { ...state, phase: "lingering" } : state;
    case "halo-exited":
      return state.phase === "lingering" || state.phase === "rewarding"
        ? { ...state, phase: "complete" }
        : state;
    case "target-activated":
      return { phase: "rewarding", targetActivated: true };
    case "reset":
      return initialJourneyState;
  }
}
