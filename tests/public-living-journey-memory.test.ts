import { describe, expect, it } from "vitest";

import {
  consumeJourneyCarry,
  createJourneyCarry,
  isMomentSuppressed,
  suppressMoment,
} from "@/components/public-journey/journey-memory";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe("public living journey memory", () => {
  it("suppresses only the selected public moment", () => {
    const storage = memoryStorage();

    suppressMoment(storage, "templates-pick");

    expect(isMomentSuppressed(storage, "templates-pick")).toBe(true);
    expect(isMomentSuppressed(storage, "home-start")).toBe(false);
  });

  it("carries a short-lived feeling of progress to the intended route", () => {
    const storage = memoryStorage();
    createJourneyCarry(storage, {
      fromMoment: "home-start",
      toPath: "/templates",
      now: 1_000,
    });

    expect(consumeJourneyCarry(storage, "/templates", 3_500)).toMatchObject({
      fromMoment: "home-start",
      toPath: "/templates",
    });
    expect(consumeJourneyCarry(storage, "/templates", 3_600)).toBeNull();
  });

  it("drops expired or mismatched carry tokens", () => {
    const storage = memoryStorage();
    createJourneyCarry(storage, {
      fromMoment: "templates-pick",
      toPath: "/templates/noir-gold/preview",
      now: 1_000,
    });

    expect(consumeJourneyCarry(storage, "/signup", 2_000)).toBeNull();

    createJourneyCarry(storage, {
      fromMoment: "templates-pick",
      toPath: "/templates/noir-gold/preview",
      now: 1_000,
    });
    expect(consumeJourneyCarry(storage, "/templates/noir-gold/preview", 7_001)).toBeNull();
  });
});
