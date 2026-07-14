import { describe, expect, it } from "vitest";

import {
  initialJourneyState,
  journeyReducer,
} from "@/components/public-journey/journey-state";

describe("public living journey state", () => {
  it("lets the source wake before it speaks", () => {
    const waking = journeyReducer(initialJourneyState, { type: "source-ready" });
    const speaking = journeyReducer(waking, { type: "message-ready" });

    expect(waking.phase).toBe("waking");
    expect(speaking.phase).toBe("speaking");
  });

  it("removes the message before transferring the halo back to the source", () => {
    const speaking = { ...initialJourneyState, phase: "speaking" as const };
    const dismissing = journeyReducer(speaking, { type: "dismiss" });
    const lingering = journeyReducer(dismissing, { type: "message-exited" });
    const complete = journeyReducer(lingering, { type: "halo-exited" });

    expect(dismissing.phase).toBe("dismissing");
    expect(lingering.phase).toBe("lingering");
    expect(complete.phase).toBe("complete");
  });

  it("records a correct target activation as a micro reward", () => {
    const rewarded = journeyReducer(
      { ...initialJourneyState, phase: "speaking" },
      { type: "target-activated" },
    );

    expect(rewarded.phase).toBe("rewarding");
    expect(rewarded.targetActivated).toBe(true);
  });
});
