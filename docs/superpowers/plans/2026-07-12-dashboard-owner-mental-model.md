# خطة تنفيذ توضيح لوحة الإدارة والموقع المنشور

> **للعامل البرمجي:** المهارة الفرعية المطلوبة: استخدام `executing-plans` لتنفيذ الخطة بندًا بندًا. جميع الخطوات تستخدم مربعات متابعة.

**الهدف:** إعادة ترتيب بداية Dashboard حتى يميّز المصور فورًا بين لوحة الإدارة والموقع العام، ويستطيع معاينته ونسخ رابطه بأسماء أفعال واضحة.

**المعمارية:** نحافظ على `DashboardViewModel` والمسار العام ومنطق النشر، وننقل أفعال الموقع إلى `DashboardSiteActions` الحالي بدل تكرار النسخ. يفتح وضع المالك المسار العام نفسه بعلامة Query، وتقرر دالة نقية ظهور Banner بعد مقارنة slug الجلسة بالـslug المطلوب. تستخدم المعاينة iframe للموقع المنشور فقط وبتحميل كسول.

**التقنيات:** Next.js 15، React 19، TypeScript، Tailwind CSS 4، Vitest، Testing Library.

## القيود العامة

- لا تغيير في Business Logic أو Routes أو Database أو API.
- لا حذف للشريط الجانبي أو Progress أو نسبة الاكتمال أو خطوات التجهيز.
- لا تكرار للمكونات أو منطق النسخ.
- رابط المشاركة يظل نظيفًا بلا Query.
- Banner المالك لا يظهر للزوار أو داخل iframe المعاينة ولا يؤثر في Metadata.
- الحفاظ على Responsive والأداء والوصول.

---

### المهمة 1: تثبيت عقدة أفعال الموقع المشتركة

**الملفات:**
- تعديل: `tests/dashboard-site-actions.test.tsx`
- تعديل: `src/components/dashboard/dashboard-site-actions.tsx`

**الواجهات:**
- يستهلك: `siteUrl: string`.
- ينتج: نسخ الرابط العام، ورابط معاينة `${siteUrl}?ownerView=1` بتسمية واضحة.

- [ ] **الخطوة 1: كتابة اختبار فاشل للتسميات والرابطين**

```tsx
render(<DashboardSiteActions siteUrl="https://frameid.app/p/ali" />);
expect(screen.getByRole("link", { name: "شاهد الموقع كما يراه العميل" }))
  .toHaveAttribute("href", "https://frameid.app/p/ali?ownerView=1");
fireEvent.click(screen.getByRole("button", { name: "انسخ رابط الموقع لإرساله للعميل" }));
expect(writeText).toHaveBeenCalledWith("https://frameid.app/p/ali");
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من فشله بسبب النص أو الرابط القديم**

الأمر: `npm test -- --run tests/dashboard-site-actions.test.tsx`

المتوقع: فشل العثور على رابط «شاهد الموقع كما يراه العميل».

- [ ] **الخطوة 3: تعديل المكوّن الحالي بأقل كود**

```tsx
const ownerViewUrl = `${siteUrl}${siteUrl.includes("?") ? "&" : "?"}ownerView=1`;
// الزر ينسخ siteUrl، والرابط يفتح ownerViewUrl في نافذة جديدة.
```

- [ ] **الخطوة 4: إعادة تشغيل الاختبار والتأكد من نجاحه**

الأمر: `npm test -- --run tests/dashboard-site-actions.test.tsx`

المتوقع: نجاح جميع اختبارات الملف.

### المهمة 2: بناء قرار Banner المالك واختباره

**الملفات:**
- إنشاء: `src/modules/public-sites/owner-view.ts`
- إنشاء: `tests/public-site-owner-view.test.ts`

**الواجهات:**
- ينتج: `shouldShowOwnerView({ requested, requestedSlug, sessionSiteSlug }): boolean`.
- يستهلكه: صفحة الموقع العامة في المهمة التالية.

- [ ] **الخطوة 1: كتابة اختبار فاشل للمالك والزائر والموقع المختلف**

```ts
expect(shouldShowOwnerView({ requested: true, requestedSlug: "ali", sessionSiteSlug: "ali" })).toBe(true);
expect(shouldShowOwnerView({ requested: false, requestedSlug: "ali", sessionSiteSlug: "ali" })).toBe(false);
expect(shouldShowOwnerView({ requested: true, requestedSlug: "ali", sessionSiteSlug: null })).toBe(false);
expect(shouldShowOwnerView({ requested: true, requestedSlug: "ali", sessionSiteSlug: "mona" })).toBe(false);
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من فشله لأن الوحدة غير موجودة**

الأمر: `npm test -- --run tests/public-site-owner-view.test.ts`

المتوقع: فشل الاستيراد.

- [ ] **الخطوة 3: إضافة الدالة النقية**

```ts
export function shouldShowOwnerView(input: OwnerViewInput): boolean {
  return input.requested && input.sessionSiteSlug === input.requestedSlug;
}
```

- [ ] **الخطوة 4: إعادة الاختبار والتأكد من نجاحه**

الأمر: `npm test -- --run tests/public-site-owner-view.test.ts`

المتوقع: نجاح أربع حالات القرار.

### المهمة 3: إظهار Banner داخل الموقع العام للمالك فقط

**الملفات:**
- إنشاء: `src/components/public-sites/public-site-owner-banner.tsx`
- إنشاء: `tests/public-site-owner-banner.test.tsx`
- تعديل: `src/app/p/[slug]/page.tsx`

**الواجهات:**
- يستهلك: `searchParams.ownerView` وجلسة المستخدم الحالية ودالة المهمة 2.
- ينتج: Banner سياقي مع رابط `/dashboard` دون تغيير Metadata أو المسار.

- [ ] **الخطوة 1: كتابة اختبار فاشل للمكوّن**

```tsx
render(<PublicSiteOwnerBanner />);
expect(screen.getByText("أنت الآن تشاهد موقعك كما يراه العميل.")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "العودة إلى لوحة الإدارة" }))
  .toHaveAttribute("href", "/dashboard");
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من فشل الاستيراد**

الأمر: `npm test -- --run tests/public-site-owner-banner.test.tsx`

المتوقع: فشل لأن المكوّن غير موجود.

- [ ] **الخطوة 3: إنشاء Banner وإدخاله شرطيًا في الصفحة العامة**

```tsx
const requestedOwnerView = searchParams.ownerView === "1";
const ownerSession = requestedOwnerView ? await getCurrentRequestSession() : null;
const showOwnerView = shouldShowOwnerView({
  requested: requestedOwnerView,
  requestedSlug: slug,
  sessionSiteSlug: ownerSession?.site.slug ?? null,
});
return <>{showOwnerView ? <PublicSiteOwnerBanner /> : null}<ThemeSiteComponent site={site} /></>;
```

- [ ] **الخطوة 4: تشغيل اختبارات Banner والقرار**

الأمر: `npm test -- --run tests/public-site-owner-banner.test.tsx tests/public-site-owner-view.test.ts`

المتوقع: نجاح جميع الاختبارات.

### المهمة 4: إعادة ترتيب الصفحة الرئيسية للـDashboard

**الملفات:**
- إنشاء: `tests/dashboard-home-client.test.tsx`
- تعديل: `src/app/(dashboard)/dashboard/home-client.tsx`
- تعديل: `src/app/customer-dashboard.css`

**الواجهات:**
- يستهلك: `siteTitle` و`siteUrl` و`statusLabel` و`isPublished` من `DashboardViewModel`، و`DashboardSiteActions` من المهمة 1.
- ينتج: رسالة الإدارة، كارت «موقعك المنشور»، iframe للموقع المنشور فقط، ونفس الجاهزية والخطوات الحالية.

- [ ] **الخطوة 1: كتابة اختبار فاشل لتسلسل الخمس ثوانٍ وحالة المسودة**

```tsx
render(<DashboardHomeClient {...publishedViewModel} />);
expect(screen.getByText("أنت الآن داخل لوحة إدارة موقعك.")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "موقعك المنشور" })).toBeInTheDocument();
expect(screen.getByTitle("معاينة موقع Ali Ahmed")).toHaveAttribute("src", publishedViewModel.siteUrl);
expect(screen.getByText("الرابط الذي سترسله لعملائك")).toBeInTheDocument();

render(<DashboardHomeClient {...draftViewModel} />);
expect(screen.queryByTitle(/معاينة موقع/)).not.toBeInTheDocument();
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من فشله بسبب الواجهة القديمة**

الأمر: `npm test -- --run tests/dashboard-home-client.test.tsx`

المتوقع: فشل العثور على «موقعك المنشور».

- [ ] **الخطوة 3: تنفيذ الرسالة والكارت وإعادة استخدام أفعال الموقع**

```tsx
<DashboardContextNotice prominent={!introAcknowledged} onAcknowledge={acknowledgeIntro} />
<section aria-labelledby="published-site-title">
  {isPublished ? <iframe title={`معاينة موقع ${siteTitle}`} src={siteUrl} loading="lazy" tabIndex={-1} /> : <DraftPreview />}
  <DashboardSiteActions siteUrl={siteUrl} />
</section>
```

- [ ] **الخطوة 4: توسيع إعدادات Onboarding الحالية بدل إنشاء نظام جديد**

```ts
type OnboardingPreferences = {
  hidden?: boolean;
  expanded?: boolean;
  introAcknowledged?: boolean;
};
```

- [ ] **الخطوة 5: تشغيل اختبار الصفحة والأفعال**

الأمر: `npm test -- --run tests/dashboard-home-client.test.tsx tests/dashboard-site-actions.test.tsx`

المتوقع: نجاح جميع الاختبارات.

### المهمة 5: توحيد تسمية معاينة الموقع في Shell والـView Model

**الملفات:**
- تعديل: `src/components/layout/dashboard-shell.tsx`
- تعديل: `src/modules/dashboard/dashboard-view-model.ts`
- تعديل: `tests/dashboard-view-model.test.ts`
- تعديل: `tests/layout-shells.test.tsx` في الجزء المتعلق بالـDashboard فقط.

**الواجهات:**
- يستهلك: `siteSlug` الحالي.
- ينتج: روابط Owner View وتسميات محددة دون تغيير الخطوات أو الحسابات.

- [ ] **الخطوة 1: تحديث التوقعات المتعلقة بالنصوص فقط وترك الحسابات الحالية كما هي**

```ts
expect(viewModel.nextStepLabel).toBe("شاهد الموقع كما يراه العميل");
expect(screen.getByRole("link", { name: "شاهد الموقع كما يراه العميل" }))
  .toHaveAttribute("href", "/p/demo?ownerView=1");
```

- [ ] **الخطوة 2: تشغيل الاختبارات المستهدفة وتسجيل فشل النصوص القديمة**

الأمر: `npm test -- --run tests/dashboard-view-model.test.ts tests/layout-shells.test.tsx`

المتوقع: فشل التوقعات الجديدة قبل تعديل الإنتاج، مع بقاء أعطال Baseline غير المرتبطة موثقة.

- [ ] **الخطوة 3: تعديل التسميات والروابط فقط**

```tsx
<Link href={`/p/${siteSlug}?ownerView=1`} target="_blank">شاهد الموقع كما يراه العميل</Link>
```

- [ ] **الخطوة 4: تشغيل اختبارات Dashboard المستهدفة**

الأمر: `npm test -- --run tests/dashboard-home-client.test.tsx tests/dashboard-site-actions.test.tsx tests/public-site-owner-view.test.ts tests/public-site-owner-banner.test.tsx`

المتوقع: نجاح اختبارات الميزة الجديدة.

### المهمة 6: التحقق البصري والفني والتسليم

**الملفات:**
- تعديل عند الحاجة فقط: ملفات المهام السابقة.
- إنشاء: لقطات قبل/بعد ضمن `artifacts/dashboard-2/` إن كانت بيانات التشغيل المحلية تسمح.

- [ ] **الخطوة 1: تشغيل Typecheck وLint واختبارات الميزة**

```bash
npm run typecheck
npm run lint
npm test -- --run tests/dashboard-home-client.test.tsx tests/dashboard-site-actions.test.tsx tests/public-site-owner-view.test.ts tests/public-site-owner-banner.test.tsx
```

- [ ] **الخطوة 2: تشغيل الاختبارات الكاملة وفصل أعطال Baseline القديمة**

الأمر: `npm test`

المتوقع: لا فشل جديد مرتبط بالميزة؛ تُوثق الاختبارات القديمة إن بقيت خارجة عن النطاق.

- [ ] **الخطوة 3: تشغيل التطبيق ومراجعة 390×844 و1440×900**

```bash
npm run dev
```

المتوقع: الرسالة والكارت والأزرار واضحة دون overflow أو كسر للSidebar/Progress.

- [ ] **الخطوة 4: مراجعة أسئلة الخمس ثوانٍ**

```text
أين أنا؟ داخل لوحة إدارة لا يراها العميل.
ماذا سيرى العميل؟ المعاينة داخل كارت «موقعك المنشور».
ماذا سأرسل؟ الرابط العام النظيف بجوار زر النسخ.
```

- [ ] **الخطوة 5: Commit وPush وفتح Pull Request**

```bash
git add docs/superpowers src/app/p/'[slug]'/page.tsx src/app/'(dashboard)'/dashboard/home-client.tsx src/app/customer-dashboard.css src/components/dashboard/dashboard-site-actions.tsx src/components/layout/dashboard-shell.tsx src/components/public-sites/public-site-owner-banner.tsx src/modules/dashboard/dashboard-view-model.ts src/modules/public-sites/owner-view.ts tests/dashboard-home-client.test.tsx tests/dashboard-site-actions.test.tsx tests/dashboard-view-model.test.ts tests/layout-shells.test.tsx tests/public-site-owner-banner.test.tsx tests/public-site-owner-view.test.ts
git commit -m "تحسين وضوح لوحة الإدارة والموقع المنشور"
git push -u origin codex/dashboard-2
gh pr create --title "لوحة التحكم 2" --body-file /tmp/dashboard-2-pr.md
```

المتوقع: Pull Request مفتوح يحتوي التقرير واللقطات، ثم يدمج عبر PR بعد اكتمال الفحوصات.
