# FrameID Customer Dashboard — Operating Workspace Execution Report

Branch: `feature/customer-operating-workspace`

## Goal

تحويل لوحة تحكم العميل من مجموعة صفحات وإعدادات منفصلة إلى مركز تشغيل يومي للمصور.

الهدف التشغيلي للوحة الآن:

1. يبدأ العميل من Dashboard واحدة واضحة.
2. يرى مسار الرحلة من تجهيز الاستوديو حتى النشر والتفعيل.
3. يعرف الخطوة التالية بدون بحث بين الصفحات.
4. يستخدم Workspaces عملية بدل أقسام تقنية منفصلة.
5. ينشر الموقع من Launch Workspace بعد اكتمال الأساسيات.

## What changed

### 1. Customer dashboard view model

Updated:

- `src/modules/dashboard/dashboard-view-model.ts`

Added:

- richer checklist items with descriptions and workspace mapping
- readiness status: `isReadyToPublish`
- launch-aware `statusLabel`
- operating alerts
- customer journey phases
- SEO/share readiness as a first-class requirement
- additional stats for publishing and sharing

The dashboard can now explain not only the current state, but also the next operational action.

### 2. Dashboard home as Operating Workspace

Updated:

- `src/app/(dashboard)/dashboard/home-client.tsx`

The dashboard home is now positioned as:

- `مركز تشغيل المصور اليومي`

It includes:

- hero with site state and next action
- readiness ring
- customer journey phases
- operating alerts
- workspace cards:
  - Studio Workspace
  - Portfolio Workspace
  - Sales Workspace
  - Launch Workspace
- enriched checklist with descriptions
- stats for photos, albums, packages, theme, sharing, and publishing

This makes the first page the main operating room for the customer instead of a passive overview.

### 3. SEO readiness wired into dashboard data

Updated:

- `src/app/(dashboard)/dashboard/page.tsx`

The page now fetches SEO settings and passes `hasSeoSettings` into the dashboard view model.

This makes launch readiness depend on a professional share/search preview, not only content quantity.

### 4. Launch / Publish Workspace

Updated:

- `src/app/(dashboard)/dashboard/publish/page.tsx`
- `src/app/(dashboard)/dashboard/publish/publish-client.tsx`
- `src/app/(dashboard)/dashboard/publish/actions.ts`

The publish page is now a real Launch Workspace.

It includes:

- readiness checklist
- publish state
- published version
- clear publish/unpublish actions
- QR code
- link copy
- customer preview link
- share preview
- share image upload
- SEO form
- pre-launch review checklist

### 5. Publish and unpublish server actions

Added:

- `publishSiteAction`
- `unpublishSiteAction`

`publishSiteAction` validates minimum readiness before publishing:

- contact information exists
- portfolio has at least one image
- at least one package exists
- SEO/share preview is configured

If ready, it updates the site:

- `status = PUBLISHED`
- `isPublished = true`
- increments `publishedVersion`

`unpublishSiteAction` returns the site to draft:

- `status = DRAFT`
- `isPublished = false`

Both actions revalidate:

- `/dashboard`
- `/dashboard/publish`
- `/p/[slug]`

## Customer journey after this implementation

### Step 1 — Register / enter dashboard

Customer lands on the dashboard command center.

They see:

- current site status
- readiness percent
- next step
- operating alerts
- workspace phases

### Step 2 — Studio setup

Customer completes:

- identity
- cover image
- contact methods
- location/social links

### Step 3 — Portfolio setup

Customer uploads work into gallery albums.

### Step 4 — Sales setup

Customer adds packages and pricing.

### Step 5 — Launch setup

Customer configures:

- SEO title
- SEO description
- share image
- QR/link preview

### Step 6 — Publish

Customer can publish only after key readiness requirements are met.

### Step 7 — Activate subscription

Billing remains connected through:

- subscription card on the home workspace
- operating alerts
- billing action links

## UX impact

Before:

- customer needed to understand multiple pages
- publishing felt like a separate SEO/link page
- readiness was basic

After:

- the home dashboard acts as the main operating center
- customer sees a clear route from setup to launch
- Launch Workspace explains exactly what blocks publishing
- publishing becomes an explicit action
- the dashboard explains why each step matters

## Files changed

- `src/modules/dashboard/dashboard-view-model.ts`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/dashboard/home-client.tsx`
- `src/app/(dashboard)/dashboard/publish/actions.ts`
- `src/app/(dashboard)/dashboard/publish/page.tsx`
- `src/app/(dashboard)/dashboard/publish/publish-client.tsx`
- `docs/customer-dashboard-operating-workspace-report.md`

## Validation notes

Static review was performed against the current schema and existing dashboard conventions.

The local container cannot access GitHub or install/run the project, so runtime checks must be run in the repository environment:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Railway deployment note

No Railway connector or deployment credentials are available in this ChatGPT environment. The branch is ready for repository validation and deployment through the existing Railway integration/manual deploy flow.
