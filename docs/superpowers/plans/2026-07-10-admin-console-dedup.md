# Admin Console Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إعادة تنظيم جميع أقسام الأدمن حول قائمة واحدة ومحرر واحد ومسار أساسي واضح لكل مهمة.

**Architecture:** تبقى صفحات الكيانات المتخصصة هي مصدر الإدارة، بينما تتحول صفحات Workspace إلى ملخصات وروابط عميقة. يبدأ التنفيذ بمكون الباقات المرجعي، ثم تطبق قواعده على القوالب والعملاء وبقية الأقسام مع اشتقاق التنقل من سجل واحد.

**Tech Stack:** Next.js 15، React 19، TypeScript، Prisma 6، Vitest، Testing Library، Tailwind CSS 4.

## Global Constraints

- لا تحذف وظيفة أو صلاحية أو بيانات عاملة.
- عنصر واحد، ظهور واحد، زر تعديل واحد، محرر واحد.
- صفحات الملخص لا تعرض نماذج إدارة مكررة.
- العربية هي لغة الواجهة اليومية.
- الهاتف وسطح المكتب وحالات التحميل والفراغ والخطأ والنجاح إلزامية.

---

### Task 1: الباقات كنموذج مرجعي

**Files:**
- Modify: `src/app/(admin)/admin/plans/plans-manager-client.tsx`
- Modify only if required: `src/app/(admin)/admin/plans/page.tsx`
- Test: `tests/admin-plans-manager.test.tsx`

- [ ] اكتب اختبارًا يفشل لأن الصفحة تعرض محررًا لكل باقة، ويطلب قائمة واحدة ومحررًا واحدًا عند الاختيار.
- [ ] شغّل `npm test -- tests/admin-plans-manager.test.tsx` وتحقق من فشل السلوك المطلوب.
- [ ] استبدل المحررات المتكررة بمحرر واحد لحالة `create` أو `edit=<id>`، مع إبقاء إجراءات الحفظ والتفعيل والأرشفة وأعداد الاستخدام.
- [ ] اختبر الفراغ والهاتف والتأكيد قبل الأرشفة ثم شغّل الاختبار حتى ينجح.

### Task 2: تبسيط صفحة المال

**Files:**
- Modify: `src/app/(admin)/admin/billing/page.tsx`
- Test: `tests/admin-billing-workspace.test.tsx`

- [ ] اكتب اختبارًا يثبت أن Workspace المال يعرض المؤشرات والطلبات العاجلة فقط ولا يعرض قائمة الباقات أو وسائل الدفع مرة ثانية.
- [ ] احذف استعلامات وعروض الإدارة المكررة، وأضف روابط بمرشحات إلى المدفوعات والاشتراكات والباقات والإعدادات.
- [ ] اختبر الروابط والمسميات العربية وحالة الفراغ.

### Task 3: القوالب والمحتوى والوسائط

**Files:**
- Modify: `src/app/(admin)/admin/templates/page.tsx`
- Modify: `src/app/(admin)/admin/templates/template-manager.tsx`
- Modify: `src/app/(admin)/admin/content/page.tsx`
- Modify only if required: `src/app/(admin)/admin/media/page.tsx`
- Test: `tests/admin-content-workspace.test.tsx`
- Test: `tests/admin-template-manager.test.tsx`

- [ ] اختبر وجود محرر قالب واحد وعدم تكرار وجهات القوالب والثيمات والوسائط داخل صفحة المحتوى.
- [ ] ادمج عمليات صور القالب داخل سياق القالب المحدد، مع الاحتفاظ بإجراءات الخادم الحالية.
- [ ] اجعل `/admin/content` فهرسًا مختصرًا، و`/admin/templates` المحرر الوحيد للقوالب، و`/admin/media` المكتبة الوحيدة للوسائط.

### Task 4: العملاء والمواقع

**Files:**
- Modify: `src/app/(admin)/admin/customers/[id]/page.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/workspace/page.tsx`
- Modify: customer links in billing/operations/tables
- Test: `tests/admin-customer-canonical-route.test.tsx`

- [ ] اختبر أن `/admin/customers/[id]/workspace` هو المسار الأساسي وأن المسار القديم يتحول إليه.
- [ ] احتفظ بكل تبويبات ووظائف العميل والموقع والصلاحيات، وحدّث الروابط الداخلية للمسار الأساسي.
- [ ] أزل الروابط المرئية للمسارات غير الموجودة بدل ترك أزرار ميتة.

### Task 5: المدفوعات والاشتراكات وإعدادات الدفع

**Files:**
- Modify pages under `src/app/(admin)/admin/payments`, `subscriptions`, and `settings/payment`
- Test: `tests/admin-billing-surfaces.test.tsx`

- [ ] اختبر أن كل صفحة تملك قائمة واحدة ومحرر/قرار واحد لكل عنصر.
- [ ] وحّد أوضاع إضافة وتعديل حساب الدفع في نموذج واحد، مع الحفاظ على الإجراءات والتدقيق والصلاحيات.
- [ ] افصل مراجعة الدفع عن عرض الاشتراك وعن إعداد وسائل الدفع في التسميات والروابط.

### Task 6: الرسائل والإشعارات

**Files:**
- Modify pages under `src/app/(admin)/admin/messages`, `notifications`, and `email`
- Test: `tests/admin-message-centers.test.tsx`

- [ ] اختبر الحدود: الرسائل للإرسال والقوالب، الإشعارات للسجل، البريد لتشخيص التسليم.
- [ ] أزل أي سجل حديث مكرر، واحتفظ بروابط انتقال مرتبطة بمهمة واضحة.
- [ ] عرب المسميات الإنجليزية غير الضرورية.

### Task 7: النظام والعمليات

**Files:**
- Modify: `src/app/(admin)/admin/system/page.tsx`
- Modify: `src/app/(admin)/admin/operations/page.tsx`
- Modify only when duplicated: jobs/errors/backups/audit/security pages
- Test: `tests/admin-system-workspaces.test.tsx`

- [ ] اختبر أن العمليات تعرض ما يحتاج تدخلًا، والنظام يعرض الصحة والإعدادات، والصفحات المتخصصة تملك التفاصيل.
- [ ] استبدل روابط المجموعات العامة بروابط عميقة أو مرشحة عندما تتوفر.
- [ ] حافظ على النسخ الاحتياطي والسجلات والأمان كأدوات متخصصة بلا نسخ لنماذجها في الملخصات.

### Task 8: التنقل واللغة والحالات المتجاوبة

**Files:**
- Modify: `src/modules/admin/navigation.ts`
- Modify: `src/components/layout/admin-sidebar.tsx`
- Modify: `src/components/layout/admin-mobile-nav.tsx`
- Modify: `src/components/admin/command-palette/command-palette.tsx`
- Test: `tests/admin-navigation-contract.test.tsx`
- Update existing shell/link tests where their old expectations are obsolete.

- [ ] اكتب مصفوفة مسارات تحدد المركز والمسار الأساسي ونوع الصفحة وظهورها اليومي أو المتقدم.
- [ ] اشتق تنقل سطح المكتب والهاتف والبحث من المصدر نفسه، وأزل الروابط الميتة والتسميات الإنجليزية اليومية.
- [ ] اختبر عدم تكرار الوجهة نفسها داخل المستوى نفسه، وحالات فتح القائمة على الهاتف.

### Task 9: التحقق والدمج

- [ ] شغّل اختبارات كل قسم ثم `npm run typecheck`, `npm run lint`, `npm test`, و`npm run build`.
- [ ] شغّل خادم التطوير وافحص `/admin/plans` وبقية المراكز على 390px و1440px، مع التأكد من عدم التداخل ووجود حالات الفراغ والخطأ والتأكيد.
- [ ] راجع الفرق كاملًا، ادمج آخر `origin/main`، أصلح التعارضات مع الحفاظ على تعديلات الويب، ثم ارفع الفرع وادمجه في `main`.
