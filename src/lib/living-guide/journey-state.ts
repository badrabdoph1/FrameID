import { DEFAULT_JOURNEY_STATE, type JourneyState, type VisitLevel } from "./types";

const JOURNEY_KEY = "frameid:guide-journey";
const DISMISSED_KEY = "frameid:guide-dismissed";
const SEEN_KEY = "frameid:guide-seen";
const VISIT_COUNT_KEY = "frameid:guide-visit-count";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or disabled
  }
}

export function loadJourneyState(): JourneyState {
  return read<JourneyState>(JOURNEY_KEY, {
    ...DEFAULT_JOURNEY_STATE,
    sessionStartTime: Date.now(),
  });
}

export function saveJourneyState(state: JourneyState): void {
  write(JOURNEY_KEY, state);
}

export function loadDismissedMessages(): string[] {
  return read<string[]>(DISMISSED_KEY, []);
}

export function saveDismissedMessages(ids: string[]): void {
  write(DISMISSED_KEY, ids);
}

export function loadSeenMessages(): string[] {
  return read<string[]>(SEEN_KEY, []);
}

export function saveSeenMessages(ids: string[]): void {
  write(SEEN_KEY, ids);
}

export function markMessageSeen(messageId: string): void {
  const seen = loadSeenMessages();
  if (!seen.includes(messageId)) {
    seen.push(messageId);
    saveSeenMessages(seen);
  }
}

export function markMessageDismissed(messageId: string): void {
  const dismissed = loadDismissedMessages();
  if (!dismissed.includes(messageId)) {
    dismissed.push(messageId);
    saveDismissedMessages(dismissed);
  }
}

export function isMessageSuppressed(messageId: string): boolean {
  return loadDismissedMessages().includes(messageId);
}

export function recordPageVisit(page: string, state: JourneyState): JourneyState {
  const visited = state.visitedPages.includes(page)
    ? state.visitedPages
    : [...state.visitedPages, page];

  const visitCount = { ...state.visitCount };
  visitCount[page] = (visitCount[page] ?? 0) + 1;

  return {
    ...state,
    visitedPages: visited,
    visitCount,
    lastAction: `visited:${page}`,
    lastTimestamp: Date.now(),
  };
}

export function getVisitLevel(messageId: string): VisitLevel {
  const count = read<Record<string, number>>(VISIT_COUNT_KEY, {});
  const visits = count[messageId] ?? 0;

  if (visits === 0) return "first";
  if (visits === 1) return "returning";
  return "familiar";
}

export function incrementVisitCount(messageId: string): void {
  const count = read<Record<string, number>>(VISIT_COUNT_KEY, {});
  count[messageId] = (count[messageId] ?? 0) + 1;
  write(VISIT_COUNT_KEY, count);
}

export function hasProgressedBeyond(messageId: string, state: JourneyState): boolean {
  const pageOrder = ["lg-home", "lg-templates", "lg-preview", "lg-signup"];
  const msgIndex = pageOrder.indexOf(messageId);
  if (msgIndex === -1) return false;

  const subsequentPages = ["/templates", "/templates/*/preview", "/signup"];

  return subsequentPages.some((page) => {
    if (page.includes("*")) {
      const pattern = page.replace(/\*/g, "[^/]+");
      return state.visitedPages.some((p) => new RegExp(`^${pattern}$`).test(p));
    }
    return state.visitedPages.includes(page);
  });
}
