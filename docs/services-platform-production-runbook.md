# دليل تشغيل FrameID Services Platform

## النشر وقاعدة البيانات

المسار المعتمد في المشروع هو:

`DATABASE_URL=... npm run db:deploy:safe`

هذا المسار:

1. يطبّق إصلاح التوافق السابق للدفع.
2. يزامن Prisma schema الحالي.
3. يطبق `20260723011000_services_platform_hardening` لضمان الفهارس الجزئية التي لا يمثلها Prisma schema.
4. يطبق `20260726021500_services_reconciliation_checkpoints` لحفظ مؤشرات المصالحة الدورية.
5. يشغّل إصلاحات التوافق التاريخية idempotently.
6. يشغّل seed المنصة.

Seed منصة الخدمات insert-only: يضيف baseline الناقص ولا يعيد كتابة Product أوOffering أوPrice أوCapability أوTrial Policy أوWorkflow موجودة، ولا ينشر تعديل Draft تلقائيًا.

## إتاحة الواجهة أثناء التطوير

- مفتاح الإتاحة المركزي هو `services-platform-ui-visible` في `FeatureFlag` على مستوى `PLATFORM`.
- عدم وجود المفتاح يعني أن منصة الخدمات مخفية افتراضيًا.
- يُدار المفتاح من «إعدادات المنصة ← منصة الخدمات ← إظهار قسم الخدمات».
- عند الإخفاء تختفي روابط مركز الخدمات من لوحات العميل والأدمن، وتُحجب مساراتها المباشرة وإجراءات النماذج القديمة المفتوحة قبل الإخفاء.
- الإخفاء يخص واجهة الوصول فقط؛ لا يوقف Outbox أوالمصالحة أومعالجة الطلبات القائمة في الخلفية.

لا تعدّل ملفات migrations التاريخية. سلسلة `prisma migrate deploy` القديمة تحتوي دينًا سابقًا في migration الدفع، وإصلاحها الصحيح هو مشروع rebaseline مستقل بعد جرد قواعد الإنتاج، لا تغيير checksum داخل feature branch.

## الجدولة

- `/api/cron/services-outbox`: كل دقيقة.
- `/api/cron/services-reconciliation`: كل خمس دقائق.
- يجب ضبط `CRON_SECRET` في production وإرسال `Authorization: Bearer <CRON_SECRET>` عند استخدام scheduler غير Vercel.

## مؤشرات الصحة

راقب القيم التالية:

- عدد `ServicesOutboxEvent` في `DEAD_LETTER` يجب أن يساوي صفرًا.
- أقدم حدث `PENDING` لا ينبغي أن يتجاوز دقيقتين في التشغيل الطبيعي.
- `ProductInstance` في `PROVISIONING` لأكثر من ساعة يظهر كـanomaly في reconciliation.
- `FulfillmentRun` في `RUNNING` بعد انتهاء lease يُحوّل إلى `FAILED` ويُعاد طلب تشغيله تلقائيًا بمفتاح side-effect ثابت.
- كل محاولة تحمل fencing token مستقلًا؛ محاولة فقدت الـlease أو انتهت صلاحيته زمنيًا لا تستطيع التجديد أو كتابة `SUCCEEDED` أو `FAILED` أو checkpoint فوق محاولة أحدث.
- الاشتراكات `PAST_DUE` و`GRACE_PERIOD` تحتاج متابعة بوابة الدفع.
- أي نتيجة `503` من reconciliation تعني حالة متدهورة وتتطلب تنبيهًا.
- `unsafeCommunicationLinks` أو`unrecoverableOrphans` فوق الصفر تعني رابطًا غير آمن أو طلبًا يفتقد بيانات الاستعادة، وتحتاج مراجعة تشغيلية فورية.

## استعادة حدث أو تنفيذ فاشل

- أحداث Outbox الفاشلة يعاد جدولتها تلقائيًا مع exponential backoff حتى `DEAD_LETTER`.
- تنفيذ Fulfillment الفاشل يعاد من لوحة الإدارة بزر «إعادة المحاولة»؛ يعاد نفس Workflow ولا يسمح بالانتقال اليدوي فوق الفشل.
- المصالحة تعيد تشغيل الـrun الذي انتهت lease الخاصة به، وتغلق Acquisition العالق في `FULFILLING` إذا كان الـrun قد وصل بالفعل إلى `SUCCEEDED`.
- المصالحة تستعيد محادثة الطلب الذي تعطل بين إنشاء Acquisition وفتح Communication، وتعيد Context Reference المفقود مع التحقق من تطابق tenant ومن زوج `conversationId + entityId` معًا.
- المصالحة تستدعي `Communication Core.attachContext` عند الإصلاح كي يمر التحقق ويُنشأ Communication Outbox Event، ولا تكتب في جداول Communication مباشرة.
- راقب `entitlementDrift` و`instanceDrift` و`unreadableFulfillmentSnapshots`؛ أي قيمة فوق الصفر تعني اختلافًا بين لقطة الطلب المكتمل وما تم منحه أو تفعيله فعليًا، وتحوّل نتيجة المصالحة إلى `DEGRADED`.
- تحفظ `ServicesReconciliationCheckpoint` موضع keyset مستقلًا لفحص Communication وFulfilled Acquisitions. عند نهاية كل دورة يعود المؤشر إلى البداية، وبذلك تُفحص كل السجلات تدريجيًا مهما تجاوز العدد حد الدفعة 500.
- أي Workflow قد يتجاوز 15 دقيقة يجب أن يستدعي `context.heartbeat()` دوريًا؛ فقدان الـtoken يوقف الكتابة النهائية ويترك المصالحة للمحاولة الأحدث.
- لا تنشئ FulfillmentRun يدويًا؛ استخدم runtime أو أعد حدث `services.fulfillment.requested` بمفتاح deduplication ثابت.

## الاسترداد أثناء التنفيذ

لا يسمح النظام بتحويل دفعة إلى `REFUNDED` بينما Acquisition في `FULFILLING`، لأن التزويد الخارجي قد يكون جارياً. انتظر اكتمال التنفيذ ثم نفّذ الاسترداد من لوحة الإدارة ليعمل مسار التعويض الكامل، أو استرد قبل بدء التنفيذ عندما تكون الحالة `PAID`.

## إضافة منتج جديد

1. أضف Product Adapter إلى Product Registry إن كان المنتج يحتاج تفعيلًا تقنيًا.
2. أنشئ Product Definition وعروضه وأسعاره وقدراته وWorkflow Template من لوحة الإدارة.
3. استخدم Preview وعالج كل validation errors.
4. انشر Catalog Revision.
5. اختبر الطلب والدفع والتنفيذ والتفعيل في Tenant اختبار.

لا يلزم تعديل Acquisition أوPayments أوEntitlements أوCommunication Core لإضافة منتج جديد.
