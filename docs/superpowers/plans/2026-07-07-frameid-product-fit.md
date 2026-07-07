# FrameID Product Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the visible product match FrameID as a multi-tenant SaaS platform for photographers with template previews, automatic provisioning, photographer dashboards, and a separate super admin console.

**Architecture:** Keep the existing Next.js app and domain modules. Strengthen the marketing route, template showroom, photographer dashboard overview, and admin navigation/page coverage without changing provisioning or billing data contracts.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma, Vitest, Testing Library.

## Global Constraints

- Arabic RTL interface copy remains the primary product language.
- Photographer dashboards are separate from the super admin console.
- Live template preview must remain available through `/templates/[code]/preview`.
- Signup must preserve selected template through `?template=`.
- No payment is required before the trial; activation remains manual through proof review.

---

### Task 1: Product Narrative on Marketing Home

**Files:**
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/modules/marketing/platform-content.ts`
- Test: `tests/marketing-homepage.test.tsx`

**Interfaces:**
- Consumes: `platformStats` from `src/modules/marketing/platform-content.ts`
- Produces: visible Arabic sections for the full customer journey, photographer dashboard scope, and super admin scope.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("heading", { name: "من قالب حي إلى موقع مستقل ولوحة تحكم." })).toBeInTheDocument();
expect(screen.getByText("الحساب، الموقع، الرابط الخاص، لوحة التحكم، والاشتراك التجريبي تُنشأ معًا بعد التسجيل.")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "لوحة المصور ليست لوحة الأدمن." })).toBeInTheDocument();
expect(screen.getByText("الأدمن الرئيسي يدير المنصة والعملاء والمدفوعات والقوالب، ولا يختلط مع لوحات المصورين.")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/marketing-homepage.test.tsx`
Expected: FAIL because the new headings and platform separation copy are not rendered yet.

- [ ] **Step 3: Write minimal implementation**

Add journey, photographer-dashboard, and super-admin sections to the homepage using existing `MarketingNav`, `Badge`, `Card`, and `Link` components.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/marketing-homepage.test.tsx`
Expected: PASS.

### Task 2: Template Showroom Promise

**Files:**
- Modify: `src/app/(marketing)/templates/page.tsx`
- Test: `tests/marketing-templates.test.tsx`

**Interfaces:**
- Consumes: `getPublishedTemplates()`
- Produces: a showroom explaining live preview and use-template provisioning.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("heading", { name: "اختر قالبًا كأنه موقع عميل حقيقي." })).toBeInTheDocument();
expect(screen.getByText("المعاينة الحية تفتح نفس القالب الذي سيحصل عليه المصور، ثم يحمل زر استخدام القالب اختياره إلى التسجيل.")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/marketing-templates.test.tsx`
Expected: FAIL because the new showroom promise is not rendered.

- [ ] **Step 3: Write minimal implementation**

Update the templates page hero and add a compact process row: Preview, Use, Provision.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/marketing-templates.test.tsx`
Expected: PASS.

### Task 3: Photographer Dashboard Command Center

**Files:**
- Modify: `src/modules/dashboard/dashboard-view-model.ts`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: `tests/dashboard-view-model.test.ts`

**Interfaces:**
- Consumes: `CurrentSession`
- Produces: `controlAreas: { label: string; href: string; description: string }[]`

- [ ] **Step 1: Write the failing test**

```ts
expect(viewModel.controlAreas.map((area) => area.label)).toEqual([
  "بيانات الموقع",
  "المعرض",
  "الباقات والخدمات",
  "SEO والتواصل",
  "القالب",
  "التفعيل"
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/dashboard-view-model.test.ts`
Expected: FAIL because `controlAreas` does not exist.

- [ ] **Step 3: Write minimal implementation**

Add `controlAreas` to the dashboard view model and render them as quick links on the dashboard page.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/dashboard-view-model.test.ts`
Expected: PASS.

### Task 4: Admin Console Coverage

**Files:**
- Modify: `src/components/layout/admin-sidebar.tsx`
- Create: missing `src/app/(admin)/admin/*/page.tsx` placeholders for admin centers referenced by navigation.
- Test: `tests/layout-shells.test.tsx`

**Interfaces:**
- Consumes: existing admin shell navigation groups.
- Produces: navigation that names customers, sites, templates, content, subscriptions, payments, backups, notifications, security, analytics, and platform settings.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("link", { name: "الاشتراكات" })).toHaveAttribute("href", "/admin/subscriptions");
expect(screen.getByRole("link", { name: "التحليلات" })).toHaveAttribute("href", "/admin/analytics");
expect(screen.getByRole("link", { name: "إعدادات المنصة" })).toHaveAttribute("href", "/admin/settings");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/layout-shells.test.tsx`
Expected: FAIL because subscriptions is not present in the admin shell.

- [ ] **Step 3: Write minimal implementation**

Update admin navigation and add placeholder pages where needed with `requireSuperAdminSession()` and `CenterPageShell`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/layout-shells.test.tsx`
Expected: PASS.
