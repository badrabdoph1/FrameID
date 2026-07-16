# Customer File Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تحويل ملف العميل إلى أربع مساحات مدمجة ومفهومة مع الحفاظ على كل الوظائف والروابط القديمة.

**Architecture:** تبقى صفحة Server Component وإجراءات الخادم ومصادر البيانات كما هي. يعاد تركيب Client Component حول عقد تنقل من أربع مساحات، وتجمع المكونات الحالية داخل هذه المساحات بدل إعادة كتابة منطقها، مع طبقة توافق تحول قيم `tab` القديمة إلى الوجهات الجديدة.

**Tech Stack:** Next.js 15، React 19، TypeScript 5.9، Tailwind CSS 4، Vitest، Testing Library.

## Global Constraints

- لا تغيير لقاعدة البيانات أو Prisma أو صلاحيات الأدمن.
- لا حذف لأي زر أو وظيفة أو إجراء خادم قائم.
- تبقى `/admin/customers` على هيكلها الحالي.
- أربع مساحات فقط داخل ملف العميل: `overview` و`site` و`billing` و`support`.
- تستمر كل قيم `tab` القديمة في العمل عبر التحويل الداخلي.
- الهاتف يبدأ من 390px، ولا يوجد تمرير أفقي إجباري.
- كل تغيير سلوكي يبدأ باختبار فاشل ثم يمر بعد التنفيذ.
- يحدث `docs/progress/2026-07-16-customer-file-reorganization.md` بعد كل مهمة.

---

## File map

- `src/app/(admin)/admin/customers/[id]/components/customer-tabs.tsx`: عقد المساحات الأربع وتحويل الروابط القديمة.
- `src/app/(admin)/admin/customers/[id]/components/customer-quick-actions.tsx`: مركز الإجراءات الموحد.
- `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`: تركيب المساحات وحالات الإجراءات.
- `src/app/(admin)/admin/customers/[id]/components/customer-*.tsx`: المكونات الحالية التي يعاد تجميعها دون تغيير منطقها.
- `tests/admin-customer-workspace.test.tsx`: عقد التنقل والتوافق.
- `tests/admin-customer-detail-layout.test.tsx`: عقد الإجراءات والتركيب والإشعارات.
- `docs/progress/2026-07-16-customer-file-reorganization.md`: نقطة الاستكمال.

### Task 1: عقد المساحات الأربع والتوافق مع الروابط القديمة

**Files:**
- Modify: `tests/admin-customer-workspace.test.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-tabs.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/page.tsx`

**Interfaces:**
- Produces: `CustomerWorkspaceId = "overview" | "site" | "billing" | "support"`.
- Produces: `normalizeCustomerTab(value): CustomerWorkspaceId`.
- Produces: `CustomerTabBar` بأربع روابط أساسية.

- [x] **Step 1: اكتب اختبار الأربع مساحات والتحويلات**

```tsx
expect(within(screen.getByRole("navigation", { name: "أقسام ملف العميل" })).getAllByRole("link")).toHaveLength(4);
expect(screen.getByRole("link", { name: "الاشتراك والمدفوعات" })).toHaveAttribute(
  "href",
  "/admin/customers/customer-1?tab=billing",
);
expect(normalizeCustomerTab("website")).toBe("site");
expect(normalizeCustomerTab("media")).toBe("site");
expect(normalizeCustomerTab("subscription")).toBe("billing");
expect(normalizeCustomerTab("payments")).toBe("billing");
expect(normalizeCustomerTab("sessions")).toBe("support");
expect(normalizeCustomerTab("notifications")).toBe("support");
expect(normalizeCustomerTab("notes")).toBe("support");
```

- [x] **Step 2: شغّل الاختبار وتحقق من الفشل الصحيح**

Run: `npm test -- tests/admin-customer-workspace.test.tsx`
Expected: FAIL لأن المكون الحالي يعرض ثمانية تبويبات ولا يعرف `site` أو`billing` أو`support`.

- [x] **Step 3: نفّذ عقد التحويل**

```ts
export type CustomerWorkspaceId = "overview" | "site" | "billing" | "support";

const workspaceByTab: Record<string, CustomerWorkspaceId> = {
  overview: "overview",
  site: "site",
  website: "site",
  media: "site",
  billing: "billing",
  subscription: "billing",
  payments: "billing",
  support: "support",
  sessions: "support",
  notifications: "support",
  notes: "support",
};

export function normalizeCustomerTab(value: string | null | undefined): CustomerWorkspaceId {
  return value ? workspaceByTab[value] ?? "overview" : "overview";
}
```

- [x] **Step 4: اجعل التنقل أربع وجهات مدمجة**

استخدم روابط `overview/site/billing/support` مع `aria-current="page"`، شبكة `grid-cols-2 lg:grid-cols-4`، ووصفًا قصيرًا لكل وجهة وأهداف لمس لا تقل عن 44px دون تمرير أفقي.

- [x] **Step 5: شغّل الاختبار المستهدف**

Run: `npm test -- tests/admin-customer-workspace.test.tsx tests/admin-navigation-contract.test.tsx`
Expected: PASS.

- [x] **Step 6: حدّث التقدم واحفظ المهمة محليًا**

تم تحديث سجل التقدم، وتُركت التغييرات دون commit للمراجعة.

### Task 2: مركز الإجراءات الموحد دون فقد وظيفة

**Files:**
- Create: `tests/admin-customer-detail-layout.test.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-quick-actions.tsx`

**Interfaces:**
- Consumes: `CustomerDetail`, `siteUrl`, `onAction`, `onCopy`, `onNotify`, `onEmail`.
- Adds: `onSecurity(): void` للانتقال إلى مساحة الدعم والحماية.
- Produces: منطقة واحدة باسم «مركز إجراءات العميل» وأربع مجموعات صفية.

- [x] **Step 1: اكتب اختبار جرد الإجراءات**

```tsx
const center = screen.getByRole("region", { name: "مركز إجراءات العميل" });
expect(within(center).getByText("الحساب والاشتراك")).toBeInTheDocument();
expect(within(center).getByText("الموقع")).toBeInTheDocument();
expect(within(center).getByText("التواصل")).toBeInTheDocument();
expect(within(center).getByText("إجراءات حساسة")).toBeInTheDocument();
expect(within(center).getByRole("button", { name: "إعادة كلمة المرور" })).toBeInTheDocument();
expect(within(center).getByRole("button", { name: "أرشفة" })).toBeInTheDocument();
expect(within(center).getByRole("button", { name: "حذف" })).toBeInTheDocument();
expect(within(center).getByRole("link", { name: "فتح الموقع" })).toHaveAttribute("href", siteUrl);
```

- [x] **Step 2: شغّل الاختبار وتحقق من فشله**

Run: `npm test -- tests/admin-customer-detail-layout.test.tsx`
Expected: FAIL لأن شريط الإجراءات الحالي غير مجمع ولا يفصل فتح الموقع عن النسخ.

- [x] **Step 3: أعد تركيب الإجراءات في مركز واحد**

استخدم `<section aria-label="مركز إجراءات العميل">` وصفوفًا مدمجة. يبقى التمديد والتفعيل والإيقاف والنشر والتواصل والأرشفة والحذف. يصبح «إعادة كلمة المرور» زر انتقال إلى `onSecurity`، وتبقى عملية التغيير الفعلية داخل `CustomerPasswordCard`.

- [x] **Step 4: افصل فتح الموقع عن نسخ الرابط**

```tsx
<a href={siteUrl} target="_blank" rel="noopener noreferrer">فتح الموقع</a>
<button type="button" onClick={() => onCopy(siteUrl)}>نسخ الرابط</button>
```

- [x] **Step 5: شغّل اختبارات الإجراء**

Run: `npm test -- tests/admin-customer-detail-layout.test.tsx`
Expected: PASS.

- [x] **Step 6: حدّث التقدم واحفظ المهمة محليًا**

تم تحديث سجل التقدم، وتُركت التغييرات دون commit للمراجعة.

### Task 3: تركيب المكونات الحالية داخل أربع مساحات

**Files:**
- Modify: `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-info-panel.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-overview-tab.tsx`
- Modify: `tests/admin-customer-detail-layout.test.tsx`

**Interfaces:**
- Consumes: `CustomerWorkspaceId`.
- Produces: `overview` يضم الملخص والإجراءات، `site` يضم الموقع والوسائط، `billing` يضم الاشتراك والمدفوعات، `support` يضم كلمة المرور والجلسات والإشعارات والملاحظات.

- [x] **Step 1: اكتب اختبارات تركيب كل مساحة**

```tsx
const overview = render(<CustomerDetailClient initialTab="overview" {...detailProps} />);
expect(screen.getByRole("region", { name: "مركز إجراءات العميل" })).toBeInTheDocument();
overview.unmount();

const site = render(<CustomerDetailClient initialTab="site" {...detailProps} />);
expect(screen.getByRole("heading", { name: "إدارة الموقع والملفات" })).toBeInTheDocument();
site.unmount();

const billing = render(<CustomerDetailClient initialTab="billing" {...detailProps} />);
expect(screen.getByRole("heading", { name: "إدارة الاشتراك والمدفوعات" })).toBeInTheDocument();
billing.unmount();

render(<CustomerDetailClient initialTab="support" {...detailProps} />);
expect(screen.getByRole("heading", { name: "الدخول والحماية" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "التواصل والمتابعة" })).toBeInTheDocument();
```

يُعرّف `detailProps` في أعلى ملف الاختبار بكائن `customer` كامل من نوع `CustomerDetail`، وقوائم `media` و`notifications` و`adminNotes` و`allSubscriptions`، دون استخدام كائن جزئي.

- [x] **Step 2: شغّل الاختبار وتحقق من الفشل**

Run: `npm test -- tests/admin-customer-detail-layout.test.tsx`
Expected: FAIL لأن المكونات الحالية تظهر في تبويبات منفصلة وكلمة المرور خارجها.

- [x] **Step 3: اجمع المكونات الموجودة دون تغيير منطقها**

```tsx
{activeWorkspace === "site" ? (
  <div className="space-y-4">
    <WorkspaceSection title="إدارة الموقع والملفات" description="النشر والنطاقات والمحتوى في مكان واحد.">
      <CustomerWebsiteTab customer={customer} onAction={showConfirm} />
    </WorkspaceSection>
    <WorkspaceSection title="الوسائط والملفات" description="ابحث في ملفات العميل وافتحها أو نزّلها.">
      <CustomerMediaTab media={media} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </WorkspaceSection>
  </div>
) : null}

{activeWorkspace === "billing" ? (
  <div className="space-y-4">
    <WorkspaceSection title="إدارة الاشتراك والمدفوعات" description="الحالة والمدة والسجل المالي معًا.">
      <CustomerSubscriptionTab customer={customer} allSubscriptions={allSubscriptions} onAction={showConfirm} />
    </WorkspaceSection>
    <WorkspaceSection title="سجل المدفوعات" description="الطلبات والمبالغ والإثباتات والمراجعات.">
      <CustomerPaymentsTab customer={customer} />
    </WorkspaceSection>
  </div>
) : null}

{activeWorkspace === "support" ? (
  <div className="space-y-4">
    <WorkspaceSection title="الدخول والحماية" description="كلمة المرور والجلسات النشطة.">
      <CustomerPasswordCard ownerEmail={customer.owner.email} ownerId={customer.owner.id} onReset={handlePasswordReset} onCopy={copyToClipboard} />
      <CustomerSessionsTab customer={customer} onAction={showConfirm} />
    </WorkspaceSection>
    <WorkspaceSection title="التواصل والمتابعة" description="الإشعارات والملاحظات الإدارية.">
      <CustomerNotificationsTab notifications={notifications} onSend={handleNotificationSend} />
      <CustomerNotesTab notes={adminNotes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
    </WorkspaceSection>
  </div>
) : null}
```

يُعرّف `WorkspaceSection` خارج `CustomerDetailClient`، وتُعرّف معالجات كلمة المرور والإشعار والملاحظات بأسماء مستقرة داخل المكون. انقل `CustomerPasswordCard` إلى بداية `support` واحذف ظهوره العام فوق التنقل.

- [x] **Step 4: صغّر المؤشرات ولوحات المعلومات**

استخدم حاويات `rounded-xl px-3 py-2.5` وقيمًا `text-base`، ولا تستخدم حدًا أدنى كبيرًا للبطاقات. تبقى أهداف الأزرار 44px.

- [x] **Step 5: شغّل اختبارات العميل كلها**

Run: `npm test -- tests/admin-customer-workspace.test.tsx tests/admin-customer-detail-layout.test.tsx tests/admin-customers-table.test.tsx`
Expected: PASS.

- [x] **Step 6: حدّث التقدم واحفظ المهمة محليًا**

تم تحديث سجل التقدم، وتُركت التغييرات دون commit للمراجعة.

### Task 4: إصلاح عقد الإشعارات ورسائل الفشل

**Files:**
- Modify: `tests/admin-customer-detail-layout.test.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-notifications-tab.tsx`

**Interfaces:**
- `sendNotificationAction` يستقبل `notificationType`, `title`, `body`, `tenantId`.

- [x] **Step 1: اكتب اختبار FormData للإشعار**

```tsx
expect(formData.get("notificationType")).toBe("warning");
expect(formData.get("title")).toBe("تنبيه مهم");
expect(formData.get("body")).toBe("راجع اشتراكك");
```

- [x] **Step 2: شغّل الاختبار وتحقق من الفشل**

Run: `npm test -- tests/admin-customer-detail-layout.test.tsx`
Expected: FAIL لأن العميل الحالي يرسل النوع تحت المفتاح `type`.

- [x] **Step 3: أصلح الاسم عند مصدر البيانات وأضف التسميات**

```ts
fd.set("notificationType", type);
```

أضف `aria-label="نوع الإشعار"` للقائمة، ورسائل عملية محددة في `handleAction`، و`catch` لفشل الحافظة.

- [x] **Step 4: شغّل الاختبارات المستهدفة وtypecheck**

Run: `npm test -- tests/admin-customer-detail-layout.test.tsx tests/admin-customer-workspace.test.tsx`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

- [x] **Step 5: حدّث التقدم واحفظ الإصلاح محليًا**

تم تحديث سجل التقدم، وتُركت التغييرات دون commit للمراجعة.

### Task 5: التحقق البصري والنهائي

**Files:**
- Modify: `docs/progress/2026-07-16-customer-file-reorganization.md`

- [x] **Step 1: اختبر مسارات الأدمن المرتبطة**

Run: `npm test -- tests/admin-customer-workspace.test.tsx tests/admin-customer-detail-layout.test.tsx tests/admin-customers-table.test.tsx tests/admin-navigation-contract.test.tsx tests/admin-communications.test.tsx tests/admin-subscriptions-workspace.test.tsx`
Expected: PASS.

- [x] **Step 2: شغّل فحوص الجودة الكاملة**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run lint`
Expected: PASS دون أخطاء جديدة.

Run: `npm test`
Expected: PASS دون فشل جديد.

Run: `npm run build`
Expected: PASS.

- [x] **Step 3: افحص الواجهة بصريًا**

افتح ملف عميل موجودًا على 390×844 و1440×900، وافحص الأربع مساحات والحوارات والنسخ وRTL وعدم وجود overflow.

- [x] **Step 4: راجع المتطلبات وسجل النتيجة**

حدّث ملف التقدم بالملفات والاختبارات وأي مشكلة معروفة، ثم راجع diff كاملًا قبل التسليم.

- [x] **Step 5: احفظ تقرير التحقق محليًا**

تم تحديث تقرير التحقق، وتُركت التغييرات دون commit للمراجعة.

### Task 6: إغلاق ملاحظات المراجعة المستقلة

**Files:**
- Modify: `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-tabs.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-media-tab.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-password-card.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/components/customer-payments-tab.tsx`
- Modify: `tests/admin-customer-workspace.test.tsx`
- Modify: `tests/admin-customer-detail-layout.test.tsx`

- [x] **Step 1: منع تكرار التفعيل للعميل الموقوف**

أضيف اختبار يثبت ظهور «تشغيل» وحده للحالة `SUSPENDED`، ثم ضُبط شرط «تفعيل» حتى لا يظهر الزران معًا.

- [x] **Step 2: مزامنة المساحة مع الرجوع والتقدم**

أضيف اختبار إعادة render بقيمة `initialTab` جديدة، ثم رُبطت الحالة المحلية بها عبر `useEffect` حتى يغيّر الرجوع والتقدم المحتوى الظاهر فعلًا.

- [x] **Step 3: تصحيح دلالة التنقل وتوضيح الخيارات**

أزيل نمط ARIA الخاص بالتبويبات لأن العناصر روابط صفحات، واستُخدمت روابط عادية مع `aria-current` ووصف مرئي لكل مساحة و`aria-label` للمحتوى الرئيسي لكل مساحة.

- [x] **Step 4: إغلاق فجوات الهاتف واللمس**

أصبح تنزيل الوسائط ظاهرًا دائمًا بحجم 44×44، ورفعت أزرار الموقع وكلمة المرور إلى 44px، وأصبح جدول المدفوعات داخل منطقة تمرير أفقية مسماة بدل قصه.

- [x] **Step 5: تحقق نهائي بعد المراجعة**

الاختبارات المستهدفة 24/24، وtypecheck وlint والبناء ناجحة. الفحص الفعلي على 1440×900 و390×844 بلا overflow، واختُبر الرابط القديم `?tab=notes` والتنقل والرجوع وتأكيد كلمة المرور.
