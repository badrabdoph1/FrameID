# Customer Outreach Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified admin campaign workspace that sends dashboard message cards to filtered or explicitly selected customers and keeps an actionable recipient history with pause/resume controls.

**Architecture:** Persist campaigns and recipient snapshots in dedicated Prisma models. A focused message-domain service owns audience resolution, validation, campaign creation, compatibility notification writes, and lifecycle changes. The admin route renders a client workspace from server-loaded campaigns and audience options; the customer dashboard reads active campaign recipients directly.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 6/PostgreSQL, Tailwind CSS 4, Vitest and Testing Library.

## Global Constraints

- Keep subscription activation messages separate from free-form customer outreach.
- Exclude deleted tenants from every audience.
- Resolve filtered audiences on the server at send time.
- Limit titles to 120 characters and bodies to 1200 characters.
- Require `messages:view` for reads and `messages:edit` for writes.
- Keep all implementation changes uncommitted for review.

---

### Task 1: Campaign persistence and domain contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260717120000_add_customer_message_campaigns/migration.sql`
- Create: `src/modules/messages/customer-outreach.ts`
- Test: `tests/customer-outreach.test.ts`

**Interfaces:**
- Produces `CustomerOutreachFilters`, `CustomerOutreachInput`, `normalizeCustomerOutreachInput(input)`, and `buildCustomerOutreachAudienceWhere(filters)`.
- Produces Prisma models `CustomerMessageCampaign` and `CustomerMessageRecipient`.

- [ ] Write tests that reject blank/oversized copy, normalize tone and mode, and map search, tenant status, subscription status, and plan ID into a deleted-safe Prisma where object.
- [ ] Run `npm test -- tests/customer-outreach.test.ts` and verify the missing module fails.
- [ ] Add focused validation/types, then add campaign and recipient models with a unique `(campaignId, tenantId)` constraint and indexes for status/date and tenant/date.
- [ ] Add SQL creating both tables, indexes, and cascading campaign/tenant foreign keys.
- [ ] Run the test and `npx prisma validate`; expect both to pass.

### Task 2: Transactional campaign service

**Files:**
- Create: `src/modules/messages/customer-outreach-service.ts`
- Test: `tests/customer-outreach-service.test.ts`

**Interfaces:**
- Consumes `CustomerOutreachInput` and an admin actor `{ id, name, email }`.
- Produces `createCustomerOutreachCampaign(prisma, input, actor)` and `setCustomerOutreachCampaignStatus(prisma, campaignId, status, actor)`.

- [ ] Write repository-shaped tests proving explicit recipients are deduplicated, filtered mode resolves the complete matching audience, empty audiences fail, creation writes recipients/notifications/logs/audit atomically, and pause/resume records audit state.
- [ ] Run `npm test -- tests/customer-outreach-service.test.ts`; verify missing exports fail.
- [ ] Implement the minimal transaction service. Compatibility notifications use `customer_campaign:<campaignId>` and logs use `CUSTOMER_BROADCAST_CATEGORY`; campaign visibility remains governed by campaign status.
- [ ] Run both outreach test files and expect all cases to pass.

### Task 3: Admin route, targeting workspace, and navigation

**Files:**
- Create: `src/app/(admin)/admin/messages/customer-outreach/page.tsx`
- Create: `src/app/(admin)/admin/messages/customer-outreach/actions.ts`
- Create: `src/app/(admin)/admin/messages/customer-outreach/customer-outreach-workspace.tsx`
- Modify: `src/app/(admin)/admin/messages/page.tsx`
- Modify: `src/modules/admin/navigation.ts`
- Test: `tests/admin-customer-outreach.test.tsx`
- Modify: `tests/admin-navigation-contract.test.tsx`

**Interfaces:**
- Server actions consume `title`, `body`, `tone`, `audienceMode`, repeated `tenantIds`, `search`, `tenantStatus`, `subscriptionStatus`, and `planId`.
- Workspace consumes serializable `customers`, `plans`, `campaigns`, `stats`, and optional feedback.

- [ ] Write UI tests for copy fields, audience filters, select page/all matching/manual modes, selected count, campaign filters, recipient disclosure, and pause/resume forms; extend navigation assertions for the nested route.
- [ ] Run the two admin tests and verify failures identify the absent route/component.
- [ ] Implement permission-protected loaders/actions and a responsive RTL workspace with composer, audience summary, searchable campaign cards, recipient detail panel, status/tone badges, and lifecycle controls.
- [ ] Add the route to the registry and a prominent «مراسلة العميل» action card/link on the subscription messages page.
- [ ] Run the admin tests and expect them to pass.

### Task 4: Unify existing customer-management sends

**Files:**
- Modify: `src/app/(admin)/admin/customers/actions.ts`
- Modify: `src/modules/admin/customers/customer-admin-service.ts`
- Test: `tests/admin-customer-outreach.test.tsx`

**Interfaces:**
- Bulk `notify` calls `createCustomerOutreachCampaign` in explicit mode.
- Individual `sendNotificationAction` calls the same service with one tenant so it appears in the central campaign history.

- [ ] Add tests showing bulk and single-customer sends delegate to the campaign contract and preserve their existing user-facing inputs.
- [ ] Run the focused test and verify it fails on the legacy direct notification writes.
- [ ] Replace both direct paths with the campaign service and retain existing redirects/revalidation.
- [ ] Run focused tests and customer workspace tests; expect them to pass.

### Task 5: Customer dashboard visibility

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/modules/dashboard/dashboard-view-model.ts`
- Modify: `src/app/(dashboard)/dashboard/home-client.tsx`
- Test: `tests/dashboard-customer-outreach.test.tsx`

**Interfaces:**
- Dashboard query returns active campaign fields through the tenant's recipient rows.
- Existing `DashboardCustomerMessage` remains the rendering contract, adding no campaign-management concerns to the client component.

- [ ] Write a dashboard test proving active recipient campaigns map to cards and paused campaigns are excluded by the query contract.
- [ ] Run the test and verify it fails against the legacy NotificationLog loader.
- [ ] Change the loader to `customerMessageRecipient.findMany` with `campaign.status = ACTIVE`, map campaign fields into the existing view model, and improve the card so multiline message text remains readable.
- [ ] Run dashboard and outreach tests and expect them to pass.

### Task 6: Full verification and review

**Files:**
- Review every path listed above plus the pre-existing dirty files from the initial status.

- [ ] Run `npx prisma format` and inspect that it only formats the intended schema.
- [ ] Run `npm test -- tests/customer-outreach.test.ts tests/customer-outreach-service.test.ts tests/admin-customer-outreach.test.tsx tests/admin-navigation-contract.test.tsx tests/dashboard-customer-outreach.test.tsx`.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Run `git diff --check` and `git status --short --branch`.
- [ ] Review the final diff for accidental overlap with the user's pre-existing changes and report exact test/build evidence without committing.
