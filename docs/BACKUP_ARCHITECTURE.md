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

## GitHub Actions والأسرار

Workflow يرسل طلبًا مصادقًا إلى `/api/backups/run` فقط. يجب جعل المستودع Private قبل الإطلاق، ولا تُتبع ملفات البيئة، ويلزم تدوير أي رمز سبق كشفه.
