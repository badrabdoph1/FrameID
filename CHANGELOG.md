# Changelog

## 2026-07-13 — إغلاق التحقق الكامل بعد الاستعادة

- ترقية Manifest إلى v2 لتسجيل أعداد جميع جداول العملاء المهمة وجرد ملفات FULL بالمسار والحجم وSHA-256.
- منع نجاح Restore عند فقد أي بيانات مسجلة أو تغير أي ملف عميل، مع مسح uploads القديمة قبل فك النسخة.
- إضافة اختبار Round-trip لملف عميل ثنائي فعلي بحجم 2MB، مع إبقاء استعادة Manifest v1 القديمة متوافقة.
- توحيد الوثائق على أن بيانات العملاء لا تدخل `main` وتوجد في GitHub فقط داخل فرعي النسخ المخصصين.
- منع تصادم معرفات النسخ المتقاربة بإضافة الثواني والمللي ثانية و`BackupJob ID` إلى اسم Artifact.

## 2026-07-13 — تثبيت الاستعادة والجدولة التلقائية

- إبقاء سجل الاستعادة ونوع FULL ومصدر GitHub بعد استبدال قاعدة البيانات المستعادة.
- استبدال Cron اليوم من الشهر بفترة 48 ساعة فعلية لا تتغير عند نهاية الشهر.
- إضافة حجز ذري مشترك يمنع تكرار النسخة بين Scheduler الداخلي وGitHub Actions، مع إعادة المحاولة بعد 15 دقيقة عند الفشل.
- منع قاعدة Railway الجديدة الفارغة من إنشاء FULL تلقائية فور الإقلاع وتجاوز النسخ الفارغة عند عودة الطوارئ.
- إلزام التحقق بعد الاستعادة بمطابقة أعداد المستخدمين والعملاء والمواقع والوسائط مع Manifest قبل عرض النجاح.
- إعادة فهرسة النسخة المختارة من Manifest بعد العودة حتى لا يختفي سجلها من لوحة النسخ.

## 2026-07-13 — فصل ملفات المنصة عن ملفات العملاء

- تصحيح مستودع GitHub الذي تستهدفه تعديلات محتوى الأدمن وإلزام نجاح Commit قبل إعلان نجاح الحفظ.
- نقل صور القوالب والمعاينة العامة إلى `public/platform` عبر GitHub بدل `public/uploads` وMediaAsset.
- حذف Scheduler API والتشفير الوهمي ومزودي التخزين المحلي ومسارات النسخ القديمة غير المستخدمة.
- إضافة `content/platform/admin-config.json` كمصدر إصدار لتعديلات الباقات والقوالب والثيمات والدفع وإعدادات ورسائل المنصة، مع استعادة الإصدارات من سجل التعديلات.

## 2026-07-13 — إصلاح تشغيل النسخ من GitHub والإثبات داخل الأدمن

- استبدال أسرار Trigger اليدوية بهوية GitHub Actions OIDC الموقعة.
- إظهار فرع النسخة وCommit ورابط GitHub وحالة مراحل الإكمال داخل صفحة الأدمن.
- تصحيح Seed الإنتاج لتشغيل FULL كل 48 ساعة بدل كل 3 أيام.

## 2026-07-13 — توحيد FrameID Backup Pipeline

- توحيد الإنشاء والاستعادة والتحقق والرفع والاحتفاظ والسجلات.
- تحويل GitHub Actions إلى Trigger فقط ومنع نجاح local-only.
- تثبيت DATABASE كل 12 ساعة/20 وFULL كل 48 ساعة/10.
- دعم العودة من آخر FULL على GitHub وإزالة المسارات القديمة.

## 2026-07-11 — Backup and disaster recovery

- Rebuilt the super-admin backup workspace and fixed the Prisma field mismatch that crashed the page.
- Made GitHub the mandatory external backup destination for completed backups.
- Added local verification before upload and remote verification after upload.
- Added restore-from-GitHub when the local artifact is missing.
- Enforced GitHub retention of the latest 20 database backups and 10 full backups.
- Added restore locking, audit events, path validation, and `pg_restore` validation for PostgreSQL custom dumps.
- Added a production backup runner that starts with the Node process and does not depend on user traffic.
- Routed migration-package creation through the normal verified `FULL` backup pipeline.
- Disabled legacy local-only snapshot and automatic-restore behavior.
- Updated backup production-readiness documentation and recorded the GitHub storage architecture decision.
