# Services Platform Context

هذا السياق يصف اللغة التجارية والتشغيلية لمنتجات وخدمات FrameID. لا يملك الرسائل أو التحصيل المالي؛ يتكامل مع Communication Core وBilling من خلال معرفات وأحداث مستقرة.

## Catalog

**Product**:
قدرة مستقلة تقدمها FrameID ويمكن أن تملك نسخة تشغيلية داخل حساب العميل، مثل موقع الأسعار أو معرض الصور.
_Avoid_: Service, Plan, Package

**Offering**:
الاقتراح التجاري القابل للطلب أو الشراء، مثل خطة منتج أو إضافة أو خدمة لمرة واحدة أو Bundle.
_Avoid_: Product, Plan كاسم عام، Package

**Price**:
نسخة زمنية غير قابلة للتعديل بأثر رجعي لسعر Offering في عملة وفترة فوترة محددتين.
_Avoid_: Amount, Cost

**Capability**:
حق أو حد قابل للمنح والاستهلاك، مثل دومين مخصص أو مساحة تخزين أو رصيد AI.
_Avoid_: Feature Flag, Feature نصية

**Bundle**:
Offering ثابت يتكون من Offerings أخرى ويباع كوحدة تجارية واحدة.
_Avoid_: Package

## Customer lifecycle

**Acquisition**:
السجل التجاري لما طلبه العميل، ويحتفظ بلقطة العناصر والأسعار والشروط وقت الطلب.
_Avoid_: CustomerRequest, Conversation, Order Request

**Fulfillment**:
التنفيذ الذي يحول Acquisition مقبولًا ومدفوعًا عند الحاجة إلى استحقاقات ونسخة منتج جاهزة.
_Avoid_: Activation كاسم للعملية كلها

**Entitlement**:
المصدر الرسمي لحق Tenant في Capability خلال فترة محددة وبحد اختياري.
_Avoid_: Feature Flag, Plan check

**Product Instance**:
نسخة فعلية من Product مملوكة لـTenant، مثل موقع أسعار بعينه أو معرض صور بعينه.
_Avoid_: Product, Site كاسم عام

**Service Subscription**:
عقد متكرر على Offering مستقل عن حالة Tenant وعن أي اشتراك آخر.
_Avoid_: Tenant status, Plan

**Trial Grant**:
منحة تجربة لOffering أو Product بمدة أو حد استخدام مستقلين عن حالة Tenant العامة.
_Avoid_: Tenant trial

## Integration

**Work Item**:
متابعة تشغيلية يملكها Communication Core وتجيب عمّن ينتظر من، ولا تمثل الحالة التجارية أو المالية.
_Avoid_: Acquisition, Fulfillment

**Photographer Package**:
باقة ينشئها المصور ليعرضها لعملائه داخل موقعه العام، وهي `Package` القديمة في المشروع.
_Avoid_: FrameID Plan, Offering

**Legacy Plan**:
خطة الفوترة الحالية لموقع الأسعار، وتبقى طبقة توافق حتى يتم نقل الاستهلاك إلى Offering وEntitlements.
_Avoid_: Product, Offering جديد
