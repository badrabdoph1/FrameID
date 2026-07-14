type JourneyEvent =
  | "public_journey_moment_seen"
  | "public_journey_message_dismissed"
  | "public_journey_moment_suppressed"
  | "public_journey_target_activated";

export function trackJourneyEvent(event: JourneyEvent, momentId: string): void {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", event, { journey_moment: momentId });
}
