const funnelStages = [
  "catalog.viewed",
  "offering.viewed",
  "acquisition.requested",
  "payment.submitted",
  "acquisition.fulfilled",
] as const;

export type ServicesAnalyticsEvent = { name: string; actorKey: string };

export function buildServicesFunnel(events: readonly ServicesAnalyticsEvent[]) {
  const stages = funnelStages.map((name, index) => {
    const actors = new Set(events.filter((event) => event.name === name).map((event) => event.actorKey)).size;
    const previousActors = index === 0
      ? actors
      : new Set(events.filter((event) => event.name === funnelStages[index - 1]).map((event) => event.actorKey)).size;
    return {
      name,
      actors,
      conversionFromPrevious: index === 0 ? 1 : previousActors === 0 ? 0 : actors / previousActors,
    };
  });
  const first = stages[0].actors;
  const last = stages.at(-1)?.actors ?? 0;
  return { stages, overallConversion: first === 0 ? 0 : last / first };
}
