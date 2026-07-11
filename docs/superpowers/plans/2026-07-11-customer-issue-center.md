# Customer Issue Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** بناء مسار موحد يلتقط كل الأخطاء تقنيًا، يتيح للعميل إنشاء بلاغ بضغطة واحدة، ويدير البلاغ حتى الحل والإغلاق من مركز «مشاكل العملاء» داخل الأدمن.

**Architecture:** نوسّع `ErrorLog` ليكون سجل كل Error Occurrence، ونضيف `CustomerIssue` و`CustomerIssueEvent` لدورة البلاغ. جميع المصادر تستدعي خدمة Domain واحدة؛ Endpoint العميل يشتق الهوية والسياق الموثوق على السيرفر، وصفحات الأخطاء تستخدم مكوّن عرض واحد لا يكشف أي تفاصيل تقنية.

**Tech Stack:** Next.js 15 App Router، React 19، TypeScript 5.9، Prisma 6/PostgreSQL، Tailwind CSS 4، Vitest وTesting Library.

## Global Constraints

- تطوير `ErrorLog` وError Center الحاليين؛ ممنوع إنشاء نظام أخطاء موازٍ.
- النص العام: «في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات.»
- لا تظهر Stack أو Digest أو Error Code أو Request ID أو Correlation ID للمستخدم النهائي.
- كل بلاغ يرتبط بالعميل والموقع والجلسة عند توفرهم من سياق موثوق.
- الإبلاغ لا يتطلب كتابة؛ الملاحظة اختيارية.
- كل Metadata تمر عبر Sanitizer يحذف الأسرار والبيانات الحساسة.
- حالات البلاغ: `NEW`, `IN_REVIEW`, `RESOLVED`, `CLOSED`.
- الأولويات: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- لا تستخدم Agents فرعية في تنفيذ هذه الخطة؛ التنفيذ Inline في الجلسة الحالية.

---

## File Structure

### Domain and persistence

- `prisma/schema.prisma`: الجداول والعلاقات والـenums والـindexes.
- `prisma/migrations/20260711190000_customer_issue_center/migration.sql`: Migration غير مدمرة.
- `src/modules/customer-issues/types.ts`: العقود العامة والحالات.
- `src/modules/customer-issues/fingerprint.ts`: تطبيع الخطأ وحساب البصمة.
- `src/modules/customer-issues/sanitize.ts`: تنقية Metadata وURL وHeaders.
- `src/modules/customer-issues/state-machine.ts`: انتقالات الحالة.
- `src/modules/customer-issues/context.ts`: بناء سياق السيرفر والعميل.
- `src/modules/customer-issues/repository.ts`: واجهة التخزين.
- `src/modules/customer-issues/prisma-customer-issue-repository.ts`: Prisma adapter.
- `src/modules/customer-issues/customer-issue-service.ts`: تسجيل الظهور، إنشاء البلاغ، الدمج، والحل.

### Capture and user experience

- `src/app/api/customer-issues/capture/route.ts`: التقاط ظهور عميل وإرجاع occurrence ID.
- `src/app/api/customer-issues/report/route.ts`: ترقية الظهور إلى بلاغ.
- `src/lib/client/error-reporting.ts`: جمع Browser/Device/OS/Screen/Timezone/Connection/last action.
- `src/components/errors/error-reporting-provider.tsx`: `window.error` و`unhandledrejection` وAction buffer.
- `src/components/errors/error-experience.tsx`: العرض الموحد والأزرار والملاحظة الاختيارية.
- `src/components/errors/global-error-experience.tsx`: نسخة قليلة الاعتماد لـGlobal Error.
- صفحات `src/app/**/error.tsx`, `not-found.tsx`, وصفحات auth/status: استخدام التجربة الموحدة.

### Admin

- `src/modules/customer-issues/admin-queries.ts`: stats/list/detail محمية.
- `src/app/(admin)/admin/errors/actions.ts`: أفعال دورة الحالة والإشعار.
- `src/app/(admin)/admin/errors/page.tsx`: قائمة مركز مشاكل العملاء.
- `src/app/(admin)/admin/errors/[id]/page.tsx`: تفاصيل البلاغ.
- `src/app/(admin)/admin/errors/[id]/issue-actions.tsx`: أزرار الإجراءات والنسخ.
- `src/modules/admin/navigation.ts`, `src/app/(admin)/admin/page.tsx`, وTopbar: Badge والملخص.

### Tests

- `tests/customer-issue-fingerprint.test.ts`
- `tests/customer-issue-sanitize.test.ts`
- `tests/customer-issue-state-machine.test.ts`
- `tests/customer-issue-service.test.ts`
- `tests/customer-issue-api.test.ts`
- `tests/error-experience.test.tsx`
- `tests/admin-customer-issue-center.test.tsx`

---

### Task 1: Database model and safe migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260711190000_customer_issue_center/migration.sql`
- Test: Prisma validation through `npm run db:generate`

**Interfaces:**
- Produces: `CustomerIssueStatus`, `CustomerIssuePriority`, `CustomerIssueSource`, `CustomerIssue`, `CustomerIssueEvent`, and extended `ErrorLog` Prisma types.

- [ ] **Step 1: Add enums and relations to Prisma schema**

Define the exact enums:

```prisma
enum CustomerIssueStatus { NEW IN_REVIEW RESOLVED CLOSED }
enum CustomerIssuePriority { LOW MEDIUM HIGH CRITICAL }
enum CustomerIssueSource { CUSTOMER_REPORT INTERNAL_AUTO ADMIN_REPORT }
```

Add nullable relations from `CustomerIssue` to `User`, `Tenant`, `Site`, and `AdminUser`, relation from `ErrorLog.issueId`, and indexes from the design spec. Add reverse relations to the related models.

- [ ] **Step 2: Write non-destructive SQL migration**

The migration must use `CREATE TYPE`, `CREATE TABLE`, and `ALTER TABLE ... ADD COLUMN` without dropping existing columns or rows. Create a sequence-backed integer `number` with a unique index and foreign keys using `ON DELETE SET NULL` for contextual relations.

- [ ] **Step 3: Validate and generate Prisma client**

Run: `npm run db:generate`

Expected: Prisma schema validates and client generation exits 0.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260711190000_customer_issue_center/migration.sql
git commit -m "feat: add customer issue data model"
```

### Task 2: Fingerprint, sanitizer, and state machine with TDD

**Files:**
- Create: `src/modules/customer-issues/types.ts`
- Create: `src/modules/customer-issues/fingerprint.ts`
- Create: `src/modules/customer-issues/sanitize.ts`
- Create: `src/modules/customer-issues/state-machine.ts`
- Create: `tests/customer-issue-fingerprint.test.ts`
- Create: `tests/customer-issue-sanitize.test.ts`
- Create: `tests/customer-issue-state-machine.test.ts`

**Interfaces:**
- Produces: `createErrorFingerprint(input): string`, `sanitizeIssuePayload(input): SanitizedIssuePayload`, `assertIssueTransition(from, to): void`.

- [ ] **Step 1: Write failing fingerprint tests**

Cover stable hashes when IDs/numbers change, route query removal, different source frames, and digest fallback.

```ts
expect(createErrorFingerprint({ code: "FID-DB-002", errorType: "PrismaError", route: "/dashboard/sites/123?token=x", stack: "at save (/app/src/actions.ts:20:4)" }))
  .toBe(createErrorFingerprint({ code: "FID-DB-002", errorType: "PrismaError", route: "/dashboard/sites/456?token=y", stack: "at save (/app/src/actions.ts:20:4)" }));
```

- [ ] **Step 2: Write failing sanitizer tests**

Assert removal of `password`, `token`, `cookie`, `authorization`, payment fields, reset tokens, and sensitive query params while preserving browser/device diagnostics.

- [ ] **Step 3: Write failing state-machine tests**

Assert the five allowed transitions from the spec and rejection of `NEW -> CLOSED`, `CLOSED -> RESOLVED`, and self-transitions.

- [ ] **Step 4: Run tests and verify RED**

Run: `npm test -- tests/customer-issue-fingerprint.test.ts tests/customer-issue-sanitize.test.ts tests/customer-issue-state-machine.test.ts`

Expected: FAIL because modules do not exist.

- [ ] **Step 5: Implement minimal domain utilities**

Use `node:crypto` SHA-256 for a 32-character fingerprint, recursive depth/size limits for metadata, and an explicit transition map:

```ts
const transitions = {
  NEW: ["IN_REVIEW"],
  IN_REVIEW: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_REVIEW"],
  CLOSED: ["IN_REVIEW"],
} as const;
```

- [ ] **Step 6: Run tests and verify GREEN**

Run the same Vitest command.

Expected: all new domain tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/customer-issues tests/customer-issue-*.test.ts
git commit -m "feat: add customer issue domain rules"
```

### Task 3: Repository and customer issue service with TDD

**Files:**
- Create: `src/modules/customer-issues/repository.ts`
- Create: `src/modules/customer-issues/prisma-customer-issue-repository.ts`
- Create: `src/modules/customer-issues/customer-issue-service.ts`
- Modify: `src/lib/errors/logger.ts`
- Modify: `src/lib/errors/error-service.ts`
- Modify: `src/lib/errors/types.ts`
- Test: `tests/customer-issue-service.test.ts`
- Test: `tests/error-service.test.ts`

**Interfaces:**
- Consumes: domain utilities from Task 2 and Prisma types from Task 1.
- Produces: `createCustomerIssueService(repository)`, `captureOccurrence(input)`, `reportIssue(input)`, `transitionIssue(input)`, `notifyResolved(input)`.

- [ ] **Step 1: Write fake-repository service tests**

Cover: occurrence creation, report creation, 24-hour same-context dedupe, separation by tenant/site/user, event creation, status transition, assignee, resolver identity, and customer notification.

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- tests/customer-issue-service.test.ts`

Expected: FAIL because service and repository contract do not exist.

- [ ] **Step 3: Implement repository contract and service**

The repository contract must expose focused methods rather than Prisma:

```ts
export interface CustomerIssueRepository {
  createOccurrence(input: CreateOccurrenceInput): Promise<ErrorOccurrence>;
  findMergeCandidate(input: MergeCandidateInput): Promise<CustomerIssueRecord | null>;
  createIssueWithEvent(input: CreateIssueInput): Promise<CustomerIssueRecord>;
  attachOccurrence(input: AttachOccurrenceInput): Promise<CustomerIssueRecord>;
  transitionWithEvent(input: TransitionIssueInput): Promise<CustomerIssueRecord>;
  createCustomerNotification(input: CustomerResolutionNotification): Promise<void>;
}
```

Use a Prisma transaction for issue+event+notification operations.

- [ ] **Step 4: Route existing `processError()` and logger persistence through occurrence fields**

Keep the public `processError()` result compatible, but stop discarding stack/cause/platform/browser/tenant fields. User-facing `UserError` must no longer expose internal codes in UI consumers.

- [ ] **Step 5: Run service and existing error tests**

Run: `npm test -- tests/customer-issue-service.test.ts tests/error-service.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/customer-issues src/lib/errors tests/customer-issue-service.test.ts tests/error-service.test.ts
git commit -m "feat: unify error occurrence and issue services"
```

### Task 4: Trusted request context and reporting API

**Files:**
- Create: `src/modules/customer-issues/context.ts`
- Create: `src/app/api/customer-issues/capture/route.ts`
- Create: `src/app/api/customer-issues/report/route.ts`
- Modify: `src/app/api/client-diagnostics/route.ts`
- Modify: `src/lib/rate-limiter.ts`
- Test: `tests/customer-issue-api.test.ts`

**Interfaces:**
- Consumes: Customer Issue Service.
- Produces: `POST /api/customer-issues/capture -> { occurrenceId }` and `POST /api/customer-issues/report -> { issueId, issueNumber, merged }`.

- [ ] **Step 1: Write failing request handler tests**

Test valid anonymous public-site capture, authenticated dashboard linking, internal admin source, invalid JSON, oversized body, spoofed user/tenant IDs ignored, and rate limiting.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/customer-issue-api.test.ts`

Expected: FAIL because routes/context are missing.

- [ ] **Step 3: Implement trusted context**

Read request/correlation/path/method/URL from middleware headers, session from secure cookies, site from session or validated `/p/[slug]`, IP from trusted proxy headers, and build values from environment. Never copy identity fields from JSON.

- [ ] **Step 4: Implement capture and report handlers**

Validate payloads with bounded parsing, call the service, return only opaque IDs and issue number, and use generic safe Arabic errors. Reuse the same service in `client-diagnostics`.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- tests/customer-issue-api.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/customer-issues src/app/api/client-diagnostics/route.ts src/modules/customer-issues/context.ts src/lib/rate-limiter.ts tests/customer-issue-api.test.ts
git commit -m "feat: add secure customer issue reporting API"
```

### Task 5: Unified error experience and client telemetry

**Files:**
- Create: `src/lib/client/error-reporting.ts`
- Create: `src/components/errors/error-reporting-provider.tsx`
- Create: `src/components/errors/error-experience.tsx`
- Create: `src/components/errors/global-error-experience.tsx`
- Modify: `src/components/errors/toast-root-provider.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/error-experience.test.tsx`

**Interfaces:**
- Produces: `ErrorExperience({ variant, error, homeHref })` and `reportClientError(error, context)`.

- [ ] **Step 1: Write failing component tests**

Assert the preferred message, the three required buttons, full refresh behavior, automatic capture once, report without note, optional note, success issue number, and absence of technical strings and digest.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/error-experience.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement bounded client metadata and action buffer**

Collect browser/device/OS/screen/language/timezone/referrer/online/effective connection/site version. Record only semantic action names from `data-error-action`; never values typed in inputs.

- [ ] **Step 4: Implement provider and components**

Register `window.error` and `unhandledrejection`, dedupe by a session key, and make reporting best-effort. Build calm responsive UI with accessible status announcements, loading/complete states, and optional note disclosure.

- [ ] **Step 5: Verify GREEN**

Run the component test command.

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/client/error-reporting.ts src/components/errors src/app/layout.tsx tests/error-experience.test.tsx
git commit -m "feat: add unified customer-safe error experience"
```

### Task 6: Replace all error and access pages

**Files:**
- Modify: `src/app/error.tsx`
- Modify: `src/app/global-error.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/(marketing)/error.tsx`
- Modify: `src/app/(dashboard)/dashboard/error.tsx`
- Modify: `src/app/(admin)/admin/error.tsx`
- Modify: `src/app/expired/page.tsx`
- Create: `src/app/unauthorized/page.tsx`
- Create: `src/app/forbidden/page.tsx`
- Create: `src/app/session-expired/page.tsx`
- Modify: auth/admin guards that currently redirect to generic pages.
- Test: `tests/error-pages.test.tsx`

**Interfaces:**
- Consumes: `ErrorExperience` and `GlobalErrorExperience`.

- [ ] **Step 1: Write page contract tests**

Import every page and assert unified copy/actions, correct `homeHref`, and state-specific calm guidance. Assert no forbidden technical phrases.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/error-pages.test.tsx`

Expected: FAIL against current inconsistent pages.

- [ ] **Step 3: Replace page implementations**

Use the shared component and ensure retry performs `window.location.reload()`. Global Error must render `<html lang="ar" dir="rtl">` and use its low-dependency component.

- [ ] **Step 4: Run repository-wide phrase audit**

Run:

```bash
rg -n "حدث خطأ غير متوقع|يوجد خطأ في النظام|Internal Server Error|Stack Trace|كود الخطأ|Error Code" src/app src/components
```

Expected: no user-facing matches; admin-only technical labels may remain only under `/admin/errors`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- tests/error-pages.test.tsx tests/error-experience.test.tsx`

```bash
git add src/app src/components/errors tests/error-pages.test.tsx
git commit -m "feat: unify all application error pages"
```

### Task 7: Admin query layer and Customer Issue Center list

**Files:**
- Create: `src/modules/customer-issues/admin-queries.ts`
- Rewrite: `src/app/(admin)/admin/errors/actions.ts`
- Rewrite: `src/app/(admin)/admin/errors/page.tsx`
- Create: `tests/admin-customer-issue-center.test.tsx`

**Interfaces:**
- Produces: `getCustomerIssueStats()`, `listCustomerIssues(filters)`, and serialized list rows without stack/metadata payloads.

- [ ] **Step 1: Write failing stats/list tests**

Assert counts for all four statuses, search/filter behavior, newest/priority ordering, reporter/site summaries, occurrence count, and omission of heavy technical fields.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/admin-customer-issue-center.test.tsx`

- [ ] **Step 3: Implement protected query layer**

Require admin permission, select only list fields, paginate, and serialize dates at the boundary.

- [ ] **Step 4: Build the list UI**

Render four metric cards, clear new badge, filters, priority/status chips, customer/site links, and a secondary technical-occurrences view for unreported `ErrorLog` rows.

- [ ] **Step 5: Verify GREEN and commit**

Run the admin center test command.

```bash
git add src/modules/customer-issues/admin-queries.ts 'src/app/(admin)/admin/errors' tests/admin-customer-issue-center.test.tsx
git commit -m "feat: build customer issue center list"
```

### Task 8: Admin issue detail and workflow actions

**Files:**
- Create: `src/app/(admin)/admin/errors/[id]/page.tsx`
- Create: `src/app/(admin)/admin/errors/[id]/issue-actions.tsx`
- Modify: `src/app/(admin)/admin/errors/actions.ts`
- Test: `tests/admin-customer-issue-detail.test.tsx`

**Interfaces:**
- Consumes: transition and notification service methods.
- Produces: `startReviewAction`, `resolveIssueAction`, `reopenIssueAction`, `closeIssueAction`, `notifyCustomerResolvedAction`.

- [ ] **Step 1: Write failing detail/action tests**

Assert every requested field and action, permissions, transition validation, admin attribution, sanitized clipboard payload, and conditional source/customer/site links.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/admin-customer-issue-detail.test.tsx`

- [ ] **Step 3: Implement server actions**

Each action gets the current admin from the server, validates the transition in Domain, writes issue+event transactionally, revalidates list/detail/dashboard, and returns a safe result.

- [ ] **Step 4: Implement detail UI**

Use progressive disclosure for stack and metadata. Generate repository file URLs only when repository base URL, commit SHA, and sanitized project-relative path are present.

- [ ] **Step 5: Verify GREEN and commit**

Run the detail test command.

```bash
git add 'src/app/(admin)/admin/errors' tests/admin-customer-issue-detail.test.tsx
git commit -m "feat: add customer issue review workflow"
```

### Task 9: Admin dashboard, navigation badges, and customer notification

**Files:**
- Modify: `src/modules/admin/navigation.ts`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/components/layout/admin-topbar.tsx`
- Modify: `src/components/layout/admin-mobile-nav.tsx`
- Modify: related admin shell props for server-derived badge counts.
- Modify: customer notification rendering if a new issue resolution type needs copy.
- Test: `tests/admin-issue-navigation.test.tsx`

**Interfaces:**
- Consumes: `getCustomerIssueStats()` and `Notification` model.

- [ ] **Step 1: Write failing navigation/dashboard tests**

Assert prominent «مشاكل العملاء» item, visible NEW badge, homepage card with four counts, recent issues, and Topbar link.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/admin-issue-navigation.test.tsx`

- [ ] **Step 3: Implement server-derived badges and dashboard section**

Do not hard-code counts into static navigation. Pass the current new count from admin layout/query into desktop/mobile/topbar components and use one accessible badge pattern.

- [ ] **Step 4: Verify GREEN and commit**

Run the navigation test command.

```bash
git add src/modules/admin/navigation.ts 'src/app/(admin)/admin/page.tsx' src/components/layout tests/admin-issue-navigation.test.tsx
git commit -m "feat: surface customer issues across admin"
```

### Task 10: Complete integration sweep and verification

**Files:**
- Modify: remaining API routes and Server Actions found by audit.
- Modify: `docs/notification-error-system-implementation.md`
- Test: all relevant tests.

**Interfaces:**
- Consumes: unified capture/reporting services.

- [ ] **Step 1: Audit remaining error surfaces**

Run:

```bash
rg -n "console\.error|catch\s*\(|new Error\(|NextResponse\.json\(\{ error|error\.message" src/app src/components src/modules src/lib
```

Classify matches: expected validation errors remain user-specific; unexpected errors must route through `processError`, route wrapper, or client reporter. Never expose raw `error.message` in a response/UI.

- [ ] **Step 2: Add missing integration tests for API and Server Actions**

For each wrapper changed, assert one occurrence is recorded with request/correlation IDs and that the returned error is calm and contains no technical details.

- [ ] **Step 3: Update system documentation**

Document the two-level occurrence/issue model, how to add a new capture point, privacy rules, state transitions, and admin workflow.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm test -- tests/customer-issue-fingerprint.test.ts tests/customer-issue-sanitize.test.ts tests/customer-issue-state-machine.test.ts tests/customer-issue-service.test.ts tests/customer-issue-api.test.ts tests/error-experience.test.tsx tests/error-pages.test.tsx tests/admin-customer-issue-center.test.tsx tests/admin-customer-issue-detail.test.tsx tests/admin-issue-navigation.test.tsx tests/error-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run in order:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: every command exits 0. If a baseline unrelated failure appears, record exact evidence and do not mask it.

- [ ] **Step 6: Final acceptance audit**

Confirm each acceptance criterion from `docs/superpowers/specs/2026-07-11-customer-issue-center-design.md` maps to a passing test or a manually inspected UI path. Confirm `git diff --check` has no output and `git status --short` contains only intended changes.

- [ ] **Step 7: Commit final integration**

```bash
git add src tests docs prisma
git commit -m "feat: complete unified customer issue reporting"
```
