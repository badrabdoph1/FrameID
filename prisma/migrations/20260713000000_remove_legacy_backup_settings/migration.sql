-- حذف إعدادات النسخ القديمة؛ السياسة الرسمية موجودة في backup-policy فقط.
ALTER TABLE "BackupSettings" DROP COLUMN IF EXISTS "compression";
ALTER TABLE "BackupSettings" DROP COLUMN IF EXISTS "encryption";
ALTER TABLE "BackupSettings" DROP COLUMN IF EXISTS "githubBranch";
