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
    const hasMessage = Boolean(bucket.message && Object.keys(bucket.message).length);
    const hasAction = Boolean(bucket.action && Object.keys(bucket.action).length);
    const hasTimer = Boolean(bucket.timer && Object.keys(bucket.timer).length);
    if (!hasMessage && !hasAction && !hasTimer) return undefined;
    return {
      message: hasMessage
        ? {
            enabled:
              typeof bucket.message?.enabled === "boolean"
                ? bucket.message.enabled
                : undefined,
            title:
              typeof bucket.message?.title === "string"
                ? bucket.message.title.trim() || undefined
                : undefined,
            description:
              typeof bucket.message?.description === "string"
                ? bucket.message.description.trim() || undefined
                : undefined,
            tone:
              typeof bucket.message?.tone === "string"
                ? validateMessageTone(bucket.message.tone)
                : undefined,
          }
        : undefined,
      action: hasAction
        ? {
            kind:
              typeof bucket.action?.kind === "string"
                ? normalizeActionKind(bucket.action.kind, "hidden")
                : undefined,
            label:
              typeof bucket.action?.label === "string"
                ? bucket.action.label.trim() || undefined
                : undefined,
            href:
              typeof bucket.action?.href === "string"
                ? bucket.action.href.trim() || null
                : undefined,
          }
        : undefined,
      timer: hasTimer
        ? {
            enabled:
              typeof bucket.timer?.enabled === "boolean"
                ? bucket.timer.enabled
                : undefined,
          }
        : undefined,
    };
  };

  return {
    trial: normalizeBucket(input.trial),
    active: normalizeBucket(input.active),
    pendingReview: normalizeBucket(input.pendingReview),
    rejected: normalizeBucket(input.rejected),
    expired: normalizeBucket(input.expired),
  };
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

export function resolveSubscriptionExperience(input: {
  defaults: SubscriptionExperienceDefaults;
  override?: SubscriptionExperienceOverride | null;
  context: SubscriptionExperienceContext;
  now?: Date;
  sourceFallbackUsed?: boolean;
}): ResolvedSubscriptionExperience {
  const now = input.now ?? new Date();
  const derived = deriveSubscriptionExperienceState(input.context, now);
  const defaultsConfig = input.defaults[derived.bucket];
  const merged = mergeStateConfig(defaultsConfig, input.override?.[derived.bucket]);
  const source = input.override?.[derived.bucket]
    ? "override"
    : input.sourceFallbackUsed
      ? "fallback"
      : "default";

  return {
    state: derived.state,
    bucket: derived.bucket,
    source,
    message: merged.config.message,
    timer: {
      enabled: merged.config.timer?.enabled ?? false,
      daysRemaining: merged.config.timer?.enabled ? derived.daysRemaining : null,
    },
    action: resolveAction(
      merged.config.action,
      input.context.supportWhatsappNumber,
    ),
  };
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
  const row = await findPlatformDefaultsRow(prisma);
  if (row?.value) {
    return normalizeSubscriptionExperienceDefaults(row.value);
  }

  return buildLegacySubscriptionExperienceDefaults(prisma);
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
  const row = await prisma.featureFlag.findFirst({
    where: {
      key: SUBSCRIPTION_EXPERIENCE_OVERRIDE_KEY,
      scope: "TENANT",
      tenantId,
      siteId: null,
    },
    select: { value: true },
  });

  return row?.value
    ? normalizeSubscriptionExperienceOverride(row.value)
    : null;
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
