# خطة تنفيذ استثناء ظهور كروت الاشتراك لكل حالة

> **للوكلاء المنفذين:** المهارة الفرعية المطلوبة: استخدم `subagent-driven-development` (موصى به) أو `executing-plans` لتنفيذ الخطة مهمةً بمهمة. تستخدم الخطوات مربعات متابعة `- [ ]`.

**الهدف:** إضافة استثناء رؤية مستقل لكل حالة اشتراك داخل ملف العميل، مع Preview فعلي، وبيانات آخر تعديل، وإرجاع جميع الحالات للإعداد العام، مع Resolver واحد مشترك بين الأدمن ولوحة العميل وصفحة الدفع.

**المعمارية:** يبقى `src/modules/subscription/subscription-experience.ts` هو الـ Module العميق الذي يملك تطبيع الاستثناءات ودمجها وحساب النتيجة والمصدر. تستخدم صفحات الأدمن Interface هذا الـ Module للحفظ والعرض، ولا تستنتج الرؤية من JSON. تُخزن بيانات آخر تعديل داخل bucket نفسه، وتظل `FeatureFlag` الحالية هي مخزن البيانات الوحيد بلا migration.

**التقنيات:** Next.js 15، React 19، TypeScript، Prisma 6، Vitest، Testing Library، Tailwind CSS.

## القيود العامة

- العمل على النسخة الأساسية والفرع `main` فقط، دون worktree.
- تظل التعديلات غير مكوميتة داخل Changes للمراجعة.
- لا يوجد مصدر قرار للرؤية خارج Subscription Experience Resolver.
- لا توجد migration ولا حزمة جديدة.
- كل bucket مستقل: `trial` و`active` و`pendingReview` و`rejected` و`expired`.
- انتقال العميل لا يحذف أي استثناء، و`suspended` يستخدم bucket `expired`.
- إخفاء الكارت لا يعطل صفحة الدفع أو الباقات أو خطوات التفعيل.

---

### المهمة 1: تعميق Module تجربة الاشتراك وإضافة قرار الرؤية المفسر

**الملفات:**
- تعديل: `src/modules/subscription/subscription-experience.ts`
- اختبار: `tests/subscription-experience.test.ts`

**الواجهات:**
- ينتج `SubscriptionCardVisibilityPreference = "inherit" | "show" | "hide"`.
- ينتج `SubscriptionCardVisibilityDecision` وفيه `preference` و`effective` و`source`.
- ينتج `SubscriptionExperienceOverrideMetadata` وفيه `updatedAt` و`updatedByAdminId` و`updatedByAdminName`.
- ينتج `resolveSubscriptionExperienceForBucket(input)` ويستخدمه `resolveSubscriptionExperience` نفسه.
- ينتج `setSubscriptionCardVisibilityPreference(input)` لتعديل حقل الرؤية فقط مع الحفاظ على بقية bucket.

- [ ] **الخطوة 1: كتابة اختبارات فاشلة للأولوية والمصدر والاستقلال**

أضف حالات تغطي `inherit/show/hide`، وأن تخصيص عنوان فقط لا يحول مصدر الرؤية إلى استثناء عميل، وأن تعديل Trial لا يغير Active.

```ts
expect(resolveVisibility({ defaultEnabled: false, preference: "show" })).toEqual({
  preference: "show",
  effective: "visible",
  source: "customer-override",
});
expect(resolveVisibility({ defaultEnabled: true, preference: "hide" }).effective).toBe("hidden");
expect(resolveVisibility({ defaultEnabled: false, preference: "inherit" }).source).toBe("global-default");
```

- [ ] **الخطوة 2: تشغيل الاختبار والتأكد من فشله**

```bash
npx vitest run tests/subscription-experience.test.ts
```

المتوقع: فشل لأن أنواع ودوال قرار الرؤية لم تُضف بعد.

- [ ] **الخطوة 3: تنفيذ الأنواع والـ bucket resolver**

أضف إلى الناتج النهائي:

```ts
visibility: {
  preference: "inherit" | "show" | "hide";
  effective: "visible" | "hidden";
  source: "customer-override" | "global-default" | "system-fallback";
}
```

اجعل `message.enabled` مشتقًا من `visibility.effective === "visible"`، واجعل Resolver الحالي يستدعي دالة دمج bucket نفسها.

- [ ] **الخطوة 4: تنفيذ patch آمن للرؤية**

اختيار `inherit` يحذف `message.enabled` فقط، ويحافظ على النص والزر والمؤقت، وينظف الحاويات الفارغة. `show/hide` يكتب metadata للأدمن المنفذ.

- [ ] **الخطوة 5: تشغيل اختبار الدومين حتى ينجح**

```bash
npx vitest run tests/subscription-experience.test.ts
```

---

### المهمة 2: حفظ metadata وقراءة سجل الاستثناء بتوافق خلفي

**الملفات:**
- تعديل: `src/modules/subscription/subscription-experience.ts`
- اختبار: `tests/subscription-experience.test.ts`

**الواجهات:**
- ينتج `getTenantSubscriptionExperienceOverrideRecord(prisma, tenantId)` ويعيد `{ override, updatedAt } | null`.
- يبقى `getTenantSubscriptionExperienceOverride` متوافقًا ويعيد override فقط.

- [ ] **الخطوة 1: اختبار فاشل لتطبيع metadata**

```ts
const normalized = normalizeSubscriptionExperienceOverride({
  trial: {
    message: { enabled: false },
    metadata: {
      updatedAt: "2026-07-18T10:00:00.000Z",
      updatedByAdminId: "admin-1",
      updatedByAdminName: "بدر",
    },
  },
});
expect(normalized.trial?.metadata?.updatedByAdminName).toBe("بدر");
```

اختبر أيضًا أن metadata وحدها لا تجعل bucket فارغًا استثناءً فعليًا.

- [ ] **الخطوة 2: تشغيل الاختبار للتأكد من الفشل**

```bash
npx vitest run tests/subscription-experience.test.ts
```

- [ ] **الخطوة 3: تنفيذ التطبيع والقراءة المتوافقة**

أعد `FeatureFlag.updatedAt` كتاريخ احتياطي للاستثناءات القديمة، واحذف السجل فقط إذا لم يبق أي bucket فعلي.

- [ ] **الخطوة 4: تشغيل الاختبار حتى ينجح**

```bash
npx vitest run tests/subscription-experience.test.ts
```

---

### المهمة 3: إجراءات ملف العميل والتدقيق والإرجاع الجماعي

**الملفات:**
- إنشاء: `src/modules/admin/customers/customer-subscription-visibility.ts`
- تعديل: `src/app/(admin)/admin/customers/actions.ts`
- إنشاء: `tests/customer-subscription-visibility.test.ts`

**الواجهات:**
- ينتج `updateCustomerSubscriptionCardVisibilityAction(formData)`.
- ينتج `clearCustomerSubscriptionExperienceOverridesAction(formData)`.
- الـ Module الإداري يقبل Repository للحفظ والتدقيق حتى يُختبر دون Prisma مباشر.

- [ ] **الخطوة 1: اختبار فاشل للتعديل والإرجاع الجماعي**

```ts
await service.updateVisibility({
  tenantId: "tenant-1",
  bucket: "trial",
  preference: "hide",
  actor: { id: "admin-1", name: "بدر" },
});
```

تحقق من حفظ patch فقط وتسجيل القرار السابق والجديد. اختبر `clearAll` وتسجيل الحالات التي أزيلت قبل حذف السجل.

- [ ] **الخطوة 2: تشغيل الاختبار للتأكد من الفشل**

```bash
npx vitest run tests/customer-subscription-visibility.test.ts
```

- [ ] **الخطوة 3: تنفيذ الـ Module وإجراءات السيرفر**

تحقق من bucket والتفضيل، واستخدم صلاحية `customers:edit`، ثم أعد التحقق من ملف العميل والرسائل ولوحة العميل وصفحة الدفع.

- [ ] **الخطوة 4: تشغيل الاختبار حتى ينجح**

```bash
npx vitest run tests/customer-subscription-visibility.test.ts
```

---

### المهمة 4: الحالات الخمس والـ Preview داخل ملف العميل

**الملفات:**
- تعديل: `src/app/(admin)/admin/customers/[id]/page.tsx`
- تعديل: `src/app/(admin)/admin/customers/[id]/customer-detail-client.tsx`
- تعديل: `src/app/(admin)/admin/customers/[id]/components/customer-subscription-tab.tsx`
- إنشاء: `src/app/(admin)/admin/customers/[id]/components/customer-subscription-visibility-card.tsx`
- إنشاء: `src/components/subscription/subscription-experience-preview.tsx`
- إنشاء: `tests/customer-subscription-visibility-card.test.tsx`

**الواجهات:**
- صفحة السيرفر تمرر الحالات الخمس والنتيجة والمصدر وmetadata وPreview محلولًا.
- مكوّن المعاينة يعرض `ResolvedSubscriptionExperience` جاهزًا ولا يدمج إعدادات.

- [ ] **الخطوة 1: اختبار مكوّن فاشل**

تحقق من ظهور الحالات الخمس، والنتيجة، والمصدر، واسم الأدمن والتاريخ، والمعاينة، وزر الإرجاع الجماعي.

```bash
npx vitest run tests/customer-subscription-visibility-card.test.tsx
```

- [ ] **الخطوة 2: بناء البيانات من Resolver في صفحة السيرفر**

حمّل defaults وoverride record والدعم بالتوازي، واشتق الحالة الحالية، ثم استخدم `resolveSubscriptionExperienceForBucket` لكل حالة. مرر بيانات قابلة للتسلسل فقط.

- [ ] **الخطوة 3: بناء واجهة مدمجة**

استخدم خمسة صفوف صغيرة قابلة للفتح، وليس خمس كروت ضخمة. كل صف يعرض النتيجة والمصدر والاختيارات الثلاثة، ثم Preview وآخر تعديل عند فتحه.

زر «إرجاع جميع الحالات للإعداد العام» يستخدم نافذة التأكيد الحالية.

- [ ] **الخطوة 4: تشغيل اختبار المكوّن حتى ينجح**

```bash
npx vitest run tests/customer-subscription-visibility-card.test.tsx
```

---

### المهمة 5: مزامنة شاشة استثناءات رسائل الاشتراك

**الملفات:**
- تعديل: `src/app/(admin)/admin/messages/page.tsx`
- تعديل: `src/app/(admin)/admin/messages/actions.ts`
- تعديل: `src/app/(admin)/admin/messages/subscription-experience-overrides-card.tsx`
- إنشاء: `tests/subscription-experience-overrides-card.test.tsx`

**الواجهات:**
- كل `TenantOption` يحمل override المطبع و`updatedAt` الاحتياطي، لا `hasOverride` فقط.
- إجراء الرسائل يستخدم patcher الدومين نفسه ويكتب metadata لكل عميل.

- [ ] **الخطوة 1: اختبار فاشل لتحميل الاستثناء الحقيقي**

اختبر أن اختيار عميل لديه `trial.message.enabled = false` يعرض «إخفاء لهذا العميل»، واسم آخر أدمن، وPreview مخفيًا.

- [ ] **الخطوة 2: تشغيل الاختبار للتأكد من الفشل**

```bash
npx vitest run tests/subscription-experience-overrides-card.test.tsx
```

- [ ] **الخطوة 3: تمرير القيم الحقيقية وإضافة tri-state**

عند عميل واحد حمّل bucket الفعلي. عند مجموعة اجعل التطبيق صريحًا، وطبّق patch لكل عميل مع الحفاظ على بقية buckets وmetadata.

- [ ] **الخطوة 4: استخدام المعاينة المشتركة**

مرر الناتج المحلول إلى مكوّن المعاينة، ولا تبنِ أولوية الرؤية داخل الواجهة.

- [ ] **الخطوة 5: تشغيل الاختبار حتى ينجح**

```bash
npx vitest run tests/subscription-experience-overrides-card.test.tsx
```

---

### المهمة 6: الحفاظ على الاستثناءات أثناء الانتقال

**الملفات:**
- تعديل: `src/modules/billing/prisma-billing-activation-repository.ts`
- تعديل: `src/modules/admin/customers/customer-admin-repository.ts`
- تعديل: `src/modules/admin/customers/prisma-customer-subscription-editor-repository.ts`
- تعديل: `tests/customer-subscription-editor.test.ts`

- [ ] **الخطوة 1: إضافة اختبار يثبت عدم حذف الاستثناء**

تحقق أن التفعيل يحدّث الاشتراك والعميل والموقع دون استدعاء `featureFlag.deleteMany`.

- [ ] **الخطوة 2: تشغيل اختبارات الاشتراك**

```bash
npx vitest run tests/customer-subscription-editor.test.ts tests/billing-activation-service.test.ts
```

- [ ] **الخطوة 3: إزالة الحذف التلقائي من المسارات الثلاثة**

احذف فقط عمليات حذف المفتاح `platform.subscription.experience.override`، واترك بقية transaction كما هي.

- [ ] **الخطوة 4: إعادة تشغيل الاختبارات حتى تنجح**

```bash
npx vitest run tests/customer-subscription-editor.test.ts tests/billing-activation-service.test.ts
```

---

### المهمة 7: توحيد الرؤية في لوحة العميل وصفحة الدفع

**الملفات:**
- تعديل: `src/app/(dashboard)/dashboard/home-client.tsx`
- تعديل: `src/app/(dashboard)/dashboard/billing/billing-client.tsx`
- تعديل: `tests/dashboard-home-client.test.tsx`
- إنشاء: `tests/billing-client-subscription-experience.test.tsx`

- [ ] **الخطوة 1: اختبار فاشل لصفحة الدفع**

مرر experience مخفيًا وتحقق أن كارت تجربة الاشتراك لا يظهر، بينما صفحة الدفع والباقات تظل ظاهرة.

- [ ] **الخطوة 2: تشغيل اختبارات الواجهة للتأكد من الفشل**

```bash
npx vitest run tests/dashboard-home-client.test.tsx tests/billing-client-subscription-experience.test.tsx
```

- [ ] **الخطوة 3: جعل الواجهتين تقرآن قرار Resolver فقط**

استخدم `experience.visibility.effective`، ولا تقرأ default أو override داخل المكوّنين.

- [ ] **الخطوة 4: إعادة تشغيل الاختبارات حتى تنجح**

```bash
npx vitest run tests/dashboard-home-client.test.tsx tests/billing-client-subscription-experience.test.tsx
```

---

### المهمة 8: التوثيق والتحقق النهائي

**الملفات:**
- تعديل: `docs/features/subscriptions.md`
- تعديل: `docs/billing-activation-architecture.md`
- تعديل: `docs/DATA_FLOW.md`
- تعديل: `docs/CHANGELOG.md`

- [ ] **الخطوة 1: تحديث التوثيق**

وثق tri-state لكل bucket، وmetadata، والاحتفاظ عبر الانتقالات، والإرجاع الجماعي، وقرار Resolver الموحد.

- [ ] **الخطوة 2: تشغيل الاختبارات المستهدفة**

```bash
npx vitest run tests/subscription-experience.test.ts tests/customer-subscription-visibility.test.ts tests/customer-subscription-visibility-card.test.tsx tests/subscription-experience-overrides-card.test.tsx tests/dashboard-home-client.test.tsx tests/billing-client-subscription-experience.test.tsx tests/customer-subscription-editor.test.ts tests/billing-activation-service.test.ts
```

- [ ] **الخطوة 3: تشغيل التحقق العام**

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

سجّل أي فشل قديم غير متعلق بالمهمة مع الدليل، ولا تخفِه ولا تعدّل اختبارات غير مرتبطة.

- [ ] **الخطوة 4: فحص الحالة النهائية**

```bash
git diff --check
git status --short --branch
```

المتوقع: لا أخطاء whitespace، وكل الملفات تظل غير مكوميتة داخل Changes للمراجعة.
