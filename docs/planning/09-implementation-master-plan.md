# Implementation Master Plan

## Purpose

هذه ليست مرحلة كتابة كود. هذه خطة تنفيذ تمنع العشوائية عندما نبدأ البناء لاحقًا. كل مرحلة يجب أن تنتج جزءًا قابلًا للتجربة، وليس نصف نظام غير مكتمل.

## Execution Philosophy

- نبني vertical slices لا طبقات معزولة.
- كل مرحلة تنتهي برحلة مستخدم تعمل.
- لا نبني integrations مستقبلية قبل الحاجة، لكن نصمم مكانها.
- لا نضيف Theme ثاني قبل أن يصبح Theme الأول صحيحًا بالكامل.
- لا نبني Admin كامل قبل أن يعمل Trial flow وDashboard الأساسي.
- لا يبدأ التنفيذ قبل تقرير معماري وخطة دقيقة ومراجعة.
- Design System وArchitecture Rules تأتي قبل الواجهات الكبيرة.

## Milestone 0 - Architecture Report and Execution Gate

### Goal

إنهاء التقرير المعماري والخطة التفصيلية قبل كتابة الكود.

### Deliverables

- Architecture report.
- Detailed implementation plan.
- Entity and flow review.
- Mandatory rules checklist.
- Risk register.
- Execution readiness decision.

### Acceptance Criteria

- لا توجد متطلبات كبيرة خارج الخطة.
- Super Admin مصمم.
- Photographer Dashboard مصمم.
- Backup/Restore مصمم.
- future modules محسوبة.
- القالب مؤجل لمكانه الصحيح.

## Milestone 1 - Project Foundation and Design System

### Goal

إنشاء أساس Next.js/React/Prisma جاهز للتوسع.

### Deliverables

- تطبيق Next.js 15.
- TypeScript strict.
- Tailwind configured.
- Prisma + PostgreSQL connection.
- Environment validation.
- Basic app shell.
- Route groups للـ marketing/dashboard/admin/public sites.
- Error/loading/not-found pages.
- Design System tokens.
- Base UI primitives.
- accessibility baseline.

### Acceptance Criteria

- التطبيق يعمل محليًا.
- build ينجح.
- لا توجد أسرار hardcoded.
- توجد صفحة marketing بسيطة وصفحة health.
- توجد migration أولى.
- لا توجد واجهة كبيرة خارج Design System.

## Milestone 2 - Auth and Tenant Creation

### Goal

تسجيل مستخدم وإنشاء Tenant/Site تلقائيًا.

### Deliverables

- Signup.
- Login.
- Forgot password structure.
- Session management.
- Tenant creation service.
- Site creation service.
- Default site data seed.

### Acceptance Criteria

- المستخدم الجديد يحصل على Tenant واحد وSite واحد.
- site status يبدأ Trial.
- slug مقترح تلقائيًا.
- لا يستطيع مستخدم قراءة بيانات مستخدم آخر.

## Milestone 3 - Template Showroom and Preview

### Goal

اختيار قالب ومعاينته حيًا.

### Deliverables

- `/templates`.
- Template card.
- Live preview route.
- Floating Action داخل المعاينة.
- use-template flow يحفظ template code خلال signup.

### Acceptance Criteria

- المعاينة ليست screenshot.
- preview pages noindex.
- زر "استخدام هذا القالب" يعمل للمسجل وغير المسجل.
- بعد signup يتم إنشاء الموقع بالقالب المختار.

## Milestone 4 - First Dashboard Screen

### Goal

أول شاشة تحقق لحظة القيمة: "موقعك أصبح موجودًا".

### Deliverables

- Link card.
- Copy link.
- Open site.
- Status badge.
- One-time slug editor.
- Live availability check.
- Smart slug suggestions.
- Photographer command center widgets.
- Autosave status foundation.

### Acceptance Criteria

- بطاقة الرابط تظهر دائمًا.
- تغيير الرابط متاح مرة واحدة فقط.
- الحالات تظهر أثناء الكتابة: متاح، مستخدم، غير صالح.
- بعد الحفظ يختفي محرر الرابط فقط.
- reserved slugs ممنوعة.
- الشاشة لا تتحول إلى CRUD.
- الهاتف هو التجربة الأساسية.

## Milestone 5 - Theme Engine MVP

### Goal

تشغيل Theme واحد من Registry ببيانات قاعدة البيانات.

### Deliverables

- Theme registry.
- Noir Gold metadata.
- Preview data.
- Renderer.
- Site sections mapping.
- Public site route `/p/[slug]`.

### Acceptance Criteria

- لا توجد بيانات ثابتة داخل Components.
- تغيير بيانات Site ينعكس في الموقع.
- القالب يعمل RTL على الهاتف.
- القالب ينتج metadata ديناميكية.

## Milestone 6 - Dashboard Content Editing

### Goal

المصور يعدل محتوى موقعه الأساسي بدون تعقيد.

### Deliverables

- Edit identity.
- Edit hero.
- Edit packages.
- Edit extras.
- Edit contact.
- Gallery upload initial.
- Preview action.
- Auto Save states.

### Acceptance Criteria

- كل تعديل يتحقق من ownership.
- Auto Save واضح.
- لا تضيع البيانات عند فشل الحفظ.
- الموقع العام يتحدث بعد الحفظ.

## Milestone 7 - Trial and Manual Activation

### Goal

تحويل Trial إلى Active بطرق دفع محلية.

### Deliverables

- Billing page.
- "تفعيل موقعي" CTA.
- InstaPay flow.
- Vodafone Cash flow.
- Proof upload.
- PaymentRequest admin review.
- Activation service.

### Acceptance Criteria

- الدفع قبل التجربة غير مطلوب.
- انتهاء Trial يحول status إلى Expired.
- البيانات لا تحذف.
- Admin approve يفعل الموقع.
- Admin reject يرسل سببًا واضحًا.

## Milestone 8 - Super Admin Console MVP

### Goal

تشغيل المنتج من لوحة داخلية.

### Deliverables

- Customers list.
- Customer profile.
- Customer Workspace.
- Sites management.
- Subscription view.
- Payment requests.
- Template management basic.
- Security Center basic.
- Support Center basic.
- Audit log.

### Acceptance Criteria

- القوائم تدعم search/filter/pagination.
- كل عملية Admin تسجل في AuditLog.
- لا يمكن لمستخدم عادي فتح admin routes.
- كل customer ليس row فقط، بل workspace.

## Milestone 8.5 - Backup Center and Disaster Recovery

### Goal

إضافة خط دفاع أساسي ضد فقدان بيانات العملاء.

### Deliverables

- Backup Center architecture implementation.
- Backup settings.
- Manual Database Backup.
- Manual Uploads Backup.
- Full Backup structure.
- GitHub backups branch integration.
- Manifest/checksum verification.
- Backup history.
- Restore Center design and guarded workflow.
- Audit events.

### Acceptance Criteria

- لا تعتبر النسخة ناجحة قبل verification.
- لا يمكن تنفيذ restore متزامن.
- لا يمكن حذف آخر نسخة سليمة.
- كل عملية تسجل في AuditLog.
- Disaster Recovery runbook موجود.

## Milestone 9 - Production Hardening

### Goal

تجهيز إطلاق تجاري أول.

### Deliverables

- Security review.
- Performance review.
- SEO review.
- Backups.
- Monitoring.
- Error tracking.
- Staging environment.
- Launch checklist.

### Acceptance Criteria

- tenant isolation tests تمر.
- LCP لموقع Noir Gold مقبول.
- لا preview pages مفهرسة.
- لا أسرار في bundle.
- يوجد rollback plan.

## Workstream Order

الترتيب المقترح:

1. Foundation.
2. Auth + Tenant.
3. Theme Showroom.
4. First Dashboard.
5. Theme Engine.
6. Editing.
7. Billing.
8. Admin.
9. Hardening.

لا نبدأ بقوالب كثيرة. القالب الأول يجب أن يصبح معيار الجودة.

## Decision Gates

بعد كل Milestone نسأل:

- هل الرحلة تعمل من الهاتف؟
- هل البيانات معزولة؟
- هل أضفنا تعقيدًا غير ضروري؟
- هل هذا يخدم تحويل الزائر إلى عميل؟
- هل القالب ما زال يشعر Premium؟
