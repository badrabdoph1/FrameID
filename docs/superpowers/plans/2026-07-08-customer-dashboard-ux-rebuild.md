# Customer Dashboard UX Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the customer dashboard from scattered CRUD screens into a guided, mobile-first website builder for photographers.

**Architecture:** Keep the current Next.js App Router and Prisma schema. Build reusable dashboard UX components around existing server actions and improve high-friction flows without large database changes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Mobile-first: every primary workflow must work comfortably on phone screens.
- No image URL upload for photographer-owned images; use the shared image uploader.
- Keep the current database schema unless a requirement is impossible without a migration.
- Avoid unrelated admin changes and preserve existing dirty worktree changes.
- Use Arabic product copy that names user goals, not implementation details.

---

### Task 1: Shared Builder UX Components

**Files:**
- Create: `src/components/dashboard/builder-primitives.tsx`
- Modify: dashboard pages to use shared headers/cards/action strips.
- Test: `tests/dashboard-builder-primitives.test.tsx`

**Interfaces:**
- Produces: `BuilderPageHeader`, `BuilderSectionCard`, `BuilderActionBar`, `BuilderNotice`, `CompletionRing`.

- [ ] Write tests for page header and notice rendering.
- [ ] Implement reusable components using existing color tokens and accessible semantics.
- [ ] Replace duplicated page shell blocks where useful.

### Task 2: Guided Home Dashboard

**Files:**
- Modify: `src/app/(dashboard)/dashboard/home-client.tsx`
- Modify: `src/modules/dashboard/dashboard-view-model.ts`
- Test: `tests/dashboard-view-model.test.ts`

**Interfaces:**
- Consumes: `DashboardViewModel`.
- Produces: clearer next-step CTA, mobile-first progress, concise stats.

- [ ] Extend view model with next step helper text and readiness state.
- [ ] Update tests for checklist labels, percent, and next action.
- [ ] Rebuild home UI around progress, checklist, counters, preview, publish.

### Task 3: Site Info Builder

**Files:**
- Modify: `src/app/(dashboard)/dashboard/site-info/site-info-client.tsx`
- Modify: `src/app/(dashboard)/dashboard/site-info/actions.ts`
- Create: `src/components/dashboard/working-hours-editor.tsx`
- Test: `tests/site-info-actions.test.ts`

**Interfaces:**
- Produces: `WorkingHoursEditor`, `parseWorkingHoursFields`.

- [ ] Test working-hours form parsing without JSON.
- [ ] Replace JSON textarea with day/time rows.
- [ ] Keep autosave and image upload feedback understandable.

### Task 4: Image Pipeline and Uploader

**Files:**
- Modify: `src/components/dashboard/image-pipeline.ts`
- Modify: `src/components/dashboard/image-uploader.tsx`
- Modify: `src/modules/media/media-upload-service.ts`
- Test: `tests/media-upload-service.test.ts`

**Interfaces:**
- Produces: safer compression that avoids unnecessary recompression and raises server size allowance for already-processed WebP/JPEG/PNG.

- [ ] Test larger processed image allowance at service layer.
- [ ] Improve copy, progress details, and selected image metadata.
- [ ] Avoid rejecting photographer images too early on the client.

### Task 5: Gallery Manager Refresh

**Files:**
- Modify: `src/app/(dashboard)/dashboard/gallery/gallery-client.tsx`

**Interfaces:**
- Produces: clearer album-first and inside-album flows, consolidated notices, touch-friendly image actions.

- [ ] Replace repeated banners with one notice area.
- [ ] Make album cards and image actions usable without hover.
- [ ] Add clearer counts and “next action” guidance.

### Task 6: Packages and Extras Refresh

**Files:**
- Modify: `src/app/(dashboard)/dashboard/services/services-client.tsx`
- Create: `src/components/dashboard/new-package-form.tsx`

**Interfaces:**
- Produces: new package form with independent feature rows.

- [ ] Replace add-package textarea with `FeatureListEditor`.
- [ ] Make package/extras action state clearer.
- [ ] Keep duplicate/delete/hide/highlight/reorder workflows.

### Task 7: Templates and Publish Center

**Files:**
- Modify: `src/app/(dashboard)/dashboard/templates/templates-client.tsx`
- Modify: `src/app/(dashboard)/dashboard/publish/publish-client.tsx`
- Modify: `src/app/(dashboard)/dashboard/publish/actions.ts`

**Interfaces:**
- Produces: theme-store cards and publishing center with QR and richer previews.

- [ ] Add visual template preview frames.
- [ ] Add QR code based on site URL without new dependency.
- [ ] Replace OG image URL mindset with guided share-image handling where current schema allows.

### Task 8: Verification and Product Review

**Files:**
- Modify tests as needed.

- [ ] Run targeted tests for changed behavior.
- [ ] Run typecheck.
- [ ] Run lint or document any pre-existing blockers.
- [ ] Review mobile and desktop layout constraints from code and fix obvious friction.
