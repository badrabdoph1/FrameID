# دليل التعافي الكامل

1. اجعل مستودع FrameID خاصًا واضبط متغيرات GitHub Backup.
2. بعد فقد Railway: نفذ `git clone` و`npm ci` وأنشئ PostgreSQL جديدًا واضبط البيئة وانشر التطبيق.
3. نفذ `npm run restore -- latest FULL` أو استخدم «عودة طوارئ من GitHub».
4. تحقق من العملاء والمواقع والاشتراكات والطلبات والصور والملفات.

لا يُنسخ شيء يدويًا من Railway، ولا يعتمد المسار على `backups/` أو صفوف BackupJob السابقة.

## توافق PostgreSQL

إصدار PostgreSQL الرسمي للمشروع هو 18، و`Dockerfile` يثبت `postgresql-client-18` لكل من `pg_dump` و`pg_restore`. تُنفذ العودة من صورة FrameID المنشورة أو بيئة تحمل PostgreSQL client 18؛ الأدوات الأقدم ترفض صيغة النسخة ولا يجوز تجاوز التحقق.
