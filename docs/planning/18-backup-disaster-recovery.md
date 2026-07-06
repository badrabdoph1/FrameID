# Backup and Disaster Recovery Architecture

## Purpose

Backup & Disaster Recovery هو خط الدفاع الأخير عن بيانات العملاء. يجب تصميمه كجزء أساسي من المنصة، لا كأداة لاحقة.

الهدف: إذا فُقد مشروع Railway بالكامل أو تلفت قاعدة البيانات أو حُذفت الملفات أو نُشر إصدار سيئ، يمكن استعادة المنصة بأقل وقت وأقل فقد بيانات ممكن.

## Current Environment

البيئة الحالية المفترضة:

- Railway.
- GitHub.
- لا يوجد مزود تخزين خارجي في الإصدار الأول.

هذا ليس مثاليًا لمنتج كبير، لكنه قابل للتشغيل كبداية إذا صممنا النظام بحذر.

## Professional Recommendation

استخدام GitHub كمخزن backup مقبول في مرحلة أولى صغيرة، لكنه ليس التخزين المثالي طويل المدى للنسخ الاحتياطية الكبيرة، خصوصًا uploads.

الخطة المعتمدة:

- Phase 1: Railway + GitHub backups branch.
- Phase 2: إضافة object storage خارجي للنسخ مثل S3/R2.
- Phase 3: cross-region backup + restore drills.

سبب البدء بـ GitHub:

- متاح في البيئة الحالية.
- مستقل عن Railway.
- يسهل استعادة مشروع مفقود.

عيوبه:

- ليس مخصصًا للملفات الكبيرة.
- repository size قد يكبر.
- Git operations قد تصبح بطيئة.

لذلك نحتاج retention policies وضغط وتشفير وتنظيم صارم.

## Backup Center

داخل Super Admin Console يوجد مركز مستقل باسم Backup Center.

ليس صفحة بسيطة. هو مركز إدارة كامل.

### Backup Dashboard

يعرض:

- حالة آخر Backup.
- وقت آخر Backup.
- نوع آخر Backup.
- حجم آخر Backup.
- عدد النسخ الموجودة.
- حالة GitHub.
- حالة Auto Backup.
- حالة Auto Restore.
- آخر Restore.
- آخر خطأ.
- صحة schedule.
- storage growth.
- retention warnings.

## Backup Types

### Database Backup

يشمل قاعدة البيانات فقط.

ينتج:

- database dump.
- schema version.
- migration version.
- manifest.
- checksum.

### Uploads Backup

يشمل الملفات المرفوعة فقط.

ينتج:

- compressed uploads archive.
- file index.
- manifest.
- checksum.

### Full Backup

يشمل:

- database.
- uploads.
- platform restore settings.
- backup settings export.
- manifest.

لا نستخدم V1/V2. نبدأ مباشرة بهذا النظام.

## Manual Backup

من Backup Center:

Action: Backup Now.

يختار Super Admin:

- Database.
- Uploads.
- Full.

مع note اختيارية تظهر في history.

## Auto Backup

كل نوع Backup له إعدادات مستقلة من Admin UI:

- enabled.
- schedule interval.
- last run.
- next run.
- retention count.
- compression algorithm.
- upload to GitHub enabled.

الإعدادات تخزن في database، لا في الكود.

## Railway Execution Strategy

### Option A: Railway Cron

مناسب كبداية إذا كان متاحًا ومستقرًا.

### Option B: App-level Scheduler

يمكن تشغيل scheduler داخل التطبيق، لكنه خطر مع multiple instances.

### Recommended

استخدم Railway Cron أو job منفصل لتشغيل endpoint داخلي آمن، مع distributed lock داخل database.

القفل يمنع تشغيل نسختين لنفس backup.

Lock fields:

- jobType.
- lockedAt.
- lockedBy.
- expiresAt.

إذا كان lock نشطًا، لا تبدأ مهمة جديدة.

## Backup Storage Flow

1. يبدأ job.
2. ينشئ سجل BackupJob.
3. يأخذ lock.
4. ينشئ الملفات محليًا مؤقتًا.
5. يضغط الملفات.
6. ينشئ Manifest.
7. يحسب SHA-256.
8. يتحقق من سلامة archive.
9. يرفع إلى GitHub branch خاص.
10. يتحقق أن الرفع اكتمل.
11. يحدّث الحالة إلى completed.
12. يسجل AuditLog.
13. يطلق retention cleanup إن لزم.

## GitHub Storage

لا نستخدم main.

نستخدم branch مستقل:

- `backups`

أو:

- `platform-backups`

الاقتراح الأفضل: `platform-backups`.

سبب الاسم:

- واضح.
- لا يختلط بالكود.
- قابل لإضافة أنواع أخرى لاحقًا.

## GitHub Folder Structure

اقتراح:

```text
backups/
  2026/
    07/
      database/
        2026-07-06T120000Z_backup-id/
          database.dump.zst
          manifest.json
      uploads/
        2026-07-06T123000Z_backup-id/
          uploads.tar.zst
          file-index.json
          manifest.json
      full/
        2026-07-06T130000Z_backup-id/
          database.dump.zst
          uploads.tar.zst
          restore-settings.json
          manifest.json
```

## Manifest

كل Backup يحتوي `manifest.json`.

يشمل:

- backupId.
- type.
- createdAt.
- completedAt.
- platformVersion.
- gitCommitSha.
- databaseMigrationVersion.
- databaseProvider.
- usersCount.
- tenantsCount.
- sitesCount.
- mediaFilesCount.
- totalSizeBytes.
- compressedSizeBytes.
- compressionAlgorithm.
- encryptionEnabled.
- encryptionAlgorithm.
- sha256Checksum.
- localVerificationStatus.
- githubUploadStatus.
- githubBranch.
- githubPath.
- durationMs.
- uploadDurationMs.
- createdBy.
- trigger: manual/auto.
- note.

## Compression

الاقتراح:

- `zstd` كخيار افتراضي لأنه سريع وفعال.
- `gzip` fallback إذا لم يتوفر.

الإعداد قابل للتعديل من Backup Settings.

## Encryption

حتى لو لم يذكر في المتطلبات، يجب إضافته.

التوصية:

- encryption قبل رفع النسخة إلى GitHub.
- مفتاح التشفير في environment secret.
- تدوير المفاتيح لاحقًا.

تحذير:

- إذا ضاع مفتاح التشفير، تصبح النسخ غير قابلة للاستعادة.
- يجب توثيق secret recovery داخليًا.

## Backup Verification

لا تعتبر النسخة ناجحة إلا بعد:

- اكتمال الملفات.
- وجود Manifest.
- صحة Manifest.
- صحة SHA-256.
- القدرة على قراءة archive.
- database dump sanity check.
- GitHub upload confirmed.

الحالة النهائية:

- completed.
- failed.
- verification_failed.
- upload_failed.

## Restore Center

داخل Backup Center يوجد Restore Center.

Restore From:

- Local.
- GitHub.

Restore Type:

- Database.
- Uploads.
- Full.

قبل Restore:

- تحذير واضح.
- طلب تأكيد.
- منع restore متزامن.
- إنشاء pre-restore backup إن أمكن.

## Restore Verification

قبل الاستعادة:

- تنزيل backup إن كان من GitHub.
- قراءة Manifest.
- التحقق من checksum.
- التحقق من platform compatibility.
- التحقق من migration version.
- التحقق من archive readability.

إذا فشل أي تحقق، توقف العملية.

## Auto Restore

المطلوب: إذا كانت قاعدة البيانات فارغة عند تشغيل المنصة لأول مرة، يبحث النظام عن أحدث نسخة مناسبة في GitHub ويستعيدها.

التوصية الأكثر أمانًا:

- Auto Restore لا يبدأ إلا إذا:
  - database empty.
  - AUTO_RESTORE enabled في platform settings أو environment bootstrap flag.
  - لا توجد علامة تمنع restore.
  - النسخة verified.

السبب:

- auto restore خطير إذا أخطأ في بيئة production قائمة.

## Backup History

كل Backup يظهر في history:

- date.
- type.
- size.
- duration.
- status.
- local status.
- GitHub status.
- note.
- created by.
- actions.

Actions:

- Download.
- Restore.
- Verify.
- Delete.
- Details.

Delete rules:

- لا حذف لآخر نسخة سليمة من كل نوع.
- لا حذف دون permission Super Admin.
- Audit mandatory.

## Backup Settings

من Admin UI:

- retention count.
- retention policy.
- auto backup on/off.
- auto restore on/off.
- schedule لكل type.
- GitHub branch.
- GitHub path prefix.
- compression algorithm.
- encryption on/off.
- backup notes policy.

لا تعتمد على تعديل الكود لتغيير هذه الإعدادات.

## Security

Backup operations محمية بـ Super Admin فقط.

قواعد:

- Audit لكل عملية.
- distributed lock.
- no concurrent restore.
- no deleting last valid backup.
- verify before restore.
- encryption for GitHub storage.
- limited visibility for backup secrets.

## Audit Events

سجل:

- Backup Started.
- Backup Completed.
- Backup Failed.
- Backup Verification Passed.
- Backup Verification Failed.
- Backup Uploaded To GitHub.
- Restore Started.
- Restore Completed.
- Restore Failed.
- Backup Deleted.
- Backup Settings Changed.

مع:

- time.
- actor.
- reason/note.
- result.
- backupId.
- ip/userAgent.

## Disaster Recovery Plan

سيناريو: فقدان مشروع Railway بالكامل.

خطوات الاستعادة:

1. إنشاء مشروع Railway جديد.
2. ربط GitHub repository.
3. ضبط environment variables الأساسية:
   - database URL.
   - GitHub token.
   - backup branch.
   - encryption key.
   - auth secrets.
4. تشغيل deployment من آخر commit مستقر.
5. عند startup، النظام يكتشف database empty.
6. Auto Restore يبحث في GitHub branch `platform-backups`.
7. يختار أحدث Full Backup verified ومتوافق.
8. ينزل backup.
9. يتحقق من manifest/checksum/encryption.
10. يستعيد database.
11. يستعيد uploads.
12. يشغل post-restore checks.
13. يسجل Restore Completed.
14. Super Admin يراجع System Health.

## Post-Restore Checks

- user count.
- tenant count.
- sites count.
- media files count.
- latest migration.
- login works.
- public site works.
- dashboard opens.
- admin opens.
- backup center sees restored state.

## Weaknesses in Current Railway + GitHub Plan

- GitHub ليس object storage.
- uploads الكبيرة قد تضخم repository.
- Git history قد يصبح ثقيلًا.
- encryption key management حساس.
- Railway local disk مؤقت ولا يعتمد عليه.
- Auto Restore خطير إذا لم يقيد.

## Improvements

### Short Term

- zstd compression.
- encryption.
- GitHub branch منفصل.
- retention policy صارمة.
- verification before success.
- restore drills شهريًا.

### Medium Term

- Cloudflare R2 أو S3 للنسخ الكبيرة.
- GitHub يحتفظ فقط بالmanifest أو database backups الصغيرة.
- external monitoring للbackup failures.

### Long Term

- cross-region backups.
- point-in-time recovery.
- automated restore testing في staging.

## Recovery Targets

مقترح:

- RPO: 24 ساعة في البداية، ثم 6 ساعات، ثم ساعة.
- RTO: أقل من 4 ساعات في البداية، ثم أقل من ساعة.

## Final Rule

Backup لا يعتبر ناجحًا لأنه "تم إنشاؤه". يعتبر ناجحًا فقط إذا تم التحقق منه ويمكن استعادته.
