import {
  ActivationMode,
  FulfillmentMode,
  OfferingType,
  PriceBillingInterval,
  Prisma,
  ProductPublicationStatus,
  ProductReleaseStage,
  SalesMode,
  type PrismaClient,
} from "@prisma/client";

const WORKFLOW_TEMPLATES = [
  {
    key: "instant",
    name: "تفعيل فوري",
    description: "تفعيل المنتج آليًا دون خطوات تشغيلية يدوية.",
    fulfillmentMode: FulfillmentMode.AUTOMATIC,
    steps: [{ key: "activate", owner: "system" }],
  },
  {
    key: "payment_then_auto",
    name: "دفع ثم تفعيل آلي",
    description: "ينتظر الدفع المعتمد ثم يبدأ التفعيل الآلي.",
    fulfillmentMode: FulfillmentMode.AUTOMATIC,
    steps: [{ key: "payment", owner: "billing" }, { key: "activate", owner: "system" }],
  },
  {
    key: "payment_then_manual",
    name: "دفع ثم تنفيذ يدوي",
    description: "ينتظر الدفع المعتمد ثم ينشئ مسار تنفيذ تشغيلي.",
    fulfillmentMode: FulfillmentMode.MANUAL,
    steps: [{ key: "payment", owner: "billing" }, { key: "fulfill", owner: "operations" }],
  },
  {
    key: "manual_service",
    name: "خدمة تنفيذ",
    description: "طلب خدمة يدار عبر Communication Core وWorkItem.",
    fulfillmentMode: FulfillmentMode.MANUAL,
    steps: [{ key: "qualify", owner: "operations" }, { key: "fulfill", owner: "operations" }],
  },
  {
    key: "custom_quote",
    name: "عرض سعر مخصص",
    description: "تأهيل المتطلبات ثم اعتماد عرض سعر مخصص قبل التنفيذ.",
    fulfillmentMode: FulfillmentMode.HYBRID,
    steps: [{ key: "qualify", owner: "operations" }, { key: "quote", owner: "billing" }, { key: "fulfill", owner: "operations" }],
  },
  {
    key: "beta_application",
    name: "طلب انضمام تجريبي",
    description: "مراجعة أهلية العميل قبل إتاحة المنتج التجريبي.",
    fulfillmentMode: FulfillmentMode.MANUAL,
    steps: [{ key: "review", owner: "product" }, { key: "activate", owner: "system" }],
  },
] as const;

export async function seedServicesPlatform(prisma: PrismaClient) {
  for (const workflow of WORKFLOW_TEMPLATES) {
    await prisma.workflowTemplate.upsert({
      where: { key_version: { key: workflow.key, version: 1 } },
      update: {
        name: workflow.name,
        description: workflow.description,
        fulfillmentMode: workflow.fulfillmentMode,
        steps: workflow.steps as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        ...workflow,
        version: 1,
        steps: workflow.steps as unknown as Prisma.InputJsonValue,
      },
    });
  }

  const activationWorkflow = await prisma.workflowTemplate.findUniqueOrThrow({
    where: { key_version: { key: "payment_then_auto", version: 1 } },
    select: { id: true },
  });

  const product = await prisma.productDefinition.upsert({
    where: { code: "pricing-site" },
    update: {
      registryKey: "pricing-site",
      name: "موقع صفحات الأسعار",
      shortDescription: "أنشئ واعرض باقات التصوير في موقع احترافي باسمك.",
      description: "المنتج الأساسي من FrameID لإدارة صفحات الأسعار والباقات وتجربة العميل.",
      category: "websites",
      tags: ["pricing", "website", "photography"] as Prisma.InputJsonValue,
      publicationStatus: ProductPublicationStatus.PUBLISHED,
      releaseStage: ProductReleaseStage.GA,
      accessTier: "STANDARD",
      sortOrder: 10,
      isFeatured: true,
      publishedRevision: 1,
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
      deletedAt: null,
    },
    create: {
      code: "pricing-site",
      registryKey: "pricing-site",
      name: "موقع صفحات الأسعار",
      shortDescription: "أنشئ واعرض باقات التصوير في موقع احترافي باسمك.",
      description: "المنتج الأساسي من FrameID لإدارة صفحات الأسعار والباقات وتجربة العميل.",
      category: "websites",
      tags: ["pricing", "website", "photography"] as Prisma.InputJsonValue,
      media: [] as Prisma.InputJsonValue,
      publicationStatus: ProductPublicationStatus.PUBLISHED,
      releaseStage: ProductReleaseStage.GA,
      accessTier: "STANDARD",
      sortOrder: 10,
      isFeatured: true,
      publishedRevision: 1,
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
    },
  });

  const offering = await prisma.catalogOffering.upsert({
    where: { code: "pricing-site-core" },
    update: {
      productId: product.id,
      workflowTemplateId: activationWorkflow.id,
      name: "FrameID الأساسي",
      shortDescription: "موقع أسعار احترافي مع إدارة الباقات والعملاء المحتملين.",
      type: OfferingType.PLAN,
      salesMode: SalesMode.SELF_SERVE,
      fulfillmentMode: FulfillmentMode.AUTOMATIC,
      activationMode: ActivationMode.AFTER_PAYMENT,
      publicationStatus: ProductPublicationStatus.PUBLISHED,
      releaseStage: ProductReleaseStage.GA,
      accessTier: "STANDARD",
      requirements: { onboarding: ["business_name", "contact_profile"] } as Prisma.InputJsonValue,
      sortOrder: 10,
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
      deletedAt: null,
    },
    create: {
      productId: product.id,
      workflowTemplateId: activationWorkflow.id,
      code: "pricing-site-core",
      name: "FrameID الأساسي",
      shortDescription: "موقع أسعار احترافي مع إدارة الباقات والعملاء المحتملين.",
      type: OfferingType.PLAN,
      salesMode: SalesMode.SELF_SERVE,
      fulfillmentMode: FulfillmentMode.AUTOMATIC,
      activationMode: ActivationMode.AFTER_PAYMENT,
      publicationStatus: ProductPublicationStatus.PUBLISHED,
      releaseStage: ProductReleaseStage.GA,
      accessTier: "STANDARD",
      requirements: { onboarding: ["business_name", "contact_profile"] } as Prisma.InputJsonValue,
      sortOrder: 10,
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
    },
  });

  await prisma.catalogPrice.upsert({
    where: {
      offeringId_version_currency_marketCode: {
        offeringId: offering.id,
        version: 1,
        currency: "EGP",
        marketCode: "EG",
      },
    },
    update: {
      amount: 49000,
      billingInterval: PriceBillingInterval.YEARLY,
      isActive: true,
    },
    create: {
      offeringId: offering.id,
      version: 1,
      currency: "EGP",
      marketCode: "EG",
      amount: 49000,
      billingInterval: PriceBillingInterval.YEARLY,
      isActive: true,
    },
  });

  const capabilities = [
    { key: "pricing_site.access", name: "الوصول إلى موقع الأسعار", valueType: "BOOLEAN", value: true },
    { key: "pricing_site.sites", name: "عدد مواقع الأسعار", valueType: "QUANTITY", unit: "site", value: 1 },
    { key: "storage.gb", name: "مساحة التخزين", valueType: "QUANTITY", unit: "GB", value: 5 },
  ] as const;

  for (const capabilityInput of capabilities) {
    const capability = await prisma.capabilityDefinition.upsert({
      where: { key: capabilityInput.key },
      update: {
        name: capabilityInput.name,
        valueType: capabilityInput.valueType,
        unit: "unit" in capabilityInput ? capabilityInput.unit : null,
      },
      create: {
        key: capabilityInput.key,
        name: capabilityInput.name,
        valueType: capabilityInput.valueType,
        unit: "unit" in capabilityInput ? capabilityInput.unit : null,
      },
    });

    await prisma.offeringCapability.upsert({
      where: { offeringId_capabilityId: { offeringId: offering.id, capabilityId: capability.id } },
      update: { value: capabilityInput.value as Prisma.InputJsonValue },
      create: {
        offeringId: offering.id,
        capabilityId: capability.id,
        value: capabilityInput.value as Prisma.InputJsonValue,
      },
    });
  }

  const trial = await prisma.trialPolicy.findFirst({
    where: { offeringId: offering.id, name: "تجربة 14 يومًا" },
    select: { id: true },
  });
  const trialData = {
    productId: product.id,
    offeringId: offering.id,
    durationDays: 14,
    oncePerTenant: true,
    requiresPaymentMethod: false,
    graceDays: 2,
    isActive: true,
  };
  if (trial) {
    await prisma.trialPolicy.update({ where: { id: trial.id }, data: trialData });
  } else {
    await prisma.trialPolicy.create({ data: { ...trialData, name: "تجربة 14 يومًا" } });
  }

  await prisma.catalogRevision.upsert({
    where: { productId_revision: { productId: product.id, revision: 1 } },
    update: {},
    create: {
      productId: product.id,
      revision: 1,
      status: ProductPublicationStatus.PUBLISHED,
      snapshot: {
        productCode: product.code,
        offeringCodes: [offering.code],
        schemaVersion: 1,
      } as Prisma.InputJsonValue,
      actorName: "FrameID system seed",
      changeNote: "Initial published catalog revision",
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
    },
  });
}
