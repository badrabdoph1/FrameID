# FrameID Services Platform – Architecture & Product Ecosystem Design

**الحالة:** معتمد للتنفيذ
**التاريخ:** 2026-07-22

## القرار التنفيذي

تتطور FrameID إلى منصة منتجات متعددة داخل Modular Monolith. يظل `Tenant` مساحة العميل، ولا يعود `Site` أو أحدث `Subscription` هو السياق الوحيد للحساب. تتكون المنصة من Modules عميقة مستقلة:

- Product Registry: تعريف Products التنفيذية وAdapters التفعيل.
- Catalog: Products وOfferings وPrices وCapabilities وBundles وTrials وWorkflows وإصدارات النشر.
- Eligibility: الظهور والأهلية والشراء وسبب القرار.
- Acquisition: لقطة الطلب التجاري والأسعار والشروط.
- Communication Core: Conversation وTimeline وWorkItem وSLA فقط.
- Payment: حقيقة التحصيل والمحاولات والاسترداد.
- Fulfillment: تنفيذ Workflows اليدوية والآلية والهجينة.
- Entitlements: حقيقة حق الاستخدام والحدود.
- Product Instances: النسخ الفعلية المفعلة وحالتها.
- Service Subscriptions: العقود المتكررة المستقلة.
- Recommendations وAnalytics: الترشيح القابل للتفسير والقياس.

## التدفق المرجعي

```text
Catalog → Eligibility → Acquisition → Conversation/WorkItem
        → Payment عند الحاجة → Fulfillment → Entitlements
        → Activation → Product Instance
```

لا تفتح المنصة معاملة طويلة مشتركة بين Services وCommunication. ينشئ Services الـAcquisition أولًا بمفتاح idempotency، ثم يستدعي واجهة Communication العامة ويربطه عبر:

```text
namespace=services
entityType=acquisition
relationKey=primary
```

تعالج إعادة المحاولة أو المصالحة أي فشل بين الحدين.

## Catalog

Product ليس ما يباع؛ Offering هو الاقتراح التجاري. Price إصدار زمني، وCapability حق قابل للمنح. حالات النشر (`DRAFT`, `IN_REVIEW`, `PUBLISHED`, `PAUSED`, `RETIRED`) منفصلة عن مرحلة الإصدار (`ANNOUNCED`, `PRIVATE_PREVIEW`, `BETA`, `GA`, `DEPRECATED`) وعن أسلوب البيع والتنفيذ.

Product جديد يسجل Adapter في Product Registry. خدمة يدوية جديدة تستطيع استخدام Workflow موثوقًا بلا تعديل النواة. لا يسمح للأدمن بتشغيل JavaScript أو SQL أو Workflow حر.

## Lifecycles

- WorkItem: `NEW → IN_PROGRESS ↔ WAITING_CUSTOMER/WAITING_INTERNAL → RESOLVED → CLOSED`.
- Acquisition: `DRAFT → REQUESTED → QUALIFYING → ACCEPTED → AWAITING_PAYMENT → PAID → FULFILLING → FULFILLED` مع `DECLINED/CANCELLED/REFUNDED`.
- Fulfillment: `PENDING → RUNNING → WAITING_CUSTOMER/WAITING_INTERNAL → READY → SUCCEEDED` مع `FAILED/CANCELLED`.
- Product Instance: `PROVISIONING → ACTIVE ↔ SUSPENDED → EXPIRED → DEPROVISIONED`.

الواجهة تعرض حالة مشتقة بسيطة ولا تدمج هذه الحقائق في enum واحد.

## Entitlements والاشتراكات

Entitlement Resolver هو المصدر الوحيد للوصول. المصادر الممكنة: Plan legacy، Service Subscription، Add-on، Bundle، شراء مرة واحدة، Trial Grant، أو Grant إداري. انتهاء اشتراك منتج لا يغير `Tenant.status` ولا يوقف منتجات أخرى.

## Customer Experience

مركز الخدمات Mobile First ويعرض `خدماتي` قبل الاكتشاف، ثم `اكتشف` و`طلباتي` و`الفوترة`. تظهر Coming Soon وBeta بوضوح. الترشيحات محدودة وقابلة للإخفاء وتشرح سببها. صفحة `/dashboard/services` الحالية تظل محرر Photographer Packages ويُوضح اسمها؛ مركز المنصة يستخدم `/dashboard/service-center` لتجنب كسر الروابط.

## Admin Experience

مركز `المنتجات والخدمات` يدير Catalog وإصدارات النشر والأسعار والCapabilities والBundles والتجارب والWorkflows وAcquisitions وFulfillment وEntitlements وقواعد الترشيح والتحليلات. كل mutation يمر عبر Module المجال وصلاحية server-side وAudit.

## Scale and security

- tenant scope مشتق من الجلسة.
- السعر يحسب على السيرفر ويحفظ snapshot.
- idempotency وunique constraints لكل command حساس.
- Transactional Outbox وworkers بleases وretry/dead-letter.
- cursor pagination وindexes مركبة وread models.
- لا Microservices أو AI أو Data Warehouse في الإصدار الحالي؛ تبنى Interfaces وAdapters فقط.

## Migration

تبقى `Plan`, `Subscription`, `PaymentRequest`, `Package`, و`ExtraService` بلا حذف. يمثل Product `pricing-site` المنتج الحالي، وتتحول بياناته تدريجيًا إلى Catalog وEntitlements مع compatibility reads حتى اكتمال المصالحة.
