# دليل تشغيل مركز التواصل

## متطلبات النشر

1. طبّق migrations قبل تشغيل النسخة الجديدة: `npm run db:migrate`.
2. عيّن `CRON_SECRET` بقيمة طويلة وعشوائية.
3. عيّن `COMMUNICATION_ATTACHMENT_ROOT` إلى volume خاص دائم، ولا تعرضه كملفات static.
4. شغّل delivery كل دقيقة، وbackfill كل دقيقة أثناء الانتقال، وreconciliation كل خمس دقائق.
5. بعد اكتمال backfill أوقف جدولة backfill فقط؛ لا توقف delivery أو reconciliation.

## ترتيب الانتقال

1. نشر schema والكود مع dual-write.
2. تشغيل `npm run communication:backfill` أو endpoint الدفعات حتى تصبح النتائج كلها صفرًا.
3. التأكد من أن reconciliation لا يعرض dead events أو مرفقات معلقة أو جمهورًا منشورًا غير مسلم.
4. مراقبة Inbox العميل والأدمن ومعدلات الخطأ لمدة مناسبة.
5. وقف الكتابات القديمة في تغيير مستقل بعد إثبات عدم وجود قارئ يعتمد عليها؛ حذف الجداول القديمة ليس جزءًا من هذه المرحلة.

## الاستجابة للأعطال

- `readyOutboxEvents`: طبيعي لفترة قصيرة؛ استمرار الزيادة يعني أن Worker لا يعمل أو أبطأ من معدل الكتابة.
- `expiredOutboxLeases`: Worker انقطع أثناء المعالجة؛ العنصر قابل لإعادة الالتقاط بعد انتهاء الـlease.
- `deadOutboxEvents`: يحتاج فحص `lastError` وإصلاح السبب ثم أداة replay مدققة قبل الإعادة.
- `failedDeliveryAttempts`: فشل نهائي لقناة/مستلم؛ لا يعني فقد محتوى Conversation.
- `stalePendingAttachments`: ملف عولج لكن لم تُحسم حالته خلال ساعة؛ افحص فشل المعاملة/التخزين.
- `undeliveredPublishedAudiences`: إعلان منشور غير ظاهر في Inbox؛ حالة إنتاج متدهورة.
- `overdueWorkItems`: تجاوز SLA تشغيلي، وليس خلل سلامة بيانات.

## النسخ الاحتياطي والأمان

- قاعدة البيانات والـattachment volume يجب أن يدخلا سياسة النسخ الاحتياطي نفسها.
- لا تُخزن روابط عامة للمرفقات؛ الوصول دائمًا عبر endpoint مفوض وبـ`no-store`.
- لا تطبع body أو أسماء الملفات أو أخطاء المزود الخام في Outbox logs.
- صلاحيات العميل تؤخذ من الجلسة فقط، وصلاحيات الأدمن من `support`/`messages` RBAC.
