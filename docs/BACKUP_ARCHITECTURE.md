# معمارية FrameID Backup Pipeline

هذه الوثيقة هي العقد الرسمي المغلق لنظام النسخ والاستعادة.

## المصدر التنفيذي الوحيد

`FrameID Backup Pipeline` في `src/modules/backups/frameid-backup-pipeline.ts` هي المنسق الوحيد للإنشاء والتحقق والرفع والاحتفاظ والسجلات والاستعادة والتحقق اللاحق. أزرار الإدارة وCLI والـScheduler وGitHub Actions مشغلات فقط.

## الأنواع والسياسة

- `DATABASE`: PostgreSQL فقط، كل 12 ساعة، آخر 20 نسخة.
- `FULL`: PostgreSQL و`public/uploads` فقط، كل 48 ساعة، آخر 10 نسخ.
- `UPLOADS` قيمة قديمة في Prisma فقط ولا توجد في أي سطح تشغيلي.
- ملفات المنصة لا تدخل النسخة؛ مصدرها Git.

## إنشاء النسخة

`Create -> Local Verify -> GitHub Upload -> Remote Verify -> Retention -> Audit -> COMPLETED -> Local Cleanup`.

أي فشل، بما فيه غياب GitHub أو فشل Retention أو Audit، ينتج `FAILED`. القرص المحلي مؤقت وليس Disaster Recovery.

## التحقق والاستعادة

`backup-verification-service.ts` هو تطبيق التحقق الوحيد. والاستعادة تستخدم المحلي إن وجد، وإلا تنزل من GitHub، ثم تتحقق وتستعيد PostgreSQL وuploads للنوع FULL وتتحقق بعد الاستعادة وتسجل Audit. الأمر `npm run restore -- latest FULL` لا يحتاج سجلات BackupJob القديمة.

في عودة الطوارئ لا تُختار نسخة FULL فارغة أنشأها تشغيل تلقائي بعد إنشاء قاعدة بديلة؛ تُختار أحدث نسخة تحتوي Tenants أو Sites أو Media وفق Manifest. بعد `pg_restore` تُقارن أعداد Users وTenants وSites وMediaAssets الفعلية بالأعداد المسجلة في Manifest، ولا تظهر رسالة النجاح عند أي اختلاف. وعلى قاعدة جديدة فارغة يؤجل Seed أول نسخة تلقائية 12/48 ساعة حتى تتاح نافذة الاستعادة.

صورة التشغيل تثبت `postgresql-client-18` المطابق لخادم PostgreSQL 18 على Railway. لا يُدعم تشغيل Restore بأداة `pg_restore` أقدم، ولا يتم تجاوز فحص توافق dump.

## GitHub Actions والأسرار

Workflow يرسل طلبًا مصادقًا إلى `/api/backups/run` فقط. المصادقة تتم بتوكن OIDC قصير العمر وموقّع من GitHub، ويتحقق السيرفر من المستودع والفرع وملف Workflow والحدث؛ لذلك لا يحتاج Trigger إلى Secret يدوي مشترك. يجب جعل المستودع Private قبل الإطلاق، ولا تُتبع ملفات البيئة، ويلزم تدوير أي رمز سبق كشفه.

المنسق الذري المشترك يحجز موعد النسخة قبل تشغيل Pipeline، وبذلك لا ينتج Scheduler الداخلي وGitHub Actions نسختين لنفس الموعد. مواعيد DATABASE تُحسب بإضافة 12 ساعة، ومواعيد FULL بإضافة 48 ساعة فعلية؛ نبضة GitHub اليومية لـFULL مجرد Trigger، ولا تشغّل النسخة إلا عند حلول الموعد. عند الفشل تُعاد المحاولة بعد 15 دقيقة.

تُحفظ النسخ في فرعي `frameid-backups-database` و`frameid-backups-full` داخل المستودع نفسه، وليس في `main`. تعرض صفحة الأدمن رابط النسخة والفرع وCommit وحالة المراحل الخمس لكل نسخة مكتملة.
