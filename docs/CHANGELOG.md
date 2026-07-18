# FrameID Changelog

## 2026-07-18 — Feature/Architecture — استثناءات ظهور كروت الاشتراك لكل عميل وحالة

- **الملفات/الوحدات المتأثرة:** Resolver تجربة الاشتراك، ملف العميل، إعدادات رسائل الاشتراك، لوحة العميل، صفحة الفوترة، وسجل التدقيق.
- **السبب:** تمكين الأدمن من إظهار أو إخفاء كارت كل حالة لعميل محدد مع الحفاظ على الإعداد العام كمصدر افتراضي واضح.
- **الأثر على النظام:** لكل حالة قرار مستقل `يتبع العام / إظهار / إخفاء`، مع Preview ونتيجة نهائية ومصدر القرار وآخر أدمن وتاريخ التعديل. تُحفظ الاستثناءات عند تغير حالة العميل، ويمكن إرجاعها جميعًا للإعداد العام بضغطة واحدة. جميع الواجهات تعتمد Resolver واحدًا دون منطق أولوية مكرر.
- **التغييرات الكاسرة:** لا يوجد؛ تم الحفاظ على إعدادات الرسائل الحالية ومسارات لوحة العميل والفوترة.
- **الترحيل المطلوب:** لا توجد Migration؛ الاستثناءات وبيانات التعديل محفوظة في سجل إعداد تجربة الاشتراك الحالي.
- **التوثيق المرتبط:** `docs/features/subscriptions.md` و`docs/billing-activation-architecture.md` و`docs/DATA_FLOW.md` ومواصفة وخطة 2026-07-18.

## 2026-07-14 — Feature/Architecture/Migration — عقد القوالب الموحّد وClassic Mobile-First

- **الملفات/الوحدات المتأثرة:** Theme Registry، Template Content Source، Public Site View Model، محرر محتوى العميل، عارضا Noir Gold وRose Blush، Contact Profile، ومعاينات معرض القوالب.
- **السبب:** جعل القوالب واجهات عرض لنفس قدرات المنصة، وإزالة الترتيب الثابت والمنطق المكرر، وإعطاء تجربة الهاتف الأولوية للمصور المستقل وعميله.
- **الأثر على النظام:** جميع القوالب تدعم Hero وGallery وPackages وExtras وContact، وتقرأ الإظهار والترتيب والإعدادات من لوحة التحكم. يدعم Hero الصورة والـoverlay والموضع والارتفاع والـCTA. أصبح التواصل أزرارًا كبيرة مع TikTok والبريد ومكان عمل حر بلا خريطة، والأسعار الصفرية تعرض «السعر عند الطلب».
- **التغييرات الكاسرة:** لا يوجد كسر مقصود للمواقع القديمة؛ طبقة التطبيع تضيف القيم الافتراضية للحقول والأقسام التاريخية الناقصة.
- **الترحيل المطلوب:** نعم؛ Migration `20260714090000_add_contact_work_location` تضيف `ContactProfile.workLocation` وتملأ القيم الفارغة بـ`فريلانسر`.
- **التوثيق المرتبط:** `theme-template-contract.md`، `TEMPLATE_ARCHITECTURE.md`، `CREATE_NEW_TEMPLATE.md`، وتصميم/خطة 2026-07-14.

## 2026-07-13 — Feature/Architecture — إعادة بناء رسائل الاشتراك والتفعيل

- **الملفات/الوحدات المتأثرة:** لوحة الأدمن `admin/messages`، Resolver تجربة الاشتراك، لوحة العميل، صفحة الفوترة، ودوال منح Trial اليدوي.
- **السبب:** الفصل بين الإعدادات العامة والاستثناءات الفردية، وإلغاء تكرار منطق الرسائل والمؤقتات وأزرار التفعيل بين أكثر من مسار.
- **الأثر على النظام:** أصبحت كل رسائل الاشتراك والتفعيل والفترة التجريبية تُحل من مصدر واحد بأولوية `override → default → fallback`، مع فصل مدة الـ Trial الافتراضية عن الرسائل نفسها.
- **التغييرات الكاسرة:** لا يوجد كسر مقصود للمستخدم النهائي، لكن تم استبدال قسم `Customer Lifecycle` القديم بهيكل جديد أكثر تخصصًا.
- **الترحيل المطلوب:** لا توجد Migration قاعدة بيانات جديدة؛ يتم استخدام طبقة إعدادات/Overrides موحدة مع fallback من الإعدادات القديمة.
- **التوثيق المرتبط:** تم تحديث `docs/features/subscriptions.md` و`docs/billing-activation-architecture.md`.

## 2026-07-13 — Refactor/Architecture — فصل مصدر المنصة عن بيانات العملاء

- **المتأثر:** Content Git sync، صور المنصة، Backup/Restore، Health، Prisma BackupSettings.
- **السبب:** إزالة المسارات المحلية القديمة ومنع كتابة أصول المنصة ضمن uploads الخاصة بالعملاء.
- **الأثر:** نجاح حفظ المنصة مشروط بـGit Commit، وأصول المنصة تُنشر من `public/platform`، وGitHub هو التخزين الوحيد للنسخ المكتملة.
- **الترحيل:** حذف أعمدة BackupSettings القديمة غير المستخدمة.

## 2026-07-13 — Fix/Security — GitHub Actions OIDC ووضوح أدلة النسخ

- **الملفات المتأثرة:** Workflow النسخ، API التشغيل، صفحة الأدمن، Repository العرض، Seed، ووثائق النسخ.
- **السبب:** كان Trigger يعتمد على Secrets غير مضبوطة، ولم تكن صفحة الأدمن تعرض مكان النسخة وCommit بوضوح.
- **الأثر:** GitHub Actions يصادق بهوية OIDC الموقعة ويستدعي Pipeline نفسها، وتظهر أدلة الرفع والتحقق داخل الأدمن.
- **التغييرات الكاسرة:** لا يوجد.
- **الترحيل المطلوب:** إعادة نشر التطبيق لتطبيق جدول FULL الرسمي وتفعيل تحقق OIDC.

## 2026-07-13 — Operations/Architecture — FrameID Backup Pipeline

- توحيد جميع مشغلات النسخ والاستعادة في Pipeline واحدة، وتحديث معمارية النسخ وADR ودليل التعافي لتطابق التنفيذ.

This is an append-only architectural and product change log. Never delete older entries; corrections must be added as new entries.

## Entry Format

- Date
- Type: Feature, Fix, Refactor, Migration, Security, Operations, Documentation
- Affected files/modules
- Reason
- System impact
- Breaking changes
- Migration required
- Related documentation updated

---

## 2026-07-11 — Fix/Documentation — Subscription soft-delete alignment

- **Affected files/modules:** `prisma/schema.prisma`, `prisma/migrations/20260711000100_restore_dropped_columns/migration.sql`, subscription reads, and `docs/features/subscriptions.md`.
- **Reason:** add and document `Subscription.deletedAt` so soft-deleted subscriptions can be excluded from normal reads without losing historical records.
- **System impact:** subscription queries and lifecycle logic must respect soft-deletion while preserving audit and recovery history.
- **Breaking changes:** No intended public breaking change.
- **Migration required:** Yes; the compatibility migration adds the nullable `deletedAt` column when missing.
- **Related documentation:** subscription feature documentation and database soft-delete rules reviewed.

## 2026-07-11 — Documentation/Governance — Final Living Documentation system

- **Affected files:** `docs/README.md`, `docs/AI_DEVELOPMENT_RULES.md`, `docs/PROJECT_ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/features/*`, `docs/CHANGELOG.md`, and final consistency review of all files under `docs/`.
- **Reason:** finalize FrameID's Official Knowledge Base, distinguish it from the code as the Executable Source of Truth, add focused feature documentation, introduce delivery-status tracking, and prevent duplicated or scattered documentation.
- **System impact:** developers and AI tools now have a complete mandatory reading sequence, one official documentation location per concern, feature-specific maintenance files, roadmap governance, and same-commit rules covering architecture, changelog, roadmap, ADRs, and feature documentation.
- **Breaking changes:** No runtime breaking change. Development and documentation governance becomes stricter.
- **Migration required:** No.
- **Related documentation:** all governance, architecture index, roadmap, and feature documentation updated in the same change.

## 2026-07-11 — Documentation/Architecture — Architecture decisions, conventions, and documentation review

- **Affected files:** `docs/ARCHITECTURE_DECISIONS.md`, `docs/PROJECT_CONVENTIONS.md`, `docs/README.md`, `docs/AI_DEVELOPMENT_RULES.md`, `docs/PROJECT_ARCHITECTURE.md`, `docs/TEMPLATE_ARCHITECTURE.md`, `docs/CHANGELOG.md`, plus consistency review of all files under `docs/`.
- **Reason:** record the rationale behind major architecture choices, establish one official implementation convention guide, strengthen code/documentation drift handling, and remove overlap between current-state documentation, decision rationale, conventions, and change history.
- **System impact:** every developer and AI tool now has a mandatory reading sequence, explicit source-of-truth boundaries, rules for services/repositories/actions/routes/media/data, and an ADR process for architectural decisions. Template switching and destructive content replacement boundaries are explicitly documented. Documentation ownership and same-commit maintenance rules are formalized.
- **Breaking changes:** No runtime breaking change. Development governance becomes stricter.
- **Migration required:** No.
- **Related documentation:** all affected documents updated in the same documentation change.

## 2026-07-11 — Documentation — Living documentation system

- **Affected files:** all files under `docs/`.
- **Reason:** make architecture documentation a maintained part of FrameID and establish mandatory rules for human and AI development.
- **System impact:** every future meaningful code change must review and update the relevant documentation in the same commit.
- **Breaking changes:** No.
- **Migration required:** No.
- **Related documentation:** all living-documentation files initialized.

## 2026-07-11 — Feature/Fix — Signup, publishing, template administration, and image upload hardening

- **Affected modules:** dashboard navigation, signup provisioning, platform URL resolution, admin template management, media upload validation, CI.
- **Reason:** ensure dashboard starts at the top, new sites are published with a valid production URL, trial duration follows admin lifecycle settings, templates are manageable without raw JSON, and images are uploaded from devices with server-side signature checks.
- **System impact:** improved onboarding, publishing reliability, template operations, and upload security.
- **Breaking changes:** No intended public breaking change.
- **Migration required:** No schema migration for these changes.
- **Related documentation:** architecture, data flow, templates, admin, authentication.
