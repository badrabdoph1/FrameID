# Template Starter Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إنشاء كل موقع جديد كنسخة مستقلة ومكتملة من القالب المختار، مع استبدال اسم المصور فقط باسم صاحب الحساب.

**Architecture:** يضاف عقد `TemplateStarterContent` إلى تعريف القالب ويصبح مصدر الحقيقة للمعاينة وبذور المنصة والتسجيل. تحول خدمة مستقلة بيانات البداية إلى `AccountCreationInput` مخصص، بينما ينشئ Prisma كل السجلات داخل المعاملة الحالية.

**Tech Stack:** Next.js 15، React 19، TypeScript، Prisma 6، Zod 4، Vitest.

## Global Constraints

- القالب والمعاينة والموقع الجديد يجب أن يستخدموا مصدر بيانات واحدًا.
- اسم المصور وحده يستبدل باسم صاحب الحساب.
- تعديلات العميل لا تغير القالب أو مواقع العملاء الآخرين.
- لا تنشأ حسابات أو مواقع ناقصة عند الفشل.
- المواقع القديمة لا تتغير تلقائيًا.

---

### Task 1: عقد بيانات بداية القالب

**Files:**
- Create: `src/modules/themes/template-starter-content.ts`
- Modify: `src/modules/themes/theme-registry.ts`
- Modify: `src/modules/themes/definitions/noir-gold.ts`
- Modify: `src/modules/themes/definitions/rose-blush.ts`
- Test: `tests/template-starter-content.test.ts`
- Test: `tests/theme-registry.test.ts`

**Interfaces:**
- Produces: `TemplateStarterContent`, `parseTemplateStarterContent(value)`, `personalizeTemplateStarterContent(content, photographerName)`، و`TemplateSummary.starterContent`.

- [ ] **Step 1: Write failing contract tests**

اختبر أن كل قالب مسجل يملك Hero وcontact وثلاث باقات على الأقل وإضافات وصور معرض، وأن التخصيص يغير حقول الهوية المحددة ولا يغير الصور أو الأسعار.

- [ ] **Step 2: Run the focused tests**

Run: `npm test -- tests/template-starter-content.test.ts tests/theme-registry.test.ts`

Expected: FAIL لأن عقد بيانات البداية غير موجود.

- [ ] **Step 3: Implement and attach the starter content**

أنشئ Zod schema كاملًا للأقسام والتواصل والباقات والإضافات والمعرض وSEO، وأضف بيانات كاملة مستقلة لكل من `noir-gold` و`rose-blush`.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/template-starter-content.test.ts tests/theme-registry.test.ts`

Expected: PASS.

### Task 2: توحيد المعاينة والبذور

**Files:**
- Modify: `src/modules/setup/platform-seed-data.ts`
- Modify: `src/app/(marketing)/templates/[code]/preview/page.tsx`
- Test: `tests/platform-seed-data.test.ts`
- Test: `tests/marketing-templates.test.tsx`

**Interfaces:**
- Consumes: `TemplateSummary.starterContent` و`parseTemplateStarterContent`.
- Produces: بيانات `previewData` مشتقة من المصدر نفسه ودالة بناء ViewModel لا تملك fallback ثابتًا منفصلًا.

- [ ] **Step 1: Write failing synchronization tests**

اختبر أن `previewData` في بذور كل قالب يساوي بيانات البداية الخاصة به، وأن قالبَي كلاسك وأنيق وهادئ لا يشتركان في الكائن نفسه.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/platform-seed-data.test.ts tests/marketing-templates.test.tsx`

Expected: FAIL بسبب بيانات `DEMO_PREVIEW_DATA` المشتركة.

- [ ] **Step 3: Replace duplicated preview constants**

حوّل بيانات البداية إلى `PublicSiteViewModel` داخل وحدة القالب، واجعل تعديلات الأدمن المقبولة تندمج فوق المصدر المسجل بعد التحقق.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/platform-seed-data.test.ts tests/marketing-templates.test.tsx`

Expected: PASS.

### Task 3: تجهيز محتوى التسجيل

**Files:**
- Create: `src/modules/onboarding/template-site-provisioning.ts`
- Modify: `src/modules/onboarding/signup-provisioning.ts`
- Test: `tests/signup-provisioning.test.ts`
- Test: `tests/template-site-provisioning.test.ts`

**Interfaces:**
- Consumes: `TemplateStarterContent` واسم صاحب الحساب.
- Produces: `ProvisionedSiteContent` ويشمل site وsections وcontact وseo وpackages وextras وgallery.

- [ ] **Step 1: Write failing provisioning tests**

اختبر كلا القالبين، القالب الافتراضي، استبدال الاسم المحدد فقط، رفض القالب غير المنشور، ورفض بيانات البداية غير الصالحة.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/signup-provisioning.test.ts tests/template-site-provisioning.test.ts`

Expected: FAIL لأن التسجيل ما زال يستخدم المحتوى العام الثابت.

- [ ] **Step 3: Build account input from the selected template**

احذف `createDefaultSections/createDefaultPackages/createDefaultExtras` واستبدلها بمحول ينسخ بيانات القالب بعمق ويخصص حقول الهوية فقط.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/signup-provisioning.test.ts tests/template-site-provisioning.test.ts`

Expected: PASS.

### Task 4: نسخ كل بيانات القالب داخل معاملة التسجيل

**Files:**
- Modify: `src/modules/onboarding/signup-provisioning.ts`
- Modify: `src/modules/onboarding/prisma-signup-repository.ts`
- Test: `tests/prisma-signup-repository.test.ts`
- Test: `tests/signup-auto-publish.test.ts`

**Interfaces:**
- Consumes: `AccountCreationInput.defaultContent` الموسع.
- Produces: ContactProfile وSEOSettings وMediaAsset وGalleryAlbum وGalleryImage مستقلة للموقع الجديد.

- [ ] **Step 1: Extend repository tests with all expected writes**

تحقق من ترتيب عمليات transaction، ملكية الصور للـTenant الجديد، ربط الألبوم، بيانات التواصل وSEO، وعدم وجود أي كتابة خارج transaction.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/prisma-signup-repository.test.ts tests/signup-auto-publish.test.ts`

Expected: FAIL لأن المستودع لا ينشئ التواصل أو SEO أو المعرض.

- [ ] **Step 3: Implement transactional cloning**

وسع أنواع Prisma transaction وأنشئ contact وSEO وأصول الصور والألبوم وروابط الصور، مع فحص أعداد `createMany` وإلقاء خطأ عند عدم تطابق العدد المتوقع.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/prisma-signup-repository.test.ts tests/signup-auto-publish.test.ts`

Expected: PASS.

### Task 5: تحقق لوحة التحكم والعرض العام

**Files:**
- Modify only if tests expose a mapping gap: `src/modules/public-sites/public-site-view-model.ts`
- Modify only if tests expose a loading gap: dashboard page loaders under `src/app/(dashboard)/dashboard/`
- Test: `tests/public-site-view-model.test.ts`
- Test: `tests/dashboard-contact-completion.test.ts`
- Test: `tests/dashboard-view-model.test.ts`

**Interfaces:**
- Consumes: records created during signup.
- Produces: public view model and populated dashboard props.

- [ ] **Step 1: Add round-trip fixture tests**

كوّن سجلًا من بيانات قالب مخصصة باسم العميل وتحقق أن Hero والتواصل والباقات والإضافات والمعرض تظهر بالقيم نفسها في الموقع ولوحة التحكم.

- [ ] **Step 2: Run focused tests and fix mapping gaps**

Run: `npm test -- tests/public-site-view-model.test.ts tests/dashboard-contact-completion.test.ts tests/dashboard-view-model.test.ts`

Expected: PASS بعد إصلاح أي mapping ناقص فقط.

### Task 6: التحقق النهائي للمرحلة الأولى

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-template-starter-content.md` لتحديث العلامات.

- [ ] **Step 1: Run the full quality suite**

Run: `npm run typecheck && npm run lint && npm test && npm run build`

Expected: جميع الأوامر تنتهي بنجاح.

- [ ] **Step 2: Perform browser verification**

أنشئ حساب اختبار لكل قالب في بيئة التطوير، وافتح الموقع ولوحات معلومات الموقع والصور والباقات على سطح المكتب والهاتف، وتحقق بصريًا من التطابق وامتلاء الحقول.

- [ ] **Step 3: Commit the completed phase**

Run: `git add` للملفات الخاصة بالمرحلة ثم `git commit -m "feat: provision new sites from template starter content"`.
