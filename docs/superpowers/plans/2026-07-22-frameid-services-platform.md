# FrameID Services Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** بناء منصة منتجات وخدمات متعددة داخل FrameID تدعم الاكتشاف، الاقتناء، التواصل، الدفع، التنفيذ، الاستحقاقات، التفعيل، الاشتراكات، التوصيات، والتحليلات من دون ربط النواة بمنتج واحد.

**Architecture:** يظل المشروع Modular Monolith. تملك Services Platform نطاقات Catalog وAcquisition وFulfillment وEntitlements وProduct Instances وRecommendations وAnalytics، وتتصل بـCommunication Core من خلال واجهته العامة و`CommunicationContextReference` فقط. تبقى المدفوعات والاشتراكات حقائق مستقلة، وتُجمع رحلة العميل في Read Models مشتقة.

**Tech Stack:** Next.js 15، React 19، TypeScript 5.9، Prisma 6، PostgreSQL، Zod، Vitest، Tailwind CSS 4.

## Global Constraints

- العمل على `main` داخل `/Users/mac/Documents/GitHub/FrameID` ومن دون worktree أو commit.
- الحفاظ على Communication Core بلا imports من Services Platform.
- لا AI فعلي، ولا Microservices، ولا Data Warehouse.
- كل كتابة تجارية حساسة idempotent ومؤرشفة في Audit/Outbox.
- لا تعتمد صلاحية المنتج على Feature Flags أو عناصر UI.
- كل استعلام عميل معزول بـ`tenantId` المشتق من الجلسة.
- تشغيل `npm run build`, `npm run typecheck`, `npm run lint`, و`npm test` بعد كل مرحلة منطقية وإصلاح أي فشل قبل المتابعة.

---

### Task 1: تثبيت اللغة والقرارات المعمارية

**Files:**
- Create: `docs/contexts/services-platform.md`
- Create: `docs/adr/0001-services-platform-domain-boundaries.md`
- Create: `docs/superpowers/specs/2026-07-22-frameid-services-platform-architecture.md`
- Modify: `docs/planning/14-module-boundaries.md`
- Modify: `docs/PROJECT_ARCHITECTURE.md`
- Modify: `docs/DATA_FLOW.md`
- Modify: `docs/DATABASE_ARCHITECTURE.md`

**Interfaces:**
- Produces canonical terms: Product, Offering, Price, Acquisition, Fulfillment, Entitlement, Product Instance, Trial Grant, Subscription.
- Establishes that legacy `Package` means a photographer's customer-facing package and legacy `Plan` is a compatibility billing plan.

- [ ] Write the Services Platform glossary with explicit `_Avoid_` aliases.
- [ ] Record the ADR selecting PostgreSQL versioned catalog data, weak Communication contexts, and Entitlements as access truth.
- [ ] Promote the approved conversation report into the official architecture specification.
- [ ] Update project boundaries and data flows to include all new modules.
- [ ] Verify documentation contains no contradictory ownership statements.

### Task 2: Add the Services Platform database contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260722090000_services_platform_foundation/migration.sql`
- Modify: `src/modules/setup/platform-seed-data.ts`
- Modify: `prisma/seed.ts`
- Create: `tests/services-platform-schema-contract.test.ts`
- Modify: `tests/platform-seed-data.test.ts`

**Interfaces:**
- Produces Prisma models for `ProductDefinition`, `CatalogOffering`, `CatalogPrice`, `CapabilityDefinition`, `OfferingCapability`, `BundleComponent`, `TrialPolicy`, `WorkflowTemplate`, `CatalogRevision`, `Acquisition`, `AcquisitionLine`, `FulfillmentRun`, `Entitlement`, `ProductInstance`, `TrialGrant`, `UsageLedger`, `ServiceSubscription`, `RecommendationRule`, `RecommendationDecision`, `ProductAnalyticsEvent`, and `ServicesOutboxEvent`.
- Extends `PaymentRequest` with optional `acquisitionId` while preserving legacy plan billing.

- [ ] Write schema contract tests for models, indexes, unique idempotency keys, and ownership fields.
- [ ] Run `npx vitest run tests/services-platform-schema-contract.test.ts` and confirm failure.
- [ ] Add typed enums and relations; keep lifecycle dimensions separate.
- [ ] Add additive SQL migration with no destructive legacy changes.
- [ ] Seed the first `pricing-site` Product, offering, capabilities, workflow templates, and recommendation rules idempotently.
- [ ] Run Prisma generation, schema tests, seed tests, typecheck, lint, full tests, and build.

### Task 3: Implement Product Registry, Catalog, and eligibility

**Files:**
- Create: `src/modules/services-platform/product-registry.ts`
- Create: `src/modules/services-platform/catalog-types.ts`
- Create: `src/modules/services-platform/catalog-policy.ts`
- Create: `src/modules/services-platform/catalog-service.ts`
- Create: `src/modules/services-platform/prisma-catalog-repository.ts`
- Create: `src/modules/services-platform/catalog-read-model.ts`
- Create: `src/modules/services-platform/eligibility.ts`
- Create: `src/modules/services-platform/product-adapters/pricing-site-product.ts`
- Create: `tests/product-registry.test.ts`
- Create: `tests/services-catalog.test.ts`
- Create: `tests/services-eligibility.test.ts`

**Interfaces:**
- `createProductRegistry(definitions).get(productKey)` resolves executable product adapters.
- `createCatalogService(repository, registry)` exposes draft, preview, publish, pause, retire, and customer catalog queries.
- `evaluateOfferingEligibility(context, policy)` returns `{ visible, eligible, purchasable, recommended, reasonCodes, ctaMode }`.

- [ ] Write failing tests for duplicate product keys, missing adapters, publication transitions, price version selection, eligibility precedence, and catalog projections.
- [ ] Implement the registry and first pricing-site adapter.
- [ ] Implement versioned catalog commands and read models.
- [ ] Implement deterministic server-side eligibility with explicit deny precedence and reason codes.
- [ ] Verify focused and full quality gates.

### Task 4: Implement Entitlements, Product Instances, subscriptions, trials, and usage

**Files:**
- Create: `src/modules/services-platform/entitlement-types.ts`
- Create: `src/modules/services-platform/entitlement-resolver.ts`
- Create: `src/modules/services-platform/entitlement-service.ts`
- Create: `src/modules/services-platform/prisma-entitlement-repository.ts`
- Create: `src/modules/services-platform/product-instance-service.ts`
- Create: `src/modules/services-platform/subscription-service.ts`
- Create: `src/modules/services-platform/trial-service.ts`
- Create: `src/modules/services-platform/usage-service.ts`
- Create: `tests/entitlement-resolver.test.ts`
- Create: `tests/product-instance-service.test.ts`
- Create: `tests/service-subscription.test.ts`
- Create: `tests/service-trial-usage.test.ts`

**Interfaces:**
- `resolveEntitlements(grants, at)` returns active capabilities and resolved limits.
- `grantEntitlements`, `revokeEntitlements`, and `consumeUsage` require idempotency keys.
- `activateProductInstance` resolves a Product Registry adapter and never changes global Tenant status.

- [ ] Write failing tests for grant precedence, expiry, quantity aggregation, usage races, multiple active subscriptions, grace periods, cancellation, renewal, and trial conversion.
- [ ] Implement pure resolver policies first.
- [ ] Implement Prisma-backed commands with atomic usage increments and audit/outbox records.
- [ ] Map legacy pricing-site subscription access into compatibility entitlements without deleting legacy data.
- [ ] Verify focused and full quality gates.

### Task 5: Implement Acquisition and Communication integration

**Files:**
- Create: `src/modules/services-platform/acquisition-types.ts`
- Create: `src/modules/services-platform/acquisition-state-machine.ts`
- Create: `src/modules/services-platform/acquisition-service.ts`
- Create: `src/modules/services-platform/prisma-acquisition-repository.ts`
- Create: `src/modules/services-platform/communication-adapter.ts`
- Create: `tests/acquisition-state-machine.test.ts`
- Create: `tests/acquisition-service.test.ts`
- Create: `tests/services-communication-integration.test.ts`

**Interfaces:**
- `requestOffering(input)` creates the price snapshot and then calls Communication Core with `namespace=services`, `entityType=acquisition`, and `relationKey=primary`.
- The acquisition status machine supports `DRAFT`, `REQUESTED`, `QUALIFYING`, `ACCEPTED`, `AWAITING_PAYMENT`, `PAID`, `FULFILLING`, `FULFILLED`, `DECLINED`, `CANCELLED`, and `REFUNDED`.

- [ ] Write failing tests for server price authority, duplicate request idempotency, invalid transitions, recovery when Communication opening fails, and context reference creation.
- [ ] Implement immutable acquisition lines and snapshots.
- [ ] Integrate through `createCommunicationCore` public commands only.
- [ ] Add customer-visible system events only for meaningful state changes.
- [ ] Verify focused and full quality gates.

### Task 6: Integrate payment, fulfillment, activation, refunds, and custom quotes

**Files:**
- Create: `src/modules/services-platform/fulfillment-state-machine.ts`
- Create: `src/modules/services-platform/fulfillment-service.ts`
- Create: `src/modules/services-platform/prisma-fulfillment-repository.ts`
- Create: `src/modules/services-platform/workflow-registry.ts`
- Modify: `src/modules/billing/billing-activation-service.ts`
- Modify: `src/modules/billing/prisma-billing-activation-repository.ts`
- Modify: `src/app/(dashboard)/dashboard/billing/actions.ts`
- Modify: `src/app/(admin)/admin/payments/actions.ts`
- Create: `tests/services-fulfillment.test.ts`
- Create: `tests/services-payment-integration.test.ts`

**Interfaces:**
- Workflow keys: `instant`, `payment_then_auto`, `payment_then_manual`, `manual_service`, `custom_quote`, and `beta_application`.
- Approved payment emits a Services event; it does not directly know product adapters.
- Fulfillment activation grants entitlements and creates product instances idempotently.

- [ ] Write failing tests for each workflow, manual readiness, partial bundle failure, payment rejection, refund revocation policy, and custom quote price acceptance.
- [ ] Extend payment requests additively to resolve Acquisition context.
- [ ] Implement fulfillment orchestration and retry-safe activation.
- [ ] Preserve the complete legacy website activation flow.
- [ ] Verify focused and full quality gates.

### Task 7: Build complete admin product operations

**Files:**
- Create: `src/app/(admin)/admin/services/page.tsx`
- Create: `src/app/(admin)/admin/services/actions.ts`
- Create: `src/app/(admin)/admin/services/services-admin-client.tsx`
- Create: `src/app/(admin)/admin/services/products/[id]/page.tsx`
- Create: `src/app/(admin)/admin/services/acquisitions/page.tsx`
- Create: `src/app/(admin)/admin/services/entitlements/page.tsx`
- Create: `src/app/(admin)/admin/services/fulfillment/page.tsx`
- Create: `src/app/(admin)/admin/services/recommendations/page.tsx`
- Modify: `src/modules/admin/navigation.ts`
- Modify: `src/modules/admin/permissions.ts`
- Create: `tests/services-admin-ui.test.tsx`
- Modify: `tests/admin-navigation-contract.test.tsx`

**Interfaces:**
- All mutations pass through Services Platform modules and admin permission guards.
- Admin supports product/offering/price/capability/bundle/trial/workflow drafts, preview, publish, pause, entitlement adjustment, fulfillment control, and recommendation rules.

- [ ] Write failing navigation, permission, and UI contract tests.
- [ ] Add a dedicated Products & Services admin center and routes.
- [ ] Build mobile-safe cards/forms with preview and explainable eligibility.
- [ ] Add audited grant/revoke/fulfillment controls.
- [ ] Verify focused and full quality gates.

### Task 8: Build the customer Services Center

**Files:**
- Move conceptually: current `/dashboard/services` copy becomes `عروضي وأسعاري` without breaking its route contract.
- Create: `src/app/(dashboard)/dashboard/service-center/page.tsx`
- Create: `src/app/(dashboard)/dashboard/service-center/[productCode]/page.tsx`
- Create: `src/app/(dashboard)/dashboard/service-center/acquisitions/[id]/page.tsx`
- Create: `src/app/(dashboard)/dashboard/service-center/actions.ts`
- Create: `src/app/(dashboard)/dashboard/service-center/services-center-client.tsx`
- Modify: `src/components/layout/dashboard-shell.tsx`
- Create: `tests/services-center-ui.test.tsx`
- Modify: `tests/layout-shells.test.tsx`

**Interfaces:**
- Tabs: `خدماتي`, `اكتشف`, `طلباتي`, `الفوترة`.
- Product details expose context-aware CTA based on eligibility and ownership.
- Acquisition details link to the canonical Communication conversation and payment flow.

- [ ] Write failing mobile-first UI, tenant isolation, route, and CTA tests.
- [ ] Build customer read model combining instances, offerings, acquisitions, billing, and recommendations.
- [ ] Implement the service center and details screens with accessible responsive navigation.
- [ ] Preserve the existing photographer package editor and clarify its naming.
- [ ] Verify focused and full quality gates.

### Task 9: Implement recommendations, attribution, and analytics

**Files:**
- Create: `src/modules/services-platform/recommendation-engine.ts`
- Create: `src/modules/services-platform/prisma-recommendation-repository.ts`
- Create: `src/modules/services-platform/analytics-events.ts`
- Create: `src/modules/services-platform/analytics-service.ts`
- Create: `src/modules/services-platform/prisma-analytics-repository.ts`
- Create: `src/app/api/services/events/route.ts`
- Modify: `src/app/(admin)/admin/analytics/page.tsx`
- Create: `src/app/(admin)/admin/analytics/services/page.tsx`
- Create: `tests/recommendation-engine.test.ts`
- Create: `tests/services-analytics.test.ts`
- Create: `tests/services-analytics-ui.test.tsx`

**Interfaces:**
- Recommendation candidates are filtered by eligibility before scoring.
- Decisions include `ruleKey`, `ruleVersion`, `reasonCodes`, placement, score, cooldown, and attribution ID.
- Funnel events use stable names from impression through first value and renewal.

- [ ] Write failing tests for eligibility filtering, priority, cooldown, dismissals, frequency caps, attribution, and funnel aggregation.
- [ ] Implement deterministic rule evaluation and future `RecommendationStrategy` seam.
- [ ] Implement validated server/client analytics ingestion with tenant authority and PII minimization.
- [ ] Build admin funnel, product, fulfillment, and commercial dashboards.
- [ ] Verify focused and full quality gates.

### Task 10: Add operational scale extension points and reconciliation

**Files:**
- Create: `src/modules/services-platform/outbox-worker.ts`
- Create: `src/modules/services-platform/reconciliation-service.ts`
- Create: `src/app/api/cron/services-platform/route.ts`
- Create: `src/app/api/cron/services-reconciliation/route.ts`
- Create: `docs/services-platform-production-runbook.md`
- Create: `tests/services-outbox-worker.test.ts`
- Create: `tests/services-reconciliation.test.ts`
- Modify: `package.json`

**Interfaces:**
- Outbox claims use lease owner/expiry, retry/backoff, and dead-letter state.
- Reconciliation detects orphan acquisitions, missing conversations, paid-but-unfulfilled work, entitlement drift, and instance drift.
- Future adapters exist for AI recommendation, external analytics sink, payment provider, object storage, and remote provisioning without activating them.

- [ ] Write failing worker lease, retry, duplicate, and reconciliation tests.
- [ ] Implement worker and cron authorization using `CRON_SECRET`.
- [ ] Add production runbook and maintenance commands.
- [ ] Verify focused and full quality gates.

### Task 11: Final migration, documentation, and regression verification

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/features/README.md`
- Create: `docs/features/services-platform.md`
- Create: `docs/progress/2026-07-22-services-platform-completion.md`

- [ ] Verify migration against a clean temporary PostgreSQL database and existing schema compatibility path.
- [ ] Run `npm run typecheck` and require exit 0.
- [ ] Run `npm run lint` and require exit 0 errors.
- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run build` and require exit 0.
- [ ] Review `git diff --check`, schema indexes, tenant scope, idempotency keys, and documentation ownership statements.
- [ ] Record all screens, modules, migrations, deviations, verification outputs, and future extension points in the completion report.
