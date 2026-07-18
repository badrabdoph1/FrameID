import type { Prisma } from "@prisma/client";

export type CommunicationAudienceSelection =
  | { mode: "ALL" }
  | { mode: "TRIAL" }
  | { mode: "SUBSCRIBED" }
  | { mode: "EXPIRED" }
  | { mode: "EXPLICIT"; tenantIds: string[] };

export function buildCommunicationAudienceWhere(
  selection: CommunicationAudienceSelection,
): Prisma.TenantWhereInput {
  const base: Prisma.TenantWhereInput = { deletedAt: null };
  if (selection.mode === "ALL") return base;
  if (selection.mode === "TRIAL") {
    return {
      ...base,
      OR: [
        { status: "TRIAL" },
        { subscriptions: { some: { deletedAt: null, status: "TRIAL" } } },
      ],
    };
  }
  if (selection.mode === "SUBSCRIBED") {
    return { ...base, subscriptions: { some: { deletedAt: null, status: "ACTIVE" } } };
  }
  if (selection.mode === "EXPIRED") {
    return {
      ...base,
      OR: [
        { status: { in: ["TRIAL_EXPIRED", "EXPIRED"] } },
        { subscriptions: { some: { deletedAt: null, status: { in: ["EXPIRED", "CANCELLED"] } } } },
      ],
    };
  }
  const tenantIds = [...new Set(selection.tenantIds.map((id) => id.trim()).filter(Boolean))];
  if (tenantIds.length === 0) throw new Error("اختر عميلًا واحدًا على الأقل.");
  return { ...base, id: { in: tenantIds } };
}
