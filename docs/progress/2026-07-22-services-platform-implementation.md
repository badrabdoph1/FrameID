# تقرير تنفيذ FrameID Services Platform

## الحالة

نُفذت منصة الخدمات كـ **Modular Monolith** داخل نطاق مستقل في `src/modules/services-platform`. أصبح المسار التشغيلي الكامل:

`Catalog → Acquisition → Communication Core → Payment → Fulfillment → Entitlements → Activation → Product Instance`

ولا تعتمد النواة على منتج بعينه؛ المنتج التنفيذي يُسجل من خلال `Product Registry`، بينما تبقى بيانات العرض والتسعير في PostgreSQL بإصدارات نشر مستقلة.

## القرارات المعمارية المنفذة

1. `Product` هو المنتج التنفيذي، و`Offering` هو ما يُباع أو يُطلب، و`Photographer Package` يظل باقة ينشئها المصور لعميله. لم يُعد استخدام `Plan` أو `Package` كأسماء عامة داخل المنصة.
2. `Acquisition` هو الحقيقة التجارية للطلب. `Conversation` و`WorkItem` يملكهما Communication Core ولا يخزنان السعر أو حالة الدفع أو التفعيل.
3. حالات Tenant وBilling وProduct منفصلة. مصدر صلاحية استخدام القدرات هو `Entitlement` فقط.
4. الأسعار والقدرات وشروط الأهلية تُنسخ وقت الطلب؛ تغيير الكتالوج لاحقًا لا يغير الطلب التاريخي.
5. كل عملية حساسة لها مفتاح idempotency، وتولد حدثًا في `ServicesOutboxEvent` داخل نفس المعاملة متى كانت العملية Prisma-backed.
6. لا توجد Microservices أو AI أو Data Warehouse. أضيفت interfaces محايدة للنقل والتزويد والتحليلات والتوصيات لتوسعة مستقبلية بلا تغيير للنواة.

## المراحل المنفذة

### المرحلة 0 — اللغة والحدود

- تثبيت القاموس الرسمي في `docs/contexts/services-platform.md`.
- توثيق ملكية النطاقات في ADR وحدود المشروع وتدفق البيانات.
- إبقاء `Plan` القديم طبقة توافق لفوترة موقع الأسعار، و`Package` القديم باقة المصور الموجهة لعملائه.

### المرحلة 1 — Communication Core

- إنشاء كل طلب خدمة عبر واجهة Communication Core العامة.
- ربط المحادثة بسياق ضعيف: `namespace=services`, `entityType=acquisition`, `relationKey=primary`.
- إنشاء WorkItem من نفس أمر فتح المحادثة عند احتياج العرض لتنفيذ تشغيلي.
- لم يُنشأ نظام رسائل أو طلبات موازٍ.

### المرحلة 2 — Product Registry وCatalog

- Product Definitions وOfferings وأسعار زمنية وCapabilities وBundles وTrial Policies وWorkflow Templates.
- Draft/Preview/Publish/Pause/Retire مع `CatalogRevision` immutable.
- Read Model مخصص للعميل يدعم السوق والعملة والأهلية وComing Soon وBeta.
- Product Registry قابل لإضافة adapters جديدة دون تعديل خدمات Catalog أوAcquisition.

### المرحلة 3 — Entitlement Core

- Resolver حتمي لدمج المنح وسياسات `REPLACE`, `SUM`, `MAX`, `ANY`.
- Entitlements مستقلة عن Tenant/Billing/Product status.
- دعم أكثر من Product Instance وأكثر من اشتراك لنفس Tenant.
- سحب الحقوق حسب مصدرها، وحدود استخدام متزامنة داخل transaction بمستوى Serializable.

### المرحلة 4 — مركز الخدمات

- واجهات Mobile First: خدماتي، اكتشف، الطلبات، الفوترة، تفاصيل المنتج، تفاصيل الطلب.
- عروض Featured وComing Soon وBeta وتجارب مجانية وتوصيات مفسرة.
- روابط مباشرة للمحادثة canonical ولإثبات الدفع.
- إعادة تسمية `/dashboard/services` بصريًا إلى «عروضي وأسعاري» مع الحفاظ على عقد المسار القديم.

### المرحلة 5 — دورة الاقتناء والتنفيذ

- دورة Acquisition محكومة بآلة حالات تمنع القفز بين الدفع والتنفيذ.
- Self-service المجاني يبدأ التنفيذ مباشرة، والمدفوع ينتظر Payment Approval.
- Workflow Registry يدعم instant وautomatic وmanual وcustom quote وbeta application.
- Fulfillment يمنح Entitlements، ينشئ Product Instance، وينشئ Service Subscription تلقائيًا للعروض الدورية.

### المرحلة 6 — نماذج البيع

- خدمات يدوية، خدمات لمرة واحدة، إضافات، Bundles، منتجات آلية، وCustom Quote.
- Bundle مكوّن من Offerings ولا يكرر تعريف المنتج أو السعر.
- الأسعار immutable داخل Acquisition Lines.

### المرحلة 7 — الاشتراكات والتجارب

- Multiple Service Subscriptions مستقلة عن اشتراك Tenant القديم.
- إنشاء وتجديد وPast Due وGrace Period وإلغاء فوري أو نهاية الفترة وانتهاء.
- Trial Grants زمنية أو محدودة بالاستخدام؛ قدرات العرض تُمنح كـEntitlements حتى نهاية المهلة.
- Refund يسجل Payment Log، يحول Acquisition إلى Refunded، يسحب الحقوق، يعلق Product Instances، ويلغي الاشتراكات المرتبطة.

### المرحلة 8 — التوصيات والتحليلات

- Rules Engine حتمي مع الأهلية والأولوية والـplacement والاستبعاد والـcooldown.
- Recommendation Decisions تحمل Attribution ID من العرض حتى Acquisition والتحويل.
- أحداث Catalog view وOffering view وRecommendation shown/clicked/dismissed وAcquisition lifecycle.
- Funnel وتحويل وإسناد ولوحة Admin مستقلة.

### المرحلة 9 — الاستعداد للتوسع

- Outbox worker بآلية claim/lease/retry/exponential backoff/dead-letter.
- Cron محمي لتشغيل Outbox وCron للمصالحة.
- Reconciliation يعيد leases المنتهية، يحدّث حالات الاشتراكات، ويعيد طلب Fulfillment الناقص.
- Extension Points لـRecommendation Provider وAnalytics Sink وProduct Provisioning وDomain Event Publisher.

## قاعدة البيانات والمهاجرات

- Migration: `20260722194500_services_platform_foundation`.
- أضيف 21 نموذجًا تشغيليًا للمنصة و15 enum، وربط اختياري من `PaymentRequest` إلى `Acquisition`.
- عُدلت مهاجرات تاريخية غير آمنة لتصبح قابلة للتطبيق على قاعدة جديدة (`IF EXISTS` / `IF NOT EXISTS` وتصحيح transaction)، دون حذف بيانات حالية.
- تم تطبيق سلسلة المهاجرات كاملة على قاعدة PostgreSQL نظيفة، ثم تشغيل seed الخدمات مرتين لإثبات idempotency.
- توجد فروق schema قديمة سابقة للمنصة بين بعض migrations التاريخية وPrisma schema الحالي؛ لم تُسوَّ بتغييرات تدميرية لأنها خارج نطاق المنصة وتحتاج migration baseline مستقلة.

## الشاشات الجديدة

### العميل

- `/dashboard/service-center`
- `/dashboard/service-center/[productCode]`
- `/dashboard/service-center/acquisitions/[id]`

### الإدارة

- `/admin/services`
- `/admin/services/products/[id]`
- `/admin/services/acquisitions`
- `/admin/services/fulfillment`
- `/admin/services/entitlements`
- `/admin/services/subscriptions`
- `/admin/services/recommendations`
- `/admin/analytics/services`

## نقاط HTTP الجديدة

- `POST /api/services/events`: استقبال أحداث القياس الموثقة من واجهة العميل.
- `GET|POST /api/cron/services-outbox`: تشغيل دفعة أحداث Outbox.
- `GET /api/cron/services-reconciliation`: فحص وإصلاح الانحراف التشغيلي.

كل Cron يتطلب `CRON_SECRET` في production.

## الوحدات الرئيسية

- Registry/Catalog: `product-registry`, `catalog-service`, `catalog-read-model`, `eligibility`.
- Commerce: `acquisition-service`, `payment-integration`, `subscription-service`, `trial-service`.
- Delivery: `fulfillment-service`, `workflows`, `product-instance-service`.
- Access: `entitlement-service`, `entitlement-resolver`, `usage-service`.
- Growth: `recommendation-engine`, `analytics-service`.
- Reliability: `outbox-worker`, `outbox-runtime`, `reconciliation`.
- Extension seams: `extensions`.

## الأمان والأداء

- عزل كل قراءة وكتابة للعميل بـ`tenantId` المستخرج من الجلسة؛ لا يؤخذ Tenant من input العميل.
- أوامر الإدارة محمية بـAdmin Permission Guards ومسجلة في Audit Log.
- السعر المرسل من العميل لا يُستخدم؛ الخادم يقرأ السعر المنشور ويخزنه كلقطة immutable.
- فهارس مركبة لمسارات tenant/status/date وoffering/status وoutbox leasing وattribution.
- حدود pagination/take في لوحات التشغيل، وفصل Read Models عن command services.
- عمليات الاستخدام المتنافسة تعمل بـSerializable transaction، وكل workers قابلة لإعادة التشغيل.

## اختلافات مبررة عن التصور

- لم تُدمج Service Subscription مع `Subscription` القديمة؛ الفصل مقصود حتى يمكن للعميل امتلاك عدة منتجات واشتراكات من دون تغيير حالة Tenant العامة.
- لم يُجعل WorkItem مصدر حالة الطلب؛ Acquisition وFulfillment هما المصدران التجاري والتشغيلي، وWorkItem يحدد المسؤول ومن ينتظر من فقط.
- لم يُنفذ AI أو Message Broker أو Warehouse؛ أضيفت عقود استبدال واضحة فقط، كما طلبت المرحلة التاسعة.
- لم تُحذف `Plan` و`Package` التاريخيتان حفاظًا على التوافق؛ تم حصر معناهما وتجنب استخدامهما في النواة الجديدة.

## تشغيل وصيانة

- يُشغّل Outbox دوريًا بفاصل قصير، وتُشغّل المصالحة كل 5–15 دقيقة.
- يجب مراقبة `DEAD_LETTER` وstale provisioning وPAST_DUE، وإضافة alert عند تجاوز الصفر.
- إضافة منتج جديد تتطلب Product Definition وOfferings منشورة وProduct adapter فقط؛ لا تتطلب تعديل Catalog أوAcquisition أوBilling أوCommunication Core.
