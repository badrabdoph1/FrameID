"use server";

import { randomUUID } from "node:crypto";

import {
  ActivationMode,
  FulfillmentMode,
  OfferingType,
  PriceBillingInterval,
  Prisma,
  ProductPublicationStatus,
  ProductReleaseStage,
  SalesMode,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createServicesPlatformRuntime } from "@/modules/services-platform/runtime";

function value(formData: FormData, key: string, max = 5_000) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim().slice(0, max) : "";
}

function integer(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(value(formData, key, 30), 10);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function json(formData: FormData, key: string): Prisma.InputJsonValue | undefined {
  const raw = value(formData, key, 20_000);
  if (!raw) return undefined;
  return JSON.parse(raw) as Prisma.InputJsonValue;
}

function code(input: string) {
  const normalized = input.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  if (!normalized) throw new Error("الكود مطلوب وبأحرف إنجليزية.");
  return normalized;
}

function fail(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "تعذر حفظ التغيير.";
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

async function audit(adminId: string, action: string, entityType: string, entityId: string, metadata?: Prisma.InputJsonObject) {
  await prisma.auditLog.create({ data: { actorId: adminId, action, entityType, entityId, metadata } });
}

function refresh(productId?: string) {
  revalidatePath("/admin/services");
  revalidatePath("/dashboard/service-center");
  if (productId) revalidatePath(`/admin/services/products/${productId}`);
}

export async function saveServicesProductAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const id = value(formData, "id", 200);
  const productCode = code(value(formData, "code"));
  const path = id ? `/admin/services/products/${id}` : "/admin/services";
  try {
    const data = {
      code: productCode,
      registryKey: code(value(formData, "registryKey") || productCode),
      name: value(formData, "name", 200),
      shortDescription: value(formData, "shortDescription", 400),
      description: value(formData, "description", 5_000) || null,
      category: code(value(formData, "category") || "other"),
      tags: value(formData, "tags").split(",").map((tag) => tag.trim()).filter(Boolean) as Prisma.InputJsonValue,
      releaseStage: (value(formData, "releaseStage") || ProductReleaseStage.ANNOUNCED) as ProductReleaseStage,
      accessTier: value(formData, "accessTier", 50) || "STANDARD",
      eligibilityPolicy: json(formData, "eligibilityPolicy") ?? Prisma.JsonNull,
      sortOrder: integer(formData, "sortOrder"),
      isFeatured: formData.get("isFeatured") === "on",
    };
    if (!data.name || !data.shortDescription) throw new Error("اسم المنتج ووصفه المختصر مطلوبان.");
    const saved = id
      ? await prisma.productDefinition.update({ where: { id }, data })
      : await prisma.productDefinition.create({ data: { ...data, publicationStatus: ProductPublicationStatus.DRAFT, media: [] } });
    await audit(admin.id, id ? "SERVICES_PRODUCT_UPDATED" : "SERVICES_PRODUCT_CREATED", "ProductDefinition", saved.id, { code: saved.code });
    refresh(saved.id);
    redirect(`/admin/services/products/${saved.id}?saved=product`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function saveCatalogOfferingAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const id = value(formData, "id", 200);
  const productId = value(formData, "productId", 200) || null;
  const path = productId ? `/admin/services/products/${productId}` : "/admin/services";
  try {
    const offeringCode = code(value(formData, "code"));
    const data = {
      productId,
      workflowTemplateId: value(formData, "workflowTemplateId", 200) || null,
      code: offeringCode,
      name: value(formData, "name", 200),
      shortDescription: value(formData, "shortDescription", 400),
      description: value(formData, "description", 5_000) || null,
      type: (value(formData, "type") || OfferingType.MANAGED_SERVICE) as OfferingType,
      salesMode: (value(formData, "salesMode") || SalesMode.REQUEST) as SalesMode,
      fulfillmentMode: (value(formData, "fulfillmentMode") || FulfillmentMode.MANUAL) as FulfillmentMode,
      activationMode: (value(formData, "activationMode") || ActivationMode.AFTER_APPROVAL) as ActivationMode,
      releaseStage: (value(formData, "releaseStage") || ProductReleaseStage.ANNOUNCED) as ProductReleaseStage,
      accessTier: value(formData, "accessTier", 50) || "STANDARD",
      requirements: json(formData, "requirements") ?? Prisma.JsonNull,
      eligibilityPolicy: json(formData, "eligibilityPolicy") ?? Prisma.JsonNull,
      sortOrder: integer(formData, "sortOrder"),
      deletedAt: null,
    };
    if (!data.name || !data.shortDescription) throw new Error("اسم العرض ووصفه مطلوبان.");
    const saved = id
      ? await prisma.catalogOffering.update({ where: { id }, data })
      : await prisma.catalogOffering.create({ data: { ...data, publicationStatus: ProductPublicationStatus.DRAFT } });
    await audit(admin.id, id ? "CATALOG_OFFERING_UPDATED" : "CATALOG_OFFERING_CREATED", "CatalogOffering", saved.id, { code: saved.code });
    refresh(productId ?? undefined);
    redirect(`${path}?saved=offering`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function addCatalogPriceAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200);
  const offeringId = value(formData, "offeringId", 200);
  const path = `/admin/services/products/${productId}`;
  try {
    const amountMajor = Number(value(formData, "amount", 30));
    if (!Number.isFinite(amountMajor) || amountMajor < 0) throw new Error("السعر غير صالح.");
    const current = await prisma.catalogPrice.aggregate({ where: { offeringId }, _max: { version: true } });
    const price = await prisma.$transaction(async (tx) => {
      await tx.catalogPrice.updateMany({ where: { offeringId, isActive: true }, data: { isActive: false, effectiveTo: new Date() } });
      return tx.catalogPrice.create({
        data: {
          offeringId,
          version: (current._max.version ?? 0) + 1,
          amount: Math.round(amountMajor * 100),
          currency: value(formData, "currency", 3).toUpperCase() || "EGP",
          marketCode: value(formData, "marketCode", 20).toUpperCase() || "GLOBAL",
          billingInterval: (value(formData, "billingInterval") || PriceBillingInterval.ONE_TIME) as PriceBillingInterval,
          isActive: true,
        },
      });
    });
    await audit(admin.id, "CATALOG_PRICE_VERSION_CREATED", "CatalogPrice", price.id, { offeringId, version: price.version, amount: price.amount });
    refresh(productId);
    redirect(`${path}?saved=price`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function assignOfferingCapabilityAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200);
  const offeringId = value(formData, "offeringId", 200);
  const capabilityKey = code(value(formData, "capabilityKey"));
  const path = `/admin/services/products/${productId}`;
  try {
    const capability = await prisma.capabilityDefinition.upsert({
      where: { key: capabilityKey },
      update: {
        name: value(formData, "capabilityName", 200) || capabilityKey,
        valueType: value(formData, "valueType", 40) || "BOOLEAN",
        unit: value(formData, "unit", 40) || null,
        aggregationPolicy: value(formData, "aggregationPolicy", 40) || "REPLACE",
      },
      create: {
        key: capabilityKey,
        name: value(formData, "capabilityName", 200) || capabilityKey,
        valueType: value(formData, "valueType", 40) || "BOOLEAN",
        unit: value(formData, "unit", 40) || null,
        aggregationPolicy: value(formData, "aggregationPolicy", 40) || "REPLACE",
      },
    });
    const raw = value(formData, "capabilityValue", 2_000) || "true";
    let capabilityValue: Prisma.InputJsonValue;
    try { capabilityValue = JSON.parse(raw) as Prisma.InputJsonValue; } catch { capabilityValue = raw; }
    await prisma.offeringCapability.upsert({
      where: { offeringId_capabilityId: { offeringId, capabilityId: capability.id } },
      update: { value: capabilityValue },
      create: { offeringId, capabilityId: capability.id, value: capabilityValue },
    });
    await audit(admin.id, "OFFERING_CAPABILITY_ASSIGNED", "CatalogOffering", offeringId, { capabilityKey });
    refresh(productId);
    redirect(`${path}?saved=capability`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function addBundleComponentAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200);
  const bundleOfferingId = value(formData, "bundleOfferingId", 200);
  const componentOfferingId = value(formData, "componentOfferingId", 200);
  const path = `/admin/services/products/${productId}`;
  try {
    if (bundleOfferingId === componentOfferingId) throw new Error("لا يمكن أن تحتوي الحزمة على نفسها.");
    await prisma.bundleComponent.upsert({
      where: { bundleOfferingId_componentOfferingId: { bundleOfferingId, componentOfferingId } },
      update: { quantity: Math.max(1, integer(formData, "quantity", 1)), required: formData.get("required") === "on" },
      create: { bundleOfferingId, componentOfferingId, quantity: Math.max(1, integer(formData, "quantity", 1)), required: formData.get("required") === "on" },
    });
    await audit(admin.id, "BUNDLE_COMPONENT_ASSIGNED", "CatalogOffering", bundleOfferingId, { componentOfferingId });
    refresh(productId);
    redirect(`${path}?saved=bundle`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function saveTrialPolicyAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200) || null;
  const offeringId = value(formData, "offeringId", 200) || null;
  const path = productId ? `/admin/services/products/${productId}` : "/admin/services";
  try {
    if (!offeringId) throw new Error("يجب ربط تجربة العميل بعرض.");
    if (formData.get("requiresPaymentMethod") === "on") throw new Error("اشتراط وسيلة دفع محفوظة غير متاح بعد؛ لا يمكن إنشاء سياسة Trial غير قابلة للاستخدام.");
    const trial = await prisma.trialPolicy.create({
      data: {
        productId,
        offeringId,
        name: value(formData, "name", 200) || "تجربة مجانية",
        durationDays: integer(formData, "durationDays") || null,
        usageLimit: integer(formData, "usageLimit") || null,
        usageCapabilityKey: value(formData, "usageCapabilityKey", 100) || null,
        oncePerTenant: formData.get("oncePerTenant") === "on",
        requiresPaymentMethod: formData.get("requiresPaymentMethod") === "on",
        graceDays: Math.max(0, integer(formData, "graceDays")),
        eligibilityPolicy: json(formData, "eligibilityPolicy") ?? Prisma.JsonNull,
        isActive: true,
      },
    });
    await audit(admin.id, "TRIAL_POLICY_CREATED", "TrialPolicy", trial.id, { offeringId });
    refresh(productId ?? undefined);
    redirect(`${path}?saved=trial`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function publishServicesProductAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200);
  const path = `/admin/services/products/${productId}`;
  try {
    await createServicesPlatformRuntime(prisma).catalog.publish({
      productId,
      actorId: admin.id,
      actorName: admin.name,
      changeNote: value(formData, "changeNote", 1_000) || "Catalog publication",
    });
    await audit(admin.id, "SERVICES_PRODUCT_PUBLISHED", "ProductDefinition", productId);
    refresh(productId);
    redirect(`${path}?published=1`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function setServicesProductStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const productId = value(formData, "productId", 200);
  const status = value(formData, "status") as ProductPublicationStatus;
  const path = `/admin/services/products/${productId}`;
  try {
    if (status === ProductPublicationStatus.PUBLISHED) throw new Error("استخدم مسار النشر المُراجع.");
    await prisma.productDefinition.update({ where: { id: productId }, data: { publicationStatus: status } });
    await audit(admin.id, `SERVICES_PRODUCT_${status}`, "ProductDefinition", productId);
    refresh(productId);
    redirect(`${path}?status=${status}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail(path, error);
  }
}

export async function setAcquisitionDecisionAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const acquisitionId = value(formData, "acquisitionId", 200);
  const target = value(formData, "target", 40) as "QUALIFYING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  try {
    await createServicesPlatformRuntime(prisma).acquisitions.transition({ acquisitionId, toStatus: target, reason: value(formData, "reason", 1_000) || null });
    await audit(admin.id, `ACQUISITION_${target}`, "Acquisition", acquisitionId);
    revalidatePath("/admin/services/acquisitions");
    redirect("/admin/services/acquisitions?updated=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/acquisitions", error);
  }
}

export async function setCustomQuoteAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const acquisitionId = value(formData, "acquisitionId", 200);
  const currency = value(formData, "currency", 3).toUpperCase() || "EGP";
  const amount = Math.round(Number(value(formData, "amount", 30)) * 100);
  try {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("قيمة عرض السعر غير صالحة.");
    await prisma.$transaction(async (tx) => {
      const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: acquisitionId } });
      if (!(["REQUESTED", "QUALIFYING", "ACCEPTED"] as string[]).includes(acquisition.status)) throw new Error("حالة الطلب لا تقبل عرض سعر جديد.");
      await tx.acquisition.update({ where: { id: acquisitionId }, data: { acceptedTotal: amount, acceptedCurrency: currency, status: "AWAITING_PAYMENT", acceptedAt: new Date() } });
      await tx.servicesOutboxEvent.create({
        data: { aggregateType: "Acquisition", aggregateId: acquisitionId, eventName: "services.quote.accepted", payload: { acquisitionId, amount, currency, adminId: admin.id }, deduplicationKey: `quote:${acquisitionId}:${randomUUID()}`, correlationId: acquisition.correlationId },
      });
    });
    await audit(admin.id, "CUSTOM_QUOTE_SET", "Acquisition", acquisitionId, { amount, currency });
    revalidatePath("/admin/services/acquisitions");
    revalidatePath(`/dashboard/service-center/acquisitions/${acquisitionId}`);
    redirect("/admin/services/acquisitions?quoted=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/acquisitions", error);
  }
}

export async function grantAdminEntitlementAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const tenantId = value(formData, "tenantId", 200);
  const capabilityKey = code(value(formData, "capabilityKey"));
  const sourceId = value(formData, "sourceId", 200) || `admin:${admin.id}:${randomUUID()}`;
  try {
    const raw = value(formData, "entitlementValue", 2_000) || "true";
    let entitlementValue: Prisma.InputJsonValue;
    try { entitlementValue = JSON.parse(raw) as Prisma.InputJsonValue; } catch { entitlementValue = raw; }
    const grant = await createServicesPlatformRuntime(prisma).entitlements.grant({ tenantId, capabilityKey, value: entitlementValue, sourceType: "ADMIN_GRANT", sourceId });
    await audit(admin.id, "ENTITLEMENT_GRANTED", "Entitlement", grant.id, { tenantId, capabilityKey, sourceId });
    revalidatePath("/admin/services/entitlements");
    redirect("/admin/services/entitlements?granted=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/entitlements", error);
  }
}

export async function revokeAdminEntitlementSourceAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const tenantId = value(formData, "tenantId", 200);
  const sourceType = value(formData, "sourceType", 100);
  const sourceId = value(formData, "sourceId", 200);
  try {
    const count = await createServicesPlatformRuntime(prisma).entitlements.revokeSource({ tenantId, sourceType, sourceId, reason: value(formData, "reason", 1_000) || "ADMIN_REVOKED" });
    await audit(admin.id, "ENTITLEMENT_SOURCE_REVOKED", "Entitlement", sourceId, { tenantId, sourceType, count });
    revalidatePath("/admin/services/entitlements");
    redirect("/admin/services/entitlements?revoked=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/entitlements", error);
  }
}

export async function startAcquisitionFulfillmentAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const acquisitionId = value(formData, "acquisitionId", 200);
  try {
    await createServicesPlatformRuntime(prisma).fulfillment.start({ acquisitionId, idempotencyKey: `fulfillment:${acquisitionId}` });
    await audit(admin.id, "FULFILLMENT_STARTED", "Acquisition", acquisitionId);
    revalidatePath("/admin/services/fulfillment");
    revalidatePath("/admin/services/acquisitions");
    redirect("/admin/services/fulfillment?started=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/fulfillment", error);
  }
}

export async function completeManualFulfillmentAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const runId = value(formData, "runId", 200);
  try {
    await createServicesPlatformRuntime(prisma).fulfillment.completeManual({
      runId,
      result: { deliveredByAdminId: admin.id, note: value(formData, "note", 2_000) || null },
      idempotencyKey: `manual-complete:${runId}`,
    });
    await audit(admin.id, "FULFILLMENT_COMPLETED", "FulfillmentRun", runId);
    revalidatePath("/admin/services/fulfillment");
    revalidatePath("/admin/services/acquisitions");
    revalidatePath("/dashboard/service-center");
    redirect("/admin/services/fulfillment?completed=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/fulfillment", error);
  }
}

export async function retryFailedFulfillmentAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const runId = value(formData, "runId", 200);
  try {
    await createServicesPlatformRuntime(prisma).fulfillment.retry({ runId, idempotencyKey: `fulfillment-retry:${runId}:${randomUUID()}` });
    await audit(admin.id, "FULFILLMENT_RETRIED", "FulfillmentRun", runId);
    revalidatePath("/admin/services/fulfillment");
    revalidatePath("/admin/services/acquisitions");
    redirect("/admin/services/fulfillment?retried=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/fulfillment", error);
  }
}

export async function refundServicePaymentAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const paymentRequestId = value(formData, "paymentRequestId", 200);
  const reason = value(formData, "reason", 1_000);
  try {
    if (!reason) throw new Error("سبب الاسترداد مطلوب.");
    const runtime = createServicesPlatformRuntime(prisma);
    const refunded = await runtime.payments.refund({
      paymentRequestId,
      reviewerId: admin.id,
      reason,
      idempotencyKey: `services-payment-refund:${paymentRequestId}`,
    });
    await runtime.entitlements.revokeSource({
      tenantId: refunded.tenantId,
      sourceType: "ACQUISITION",
      sourceId: refunded.acquisitionId,
      reason: `PAYMENT_REFUNDED:${reason}`,
    });
    await prisma.$transaction([
      prisma.productInstance.updateMany({
        where: { tenantId: refunded.tenantId, acquisitionId: refunded.acquisitionId, status: { in: ["PROVISIONING", "ACTIVE"] } },
        data: { status: "SUSPENDED", suspendedAt: new Date() },
      }),
      prisma.serviceSubscription.updateMany({
        where: { tenantId: refunded.tenantId, acquisitionId: refunded.acquisitionId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "SUSPENDED"] } },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: `PAYMENT_REFUNDED:${reason}` },
      }),
    ]);
    await audit(admin.id, "SERVICES_PAYMENT_REFUNDED", "PaymentRequest", paymentRequestId, { acquisitionId: refunded.acquisitionId, reason });
    revalidatePath("/admin/services/acquisitions");
    revalidatePath("/admin/services/entitlements");
    revalidatePath("/dashboard/service-center");
    redirect("/admin/services/acquisitions?refunded=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/acquisitions", error);
  }
}

export async function manageServiceSubscriptionAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const subscriptionId = value(formData, "subscriptionId", 200);
  const operation = value(formData, "operation", 40);
  try {
    const current = await prisma.serviceSubscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    const service = createServicesPlatformRuntime(prisma).subscriptions;
    if (operation === "RENEW") {
      const periodStart = current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + Math.max(1, Math.min(366, integer(formData, "days", 30))));
      await service.renew({ subscriptionId, periodStart, periodEnd, idempotencyKey: `admin:${admin.id}:renew:${subscriptionId}:${periodEnd.toISOString()}` });
    } else if (operation === "GRACE") {
      await service.enterGrace({ subscriptionId, graceDays: Math.max(1, Math.min(30, integer(formData, "days", 7))), idempotencyKey: `admin:${admin.id}:grace:${subscriptionId}` });
    } else if (operation === "CANCEL") {
      await service.cancel({ subscriptionId, atPeriodEnd: false, reason: value(formData, "reason", 1_000) || "ADMIN_CANCELLED", idempotencyKey: `admin:${admin.id}:cancel:${subscriptionId}` });
    } else if (operation === "EXPIRE") {
      await service.expire({ subscriptionId, idempotencyKey: `admin:${admin.id}:expire:${subscriptionId}` });
    } else {
      throw new Error("عملية الاشتراك غير مدعومة.");
    }
    await audit(admin.id, `SERVICE_SUBSCRIPTION_${operation}`, "ServiceSubscription", subscriptionId);
    revalidatePath("/admin/services/subscriptions");
    revalidatePath("/dashboard/service-center");
    redirect(`/admin/services/subscriptions?updated=${operation}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/subscriptions", error);
  }
}

export async function saveRecommendationRuleAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const id = value(formData, "id", 200);
  try {
    const ruleKey = code(value(formData, "key"));
    const offeringId = value(formData, "offeringId", 200);
    const data = {
      key: ruleKey,
      name: value(formData, "name", 200),
      priority: integer(formData, "priority"),
      conditions: json(formData, "conditions") ?? {},
      action: { offeringId, score: Number(value(formData, "score", 20)) || 0 } as Prisma.InputJsonObject,
      placements: value(formData, "placements").split(",").map((item) => item.trim()).filter(Boolean) as Prisma.InputJsonValue,
      reasonCodes: value(formData, "reasonCodes").split(",").map((item) => item.trim()).filter(Boolean) as Prisma.InputJsonValue,
      frequencyCap: integer(formData, "frequencyCap") || null,
      cooldownHours: integer(formData, "cooldownHours") || null,
    };
    if (!data.name || !offeringId) throw new Error("اسم القاعدة والعرض المستهدف مطلوبان.");
    const rule = id
      ? await prisma.recommendationRule.update({ where: { id }, data })
      : await prisma.recommendationRule.create({ data: { ...data, status: "DRAFT" } });
    await audit(admin.id, id ? "RECOMMENDATION_RULE_UPDATED" : "RECOMMENDATION_RULE_CREATED", "RecommendationRule", rule.id, { key: rule.key });
    revalidatePath("/admin/services/recommendations");
    redirect("/admin/services/recommendations?saved=1");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/recommendations", error);
  }
}

export async function setRecommendationRuleStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("services", "edit");
  const id = value(formData, "id", 200);
  const status = value(formData, "status") as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  try {
    const rule = await prisma.recommendationRule.update({ where: { id }, data: { status, version: { increment: 1 } } });
    await audit(admin.id, `RECOMMENDATION_RULE_${status}`, "RecommendationRule", id, { key: rule.key });
    revalidatePath("/admin/services/recommendations");
    revalidatePath("/dashboard/service-center");
    redirect(`/admin/services/recommendations?status=${status}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    fail("/admin/services/recommendations", error);
  }
}
