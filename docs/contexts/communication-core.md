# Communication Core Context

## الغرض

`communication-core` هو المصدر الرسمي لكل محتوى تواصلي محفوظ في FrameID. يخدم الطلبات، الرسائل المباشرة، أحداث النظام ذات القيمة للعميل، والإعلانات من خلال نموذج واحد، من دون معرفة منطق أي Product.

## يملك

- `CommunicationConversation` وهوية الموضوع وترتيبه.
- `CommunicationEntry` كمصدر وحيد للنص والـTimeline.
- `CommunicationAudience` لإتاحة المحادثة داخل Inbox.
- `CommunicationReadCursor` للقراءة الدقيقة monotonic.
- `CommunicationWorkItem` الاختياري والمتابعة التشغيلية المشتركة.
- `CommunicationWorkItemEvent` كوقائع انتقال قابلة للتحليل وإعادة البناء.
- `CommunicationContextReference` للربط الضعيف العام.
- metadata مرفقات التواصل وحالة فحصها، لا تنفيذ التخزين نفسه.
- `CommunicationCampaign` لتعريف النشر والجمهور، لا نسخة المحتوى.
- `CommunicationOutboxEvent` و`CommunicationDeliveryAttempt` كعقد توصيل، لا نسخ الرسالة.

## لا يملك

- Product catalog أو التسعير أو الأهلية.
- `Acquisition` أو الدفع أو الاشتراك أو الاستحقاقات أو fulfillment.
- دورة حياة Site/Domain/Invitation أو أي Product instance.
- صلاحية المستخدم في كيان Product؛ يتحقق منها Module المالك قبل الاستدعاء.
- حل Segment تجاري من الباقة أو الاشتراك؛ يمرر `communication-audience` مستلمين موثوقين.
- رفع الملف أو فحص Magic Bytes أو توقيع الرابط؛ يمر metadata ملف جهزه `communication-attachments`.
- البريد وPush ومزودو القنوات؛ يستهلكها `communication-delivery` من Outbox.

## Public API

واجهة الكتابة الوحيدة هي `createCommunicationCore(repository)` وتعرض:

- `openConversation(input)`
- `appendEntry(input)`
- `appendSystemEvent(input)`
- `attachContext(input)`
- `markRead(input)`
- `transitionWorkItem(input)`
- `manageWorkItem(input)`
- `publishCampaign(input)`
- `withdrawCampaign(input)`

لا يجوز للصفحات أو Product Modules الكتابة المباشرة في جداول Communication.

## Context Reference Contract

```ts
type CommunicationContextReference = {
  namespace: string;
  entityType: string;
  entityId: string;
  relationKey: string;
};
```

- `namespace` يحدد Module المالك مثل `services`, `billing`, `sites`.
- `entityType` مفتاح نوع داخل الـModule، وليس enum مركزيًا.
- `entityId` opaque ويحافظ على حالته الأصلية.
- `relationKey` يصف العلاقة مثل `primary`, `source`, `related`.
- لا يوجد FK إلى entity خارج Communication.
- لا يثبت المرجع الصلاحية أو وجود الكيان. الـModule المالك يفعل ذلك قبل الاستدعاء.
- Resolver الاسم/الرابط يسجل مستقبلًا في Composition Root؛ لا يدخل بيانات Product إلى النواة.

## Contract لمركز الخدمات

`services` ينشئ `Acquisition` ولقطة السعر في حدّه، ثم يستدعي النواة بمفتاح idempotency مشتق من العملية، ويربط المحادثة بـ:

```text
namespace=services
entityType=acquisition
entityId=<opaque acquisition id>
relationKey=primary
```

تغيرات fulfillment التي تهم العميل تستخدم `appendSystemEvent`. الحالة التجارية تبقى داخل Services Platform، ولا يقرأ Communication جداول الخدمات لاتخاذ قرار.

## Identity and authorization

- actor اتحاد صريح: Customer/User أو Admin/AdminUser أو System/systemKey.
- قاعدة البيانات تفرض XOR للمعرفات؛ لا يوجد polymorphic actor غامض.
- UI/Action تستخرج `tenantId` وactor من جلسة موثوقة، ولا تعتمد قيم نموذج العميل.
- النواة تمنع Customer من `ADMIN_ONLY` و`INTERNAL_NOTE`.
- فحص امتلاك العميل للـTenant وصلاحيات الأدمن row-level مسؤولية Application authorization قبل استدعاء Core. لا تتحول النواة إلى مستودع صلاحيات لكل Product.

## Transaction boundaries

- فتح محادثة يكتب Conversation + first Entry + Audience + WorkItem الاختياري + Contexts + attachment metadata + Outbox داخل transaction واحدة.
- الرد يحجز Sequence بتحديث شرطي على `lastSequence` و`version`; لا يستخدم `max(sequence)+1`.
- انتقال WorkItem يخصص Timeline sequence ويكتب structured event وOutbox في transaction واحدة.
- القراءة لا تنخفض، ولا يمكن تعليم Sequence مستقبلية كمقروءة.
- كل command منشئ يملك idempotency key وقيد قاعدة بيانات مناسبًا.

## Events

الأسماء الحالية versioned:

- `communication.conversation.opened.v1`
- `communication.entry.appended.v1`
- `communication.context.attached.v1`
- `communication.work_item.transitioned.v1`
- `communication.campaign.published.v1`

يحمل payload معرفات وsequence/status فقط. لا يحمل subject/body أو بيانات دفع/منتج.

## واجهات الاستخدام المنفذة

- Inbox العميل: `/dashboard/communication` مع البحث البصري، عداد غير المقروء، إنشاء طلب، Timeline، ردود وصور خاصة.
- Inbox الأدمن: `/admin/communications` مع البحث والفلاتر والترتيب والحالة والأولوية والتعيين والملاحظات الداخلية.
- الإعلانات: `/admin/communications/broadcasts` و`/admin/communications/broadcasts/new` لجماهير الكل، التجريبي، المشترك، المنتهي أو قائمة صريحة.
- تنزيل المرفقات يمر حصريًا عبر `/api/communication/attachments/:id` بعد التحقق من الجلسة والجمهور والظهور وحالة الفحص.

## Delivery boundary

Core يكتب Transactional Outbox ويجهز `status`, `availableAt`, `leaseOwner`, `leaseExpiresAt`, `attempts`, وdead-letter state. `communication-delivery` يملك lease claim شرطيًا، retry/backoff، idempotent delivery attempts، وdead-letter state. الـIn-App adapter يعلّم Audience بالتسليم ولا ينسخ نص الرسالة. Product Modules تستهلك الأحداث أو تستدعي Commands؛ لا تنشئ Outbox rows اعتباطيًا.

التشغيل المجدول:

- `POST /api/cron/communication-delivery` لمعالجة دفعة Outbox.
- `POST /api/cron/communication-backfill` لترحيل دفعة من المصادر القديمة.
- `GET /api/cron/communication-reconciliation` لفحص الانحرافات التشغيلية؛ يعيد `503` عند وجود حالة متدهورة.
- كل المسارات تتطلب `Authorization: Bearer $CRON_SECRET` في الإنتاج.

## المرفقات

- الإصدار الحالي يقبل صورًا فقط، بحد أقصى 5 صور و5MB للصورة.
- الملف يُفك ترميزه للتحقق من أنه صورة حقيقية، ويعاد ترميزه WebP بأبعاد محدودة قبل وضعه في تخزين خاص.
- metadata فقط تدخل معاملة Core، ثم تتحول الحالة إلى `CLEAN` بعد نجاح المعاملة؛ وتُنظف الملفات تلقائيًا عند فشل الكتابة.
- `COMMUNICATION_ATTACHMENT_ROOT` يحدد جذر التخزين الخاص. الافتراضي `.data/communication-attachments` مناسب لعقدة ذات قرص دائم، وليس لتشغيل متعدد العقد بلا volume مشترك.

## الربط والترحيل

- `communication-center/legacy-bridge` هو Adapter انتقالي idempotent للإشعارات وطلبات العملاء وحالات الدعم وحملات الرسائل القديمة.
- الدفع، حل مشكلات العملاء، حذف الحساب، والرسائل المباشرة/الجماعية الحالية تستخدم النواة عند نقاط التركيب مع إبقاء الكتابة القديمة مؤقتًا للتوافق. الرسالة الفردية من ملف العميل أصبحت `DIRECT Conversation` قابلة للرد، والجماعية فقط هي Campaign.
- `npm run communication:backfill` يرحل التاريخ القديم على دفعات، مستخدمًا Context أو مفاتيح المصدر لمنع التكرار.
- لا تحذف الجداول القديمة قبل اكتمال backfill، نجاح reconciliation، ومرور فترة مراقبة متفق عليها.

## حدود الإنتاج الحالية

- قناة In-App مكتملة. البريد وPush وSMS ليست مفعلة؛ إضافتها تتم كـDelivery Adapters من دون تغيير Core.
- `publishCampaign` يحل الجمهور قبل الكتابة ويناسبه عشرات الآلاف ضمن حدود الإصدار الحالي. الحملات بمئات الآلاف تحتاج audience expansion worker/checkpoint قبل تفعيلها.
- التخزين المحلي الخاص يحتاج persistent volume وعقدة مشاركة واحدة. عند التوسع الأفقي يجب إضافة S3-compatible adapter ونقل المفاتيح، من دون تغيير جداول Core.
- البحث الحالي يعتمد PostgreSQL واستعلامات مفهرسة للعناوين والعملاء وأرقام المحادثات. البحث الكامل داخل ملايين الرسائل مؤجل لمحرك Projection/Search مستقل.
