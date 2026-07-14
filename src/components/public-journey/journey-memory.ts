const SUPPRESSION_KEY = "frameid.publicJourney.suppressed.v1";
const CARRY_KEY = "frameid.publicJourney.carry.v1";
const CARRY_TTL_MS = 5_000;

type JourneyCarry = {
  fromMoment: string;
  toPath: string;
  createdAt: number;
};

function readSuppressed(storage: Storage): string[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(SUPPRESSION_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function isMomentSuppressed(storage: Storage, momentId: string): boolean {
  return readSuppressed(storage).includes(momentId);
}

export function suppressMoment(storage: Storage, momentId: string): void {
  const suppressed = new Set(readSuppressed(storage));
  suppressed.add(momentId);
  storage.setItem(SUPPRESSION_KEY, JSON.stringify([...suppressed]));
}

export function createJourneyCarry(
  storage: Storage,
  input: { fromMoment: string; toPath: string; now?: number },
): void {
  const carry: JourneyCarry = {
    fromMoment: input.fromMoment,
    toPath: input.toPath,
    createdAt: input.now ?? Date.now(),
  };
  storage.setItem(CARRY_KEY, JSON.stringify(carry));
}

export function consumeJourneyCarry(
  storage: Storage,
  pathname: string,
  now = Date.now(),
): JourneyCarry | null {
  const raw = storage.getItem(CARRY_KEY);
  storage.removeItem(CARRY_KEY);
  if (!raw) return null;

  try {
    const carry = JSON.parse(raw) as Partial<JourneyCarry>;
    if (
      typeof carry.fromMoment !== "string" ||
      typeof carry.toPath !== "string" ||
      typeof carry.createdAt !== "number" ||
      carry.toPath !== pathname ||
      now - carry.createdAt > CARRY_TTL_MS
    ) {
      return null;
    }
    return carry as JourneyCarry;
  } catch {
    return null;
  }
}
