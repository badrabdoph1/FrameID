import type { Prisma } from "@prisma/client";

export const customerOutreachTones = ["info", "success", "warning", "danger"] as const;
export const customerOutreachStatuses = ["ACTIVE", "PAUSED"] as const;
export const customerOutreachAudienceModes = ["ALL_MATCHING", "EXPLICIT"] as const;

export type CustomerOutreachTone = (typeof customerOutreachTones)[number];
export type CustomerOutreachStatus = (typeof customerOutreachStatuses)[number];
export type CustomerOutreachAudienceMode = (typeof customerOutreachAudienceModes)[number];

export type CustomerOutreachFilters = {
  search?: string;
  tenantStatus?: string;
  subscriptionStatus?: string;
  planId?: string;
};

export type CustomerOutreachInput = {
  title: string;
  body: string;
  tone: string;
  audienceMode: string;
  tenantIds: string[];
  filters: CustomerOutreachFilters;
};

export type NormalizedCustomerOutreachInput = {
  title: string;
  body: string;
  tone: CustomerOutreachTone;
  audienceMode: CustomerOutreachAudienceMode;
  tenantIds: string[];
  filters: CustomerOutreachFilters;
};

const tenantStatuses = new Set(["TRIAL", "ACTIVE", "TRIAL_EXPIRED", "EXPIRED", "SUSPENDED"]);
const subscriptionStatuses = new Set(["TRIAL", "ACTIVE", "EXPIRED", "PAST_DUE", "CANCELLED", "SUSPENDED"]);

export function normalizeCustomerOutreachInput(input: CustomerOutreachInput): NormalizedCustomerOutreachInput {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("عنوان الرسالة مطلوب.");
  if (title.length > 120) throw new Error("عنوان الرسالة يجب ألا يزيد على 120 حرفًا.");
  if (!body) throw new Error("نص الرسالة مطلوب.");
  if (body.length > 1200) throw new Error("نص الرسالة يجب ألا يزيد على 1200 حرف.");

  if (!customerOutreachTones.includes(input.tone as CustomerOutreachTone)) {
    throw new Error("نوع الرسالة غير صالح.");
  }
  if (!customerOutreachAudienceModes.includes(input.audienceMode as CustomerOutreachAudienceMode)) {
    throw new Error("طريقة تحديد الجمهور غير صالحة.");
  }
  const tone = input.tone as CustomerOutreachTone;
  const audienceMode = input.audienceMode as CustomerOutreachAudienceMode;
  const tenantIds = [...new Set(input.tenantIds.map((id) => id.trim()).filter(Boolean))];
  if (audienceMode === "EXPLICIT" && tenantIds.length === 0) {
    throw new Error("اختر عميلًا واحدًا على الأقل.");
  }

  const filters = Object.fromEntries(
    Object.entries(input.filters)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, value?.trim()]),
  ) as CustomerOutreachFilters;
  assertValidCustomerOutreachFilters(filters);

  return { title, body, tone, audienceMode, tenantIds, filters };
}

export function buildCustomerOutreachAudienceWhere(filters: CustomerOutreachFilters): Prisma.TenantWhereInput {
  assertValidCustomerOutreachFilters(filters);
  const where: Prisma.TenantWhereInput = { deletedAt: null };
  const search = filters.search?.trim();
  if (tenantStatuses.has(filters.tenantStatus ?? "")) where.status = filters.tenantStatus as never;
  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const subscriptionStatus = subscriptionStatuses.has(filters.subscriptionStatus ?? "")
    ? filters.subscriptionStatus
    : undefined;
  const planId = filters.planId?.trim() || undefined;
  if (subscriptionStatus || planId) {
    where.subscriptions = {
      some: {
        deletedAt: null,
        ...(subscriptionStatus ? { status: subscriptionStatus as never } : {}),
        ...(planId ? { planId } : {}),
      },
    };
  }

  return where;
}

function assertValidCustomerOutreachFilters(filters: CustomerOutreachFilters) {
  if (filters.tenantStatus?.trim() && !tenantStatuses.has(filters.tenantStatus.trim())) {
    throw new Error("حالة العميل المحددة غير صالحة.");
  }
  if (filters.subscriptionStatus?.trim() && !subscriptionStatuses.has(filters.subscriptionStatus.trim())) {
    throw new Error("حالة الاشتراك المحددة غير صالحة.");
  }
}
