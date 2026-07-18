import type { Prisma, PrismaClient } from "@prisma/client";

import {
  ACTIVATION_TEMPLATE_CATEGORY,
  activationTemplateDefinitions,
  parseActivationTemplatePayload,
  type CustomerMessageTone,
  validateMessageTone,
} from "@/modules/messages/customer-message-config";
import {
  defaultLifecycleTimerSettings,
  getLifecycleTimerSettings,
} from "@/modules/lifecycle/customer-lifecycle";
import {
  DEFAULT_SUPPORT_WHATSAPP_NUMBER,
  toWhatsappHref,
} from "@/modules/support/support-utils";

export const SUBSCRIPTION_EXPERIENCE_DEFAULTS_KEY =
  "platform.subscription.experience.defaults";
export const SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY =
  "platform.subscription.experience.override";

export type SubscriptionExperienceActionKind =
  | "activate-default"
  | "billing-page"
  | "whatsapp"
  | "support"
  | "custom-link"
  | "hidden";

export type SubscriptionExperienceBucket =
  | "trial"
  | "active"
  | "pendingReview"
  | "rejected"
  | "expired";

export type SubscriptionExperienceState =
  | "trial"
  | "trial-ending-soon"
  | "active"
  | "pending-review"
  | "rejected"
  | "expired"
  | "suspended";

export type SubscriptionExperienceMessage = {
  enabled: boolean;
  title: string;
  description: string;
  tone: CustomerMessageTone;
};

export type SubscriptionExperienceActionConfig = {
  kind: SubscriptionExperienceActionKind;
  label: string;
  href: string | null;
};

export type SubscriptionExperienceTimerConfig = {
  enabled: boolean;
};

export type SubscriptionExperienceStateConfig = {
  message: SubscriptionExperienceMessage;
  action: SubscriptionExperienceActionConfig;
  timer?: SubscriptionExperienceTimerConfig;
};

export type SubscriptionCardVisibilityPreference = "inherit" | "show" | "hide";
export type SubscriptionCardVisibilityEffective = "visible" | "hidden";
export type SubscriptionCardVisibilitySource =
  | "customer-override"
  | "global-default"
  | "system-fallback";

export type SubscriptionCardVisibilityDecision = {
  preference: SubscriptionCardVisibilityPreference;
  effective: SubscriptionCardVisibilityEffective;
  source: SubscriptionCardVisibilitySource;
};

export type SubscriptionExperienceOverrideMetadata = {
  updatedAt: string;
  updatedByAdminId: string;
  updatedByAdminName: string;
};

export type SubscriptionExperienceDefaults = Record<
  SubscriptionExperienceBucket,
  SubscriptionExperienceStateConfig
> & {
  trialPolicy: {
    defaultDays: number;
  };
};

export type SubscriptionExperienceStateOverride = {
  message?: Partial<SubscriptionExperienceMessage>;
  action?: Partial<SubscriptionExperienceActionConfig>;
  timer?: Partial<SubscriptionExperienceTimerConfig>;
  metadata?: SubscriptionExperienceOverrideMetadata;
};

export type SubscriptionExperienceOverride = Partial<
  Record<SubscriptionExperienceBucket, SubscriptionExperienceStateOverride>
>;

export type SubscriptionExperienceContext = {
  tenantStatus: string;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  latestPaymentRequestStatus?: string | null;
  supportWhatsappNumber?: string | null;
};

export type ResolvedSubscriptionExperience = {
  state: SubscriptionExperienceState;
  bucket: SubscriptionExperienceBucket;
  source: "override" | "default" | "fallback";
  visibility: SubscriptionCardVisibilityDecision;
  message: SubscriptionExperienceMessage;
  timer: {
    enabled: boolean;
    daysRemaining: number | null;
  };
  action: {
    kind: SubscriptionExperienceActionKind;
    label: string;
    href: string | null;
    visible: boolean;
    target: "_self" | "_blank";
  };
};

type FeatureFlagClient = Pick<PrismaClient, "featureFlag" | "notificationLog">;

const DEFAULT_EXTERNAL_TARGET = "_blank" as const;
const DEFAULT_INTERNAL_TARGET = "_self" as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTION_KINDS: SubscriptionExperienceActionKind[] = [
  "activate-default",
  "billing-page",
  "whatsapp",
  "support",
  "custom-link",
  "hidden",
];

export const subscriptionExperienceActionDefinitions: Array<{
  value: SubscriptionExperienceActionKind;
  label: string;
}> = [
  { value: "activate-default", label: "التفعيل الافتراضي" },
  { value: "billing-page", label: "صفحة الدفع" },
  { value: "whatsapp", label: "التواصل عبر واتساب" },
  { value: "support", label: "الدعم الفني" },
  { value: "custom-link", label: "رابط مخصص" },
  { value: "hidden", label: "إخفاء الزر" },
];

export const subscriptionExperienceBucketDefinitions: Array<{
  value: SubscriptionExperienceBucket;
  label: string;
  description: string;
}> = [
  { value: "trial", label: "العملاء التجريبيون", description: "ما يظهر أثناء الفترة التجريبية." },
  { value: "active", label: "العملاء المشتركون", description: "ما يظهر بعد تفعيل الاشتراك." },
  { value: "pendingReview", label: "قيد المراجعة", description: "ما يظهر بعد إرسال إثبات الدفع وقبل المراجعة." },
  { value: "rejected", label: "الطلب مرفوض", description: "ما يظهر بعد رفض طلب التفعيل." },
  { value: "expired", label: "الحساب المنتهي", description: "ما يظهر عند انتهاء التجربة أو الاشتراك." },
];

function normalizeDays(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(3650, Math.round(parsed)));
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeActionKind(
  value: unknown,
  fallback: SubscriptionExperienceActionKind,
): SubscriptionExperienceActionKind {
  return ACTION_KINDS.includes(value as SubscriptionExperienceActionKind)
    ? (value as SubscriptionExperienceActionKind)
    : fallback;
}

function createStateConfig(
  input: Partial<SubscriptionExperienceStateConfig>,
  fallback: SubscriptionExperienceStateConfig,
): SubscriptionExperienceStateConfig {
  return {
    message: {
      enabled:
        input.message?.enabled ?? fallback.message.enabled,
      title: normalizeText(input.message?.title, fallback.message.title),
      description: normalizeText(
        input.message?.description,
        fallback.message.description,
      ),
      tone: validateMessageTone(input.message?.tone ?? fallback.message.tone),
    },
    action: {
      kind: normalizeActionKind(
        input.action?.kind,
        fallback.action.kind,
      ),
      label: normalizeText(input.action?.label, fallback.action.label),
      href:
        typeof input.action?.href === "string"
          ? input.action.href.trim() || null
          : fallback.action.href,
    },
    timer: fallback.timer
      ? {
          enabled: input.timer?.enabled ?? fallback.timer.enabled,
        }
      : undefined,
  };
}

export const defaultSubscriptionExperienceDefaults: SubscriptionExperienceDefaults = {
  trial: {
    message: {
      enabled: true,
      title: "حسابك تجريبي",
      description: "فعّل الاشتراك قبل نهاية الفترة التجريبية حتى يظل موقعك متاحًا للعملاء.",
      tone: "warning",
    },
    timer: { enabled: true },
    action: {
      kind: "billing-page",
      label: "فعّل الآن",
      href: null,
    },
  },
  active: {
    message: {
      enabled: true,
      title: "اشتراكك مفعل",
      description: "اشتراكك مفعل والموقع جاهز للعمل والمشاركة مع عملائك.",
      tone: "success",
    },
    action: {
      kind: "hidden",
      label: "",
      href: null,
    },
  },
  pendingReview: {
    message: {
      enabled: true,
      title: "طلب التفعيل قيد المراجعة",
      description: "تم إرسال إثبات الدفع. سنراجع الطلب ونفعّل الاشتراك فور التأكد.",
      tone: "warning",
    },
    action: {
      kind: "support",
      label: "تواصل مع الدعم",
      href: null,
    },
  },
  rejected: {
    message: {
      enabled: true,
      title: "تم رفض طلب التفعيل",
      description: "راجع سبب الرفض ثم أعد إرسال طلب التفعيل من صفحة الاشتراك.",
      tone: "danger",
    },
    action: {
      kind: "billing-page",
      label: "إعادة المحاولة",
      href: null,
    },
  },
  expired: {
    message: {
      enabled: true,
      title: "الاشتراك يحتاج إجراء",
      description: "انتهت التجربة أو الاشتراك. فعّل أو جدّد حتى يظل الموقع شغالًا للعملاء.",
      tone: "danger",
    },
    timer: { enabled: false },
    action: {
      kind: "billing-page",
      label: "جدّد الآن",
      href: null,
    },
  },
  trialPolicy: {
    defaultDays: defaultLifecycleTimerSettings.trial.defaultDays,
  },
};

export function normalizeSubscriptionExperienceDefaults(
  value: unknown,
  fallback: SubscriptionExperienceDefaults = defaultSubscriptionExperienceDefaults,
): SubscriptionExperienceDefaults {
  const input = value && typeof value === "object" ? (value as Partial<SubscriptionExperienceDefaults>) : {};
  return {
    trial: createStateConfig(input.trial ?? {}, fallback.trial),
    active: createStateConfig(input.active ?? {}, fallback.active),
    pendingReview: createStateConfig(
      input.pendingReview ?? {},
      fallback.pendingReview,
    ),
    rejected: createStateConfig(input.rejected ?? {}, fallback.rejected),
    expired: createStateConfig(input.expired ?? {}, fallback.expired),
    trialPolicy: {
      defaultDays: normalizeDays(
        input.trialPolicy?.defaultDays,
        fallback.trialPolicy.defaultDays,
      ),
    },
  };
}

export function normalizeSubscriptionExperienceOverride(
  value: unknown,
): SubscriptionExperienceOverride {
  const input = value && typeof value === "object" ? (value as SubscriptionExperienceOverride) : {};
  const normalizeBucket = (
    bucket: SubscriptionExperienceStateOverride | undefined,
  ): SubscriptionExperienceStateOverride | undefined => {
    if (!bucket || typeof bucket !== "object") return undefined;
    const message: Partial<SubscriptionExperienceMessage> = {};
    if (typeof bucket.message?.enabled === "boolean") message.enabled = bucket.message.enabled;
    if (typeof bucket.message?.title === "string" && bucket.message.title.trim()) {
      message.title = bucket.message.title.trim();
    }
    if (
      typeof bucket.message?.description === "string" &&
      bucket.message.description.trim()
    ) {
      message.description = bucket.message.description.trim();
    }
    if (typeof bucket.message?.tone === "string") {
      message.tone = validateMessageTone(bucket.message.tone);
    }

    const action: Partial<SubscriptionExperienceActionConfig> = {};
    if (typeof bucket.action?.kind === "string") {
      action.kind = normalizeActionKind(bucket.action.kind, "hidden");
    }
    if (typeof bucket.action?.label === "string" && bucket.action.label.trim()) {
      action.label = bucket.action.label.trim();
    }
    if (typeof bucket.action?.href === "string") {
      action.href = bucket.action.href.trim() || null;
    }

    const timer: Partial<SubscriptionExperienceTimerConfig> = {};
    if (typeof bucket.timer?.enabled === "boolean") timer.enabled = bucket.timer.enabled;

    const hasMessage = Object.keys(message).length > 0;
    const hasAction = Object.keys(action).length > 0;
    const hasTimer = Object.keys(timer).length > 0;
    if (!hasMessage && !hasAction && !hasTimer) return undefined;

    const metadata = bucket.metadata;
    const normalizedMetadata =
      metadata &&
      typeof metadata.updatedAt === "string" &&
      !Number.isNaN(Date.parse(metadata.updatedAt)) &&
      typeof metadata.updatedByAdminId === "string" &&
      metadata.updatedByAdminId.trim() &&
      typeof metadata.updatedByAdminName === "string" &&
      metadata.updatedByAdminName.trim()
        ? {
            updatedAt: new Date(metadata.updatedAt).toISOString(),
            updatedByAdminId: metadata.updatedByAdminId.trim(),
            updatedByAdminName: metadata.updatedByAdminName.trim(),
          }
        : undefined;

    return {
      message: hasMessage ? message : undefined,
      action: hasAction ? action : undefined,
      timer: hasTimer ? timer : undefined,
      metadata: normalizedMetadata,
    };
  };

  const normalized: SubscriptionExperienceOverride = {};
  for (const bucket of subscriptionExperienceBucketDefinitions) {
    const value = normalizeBucket(input[bucket.value]);
    if (value) normalized[bucket.value] = value;
  }
  return normalized;
}

export function getSubscriptionCardVisibilityPreference(
  bucketOverride?: SubscriptionExperienceStateOverride,
): SubscriptionCardVisibilityPreference {
  if (bucketOverride?.message?.enabled === true) return "show";
  if (bucketOverride?.message?.enabled === false) return "hide";
  return "inherit";
}

export function resolveSubscriptionCardVisibility(input: {
  defaultEnabled: boolean;
  preference: SubscriptionCardVisibilityPreference;
  sourceFallbackUsed?: boolean;
}): SubscriptionCardVisibilityDecision {
  if (input.preference === "show") {
    return { preference: "show", effective: "visible", source: "customer-override" };
  }
  if (input.preference === "hide") {
    return { preference: "hide", effective: "hidden", source: "customer-override" };
  }
  return {
    preference: "inherit",
    effective: input.defaultEnabled ? "visible" : "hidden",
    source: input.sourceFallbackUsed ? "system-fallback" : "global-default",
  };
}

export function setSubscriptionCardVisibilityPreference(input: {
  override?: SubscriptionExperienceOverride | null;
  bucket: SubscriptionExperienceBucket;
  preference: SubscriptionCardVisibilityPreference;
  actor: { id: string; name: string };
  now?: Date;
}): SubscriptionExperienceOverride {
  const current = normalizeSubscriptionExperienceOverride(input.override);
  const bucketOverride = current[input.bucket] ?? {};
  const message = { ...(bucketOverride.message ?? {}) };

  if (input.preference === "inherit") delete message.enabled;
  else message.enabled = input.preference === "show";

  const nextBucket: SubscriptionExperienceStateOverride = {
    ...bucketOverride,
    message: Object.keys(message).length ? message : undefined,
  };
  const hasConfig = Boolean(
    nextBucket.message || nextBucket.action || nextBucket.timer,
  );
  const next = { ...current };

  if (!hasConfig) {
    delete next[input.bucket];
    return normalizeSubscriptionExperienceOverride(next);
  }

  next[input.bucket] = {
    ...nextBucket,
    metadata: {
      updatedAt: (input.now ?? new Date()).toISOString(),
      updatedByAdminId: input.actor.id,
      updatedByAdminName: input.actor.name,
    },
  };
  return normalizeSubscriptionExperienceOverride(next);
}

function mergeStateConfig(
  defaults: SubscriptionExperienceStateConfig,
  override?: SubscriptionExperienceStateOverride,
) {
  if (!override) {
    return { config: defaults, source: "default" as const };
  }

  return {
    source: "override" as const,
    config: {
      message: {
        enabled: override.message?.enabled ?? defaults.message.enabled,
        title: normalizeText(override.message?.title, defaults.message.title),
        description: normalizeText(
          override.message?.description,
          defaults.message.description,
        ),
        tone: validateMessageTone(
          override.message?.tone ?? defaults.message.tone,
        ),
      },
      action: {
        kind: normalizeActionKind(
          override.action?.kind,
          defaults.action.kind,
        ),
        label: normalizeText(override.action?.label, defaults.action.label),
        href:
          override.action?.href !== undefined
            ? override.action.href
            : defaults.action.href,
      },
      timer: defaults.timer
        ? {
            enabled: override.timer?.enabled ?? defaults.timer.enabled,
          }
        : undefined,
    },
  };
}

export function calcExperienceDaysRemaining(
  endDate: Date | null,
  now = new Date(),
) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS));
}

export function deriveSubscriptionExperienceState(
  context: Omit<SubscriptionExperienceContext, "supportWhatsappNumber">,
  now = new Date(),
): { state: SubscriptionExperienceState; bucket: SubscriptionExperienceBucket; daysRemaining: number | null } {
  const latestPaymentRequestStatus = context.latestPaymentRequestStatus ?? null;
  const trialDaysRemaining = calcExperienceDaysRemaining(context.trialEndsAt, now);

  if (
    context.tenantStatus === "SUSPENDED" ||
    context.subscriptionStatus === "SUSPENDED"
  ) {
    return { state: "suspended", bucket: "expired", daysRemaining: null };
  }

  if (
    latestPaymentRequestStatus &&
    ["SUBMITTED", "PENDING", "UNDER_REVIEW"].includes(latestPaymentRequestStatus) &&
    context.subscriptionStatus !== "ACTIVE" &&
    context.tenantStatus !== "ACTIVE"
  ) {
    return { state: "pending-review", bucket: "pendingReview", daysRemaining: trialDaysRemaining };
  }

  if (
    latestPaymentRequestStatus === "REJECTED" &&
    context.subscriptionStatus !== "ACTIVE" &&
    context.tenantStatus !== "ACTIVE"
  ) {
    return { state: "rejected", bucket: "rejected", daysRemaining: trialDaysRemaining };
  }

  if (
    context.subscriptionStatus === "ACTIVE" ||
    context.tenantStatus === "ACTIVE"
  ) {
    const activeDaysRemaining = calcExperienceDaysRemaining(
      context.subscriptionEndsAt,
      now,
    );
    return { state: "active", bucket: "active", daysRemaining: activeDaysRemaining };
  }

  if (
    context.subscriptionStatus === "TRIAL" ||
    context.tenantStatus === "TRIAL"
  ) {
    if (trialDaysRemaining !== null && trialDaysRemaining <= 0) {
      return { state: "expired", bucket: "expired", daysRemaining: 0 };
    }
    if (trialDaysRemaining !== null && trialDaysRemaining <= 7) {
      return {
        state: "trial-ending-soon",
        bucket: "trial",
        daysRemaining: trialDaysRemaining,
      };
    }
    return { state: "trial", bucket: "trial", daysRemaining: trialDaysRemaining };
  }

  return { state: "expired", bucket: "expired", daysRemaining: 0 };
}

function resolveAction(
  action: SubscriptionExperienceActionConfig,
  supportWhatsappNumber?: string | null,
) {
  const phone = supportWhatsappNumber || DEFAULT_SUPPORT_WHATSAPP_NUMBER;

  if (action.kind === "hidden") {
    return {
      kind: action.kind,
      label: action.label,
      href: null,
      visible: false,
      target: DEFAULT_INTERNAL_TARGET,
    };
  }

  if (action.kind === "custom-link") {
    const href = action.href?.trim() || null;
    return {
      kind: action.kind,
      label: action.label,
      href,
      visible: Boolean(href),
      target:
        href && /^https?:\/\//u.test(href)
          ? DEFAULT_EXTERNAL_TARGET
          : DEFAULT_INTERNAL_TARGET,
    };
  }

  if (action.kind === "support") {
    return {
      kind: action.kind,
      label: action.label,
      href: toWhatsappHref(
        phone,
        "مرحبًا، أحتاج دعمًا بخصوص الاشتراك أو التفعيل داخل FrameID.",
      ),
      visible: true,
      target: DEFAULT_EXTERNAL_TARGET,
    };
  }

  if (action.kind === "whatsapp") {
    return {
      kind: action.kind,
      label: action.label,
      href: toWhatsappHref(
        phone,
        "مرحبًا، أريد المساعدة في تفعيل أو تجديد اشتراكي داخل FrameID.",
      ),
      visible: true,
      target: DEFAULT_EXTERNAL_TARGET,
    };
  }

  return {
    kind: action.kind,
    label: action.label,
    href: "/dashboard/billing",
    visible: true,
    target: DEFAULT_INTERNAL_TARGET,
  };
}

export function resolveSubscriptionExperienceForBucket(input: {
  defaults: SubscriptionExperienceDefaults;
  override?: SubscriptionExperienceOverride | null;
  bucket: SubscriptionExperienceBucket;
  state: SubscriptionExperienceState;
  daysRemaining: number | null;
  supportWhatsappNumber?: string | null;
  sourceFallbackUsed?: boolean;
}): ResolvedSubscriptionExperience {
  const defaultsConfig = input.defaults[input.bucket];
  const bucketOverride = input.override?.[input.bucket];
  const merged = mergeStateConfig(defaultsConfig, bucketOverride);
  const visibility = resolveSubscriptionCardVisibility({
    defaultEnabled: defaultsConfig.message.enabled,
    preference: getSubscriptionCardVisibilityPreference(bucketOverride),
    sourceFallbackUsed: input.sourceFallbackUsed,
  });
  const source = bucketOverride
    ? "override"
    : input.sourceFallbackUsed
      ? "fallback"
      : "default";

  return {
    state: input.state,
    bucket: input.bucket,
    source,
    visibility,
    message: {
      ...merged.config.message,
      enabled: visibility.effective === "visible",
    },
    timer: {
      enabled: merged.config.timer?.enabled ?? false,
      daysRemaining:
        merged.config.timer?.enabled ? input.daysRemaining : null,
    },
    action: resolveAction(
      merged.config.action,
      input.supportWhatsappNumber,
    ),
  };
}

export function resolveSubscriptionExperience(input: {
  defaults: SubscriptionExperienceDefaults;
  override?: SubscriptionExperienceOverride | null;
  context: SubscriptionExperienceContext;
  now?: Date;
  sourceFallbackUsed?: boolean;
}): ResolvedSubscriptionExperience {
  const now = input.now ?? new Date();
  const derived = deriveSubscriptionExperienceState(input.context, now);
  return resolveSubscriptionExperienceForBucket({
    defaults: input.defaults,
    override: input.override,
    bucket: derived.bucket,
    state: derived.state,
    daysRemaining: derived.daysRemaining,
    supportWhatsappNumber: input.context.supportWhatsappNumber,
    sourceFallbackUsed: input.sourceFallbackUsed,
  });
}

function getLegacyDefinitionDefaults(key: string) {
  const definition = activationTemplateDefinitions.find(
    (item) => item.key === key,
  );

  return definition
    ? {
        title: definition.defaultTitle,
        body: definition.defaultBody,
        tone: definition.tone,
      }
    : null;
}

export async function buildLegacySubscriptionExperienceDefaults(
  prisma: FeatureFlagClient,
) {
  const [legacyTemplates, lifecycleTimerSettings] = await Promise.all([
    prisma.notificationLog.findMany({
      where: {
        category: ACTIVATION_TEMPLATE_CATEGORY,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { title: true, body: true, type: true },
    }),
    getLifecycleTimerSettings(prisma as PrismaClient),
  ]);

  const templateMap = new Map(legacyTemplates.map((row) => [row.title, row]));
  const buildMessage = (key: string, fallback: SubscriptionExperienceMessage) => {
    const definition = getLegacyDefinitionDefaults(key);
    const row = templateMap.get(key);
    const payload = parseActivationTemplatePayload(row?.body, {
      title: definition?.title ?? fallback.title,
      body: definition?.body ?? fallback.description,
    });
    return {
      enabled: true,
      title: payload.title,
      description: payload.body,
      tone: validateMessageTone(row?.type ?? definition?.tone ?? fallback.tone),
    } satisfies SubscriptionExperienceMessage;
  };

  return normalizeSubscriptionExperienceDefaults({
    ...defaultSubscriptionExperienceDefaults,
    trial: {
      ...defaultSubscriptionExperienceDefaults.trial,
      message: buildMessage("trial", defaultSubscriptionExperienceDefaults.trial.message),
      timer: { enabled: lifecycleTimerSettings.trial.enabled },
    },
    active: {
      ...defaultSubscriptionExperienceDefaults.active,
      message: buildMessage("active", defaultSubscriptionExperienceDefaults.active.message),
    },
    pendingReview: {
      ...defaultSubscriptionExperienceDefaults.pendingReview,
      message: buildMessage(
        "pending-review",
        defaultSubscriptionExperienceDefaults.pendingReview.message,
      ),
    },
    rejected: {
      ...defaultSubscriptionExperienceDefaults.rejected,
      message: buildMessage("rejected", defaultSubscriptionExperienceDefaults.rejected.message),
    },
    expired: {
      ...defaultSubscriptionExperienceDefaults.expired,
      message: buildMessage("expired", defaultSubscriptionExperienceDefaults.expired.message),
    },
    trialPolicy: {
      defaultDays: lifecycleTimerSettings.trial.defaultDays,
    },
  });
}

async function findPlatformDefaultsRow(prisma: FeatureFlagClient) {
  return prisma.featureFlag.findFirst({
    where: {
      key: SUBSCRIPTION_EXPERIENCE_DEFAULTS_KEY,
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
    },
    select: { id: true, value: true },
  });
}

export async function getSubscriptionExperienceDefaults(prisma: FeatureFlagClient) {
  return (await getSubscriptionExperienceDefaultsRecord(prisma)).defaults;
}

export async function getSubscriptionExperienceDefaultsRecord(
  prisma: FeatureFlagClient,
) {
  const row = await findPlatformDefaultsRow(prisma);
  if (row?.value) {
    return {
      defaults: normalizeSubscriptionExperienceDefaults(row.value),
      sourceFallbackUsed: false,
    };
  }

  return {
    defaults: await buildLegacySubscriptionExperienceDefaults(prisma),
    sourceFallbackUsed: true,
  };
}

export async function saveSubscriptionExperienceDefaults(
  prisma: FeatureFlagClient,
  defaults: SubscriptionExperienceDefaults,
) {
  const existing = await findPlatformDefaultsRow(prisma);
  const data = {
    key: SUBSCRIPTION_EXPERIENCE_DEFAULTS_KEY,
    scope: "PLATFORM" as const,
    tenantId: null,
    siteId: null,
    enabled: true,
    value: defaults as unknown as Prisma.InputJsonObject,
  };

  if (existing) {
    await prisma.featureFlag.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.featureFlag.create({ data });
  }
}

export async function getTenantSubscriptionExperienceOverride(
  prisma: FeatureFlagClient,
  tenantId: string,
) {
  const record = await getTenantSubscriptionExperienceOverrideRecord(
    prisma,
    tenantId,
  );
  return record?.override ?? null;
}

export async function getTenantSubscriptionExperienceOverrideRecord(
  prisma: FeatureFlagClient,
  tenantId: string,
) {
  const row = await prisma.featureFlag.findFirst({
    where: {
      key: SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY,
      scope: "TENANT",
      tenantId,
      siteId: null,
    },
    select: { value: true, updatedAt: true },
  });

  if (!row?.value) return null;
  return {
    override: normalizeSubscriptionExperienceOverride(row.value),
    updatedAt: row.updatedAt,
  };
}

export async function saveTenantSubscriptionExperienceOverride(
  prisma: FeatureFlagClient,
  tenantId: string,
  override: SubscriptionExperienceOverride,
) {
  const normalized = normalizeSubscriptionExperienceOverride(override);
  const hasValue = Object.values(normalized).some(Boolean);

  const existing = await prisma.featureFlag.findFirst({
    where: {
      key: SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY,
      scope: "TENANT",
      tenantId,
      siteId: null,
    },
    select: { id: true },
  });

  if (!hasValue) {
    if (existing) {
      await prisma.featureFlag.delete({ where: { id: existing.id } });
    }
    return;
  }

  const data = {
    key: SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY,
    scope: "TENANT" as const,
    tenantId,
    siteId: null,
    enabled: true,
    value: normalized as unknown as Prisma.InputJsonObject,
  };

  if (existing) {
    await prisma.featureFlag.update({ where: { id: existing.id }, data });
  } else {
    await prisma.featureFlag.create({ data });
  }
}

export async function clearTenantSubscriptionExperienceOverride(
  prisma: FeatureFlagClient,
  tenantId: string,
) {
  const existing = await prisma.featureFlag.findFirst({
    where: {
      key: SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY,
      scope: "TENANT",
      tenantId,
      siteId: null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.featureFlag.delete({ where: { id: existing.id } });
  }
}
