# خطة تنفيذ إعادة بناء رسائل الاشتراك والتفعيل

> **للوكلاء المنفذين:** المهارة المطلوبة: `subagent-driven-development` أو `executing-plans`. هذه الخطة تستخدم مربعات اختيار للمتابعة.

**الهدف:** بناء نظام موحد لرسائل الاشتراك والتفعيل والفترة التجريبية داخل الأدمن ولوحة العميل، مع فصل defaults عن overrides وإلغاء التكرار في القرار.

**المعمارية:** سنستخدم `FeatureFlag` الموجودة بالفعل كمصدر واحد للإعدادات العامة وكمخزن overrides على مستوى `TENANT`. سنضيف Resolver مركزيًا يشتق حالة العرض للعميل ويغذي كلًا من واجهة الأدمن ولوحة العميل وصفحة التفعيل.

**التقنيات:** Next.js 15، React 19، Prisma، Vitest، Server Actions، FeatureFlag JSON.

## القيود العامة

- كل النصوص بالعربية.
- لا نضيف تخزينًا مكررًا لنفس القرار في أكثر من مكان.
- defaults → overrides → fallback هو الترتيب الوحيد المسموح.
- مدة Trial الافتراضية منفصلة عن الرسائل.
- Trial الممنوحة يدويًا تبدأ من وقت التنفيذ وليس من `createdAt`.
- لا يتم تعديل العملاء الحاليين عند تغيير المدة الافتراضية إلا باختيار صريح من الأدمن.

---

### المهمة 1: تأسيس نموذج الدومين والـ Resolver

**الملفات:**
- إنشاء: `src/modules/subscription/subscription-experience.ts`
- تعديل: `src/modules/messages/customer-message-config.ts`
- تعديل: `src/modules/setup/platform-configuration-git.ts`
- اختبار: `tests/subscription-experience.test.ts`

**الواجهات:**
- يستهلك:
  - `FeatureFlag` defaults
  - `FeatureFlag` overrides
  - `Tenant` + `Subscription` + `PaymentRequest`
- ينتج:
  - `getSubscriptionExperienceDefaults(prisma)`
  - `saveSubscriptionExperienceDefaults(prisma, input)`
  - `getTenantSubscriptionExperienceOverride(prisma, tenantId)`
  - `saveTenantSubscriptionExperienceOverride(prisma, tenantId, input)`
  - `clearTenantSubscriptionExperienceOverride(prisma, tenantId)`
  - `resolveSubscriptionExperience(input)`

- [ ] كتابة اختبار فاشل يثبت أولوية override على default وعلى fallback
- [ ] تشغيل الاختبار والتأكد من فشله
- [ ] تنفيذ نموذج الـ defaults والـ overrides وأنواع الزر والحالات المشتقة
- [ ] تنفيذ Resolver المركزي وربط fallback migration من الإعدادات القديمة
- [ ] تشغيل اختبار الوحدة والتأكد من نجاحه

### المهمة 2: نقل إعدادات الأدمن إلى النظام الجديد

**الملفات:**
- تعديل: `src/app/(admin)/admin/messages/actions.ts`
- تعديل: `src/app/(admin)/admin/messages/page.tsx`
- تعديل: `src/app/(admin)/admin/messages/lifecycle-timer-card.tsx`
- إنشاء: `src/app/(admin)/admin/messages/subscription-experience-defaults-card.tsx`
- إنشاء: `src/app/(admin)/admin/messages/subscription-experience-overrides-card.tsx`
- اختبار: `tests/admin-subscription-experience-actions.test.ts`

**الواجهات:**
- يستهلك:
  - `saveSubscriptionExperienceDefaults`
  - `saveTenantSubscriptionExperienceOverride`
  - `clearTenantSubscriptionExperienceOverride`
  - `applyTrialTimerToTenants`
- ينتج:
  - صفحة أدمن جديدة واضحة فيها:
    - عملاء Trial
    - مدة Trial الافتراضية
    - عملاء Active
    - الاستثناءات الخاصة

- [ ] كتابة اختبار فاشل لحفظ defaults الجديدة
- [ ] كتابة اختبار فاشل لتطبيق override على عميل محدد
- [ ] تشغيل الاختبارات والتأكد من الفشل الصحيح
- [ ] حذف/عزل واجهة الرسائل العامة من هذا القسم
- [ ] بناء بطاقات defaults الثلاث
- [ ] بناء واجهة overrides مع تطبيق رسالة/مؤقت/زر وإزالة override
- [ ] تشغيل اختبارات الأدمن والتأكد من النجاح

### المهمة 3: توحيد تجربة لوحة العميل وصفحة التفعيل

**الملفات:**
- تعديل: `src/app/(dashboard)/dashboard/page.tsx`
- تعديل: `src/modules/dashboard/dashboard-view-model.ts`
- تعديل: `src/app/(dashboard)/dashboard/home-client.tsx`
- تعديل: `src/app/(dashboard)/dashboard/billing/page.tsx`
- تعديل: `src/app/(dashboard)/dashboard/billing/billing-client.tsx`
- اختبار: `tests/dashboard-subscription-experience.test.tsx`

**الواجهات:**
- يستهلك:
  - `resolveSubscriptionExperience`
- ينتج:
  - بطاقة اشتراك موحدة في الـ dashboard
  - رسالة موحدة في صفحة التفعيل
  - CTA موحد

- [ ] كتابة اختبار فاشل لعرض رسالة Trial مع مؤقت وزر
- [ ] كتابة اختبار فاشل لعرض حالة pending-review
- [ ] تشغيل الاختبارات والتأكد من الفشل
- [ ] توصيل الصفحة الرئيسية ببيانات الـ Resolver
- [ ] استبدال `TrialNotice` برسالة موحدة قادمة من الـ Resolver
- [ ] تقليل التكرار بين `operatingAlerts` وتجربة الاشتراك
- [ ] تشغيل اختبارات الواجهة والتأكد من النجاح

### المهمة 4: دعم Trial جديدة مستقلة للعملاء المحددين

**الملفات:**
- تعديل: `src/modules/lifecycle/customer-lifecycle.ts`
- تعديل: `src/app/(admin)/admin/messages/actions.ts`
- تعديل: `src/app/(admin)/admin/customers/actions.ts`
- اختبار: `tests/manual-trial-grant.test.ts`

**الواجهات:**
- ينتج:
  - دالة تمنح Trial جديدة من وقت التنفيذ
  - مسار أدمن واضح لا يعيد ربطها بتاريخ إنشاء الحساب

- [ ] كتابة اختبار فاشل يمنح Trial جديدة ويثبت أن البداية من وقت التنفيذ
- [ ] تشغيل الاختبار والتأكد من الفشل
- [ ] تنفيذ دالة domain صريحة لمنح Trial جديدة
- [ ] استخدام نفس الدالة من الأدمن حيث يلزم
- [ ] تشغيل الاختبار والتأكد من النجاح

### المهمة 5: التوثيق والتحقق النهائي

**الملفات:**
- تعديل: `docs/features/subscriptions.md`
- تعديل: `docs/billing-activation-architecture.md`
- تعديل: `docs/CHANGELOG.md`

**التحقق:**
- `npm run test -- tests/subscription-experience.test.ts tests/manual-trial-grant.test.ts tests/dashboard-subscription-experience.test.tsx tests/admin-subscription-experience-actions.test.ts`
- `npm run typecheck`
- `npm run lint`

- [ ] تحديث التوثيق لشرح المصدر الجديد للقرار
- [ ] تشغيل الاختبارات المستهدفة
- [ ] تشغيل `typecheck`
- [ ] تشغيل `lint`
- [ ] فقط بعد نجاح التحقق: commit ثم push للفرع الحالي
