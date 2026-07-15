import type { Prisma, PrismaClient } from "@prisma/client";

export const LIFECYCLE_TIMER_SETTINGS_KEY = "platform.lifecycle.timers";
const DEACTIVATION_PAUSE_TRIAL_KEY = "deactivation.pause.trial";
const DEACTIVATION_PAUSE_PAID_KEY = "deactivation.pause.paid";
const DAY_MS = 24 * 60 * 60 * 1000;

type LifecyclePrismaClient = PrismaClient;

export type LifecycleDurationPreset = "keep" | "30" | "60" | "90" | "180" | "365" | "730" | "forever" | "custom";

export type LifecycleTimerSettings = {
  trial: {
    enabled: boolean;
    useDefault: boolean;
    defaultDays: number;
  };
  subscription: {
    enabled: boolean;
    defaultPreset: LifecycleDurationPreset;
    customDays: number;
  };
};

export const lifecycleDurationOptions: Array<{ value: LifecycleDurationPreset; label: string; days: number | null; description?: string }> = [
  { value: "keep", label: "الوضع الذكي", days: null, description: "يحافظ على تاريخ انتهاء كل عميل كما هو" },
  { value: "30", label: "30 يوم", days: 30 },
  { value: "60", label: "شهرين", days: 60 },
  { value: "90", label: "3 أشهر", days: 90 },
  { value: "180", label: "6 أشهر", days: 180 },
  { value: "365", label: "سنة", days: 365 },
  { value: "730", label: "سنتين", days: 730 },
  { value: "forever", label: "دائم", days: null },
  { value: "custom", label: "مدة مخصصة", days: null },
];

export const defaultLifecycleTimerSettings: LifecycleTimerSettings = {
  trial: { enabled: true, useDefault: true, defaultDays: 14 },
  subscription: { enabled: true, defaultPreset: "keep", customDays: 30 },
};

function normalizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(3650, Math.round(parsed)));
}

export function normalizeLifecycleTimerSettings(value: unknown): LifecycleTimerSettings {
  const input = value as Partial<LifecycleTimerSettings> | null | undefined;
  const preset = input?.subscription?.defaultPreset;
  return {
    trial: {
      enabled: input?.trial?.enabled ?? defaultLifecycleTimerSettings.trial.enabled,
      useDefault: input?.trial?.useDefault ?? defaultLifecycleTimerSettings.trial.useDefault,
      defaultDays: normalizeNumber(input?.trial?.defaultDays, defaultLifecycleTimerSettings.trial.defaultDays),
    },
    subscription: {
      enabled: input?.subscription?.enabled ?? defaultLifecycleTimerSettings.subscription.enabled,
      defaultPreset: lifecycleDurationOptions.some((item) => item.value === preset) ? preset as LifecycleDurationPreset : "keep",
      customDays: normalizeNumber(input?.subscription?.customDays, defaultLifecycleTimerSettings.subscription.customDays),
    },
  };
}

export function resolveDurationDays(preset: LifecycleDurationPreset, customDays?: number): number | null {
  if (preset === "keep" || preset === "forever") return null;
  if (preset === "custom") return normalizeNumber(customDays, 30);
  const option = lifecycleDurationOptions.find((item) => item.value === preset);
  return option?.days ?? 30;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getLifecycleEndDate(start: Date, preset: LifecycleDurationPreset, customDays?: number): Date | null {
  if (preset === "keep") return null;
  const days = resolveDurationDays(preset, customDays);
  return days === null ? null : addDays(start, days);
}

export function calcLifecycleDaysRemaining(endDate: Date | null, now = new Date()) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS));
}

export function calcLifecycleProgressPercent(startDate: Date | null, endDate: Date | null, now = new Date()) {
  if (!startDate || !endDate) return null;
  const total = endDate.getTime() - startDate.getTime();
  if (total <= 0) return 100;
  const elapsed = Math.min(total, Math.max(0, now.getTime() - startDate.getTime()));
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function shouldShowLifecycleTimerCard(settings: LifecycleTimerSettings, subscription: { isTrial: boolean; isActive: boolean; isExpired: boolean }) {
  if (subscription.isTrial) return settings.trial.enabled;
  if (subscription.isActive || subscription.isExpired) return settings.subscription.enabled;
  return false;
}

export async function getLifecycleTimerSettings(prisma: LifecyclePrismaClient): Promise<LifecycleTimerSettings> {
  const row = await prisma.featureFlag.findFirst({
    where: { key: LIFECYCLE_TIMER_SETTINGS_KEY, scope: "PLATFORM", tenantId: null, siteId: null },
    select: { value: true },
  });
  return normalizeLifecycleTimerSettings(row?.value);
}

export async function saveLifecycleTimerSettings(prisma: LifecyclePrismaClient, settings: LifecycleTimerSettings) {
  const current = await prisma.featureFlag.findFirst({
    where: { key: LIFECYCLE_TIMER_SETTINGS_KEY, scope: "PLATFORM", tenantId: null, siteId: null },
    select: { id: true },
  });
  const data = {
    key: LIFECYCLE_TIMER_SETTINGS_KEY,
    scope: "PLATFORM" as const,
    tenantId: null,
    siteId: null,
    enabled: true,
    value: settings as unknown as Prisma.InputJsonObject,
  };
  if (current) await prisma.featureFlag.update({ where: { id: current.id }, data });
  else await prisma.featureFlag.create({ data });
}

export async function applyDefaultTrialDurationFromRegistration(prisma: LifecyclePrismaClient, defaultDays: number) {
  const days = normalizeNumber(defaultDays, defaultLifecycleTimerSettings.trial.defaultDays);
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, status: "TRIAL" },
    select: { id: true, createdAt: true },
  });

  for (const tenant of tenants) {
    const start = tenant.createdAt;
    const end = addDays(start, days);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { trialStartedAt: start, trialEndsAt: end, trialDays: days },
    });
    await prisma.subscription.updateMany({
      where: { tenantId: tenant.id, status: "TRIAL" },
      data: { currentPeriodStart: start, currentPeriodEnd: end, expiresAt: end },
    });
  }

  return tenants.length;
}

async function notifyLifecycleExpired(prisma: LifecyclePrismaClient, tenant: { id: string; ownerUserId?: string | null }, type: "trial" | "subscription") {
  const title = type === "trial" ? "انتهت التجربة المجانية" : "انتهى الاشتراك";
  const body = type === "trial"
    ? "انتهت فترة التجربة المجانية. يمكنك تفعيل الاشتراك لإعادة تشغيل الموقع."
    : "انتهت مدة الاشتراك. يمكنك تجديد الاشتراك لإعادة تشغيل الموقع.";

  await prisma.notification.create({ data: { tenantId: tenant.id, type: `${type}_expired`, title, body } }).catch(() => undefined);
  await prisma.notificationLog.create({ data: { type: "danger", title, body, category: "lifecycle", tenantId: tenant.id } }).catch(() => undefined);
}

export async function isDeactivationPaused(prisma: LifecyclePrismaClient, type: "trial" | "paid"): Promise<boolean> {
  const key = type === "trial" ? DEACTIVATION_PAUSE_TRIAL_KEY : DEACTIVATION_PAUSE_PAID_KEY;
  const flag = await prisma.featureFlag.findFirst({
    where: { key, scope: "PLATFORM", tenantId: null, siteId: null },
    select: { enabled: true },
  });
  return flag?.enabled ?? false;
}

export async function setDeactivationPause(prisma: LifecyclePrismaClient, type: "trial" | "paid", paused: boolean, metadata?: Record<string, unknown>) {
  const key = type === "trial" ? DEACTIVATION_PAUSE_TRIAL_KEY : DEACTIVATION_PAUSE_PAID_KEY;
  const current = await prisma.featureFlag.findFirst({
    where: { key, scope: "PLATFORM", tenantId: null, siteId: null },
    select: { id: true },
  });

  if (current) {
    await prisma.featureFlag.update({
      where: { id: current.id },
      data: { enabled: paused, value: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : undefined },
    });
  } else {
    await prisma.featureFlag.create({
      data: {
        key,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
        enabled: paused,
        value: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }
}

export async function syncCustomerLifecycle(prisma: LifecyclePrismaClient, options: { tenantId?: string; now?: Date; limit?: number } = {}) {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 200;
  const tenantScope = options.tenantId ? { id: options.tenantId } : {};

  const trialPaused = await isDeactivationPaused(prisma, "trial");
  const paidPaused = await isDeactivationPaused(prisma, "paid");

  let expiredTrialsCount = 0;
  let expiredSubscriptionsCount = 0;

  if (!trialPaused) {
    const expiredTrials = await prisma.tenant.findMany({
      where: { ...tenantScope, deletedAt: null, status: "TRIAL", trialEndsAt: { lte: now } },
      take: limit,
      select: { id: true, ownerUserId: true, trialEndsAt: true },
    });

    for (const tenant of expiredTrials) {
      await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "TRIAL_EXPIRED", gracePeriodEndsAt: null } });
      await prisma.subscription.updateMany({ where: { tenantId: tenant.id, status: "TRIAL" }, data: { status: "EXPIRED", currentPeriodEnd: tenant.trialEndsAt, expiresAt: tenant.trialEndsAt } });
      await prisma.site.updateMany({ where: { tenantId: tenant.id, deletedAt: null }, data: { status: "EXPIRED", isPublished: false } });
      await notifyLifecycleExpired(prisma, tenant, "trial");
      await prisma.auditLog.create({ data: { actorId: null, tenantId: tenant.id, action: "TRIAL_AUTO_EXPIRED", entityType: "Tenant", entityId: tenant.id, metadata: { expiredAt: now.toISOString(), trialEndsAt: tenant.trialEndsAt.toISOString() } } }).catch(() => undefined);
    }
    expiredTrialsCount = expiredTrials.length;
  }

  if (!paidPaused) {
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ currentPeriodEnd: { lte: now } }, { expiresAt: { lte: now } }],
        tenant: { ...tenantScope, deletedAt: null },
      },
      take: limit,
      select: { id: true, tenantId: true, currentPeriodEnd: true, expiresAt: true, tenant: { select: { id: true, ownerUserId: true } } },
    });

    for (const subscription of expiredSubscriptions) {
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED" } });
      await prisma.tenant.update({ where: { id: subscription.tenantId }, data: { status: "EXPIRED", gracePeriodEndsAt: null } });
      await prisma.site.updateMany({ where: { tenantId: subscription.tenantId, deletedAt: null }, data: { status: "EXPIRED", isPublished: false } });
      await notifyLifecycleExpired(prisma, subscription.tenant, "subscription");
      await prisma.auditLog.create({ data: { actorId: null, tenantId: subscription.tenantId, action: "SUBSCRIPTION_AUTO_EXPIRED", entityType: "Subscription", entityId: subscription.id, metadata: { expiredAt: now.toISOString(), endAt: (subscription.currentPeriodEnd ?? subscription.expiresAt)?.toISOString() } } }).catch(() => undefined);
    }
    expiredSubscriptionsCount = expiredSubscriptions.length;
  }

  return { expiredTrials: expiredTrialsCount, expiredSubscriptions: expiredSubscriptionsCount };
}

export async function getDeactivationPauseStats(prisma: LifecyclePrismaClient) {
  const now = new Date();
  const [trialPaused, paidPaused] = await Promise.all([
    isDeactivationPaused(prisma, "trial"),
    isDeactivationPaused(prisma, "paid"),
  ]);

  const [
    totalTrial,
    activeTrial,
    expiredTrialStillActive,
    totalPaid,
    activePaid,
    expiredPaidStillActive,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL" } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL", trialEndsAt: { gt: now } } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL", trialEndsAt: { lte: now } } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "ACTIVE", subscriptions: { some: { status: "ACTIVE", currentPeriodEnd: { gt: now } } } } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "ACTIVE", subscriptions: { some: { status: "ACTIVE", OR: [{ currentPeriodEnd: { lte: now } }, { expiresAt: { lte: now } }] } } } }),
  ]);

  return {
    trial: {
      paused: trialPaused,
      total: totalTrial,
      active: activeTrial,
      expiredButActive: trialPaused ? expiredTrialStillActive : 0,
      wouldDeactivate: trialPaused ? expiredTrialStillActive : 0,
    },
    paid: {
      paused: paidPaused,
      total: totalPaid,
      active: activePaid,
      expiredButActive: paidPaused ? expiredPaidStillActive : 0,
      wouldDeactivate: paidPaused ? expiredPaidStillActive : 0,
    },
  };
}

export async function runCatchUpDeactivation(prisma: LifecyclePrismaClient, type: "trial" | "paid", limit = 500) {
  const now = new Date();

  if (type === "trial") {
    const expiredTrials = await prisma.tenant.findMany({
      where: { deletedAt: null, status: "TRIAL", trialEndsAt: { lte: now } },
      take: limit,
      select: { id: true, ownerUserId: true, trialEndsAt: true },
    });

    for (const tenant of expiredTrials) {
      await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "TRIAL_EXPIRED", gracePeriodEndsAt: null } });
      await prisma.subscription.updateMany({ where: { tenantId: tenant.id, status: "TRIAL" }, data: { status: "EXPIRED", currentPeriodEnd: tenant.trialEndsAt, expiresAt: tenant.trialEndsAt } });
      await prisma.site.updateMany({ where: { tenantId: tenant.id, deletedAt: null }, data: { status: "EXPIRED", isPublished: false } });
      await notifyLifecycleExpired(prisma, tenant, "trial");
      await prisma.auditLog.create({ data: { actorId: null, tenantId: tenant.id, action: "TRIAL_CATCH_UP_EXPIRED", entityType: "Tenant", entityId: tenant.id, metadata: { expiredAt: now.toISOString(), trialEndsAt: tenant.trialEndsAt.toISOString() } } }).catch(() => undefined);
    }

    return { count: expiredTrials.length };
  }

  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: { lte: now } }, { expiresAt: { lte: now } }],
      tenant: { deletedAt: null },
    },
    take: limit,
    select: { id: true, tenantId: true, currentPeriodEnd: true, expiresAt: true, tenant: { select: { id: true, ownerUserId: true } } },
  });

  for (const subscription of expiredSubscriptions) {
    await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED" } });
    await prisma.tenant.update({ where: { id: subscription.tenantId }, data: { status: "EXPIRED", gracePeriodEndsAt: null } });
    await prisma.site.updateMany({ where: { tenantId: subscription.tenantId, deletedAt: null }, data: { status: "EXPIRED", isPublished: false } });
    await notifyLifecycleExpired(prisma, subscription.tenant, "subscription");
    await prisma.auditLog.create({ data: { actorId: null, tenantId: subscription.tenantId, action: "SUBSCRIPTION_CATCH_UP_EXPIRED", entityType: "Subscription", entityId: subscription.id, metadata: { expiredAt: now.toISOString(), endAt: (subscription.currentPeriodEnd ?? subscription.expiresAt)?.toISOString() } } }).catch(() => undefined);
  }

  return { count: expiredSubscriptions.length };
}

export async function getDeactivationPausedAccounts(
  prisma: LifecyclePrismaClient,
  type: "trial" | "paid",
  options: { search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; page?: number; pageSize?: number; filter?: "all" | "expired-active" } = {},
) {
  const now = new Date();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;
  const sortOrder = options.sortOrder ?? "asc";
  const accountFilter = options.filter ?? "expired-active";

  const baseWhere: Prisma.TenantWhereInput = type === "trial"
    ? {
        deletedAt: null,
        status: "TRIAL",
        ...(accountFilter === "expired-active" ? { trialEndsAt: { lte: now } } : {}),
      }
    : {
        deletedAt: null,
        status: "ACTIVE",
        ...(accountFilter === "expired-active"
          ? { subscriptions: { some: { status: "ACTIVE", OR: [{ currentPeriodEnd: { lte: now } }, { expiresAt: { lte: now } }] } } }
          : {}),
      };

  const searchFilter = options.search?.trim();
  const where: Prisma.TenantWhereInput = searchFilter
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { displayName: { contains: searchFilter, mode: "insensitive" } },
              { owner: { name: { contains: searchFilter, mode: "insensitive" } } },
              { owner: { email: { contains: searchFilter, mode: "insensitive" } } },
            ],
          },
        ],
      }
    : baseWhere;

  const [accounts, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: options.sortBy === "displayName"
        ? { displayName: sortOrder }
        : options.sortBy === "email"
          ? { owner: { email: sortOrder } }
          : options.sortBy === "trialEndsAt" || options.sortBy === "endsAt"
            ? { trialEndsAt: sortOrder }
            : options.sortBy === "daysOverdue"
              ? { trialEndsAt: sortOrder }
              : { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        sites: {
          where: { deletedAt: null },
          select: { id: true, title: true, slug: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
        subscriptions: type === "paid" ? {
          where: { status: "ACTIVE", OR: [{ currentPeriodEnd: { lte: now } }, { expiresAt: { lte: now } }] },
          select: { id: true, currentPeriodEnd: true, expiresAt: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        } : undefined,
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  const mapped = accounts.map((a) => {
    const endDate = type === "trial"
      ? a.trialEndsAt
      : (a.subscriptions?.[0]?.currentPeriodEnd ?? a.subscriptions?.[0]?.expiresAt ?? null);
    const daysOverdue = endDate ? Math.floor((now.getTime() - endDate.getTime()) / DAY_MS) : 0;
    return {
      id: a.id,
      ownerName: a.owner?.name ?? "—",
      siteName: a.sites?.[0]?.title ?? "—",
      siteSlug: a.sites?.[0]?.slug ?? null,
      email: a.owner?.email ?? "—",
      createdAt: a.createdAt.toISOString(),
      endDate: endDate?.toISOString() ?? null,
      daysOverdue,
      status: a.status,
      reason: daysOverdue > 0
        ? (type === "trial" ? "تعليق تعطيل الحسابات التجريبية" : "تعليق تعطيل الحسابات المدفوعة")
        : "يعمل بشكل طبيعي",
    };
  });

  return { accounts: mapped, total, page, pageSize };
}

export async function applyTrialTimerToTenants(prisma: LifecyclePrismaClient, tenantIds: string[], days: number | "keep") {
  const now = new Date();
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds }, deletedAt: null, status: { in: ["TRIAL", "TRIAL_EXPIRED"] } },
    select: { id: true, createdAt: true, trialEndsAt: true },
  });

  for (const tenant of tenants) {
    const end = days === "keep" && tenant.trialEndsAt > now ? tenant.trialEndsAt : addDays(tenant.createdAt, typeof days === "number" ? days : defaultLifecycleTimerSettings.trial.defaultDays);
    const appliedDays = Math.max(1, Math.ceil((end.getTime() - tenant.createdAt.getTime()) / DAY_MS));
    await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "TRIAL", trialStartedAt: tenant.createdAt, trialEndsAt: end, trialDays: appliedDays, gracePeriodEndsAt: null } });
    await prisma.subscription.updateMany({ where: { tenantId: tenant.id, status: { in: ["TRIAL", "EXPIRED"] } }, data: { status: "TRIAL", currentPeriodStart: tenant.createdAt, currentPeriodEnd: end, expiresAt: end } });
  }

  await prisma.site.updateMany({ where: { tenantId: { in: tenants.map((tenant) => tenant.id) }, deletedAt: null }, data: { status: "PUBLISHED", isPublished: true } });
  await prisma.auditLog.create({ data: { actorId: null, action: "TRIAL_TIMER_APPLIED", entityType: "Tenant", metadata: { count: tenants.length, tenantIds, mode: days === "keep" ? "keep" : "days", days } } }).catch(() => undefined);
  return tenants.length;
}

export async function grantFreshTrialToTenants(
  prisma: LifecyclePrismaClient,
  tenantIds: string[],
  days: number,
  now = new Date(),
) {
  const normalizedDays = normalizeNumber(days, defaultLifecycleTimerSettings.trial.defaultDays);
  const end = addDays(now, normalizedDays);

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds }, deletedAt: null },
    select: { id: true },
  });

  if (tenants.length === 0) return 0;

  for (const tenant of tenants) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        status: "TRIAL",
        trialStartedAt: now,
        trialEndsAt: end,
        trialDays: normalizedDays,
        gracePeriodEndsAt: null,
      },
    });

    await prisma.subscription.updateMany({
      where: { tenantId: tenant.id },
      data: {
        status: "TRIAL",
        currentPeriodStart: now,
        currentPeriodEnd: end,
        expiresAt: end,
      },
    });
  }

  await prisma.site.updateMany({
    where: { tenantId: { in: tenants.map((tenant) => tenant.id) }, deletedAt: null },
    data: { status: "PUBLISHED", isPublished: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: "TRIAL_FRESH_GRANT_APPLIED",
      entityType: "Tenant",
      metadata: {
        count: tenants.length,
        tenantIds: tenants.map((tenant) => tenant.id),
        days: normalizedDays,
        startedAt: now.toISOString(),
        endsAt: end.toISOString(),
      },
    },
  }).catch(() => undefined);

  return tenants.length;
}

export async function applySubscriptionTimerToTenants(prisma: LifecyclePrismaClient, tenantIds: string[], preset: LifecycleDurationPreset, customDays: number) {
  const now = new Date();
  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: { in: tenantIds }, status: { in: ["ACTIVE", "EXPIRED", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, tenantId: true, currentPeriodStart: true, currentPeriodEnd: true, expiresAt: true },
  });

  const seen = new Set<string>();
  const latestSubscriptions = subscriptions.filter((sub) => {
    if (seen.has(sub.tenantId)) return false;
    seen.add(sub.tenantId);
    return true;
  });

  for (const sub of latestSubscriptions) {
    const currentEnd = sub.currentPeriodEnd ?? sub.expiresAt ?? null;
    const end = preset === "keep" ? currentEnd : getLifecycleEndDate(now, preset, customDays);
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", currentPeriodStart: sub.currentPeriodStart ?? now, ...(end ? { currentPeriodEnd: end, expiresAt: end } : {}) } });
    await prisma.tenant.update({ where: { id: sub.tenantId }, data: { status: "ACTIVE", gracePeriodEndsAt: null } });
  }

  await prisma.site.updateMany({ where: { tenantId: { in: latestSubscriptions.map((item) => item.tenantId) }, deletedAt: null }, data: { status: "PUBLISHED", isPublished: true } });
  await prisma.auditLog.create({ data: { actorId: null, action: "SUBSCRIPTION_TIMER_APPLIED", entityType: "Subscription", metadata: { count: latestSubscriptions.length, tenantIds, preset, customDays } } }).catch(() => undefined);
  return latestSubscriptions.length;
}
