# Communication Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** بناء نواة التواصل الرسمية العامة في FrameID، مع مصدر واحد للمحتوى، Context Reference بلا Product coupling، تسلسل وقراءة آمنين، WorkItem اختياري، حملات، ومخرجات Outbox قابلة للتوصيل.

**Architecture:** وحدة عميقة داخل الـModular Monolith بواجهة Commands صغيرة ومستودع ذري واحد. لا تستورد النواة أي Module منتج، ولا تُخزن تفاصيل المنتج؛ تمر المراجع الخارجية كمفاتيح opaque، وتحمل أحداث Outbox معرفات وإصدار schema فقط. تظل واجهات العميل والأدمن وترحيل الكتابات القديمة خططًا لاحقة فوق هذه النواة.

**Tech Stack:** TypeScript 5.9، Next.js 15، Prisma 6/PostgreSQL، Vitest 3، Zod غير مطلوب داخل النواة لأن التحقق Domain-level خفيف ومستقل.

## Global Constraints

- كل Production behavior يبدأ باختبار فاشل ثم أقل تنفيذ ينجحه.
- لا FK ولا import من Communication Core إلى Services/Billing/Sites/Subscriptions أو أي Product Module.
- لا نسخ لـEntry title/body في Campaign أو Outbox أو DeliveryAttempt.
- كل كتابة مركبة ذرية وتنتج Outbox envelope داخل نفس المعاملة.
- `idempotencyKey` إلزامي للأوامر المنشئة، و`expectedLastSequence` إلزامي لردود البشر.
- Timeline وInbox يستخدمان cursor/sequence، لا offset أو `max(sequence)+1`.
- لا تعديل أو حذف للأنظمة القديمة في Migration التأسيسية.
- لا commits آلية أثناء هذه الخطة لأن مساحة العمل المشتركة تحتوي تغييرات مستخدم غير مرتبطة.

## File Structure

- `prisma/schema.prisma`: جداول وعلاقات Communication فقط.
- `prisma/migrations/20260718190000_communication_core/migration.sql`: إنشاء الأنواع والجداول والقيود والفهارس من دون إسقاط قديم.
- `src/modules/communication-core/types.ts`: Ubiquitous language، actors، records، وcommand inputs بلا Prisma types.
- `src/modules/communication-core/validation.ts`: تطبيع المفاتيح والنصوص والتحقق من actor/context/visibility.
- `src/modules/communication-core/state-machine.ts`: انتقالات WorkItem المشتركة فقط.
- `src/modules/communication-core/events.ts`: أسماء الأحداث وإصداراتها وبناء envelope معرفاتي.
- `src/modules/communication-core/repository.ts`: Port ذري يعبّر عن عمليات النواة، لا CRUD عام.
- `src/modules/communication-core/service.ts`: الواجهة العامة المعتمدة والتنسيق قبل المستودع.
- `src/modules/communication-core/prisma-communication-repository.ts`: Transactions، atomic sequence، idempotency، وOutbox.
- `src/modules/communication-core/index.ts`: Public API صغير.
- `tests/communication-core-schema-contract.test.ts`: عقد المخطط والـMigration.
- `tests/communication-core-state-machine.test.ts`: دورة العمل.
- `tests/communication-core-service.test.ts`: سلوك الواجهة العامة بواسطة in-memory port كامل.
- `tests/prisma-communication-repository.test.ts`: صحة حدود المعاملة وتسلسل الكتابات، لا اختبار mock نفسه.
- `docs/contexts/communication-core.md`: حدود الملكية والعقود والاستخدام من Products.
- `docs/planning/14-module-boundaries.md`: تصحيح ملكية Notification وإضافة Communication.

---

### Task 1: Database contract and additive migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260718190000_communication_core/migration.sql`
- Create: `tests/communication-core-schema-contract.test.ts`

**Interfaces:**
- Consumes: `User`, `AdminUser`, `Tenant` الحالية فقط كحدود هوية وجمهور.
- Produces: نماذج `CommunicationConversation`, `CommunicationEntry`, `CommunicationAudience`, `CommunicationReadCursor`, `CommunicationWorkItem`, `CommunicationWorkItemEvent`, `CommunicationContextReference`, `CommunicationAttachment`, `CommunicationCampaign`, `CommunicationOutboxEvent`, و`CommunicationDeliveryAttempt`.

- [ ] **Step 1: اكتب اختبار العقد الفاشل**

يتحقق الاختبار من وجود النماذج والحقول الحرجة والقيود SQL التالية: قيد DIRECT/BROADCAST والـtenant، author XOR، reader XOR، uniqueness للتسلسل/idempotency/context/audience، وفهارس claim/Inbox/WorkItem.

- [ ] **Step 2: شغّل الاختبار وتحقق من RED**

Run: `npm test -- tests/communication-core-schema-contract.test.ts`

Expected: FAIL لأن نماذج Communication والـMigration غير موجودة.

- [ ] **Step 3: أضف المخطط والـMigration الإضافية**

المخطط المطلوب:

```text
Conversation(mode, tenant, typeKey, lifecycle, replyMode, actor, sequence/version)
  -> Entry(sequence, kind, visibility, explicit actor, body/metadata)
  -> Audience(tenant, in-app delivered/archive/withdraw timestamps)
  -> ReadCursor(explicit user/admin reader, monotonic sequence)
  -> WorkItem?(status, priority, queue, SLA/projection/version)
  -> ContextReference(namespace, entityType, entityId, relationKey)
  -> Campaign?(definition/status/counts)
Entry -> Attachment(private storage metadata + scan lifecycle)
WorkItem -> WorkItemEvent(append-only structured transition facts)
Command transaction -> OutboxEvent -> DeliveryAttempt
```

تتضمن SQL Check constraints التي لا يعبر عنها Prisma، ولا تنشئ FK إلى كيان Product.

- [ ] **Step 4: نسّق وتحقق**

Run: `npx prisma format && npx prisma validate && npm test -- tests/communication-core-schema-contract.test.ts`

Expected: Prisma valid وPASS.

### Task 2: Domain language, validation, and workflow

**Files:**
- Create: `src/modules/communication-core/types.ts`
- Create: `src/modules/communication-core/validation.ts`
- Create: `src/modules/communication-core/state-machine.ts`
- Create: `tests/communication-core-state-machine.test.ts`

**Interfaces:**
- Consumes: لا شيء من Modules أخرى.
- Produces: `CommunicationActor`, `OpenConversationInput`, `AppendEntryInput`, `AttachContextInput`, `MarkReadInput`, `TransitionWorkItemInput`, `PublishCampaignInput`, `assertWorkItemTransition`, ومطبعّات المفاتيح والنص.

- [ ] **Step 1: اكتب اختبارات workflow والتحقق الفاشلة**

الحالات المثبتة: الانتقالات المعتمدة، منع القفز غير القانوني، إعادة فتح `RESOLVED/CLOSED` إلى `IN_PROGRESS` فقط، منع CUSTOMER من `ADMIN_ONLY/INTERNAL_NOTE`، اشتراط tenant للمباشر ومنعه للبث، تحقق actor الصريح، وصيغة context keys.

- [ ] **Step 2: شغّل RED**

Run: `npm test -- tests/communication-core-state-machine.test.ts`

Expected: FAIL بسبب عدم وجود module.

- [ ] **Step 3: نفذ أقل Domain code يحقق العقد**

استخدم discriminated unions للـactor:

```ts
type CommunicationActor =
  | { type: "CUSTOMER"; userId: string }
  | { type: "ADMIN"; adminUserId: string }
  | { type: "SYSTEM"; systemKey: string };
```

وتظل `queueKey`, `typeKey`, `namespace`, و`entityType` strings منقحة كي تضيف Modules جديدة قيمًا من دون Migration أو تعديل النواة.

- [ ] **Step 4: شغّل GREEN ثم المجموعة القريبة**

Run: `npm test -- tests/communication-core-state-machine.test.ts tests/customer-issue-state-machine.test.ts`

Expected: PASS.

### Task 3: Public command service and extension points

**Files:**
- Create: `src/modules/communication-core/events.ts`
- Create: `src/modules/communication-core/repository.ts`
- Create: `src/modules/communication-core/service.ts`
- Create: `src/modules/communication-core/index.ts`
- Create: `tests/communication-core-service.test.ts`

**Interfaces:**
- Consumes: Types/validation/state machine من Task 2.
- Produces: `createCommunicationCore(repository, options?)` ويعيد `openConversation`, `appendEntry`, `appendSystemEvent`, `attachContext`, `markRead`, `transitionWorkItem`, و`publishCampaign`.

- [ ] **Step 1: اكتب in-memory repository كامل واختبارات Commands الفاشلة**

الاختبارات تثبت: إنشاء direct conversation مع Entry/Audience/WorkItem/Contexts؛ idempotent retry؛ collision عند sequence قديمة؛ sequence متزايد؛ read monotonic حتى sequence موجودة؛ system event بلا Product import؛ context متعدد؛ transition مع structured event؛ وحملة تملك محتوى واحدًا وجمهورًا بلا نسخ body.

- [ ] **Step 2: شغّل RED**

Run: `npm test -- tests/communication-core-service.test.ts`

Expected: FAIL لأن Public API غير موجود.

- [ ] **Step 3: نفذ Port والواجهة العامة**

يعبّر Port عن عمليات ذرية عالية المستوى:

```ts
interface CommunicationRepository {
  openConversation(command: OpenConversationCommand): Promise<OpenConversationResult>;
  appendEntry(command: AppendEntryCommand): Promise<AppendEntryResult>;
  attachContext(command: AttachContextCommand): Promise<ContextReferenceRecord>;
  markRead(command: MarkReadCommand): Promise<ReadCursorRecord>;
  transitionWorkItem(command: TransitionWorkItemCommand): Promise<WorkItemRecord>;
  publishCampaign(command: PublishCampaignCommand): Promise<PublishCampaignResult>;
}
```

لا يعرّض CRUD أو Prisma client. تبني الخدمة event metadata ثابتًا، وتترك atomicity/idempotency للمستودع.

- [ ] **Step 4: شغّل GREEN واختبارات النواة**

Run: `npm test -- tests/communication-core-state-machine.test.ts tests/communication-core-service.test.ts`

Expected: PASS.

### Task 4: Prisma adapter and transactional guarantees

**Files:**
- Create: `src/modules/communication-core/prisma-communication-repository.ts`
- Create: `tests/prisma-communication-repository.test.ts`

**Interfaces:**
- Consumes: `CommunicationRepository` وPrisma models من Tasks 1 و3.
- Produces: `createPrismaCommunicationRepository(prisma: PrismaClient)`.

- [ ] **Step 1: اكتب اختبارات adapter الفاشلة حول السلوك الذري**

تثبت الاختبارات: open يكتب conversation/audience/entry/work item/context/outbox داخل transaction واحدة؛ append يحجز sequence بتحديث شرطي على `expectedLastSequence` ولا يستخدم `max`; retry يعيد السجل الموجود؛ markRead لا يخفض cursor؛ transition يكتب WorkItemEvent وTimeline Entry وOutbox معًا؛ campaign لا ينسخ body في Campaign/Outbox.

- [ ] **Step 2: شغّل RED**

Run: `npm test -- tests/prisma-communication-repository.test.ts`

Expected: FAIL لأن adapter غير موجود.

- [ ] **Step 3: نفذ Prisma adapter**

قواعد التنفيذ:

- `updateMany({where:{id,lastSequence:expected}, data:{lastSequence:{increment:1}, version:{increment:1}}})` ثم fetch داخل transaction؛ count صفر = `CommunicationConflictError`.
- فحص idempotency قبل أي increment، والاعتماد أيضًا على unique constraints عند السباق.
- إنشاء Entry وتحديث projection وOutbox في نفس transaction.
- `markRead` يستخدم تحديثًا شرطيًا أو upsert يحفظ الأكبر فقط.
- الحملة تنشئ Conversation/Entry مرة واحدة وAudience rows خفيفة على دفعات محدودة؛ مرحلة fan-out worker الموسعة تبقى خلف نفس Port.

- [ ] **Step 4: ولّد Prisma وشغّل GREEN**

Run: `npx prisma generate && npm test -- tests/prisma-communication-repository.test.ts`

Expected: PASS.

### Task 5: Boundary documentation and full verification

**Files:**
- Create: `docs/contexts/communication-core.md`
- Modify: `docs/planning/14-module-boundaries.md`
- Verify: كل ملفات Tasks 1–4.

**Interfaces:**
- Consumes: Public API النهائي.
- Produces: خريطة ملكية يمكن لأي Product Module اتباعها من دون قراءة التنفيذ الداخلي.

- [ ] **Step 1: وثّق حدود السياق**

تتضمن الوثيقة: owns/does-not-own، public commands، emitted events، context-reference contract، identity/audience authorization، transaction boundaries، ومثال Services Platform لا يستورد تفاصيل النواة.

- [ ] **Step 2: حدّث Module Boundaries**

أضف Communication كوحدة مالكة للمحتوى والقراءة والعمل، وحوّل Notification إلى policy/delivery channel owner. لا تغيّر حدود Modules أخرى.

- [ ] **Step 3: شغّل اختبارات Communication ثم الاختبارات الكاملة**

Run:

```bash
npm test -- tests/communication-core-schema-contract.test.ts tests/communication-core-state-machine.test.ts tests/communication-core-service.test.ts tests/prisma-communication-repository.test.ts
npm run typecheck
npm test
```

Expected: كل الأوامر تنتهي بنجاح.

- [ ] **Step 4: افحص التغييرات وحدها**

Run: `git diff --check && git status --short --branch`

Expected: لا whitespace errors، وكل التغييرات الجديدة محصورة في Communication/docs/schema/migration مع بقاء تغييرات المستخدم الأخرى كما هي.

## Self-review

- يغطي Context Integration عبر weak references وresolver seam من دون FK دائري.
- يغطي Extension Points كلها؛ `appendSystemEvent` wrapper واضح وOutbox نتيجة إلزامية للأوامر لا جدول عام تعبث به Modules.
- يفصل WorkItem عن Conversation، وCampaign عن المحتوى، وDelivery عن Inbox.
- يؤجل UI والترحيل والـworker الخارجي من دون أن يحجز قرارًا يعيد تشكيل جداول الحقيقة.
- لا توجد placeholders أو Product-specific enums داخل النواة.
