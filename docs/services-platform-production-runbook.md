# دليل تشغيل FrameID Services Platform

## النشر وقاعدة البيانات

المسار المعتمد في المشروع هو:

`DATABASE_URL=... npm run db:deploy:safe`

هذا المسار:

1. يطبّق إصلاح التوافق السابق للدفع.
2. يزامن Prisma schema الحالي.
3. يطبق `20260723011000_services_platform_hardening` لضمان الفهارس الجزئية التي لا يمثلها Prisma schema.
4. يشغّل إصلاحات التوافق التاريخية idempotently.
5. يشغّل seed المنصة.

لا تعدّل ملفات migrations التاريخية. سلسلة `prisma migrate deploy` القديمة تحتوي دينًا سابقًا في migration الدفع، وإصلاحها الصحيح هو مشروع rebaseline مستقل بعد جرد قواعد الإنتاج، لا تغيير checksum داخل feature branch.

## الجدولة

- `/api/cron/services-outbox`: كل دقيقة.
- `/api/cron/services-reconciliation`: كل خمس دقائق.
- يجب ضبط `CRON_SECRET` في production وإرسال `Authorization: Bearer <CRON_SECRET>` عند استخدام scheduler غير Vercel.

## مؤشرات الصحة

راقب القيم التالية:

- عدد `ServicesOutboxEvent` في `DEAD_LETTER` يجب أن يساوي صفرًا.
- أقدم حدث `PENDING` لا ينبغي أن يتجاوز دقيقتين في التشغيل الطبيعي.
- `FulfillmentRun` في `PROVISIONING` لأكثر من ساعة يظهر كـanomaly في reconciliation.
- الاشتراكات `PAST_DUE` و`GRACE_PERIOD` تحتاج متابعة بوابة الدفع.
- أي نتيجة `503` من reconciliation تعني حالة متدهورة وتتطلب تنبيهًا.

## استعادة حدث أو تنفيذ فاشل

- أحداث Outbox الفاشلة يعاد جدولتها تلقائيًا مع exponential backoff حتى `DEAD_LETTER`.
- تنفيذ Fulfillment الفاشل يعاد من لوحة الإدارة بزر «إعادة المحاولة»؛ يعاد نفس Workflow ولا يسمح بالانتقال اليدوي فوق الفشل.
- لا تنشئ FulfillmentRun يدويًا؛ استخدم runtime أو أعد حدث `services.fulfillment.requested` بمفتاح deduplication ثابت.

## إضافة منتج جديد

1. أضف Product Adapter إلى Product Registry إن كان المنتج يحتاج تفعيلًا تقنيًا.
2. أنشئ Product Definition وعروضه وأسعاره وقدراته وWorkflow Template من لوحة الإدارة.
3. استخدم Preview وعالج كل validation errors.
4. انشر Catalog Revision.
5. اختبر الطلب والدفع والتنفيذ والتفعيل في Tenant اختبار.

لا يلزم تعديل Acquisition أوPayments أوEntitlements أوCommunication Core لإضافة منتج جديد.
