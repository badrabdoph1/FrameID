# Admin Main Professional Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إعادة بناء تجربة كل صفحات الأدمن كمساحة عربية بسيطة ومتكاملة، مع عقد موحد للمسارات والمكونات، دون حذف أي وظيفة حالية.

**Architecture:** يبقى كل من Next.js App Router وPrisma وإجراءات الخادم الحالية. ينشأ سجل مركزي للمسارات تشتق منه واجهات التنقل والعناوين، ويصبح `AdminPageShell` الغلاف الوحيد المباشر للصفحات، بينما تعرض المراكز ملخصات وروابط ولا تكرر محررات الصفحات المتخصصة.

**Tech Stack:** Next.js 15، React 19، TypeScript 5.9، Prisma 6، Tailwind CSS 4، Vitest، Testing Library.

## Global Constraints

- العربية هي لغة الواجهة اليومية، مع إبقاء المصطلح التقني فقط عند الحاجة وشرحه.
- الهاتف يبدأ من 390px، والحد الأدنى لأهداف اللمس 44px.
- لا تحذف أي وظيفة أو مسار أو صلاحية أو سجل تدقيق موجود.
- قائمة واحدة ومحرر واحد لكل كيان، ولا تكرر أدوات الإدارة داخل صفحات الملخص.
- كل صفحة تدعم التحميل والفراغ والخطأ والنجاح بحسب طبيعتها.
- المرشحات المهمة تحفظ في URL، ولا تستخدم روابط `#` أو أرقام واجهة ثابتة.
- كل مهمة تنتهي باختبار وcommit مستقل وتحديث `docs/progress/2026-07-14-admin-main-overhaul.md`.
- خط الأساس: 242 اختبارًا ناجحًا و30 فشلًا سابقًا من 272؛ لا يضاف أي فشل جديد وتصل اختبارات الأدمن المستهدفة إلى النجاح الكامل.

---

## File map

- `src/modules/admin/navigation.ts`: سجل مراكز ومسارات الأدمن والمساعدات المشتقة.
- `src/components/layout/admin-shell.tsx`: تركيب الغلاف العام فقط.
- `src/components/layout/admin-page-shell.tsx`: عقد رأس ومحتوى كل صفحة.
- `src/components/layout/admin-sidebar.tsx`: تنقل سطح المكتب المشتق من السجل.
- `src/components/layout/admin-mobile-nav.tsx`: تنقل الهاتف والقائمة الكاملة.
- `src/components/layout/admin-topbar.tsx`: Breadcrumbs والبحث والإجراءات العامة.
- `src/components/admin/admin-workspace-primitives.tsx`: كروت الملخص والقوائم التشغيلية المشتركة.
- `src/components/admin/shared/data-table.tsx`: عرض البيانات المتجاوب وحالاته.
- `src/app/(admin)/admin/**`: صفحات المراكز والصفحات المتخصصة.
- `tests/admin-*.test.tsx`: عقود السلوك والعرض لكل مرحلة.
- `docs/progress/2026-07-14-admin-main-overhaul.md`: نقطة الاستكمال الوحيدة.

### Task 1: عقد المسارات وعدم التكرار

**Files:**
- Modify: `src/modules/admin/navigation.ts`
- Create: `tests/admin-navigation-contract.test.tsx`
- Update: `docs/progress/2026-07-14-admin-main-overhaul.md`

**Interfaces:**
- Produces: `AdminRouteDefinition`, `adminRoutes`, `getAdminRoute(pathname)`, `getAdminBreadcrumbs(pathname)`, `adminSections`, `allAdminLinks`.

- [x] **Step 1: اكتب اختبار العقد**

```tsx
import { describe, expect, it } from "vitest";
import { adminRoutes, adminSections, getAdminBreadcrumbs, getAdminRoute } from "@/modules/admin/navigation";

describe("admin navigation contract", () => {
  it("keeps every visible destination unique and Arabic", () => {
    const hrefs = adminSections.flatMap((section) => section.links.map((link) => link.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(adminRoutes.every((route) => route.labelAr.trim().length > 0)).toBe(true);
  });

  it("resolves nested routes and breadcrumbs from one registry", () => {
    expect(getAdminRoute("/admin/customers/customer-1")?.id).toBe("customer-details");
    expect(getAdminBreadcrumbs("/admin/settings/payment").map((item) => item.label)).toEqual([
      "لوحة الإدارة",
      "الإعدادات",
      "وسائل الدفع",
    ]);
  });
});
```

- [x] **Step 2: شغّل الاختبار وتحقق من فشله**

Run: `npm test -- tests/admin-navigation-contract.test.tsx`
Expected: FAIL لأن السجل والدوال الجديدة غير موجودة.

- [x] **Step 3: وسّع عقد التنقل**

```ts
export type AdminRouteDefinition = {
  id: string;
  href: string;
  labelAr: string;
  descriptionAr: string;
  sectionId: AdminSectionId;
  visibility: "daily" | "advanced" | "contextual";
  match: "exact" | "prefix";
  keywords: readonly string[];
  icon: LucideIcon;
};

export function getAdminRoute(pathname: string): AdminRouteDefinition | undefined;
export function getAdminBreadcrumbs(pathname: string): Array<{ label: string; href: string }>;
```

- [x] **Step 4: شغّل عقد التنقل واختبارات الروابط**

Run: `npm test -- tests/admin-navigation-contract.test.tsx tests/admin-center-links.test.tsx tests/admin-issue-navigation.test.tsx`
Expected: PASS.

- [x] **Step 5: حدّث التقدم واعمل commit**

```bash
git add src/modules/admin/navigation.ts tests/admin-navigation-contract.test.tsx docs/progress/2026-07-14-admin-main-overhaul.md
git commit -m "refactor: unify admin route contract"
```

### Task 2: الغلاف والتنقل والحالات المشتركة

**Files:**
- Modify: `src/components/layout/admin-shell.tsx`
- Modify: `src/components/layout/admin-page-shell.tsx`
- Modify: `src/components/layout/admin-sidebar.tsx`
- Modify: `src/components/layout/admin-mobile-nav.tsx`
- Modify: `src/components/layout/admin-topbar.tsx`
- Modify: `src/components/layout/admin-empty-state.tsx`
- Modify: `src/components/layout/admin-error-state.tsx`
- Modify: `src/components/layout/admin-loading-skeleton.tsx`
- Modify: `src/app/admin.css`
- Modify: `tests/layout-shells.test.tsx`
- Create: `tests/admin-shell-accessibility.test.tsx`

**Interfaces:**
- Consumes: `getAdminRoute`, `getAdminBreadcrumbs`, `adminSections`.
- Produces: غلاف واحد متجاوب وتنقل مشتق من السجل وحالات تحمل عناوين وإجراءات موحدة.

- [x] **Step 1: اختبر الهاتف وBreadcrumbs وإتاحة الوصول**

```tsx
expect(screen.getByRole("button", { name: "فتح كل أقسام الأدمن" })).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "مسار الصفحة" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "انتقل إلى المحتوى" })).toHaveAttribute("href", "#admin-main-content");
```

- [x] **Step 2: شغّل الاختبارات وتحقق من الفشل المتوقع**

Run: `npm test -- tests/layout-shells.test.tsx tests/admin-shell-accessibility.test.tsx`
Expected: FAIL في التسميات والعقد القديم.

- [x] **Step 3: اشتق كل التسميات من السجل وأزل الأرقام الثابتة**

اجعل شارة الإشعارات تظهر فقط عند تمرير قيمة حقيقية، واجعل Breadcrumbs تستخدم `getAdminBreadcrumbs`. أضف `id="admin-main-content"` وSkip link، ووحّد aria labels العربية.

- [x] **Step 4: أضف reduced motion وأحجام اللمس**

```css
@media (prefers-reduced-motion: reduce) {
  .admin-dark-shell *, .admin-dark-shell *::before, .admin-dark-shell *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [x] **Step 5: شغّل اختبارات الغلاف واعمل commit**

Run: `npm test -- tests/layout-shells.test.tsx tests/admin-shell-accessibility.test.tsx tests/admin-navigation-contract.test.tsx`
Expected: PASS.

Commit: `refactor: simplify admin shell and navigation`.

### Task 3: لوحة القيادة الرئيسية

**Files:**
- Modify: `src/modules/admin/admin-overview-view-model.ts`
- Modify: `src/modules/admin/prisma-admin-overview-repository.ts`
- Modify: `src/app/(admin)/admin/page.tsx`
- Create: `tests/admin-command-center.test.tsx`
- Modify: `tests/admin-overview-view-model.test.ts`
- Modify: `tests/prisma-admin-overview-repository.test.ts`

**Interfaces:**
- Produces: `AdminCommandCenterViewModel` بأجزاء `priority`, `metrics`, `workQueue`, `recentActivity`, `platformStatus`.

- [x] **Step 1: اختبر ترتيب القرار وحالة الهدوء**

```tsx
expect(screen.getByRole("heading", { name: "ما يحتاج تدخلك الآن" })).toBeInTheDocument();
expect(screen.getByText("لا توجد مهام عاجلة الآن")).toBeInTheDocument();
expect(screen.queryByText("3")).not.toBeInTheDocument();
```

- [x] **Step 2: شغّل الاختبارات وتحقق من الفشل**

Run: `npm test -- tests/admin-command-center.test.tsx tests/admin-overview-view-model.test.ts tests/prisma-admin-overview-repository.test.ts`
Expected: FAIL في بنية ViewModel الجديدة.

- [x] **Step 3: نفذ ViewModel بلا بيانات وهمية**

أعد استخدام الاستعلامات الحالية، وحوّلها إلى أجزاء مستقلة ذات قيم وروابط عميقة. لا تجعل فشل مؤشر غير حرج يمنع بقية الصفحة.

- [x] **Step 4: أعد ترتيب الصفحة من الأولوية إلى الحالة**

استخدم `AdminPageShell` وprimitives المشتركة فقط. احذف أي بطاقة تكرر قائمة موجودة في صفحة متخصصة.

- [x] **Step 5: شغّل الاختبارات واعمل commit**

Commit: `feat: rebuild admin command center`.

### Task 4: العملاء وتفاصيل العميل

**Files:**
- Modify: `src/app/(admin)/admin/customers/page.tsx`
- Modify: `src/app/(admin)/admin/customers/customers-table.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/page.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/*.tsx`
- Modify: `tests/admin-customers-table.test.tsx`
- Create: `tests/admin-customer-workspace.test.tsx`

**Interfaces:**
- Produces: قائمة قابلة للترشيح وCustomer 360 بتبويبات ثابتة وروابط عميقة.

- [x] اختبر البحث والفراغ وعرض الهاتف وحفظ التبويب في URL.
- [x] شغّل `npm test -- tests/admin-customers-table.test.tsx tests/admin-customer-workspace.test.tsx` وتحقق من الفشل.
- [x] وحّد ملخص العميل والإجراءات السريعة، وأزل البيانات المتكررة بين الرأس والتبويبات.
- [x] اجعل أسماء التبويبات عربية واضحة: نظرة عامة، الموقع، الاشتراك، المدفوعات، الوسائط، الجلسات، الإشعارات، الملاحظات.
- [x] شغّل الاختبارات واعمل commit بعنوان `feat: simplify customer admin workspace`.

### Task 5: المواقع وتفاصيل الموقع

**Files:**
- Modify: `src/app/(admin)/admin/sites/page.tsx`
- Modify: `src/app/(admin)/admin/sites/sites-table.tsx`
- Modify: `src/app/(admin)/admin/sites/[id]/page.tsx`
- Create: `tests/admin-site-workspace.test.tsx`

- [x] اختبر الروابط العميقة وحالات عدم وجود دومين أو باقات أو إضافات.
- [x] عرّب Sections وPackages وExtras وFeature Flags وGallery Albums وحالات Active/Hidden.
- [x] اجمع بيانات الاتصال وSEO في لوحات مفهومة مع روابط للعميل والموقع العام.
- [x] شغّل `npm test -- tests/admin-site-workspace.test.tsx` واعمل commit بعنوان `feat: clarify admin site workspace`.

### Task 6: مركز المال والصفحات المالية

**Files:**
- Modify: `src/app/(admin)/admin/billing/page.tsx`
- Modify: `src/app/(admin)/admin/payments/**`
- Modify: `src/app/(admin)/admin/subscriptions/page.tsx`
- Modify: `src/app/(admin)/admin/plans/**`
- Split: `src/app/(admin)/admin/settings/payment/page.tsx`
- Create: `src/app/(admin)/admin/settings/payment/payment-account-form.tsx`
- Create: `src/app/(admin)/admin/settings/payment/payment-account-list.tsx`
- Modify: `tests/admin-billing-workspace.test.tsx`
- Modify: `tests/admin-plans-manager.test.tsx`
- Create: `tests/admin-billing-surfaces.test.tsx`

- [x] اختبر أن المركز يعرض الأولويات ولا يكرر النماذج.
- [x] اختبر قائمة ومحررًا واحدًا للباقات ووسائل الدفع.
- [x] نفذ روابط مرشحة من المؤشرات إلى الطلبات والتجارب والحالات المتأخرة.
- [x] قسم ملف إعدادات الدفع مع الإبقاء على إجراءات الخادم والتأكيد والحذف.
- [x] شغّل اختبارات المالية واعمل commit بعنوان `feat: streamline admin billing workflows`.

### Task 7: مركز المحتوى وأدواته

**Files:**
- Modify: `src/app/(admin)/admin/content/page.tsx`
- Modify: `src/app/(admin)/admin/content/[...slug]/page.tsx`
- Modify: `src/app/(admin)/admin/page-studio/**`
- Modify: `src/app/(admin)/admin/templates/**`
- Modify: `src/app/(admin)/admin/themes/page.tsx`
- Modify: `src/app/(admin)/admin/media/page.tsx`
- Modify: `src/app/(admin)/admin/revisions/page.tsx`
- Modify: `src/app/(admin)/admin/marketing/page.tsx`
- Modify: `src/app/(admin)/admin/social-preview/**`
- Modify: `tests/admin-content-workspace.test.tsx`
- Modify: `tests/admin-template-manager.test.tsx`
- Create: `tests/admin-content-surfaces.test.tsx`

- [x] اختبر أن كل نوع محتوى يملك محررًا واحدًا ووجهة واحدة.
- [x] استبدل صفحات “قريبًا” بفهرس حقيقي للقدرات المتاحة أو حالة مفيدة مرتبطة بالبديل العامل.
- [x] اربط القالب المحدد بصوره وإعداداته داخل سياق واحد، ولا تكرر مركز الصور خارجه.
- [x] أظهر حالة الوسائط والثيمات والمراجعات بلغة عربية وروابط قابلة للتنفيذ.
- [x] شغّل اختبارات المحتوى واعمل commit بعنوان `feat: organize admin content platform`.

### Task 8: التواصل

**Files:**
- Modify: `src/app/(admin)/admin/messages/**`
- Modify: `src/app/(admin)/admin/notifications/**`
- Modify: `src/app/(admin)/admin/support/**`
- Modify: `src/app/(admin)/admin/email/page.tsx`
- Create: `tests/admin-communications.test.tsx`

- [x] اختبر الحدود: الرسائل للتحكم في تجربة العميل، الإشعارات للسجل، الدعم للحالات، والبريد للتسليم.
- [x] عرّب التسميات المرئية وأزل السجلات أو المؤشرات المكررة بين الصفحات.
- [x] أضف حالات فراغ وإجراءات انتقال مرتبطة بالمهمة الحالية.
- [x] شغّل `npm test -- tests/admin-communications.test.tsx` واعمل commit بعنوان `feat: clarify admin communication centers`.

### Task 9: النظام والتشغيل والأدوات المتقدمة

**Files:**
- Modify: `src/app/(admin)/admin/system/page.tsx`
- Modify: `src/app/(admin)/admin/operations/page.tsx`
- Modify: `src/app/(admin)/admin/errors/**`
- Modify: `src/app/(admin)/admin/backups/**`
- Modify: `src/app/(admin)/admin/audit/page.tsx`
- Modify: `src/app/(admin)/admin/security/**`
- Modify: `src/app/(admin)/admin/jobs/page.tsx`
- Modify: `src/app/(admin)/admin/feature-flags/**`
- Modify: `src/app/(admin)/admin/admin-users/page.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`
- Modify: `src/app/(admin)/admin/health/page.tsx`
- Modify: `src/app/(admin)/admin/analytics/page.tsx`
- Modify: `src/app/(admin)/admin/rendering-diagnostics/page.tsx`
- Modify: `src/app/(admin)/admin/search/page.tsx`
- Create: `tests/admin-system-surfaces.test.tsx`
- Modify: `tests/backup-architecture-contract.test.ts`

- [ ] اختبر أن العمليات تعرض الطوابير التي تحتاج تدخلًا، والنظام يعرض الصحة والوجهات فقط.
- [ ] أصلح عقد “ذهاب طوارئ” وتسميات التنقل الحالية الفاشلة.
- [ ] حوّل صفحات “قريبًا” إلى حالة تشغيلية صادقة مبنية على البيانات المتاحة أو روابط بديلة محددة.
- [ ] عرّب العناوين والقيم المتكررة مع إبقاء المفاتيح التقنية القابلة للنسخ.
- [ ] شغّل اختبارات النظام والنسخ والأخطاء واعمل commit بعنوان `feat: complete admin system surfaces`.

### Task 10: الجداول والنماذج والاستجابة

**Files:**
- Modify: `src/components/admin/shared/data-table.tsx`
- Modify: `src/components/admin/pending-button.tsx`
- Modify: `src/components/layout/admin-confirm-dialog.tsx`
- Modify: `src/app/admin.css`
- Modify: `tests/admin-data-table.test.tsx`
- Create: `tests/admin-interaction-states.test.tsx`

- [ ] اختبر عرض البطاقات على الهاتف، تعطيل الإرسال المكرر، ورسالة التأكيد ذات الأثر.
- [ ] اجعل DataTable يدعم `mobileLabel` وempty state وURL filters دون تمرير أفقي غير مقصود.
- [ ] أضف حالات pressed/focus/disabled/loading واحترم reduced motion.
- [ ] شغّل الاختبارات واعمل commit بعنوان `refactor: standardize admin interaction states`.

### Task 11: التحقق البصري والنهائي

**Files:**
- Modify: `docs/progress/2026-07-14-admin-main-overhaul.md`
- Create: `docs/admin-main-professional-overhaul-report.md`

- [ ] شغّل اختبارات الأدمن فقط: `npm test -- tests/admin-*.test.tsx tests/layout-shells.test.tsx tests/backup-architecture-contract.test.ts`.
- [ ] شغّل `npm run typecheck` ثم `npm run lint` ثم `npm run build`.
- [ ] شغّل `npm test` وقارن النتيجة بخط الأساس 242/272؛ أصلح كل فشل جديد.
- [ ] افحص `/admin` وكل مركز أساسي على 390x844 و768x1024 و1440x900، ثم افحص صفحة متخصصة واحدة على الأقل من كل مركز.
- [ ] تحقق من keyboard focus وEscape وRTL وعدم وجود overflow أو روابط ميتة.
- [ ] اكتب التقرير النهائي بما نُفذ، الأخطاء التي أصلحت، والاقتراحات المؤجلة فقط عندما تتطلب قدرة منتج أو قاعدة بيانات جديدة.
- [ ] اعمل commit بعنوان `docs: finalize admin overhaul verification`.
