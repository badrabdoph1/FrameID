# Execution Governance: Report First, Plan Second, Implementation Third

## Purpose

هذه الوثيقة تمنع بدء التنفيذ قبل اكتمال التحليل والخطة الدقيقة. المشروع كبير، وأي تنفيذ متسرع سيجعلنا ننسى أجزاء مثل Admin, Backup, RBAC, Theme Engine, future modules.

## Mandatory Order

لا يبدأ التنفيذ مباشرة.

الترتيب الإلزامي:

1. Architecture Report.
2. Detailed Implementation Plan.
3. Review Gate.
4. Fork/worktree or implementation workspace.
5. Execution milestone by milestone.
6. Verification after every milestone.

## Architecture Report

قبل التنفيذ يجب وجود تقرير يراجع:

- Product vision.
- UX flows.
- Entities.
- Permissions.
- Theme Engine.
- Dashboard.
- Super Admin.
- Subscription.
- Backup/Restore.
- Security.
- Performance.
- SEO.
- Deployment.
- Future modules.

التقرير يجب أن يذكر:

- قرارات معمارية.
- بدائل مرفوضة.
- سبب اختيار الحل.
- المخاطر.
- ما يحتاج تأجيلًا.

## Detailed Implementation Plan

بعد التقرير، يتم إنشاء خطة تنفيذ دقيقة.

يجب أن تقسم إلى milestones صغيرة:

- Foundation.
- Design System.
- Auth.
- Tenant/Site.
- Theme Engine.
- Dashboard Core.
- Public Sites.
- Billing.
- Admin Core.
- Backup Center.
- Hardening.

كل milestone يجب أن يحتوي:

- الهدف.
- الملفات/الموديولات.
- نماذج البيانات.
- الخدمات.
- الواجهات.
- الاختبارات.
- معايير القبول.
- ما لا يدخل في هذه المرحلة.

## Review Gate

قبل التنفيذ نسأل:

- هل كل متطلبات المستخدم موجودة في الخطة؟
- هل القالب مؤجل لمكانه الصحيح؟
- هل Admin مصمم كControl Center؟
- هل Photographer Dashboard مصمم كمنتج؟
- هل Backup/Restore مصمم كخط دفاع؟
- هل future modules ممكنة دون إعادة بناء؟
- هل توجد أي نقطة hardcoded؟
- هل توجد أي duplicate logic متوقعة؟

## Implementation Workspace

لا يبدأ التنفيذ من fork أو worktree قبل اكتمال التقرير والخطة.

بعد اكتمالهما:

- يتم إنشاء workspace للتنفيذ.
- يتم تنفيذ milestones بالترتيب.
- لا يتم تخطي Design System وCore Architecture.

## Execution Rules

- لا تنفيذ بدون اختبار مناسب.
- لا UI خارج Design System.
- لا feature دون permissions.
- لا public site دون SEO.
- لا upload دون media policy.
- لا admin action دون Audit.
- لا backup دون verification.
- لا autosave دون failure state.

## Definition of Ready

الميزة جاهزة للتنفيذ فقط إذا:

- واضحة الهدف.
- لها data model أو تستخدم model موجود.
- لها permission rules.
- لها UI pattern.
- لها loading/error/empty states.
- لها acceptance criteria.
- لا تكسر future extensibility.

## Definition of Done

الميزة مكتملة فقط إذا:

- تعمل mobile first.
- تستخدم Design System.
- تحترم tenant isolation.
- لا تحتوي hardcoded data.
- لديها validation.
- لديها audit عند الحاجة.
- الأداء مقبول.
- الاختبارات الأساسية تمر.
- موثقة إن كانت معمارية.

## CTO Override Rule

إذا ظهر أثناء التنفيذ حل أفضل من الخطة:

1. يوثق الاقتراح.
2. يذكر المزايا والعيوب.
3. يحدد أثره على الخطة.
4. يعتمد الحل الأفضل.
5. تحدث الوثائق قبل أو مع التنفيذ.

## Current Status

هذه المرحلة ما زالت Analysis and Planning.

لا يوجد تنفيذ كود للتطبيق بعد.

الخطوة التالية بعد هذه الوثائق:

- إنشاء تقرير معماري نهائي مختصر.
- ثم خطة تنفيذ دقيقة task-by-task.
- ثم بدء التنفيذ فقط بعد ذلك.
