# Future Enhancements & Architectural Review — مذكرة الأنماط المهنية لمركز التواصل

**التاريخ:** 18 يوليو 2026
**نوع الوثيقة:** بحث مستقل بمصادر أولية لدعم المراجعة المعمارية
**النطاق:** Saved Views، Inbox، الردود الجاهزة، الأتمتة، SLA، منع تضارب الردود، البحث، التحليلات، الإشعارات، أمان المرفقات، والتوسع

## 1. الغرض والمنهج

هذه المذكرة لا تقترح استنساخ Zendesk أو Intercom أو Help Scout أو Front. تمت مراجعة وثائقهم الرسمية لاستخراج الأنماط التي أثبتت قيمة تشغيلية واضحة، ثم مقارنتها بتكلفتها على مركز تواصل SaaS ناشئ. كما تمت مراجعة وثائق PostgreSQL الرسمية وOWASP لتحديد ما يمكن أن يبقى داخل البنية الحالية، وما يحتاج حدًا معماريًا من اليوم.

معيار قبول أي نمط هنا هو:

1. يحل مشكلة متوقعة أو قابلة للقياس، لا مجرد تحسين شكلي.
2. لا يخلق مصدر حقيقة ثانٍ للرسائل أو الإشعارات.
3. يمكن إدخاله تدريجيًا من دون بناء منصة دعم ضخمة قبل الحاجة.
4. تكون تكلفته التشغيلية والأمنية متناسبة مع القيمة.

تعريف المراحل في هذه المذكرة:

- **Phase 1:** ضروري لصحة الأساس أو لأمانه، حتى لو لم يظهر كله كميزة مرئية.
- **Phase 2:** يضاف بعد تشغيل الصندوق وظهور حجم عمل متكرر يبرره.
- **مستقبلية:** لا تنفذ إلا بعد بلوغ عتبة استخدام أو أداء مقاسة.

## 2. الخلاصة التنفيذية

أهم نتيجة هي أن التحسينات الأعلى قيمة في البداية ليست أكثر الواجهات ظهورًا، بل أربعة ضمانات أساسية:

1. **إرسال آمن من التزامن:** يمنع ردين متضاربين أو إرسال رد على نسخة قديمة من المحادثة.
2. **أحداث وقياسات صحيحة منذ اليوم الأول:** لأن أزمنة أول رد والحل وفترات الانتظار لا يمكن إعادة بنائها بدقة لاحقًا إذا لم تسجل transitions وتوقيتها الآن.
3. **مرفقات خاصة بدفاع متعدد الطبقات:** لا روابط عامة، ولا ثقة في الامتداد أو `Content-Type` وحده.
4. **تصنيف موحد للإشعارات مع مفاتيح dedup/grouping:** حتى لا تتحول كل قناة إلى منطق مستقل.

أما Saved Views، الردود الجاهزة، SLA المرئي، ولوحة التحليلات فهي عالية القيمة غالبًا، لكن الأنسب تنفيذها في Phase 2 بعد ثبات نموذج المحادثة وظهور أنماط التشغيل الحقيقية. الأتمتة تستحق التجهيز الحدّي الآن، لكن **لا تستحق Rule Builder عامًا في Phase 1**. ومحرك بحث خارجي، تقسيم الجداول مبكرًا، OCR للمرفقات، وميزات notification “ذكية” لا تستحق تكلفتها حاليًا.

## 3. مصفوفة القرار

| النمط | المشكلة التي يحلها | القيمة الحقيقية | حكم التعقيد | التجهيز المطلوب الآن | الأولوية | المرحلة |
|---|---|---|---|---|---|---|
| Default Views + Saved Views | ضياع العمل داخل قائمة واحدة | يقلل وقت triage ويجعل المسؤوليات مرئية | يستحق، لكن custom views ليست أساسية يوم الإطلاق | عقد فلاتر وترتيب ثابت قابل للحفظ | عالية | Defaults في Phase 1، الحفظ في Phase 2 |
| Assignee + queue + waiting age | غياب الملكية والأولوية التشغيلية | يمنع نسيان الطلبات ويظهر الأقدم انتظارًا | يستحق من أول إصدار | حقول التعيين وآخر inbound وموعد الاستحقاق | عالية | Phase 1 |
| Personal pin/star مستقل | تفضيل شخصي لا يغير سير العمل | محدود إذا وجدت Views وassignment | لا يستحق نموذجًا عامًا الآن | لا شيء | منخفضة | مستقبلية أو مرفوضة |
| Reply Templates | تكرار كتابة نفس الإجابات | سرعة واتساق لغوي مع بقاء قرار الإرسال بشريًا | يستحق عند وجود تكرار فعلي | Composer command موحد؛ لا يلزم جدول الآن | عالية | Phase 2 |
| Macros متعددة الإجراءات | تكرار الرد مع تغييرات حالة/تعيين | تختصر عدة خطوات في إجراء يدوي قابل للمراجعة | مفيدة بعد ثبات أوامر المجال | Commands منفصلة قابلة للتركيب والتدقيق | متوسطة/عالية | Phase 2 |
| Automation rules | تعيين وتذكير وتصعيد متكرر | تخفض العمل اليدوي وتحمي SLA | تستحق تدريجيًا؛ builder عام مبكرًا لا يستحق | event taxonomy، outbox، idempotency، audit | عالية | قواعد محدودة Phase 2؛ builder مستقبلًا |
| SLA | غياب توقعات زمنية وأولوية قابلة للقياس | يركز الفريق على العمل المعرض للتأخير | يستحق عندما توجد التزامات أو حجم queue | تسجيل الساعة التشغيلية وtransitions الآن | متوسطة/عالية | قياس Phase 1، سياسة/واجهة Phase 2 |
| Collision detection | ردود مزدوجة أو مبنية على timeline قديم | يحمي ثقة العميل ويمنع عملًا مكررًا | يستحق قطعًا | optimistic concurrency + idempotency | عالية | Phase 1 |
| Presence “يشاهد/يكتب الآن” | تنسيق لحظي بين عدة موظفين | مفيد لفريق متزامن، لكنه ليس ضمان صحة | لا يكفي وحده، ويمكن تأجيله | Presence adapter اختياري فقط | متوسطة | Phase 2 |
| بحث PostgreSQL | الوصول بالرقم/العنوان/العميل/المحتوى | عائد مباشر من دون خدمة جديدة | يستحق | Search contract وفهارس مدروسة | عالية | الدقيق في Phase 1؛ المحتوى في Phase 2 |
| محرك بحث خارجي | أحجام أو ranking لا يخدمها Postgres | مفيد فقط عند ظهور bottleneck مقاس | لا يستحق الآن | Projection interface فقط إن لزم | منخفضة حاليًا | مستقبلية مشروطة |
| Analytics timestamps/projection | تعذر حساب الأداء تاريخيًا | يحفظ قابلية القياس من البداية | يستحق كأساس، لا Dashboard كامل | أحداث immutable وحقول أزمنة واضحة | عالية | Phase 1 |
| Analytics Dashboard | معرفة الاختناقات وجودة الخدمة | يحسن staffing والعمليات بعد وجود بيانات | يستحق بعد توفر عينة كافية | projection قابل لإعادة البناء | متوسطة/عالية | Phase 2 |
| Notification preferences | الإرهاق من كثرة القنوات | تحسن الثقة وتقلل إلغاء القنوات | تستحق بعد تعدد القنوات | event categories + policy resolver | متوسطة | Phase 2 |
| Notification grouping/delay | عدة تنبيهات لنفس موجة الرسائل | يقلل الضوضاء وكلفة الإرسال | يستحق بتكلفة صغيرة | `groupKey` ونافذة تجميع | عالية | تجهيز Phase 1؛ تشغيل Phase 2 |
| Private attachment pipeline | تسريب أو تنفيذ محتوى خبيث | حماية بيانات العملاء والمنصة | لا يمكن تأجيله | lifecycle + ACL + scan state | عالية | Phase 1 |
| Partitioning من اليوم الأول | افتراض نمو مستقبلي | لا قيمة فورية وقد يعقد القيود والمفاتيح | مرفوض قبل القياس | retention/time keys فقط | منخفضة | مستقبلية مشروطة |

## 4. Saved Views وتجربة الـInbox

### ما يستحق

تعرف Zendesk الـViews بأنها قوائم طلبات مبنية على شروط، وتفصل بين Views شخصية ومشتركة؛ كما تنبه أن الـView أداة تشغيل للحاضر، بينما التقارير للتحليل التاريخي والـexport للأحجام الهائلة. هذا فصل مهم يجب الحفاظ عليه، لا دمج Saved View مع التقارير في نموذج واحد. [وثائق Zendesk الرسمية: Creating views](https://support.zendesk.com/hc/en-us/articles/4408888828570-Creating-views-to-build-customized-lists-of-tickets)

التصميم المقترح:

- يبدأ Phase 1 بعدد قليل من Views ثابتة: «غير مسندة»، «تحتاج ردًا»، «بانتظار العميل»، «الأقدم انتظارًا»، و«معرضة لتجاوز الهدف» إن فُعل SLA.
- يحفظ Phase 2 تعريف View كفلتر وترتيب وأعمدة، مع scope شخصي أو مشترك وصلاحية إدارة الـshared views.
- يظل الـView استعلامًا، لا snapshot من المحادثات؛ لا جدول عضوية يكرر كل النتائج.
- يجب أن يستخدم نفس Filter Contract الذي يستخدمه Inbox API، حتى لا يتكرر منطق الفلترة.
- يحد عدد الـViews الظاهرة أو المثبتة في الشريط، لأن عشرات الـViews تعيد مشكلة الفوضى بصيغة جديدة.

Intercom يربط قيمة Inbox بترتيب مثل `Waiting since` و`Last activity` و`Next SLA`، لا بمجرد تاريخ الإنشاء. [وثائق Intercom الرسمية: Inbox sorting](https://www.intercom.com/help/en/articles/6989006-inbox-sorting) هذا يبرر الاحتفاظ من الآن بمؤشرات مثل آخر رسالة عميل، آخر رد أدمن، ووقت بدء انتظار العميل/الفريق.

### ما لا يستحق

- **Pin وStar عالميان للمحادثة:** يتعارضان بسهولة مع الأولوية والتعيين وSaved Views، ولا يوضحان هل العنصر مهم للفريق أم لموظف واحد. إذا ظهر احتياج شخصي لاحقًا، يكفي `favorite` شخصي خفيف؛ لا نضيف حالة business جديدة.
- **تقسيمات “ذكية” مبنية على AI:** لا يوجد احتياج يبررها الآن، ويمكن بناء Views موثوقة من حقول صريحة.
- **مجلدات عميل معقدة:** العميل يحتاج تصنيفات وفلاتر قليلة، لا نظام تنظيم مشابه للبريد الإلكتروني.

## 5. الردود الجاهزة: Templates أم Macros؟

المصادر الرسمية تميز نمطين مختلفين:

- Front يعرّف Message Templates كإجابات محفوظة لتسريع الرد وتوحيد صوت الفريق، ويدعم نطاقًا شخصيًا أو مشتركًا ومتغيرات ديناميكية وإدراجًا من الـComposer. [وثائق Front الرسمية: Message templates](https://help.front.com/en/articles/2230)
- Zendesk يعرّف Macro كإجراء يدوي يختاره الموظف، ويمكنه إضافة نص وتغيير الحالة والتعيين والوسوم؛ وهو يختلف عن triggers/automations لأنه لا يملك شروطًا ولا يعمل تلقائيًا. [وثائق Zendesk الرسمية: Creating macros](https://support.zendesk.com/hc/en-us/articles/4408844187034-Creating-macros-for-repetitive-ticket-responses-and-actions)

### القرار

ابدأ في Phase 2 بـ**Reply Templates مشتركة ومنتقاة**، ثم أضف Macros فقط إذا ثبت أن الموظفين يكررون «رد + حالة + تعيين/تصنيف» معًا.

التصميم الذي يحافظ على المصدر الواحد:

- الـTemplate ليس رسالة مرسلة ولا مرجعًا يُعرض للعميل؛ عند اختياره يُنسخ محتواه إلى الـComposer ثم يستطيع الموظف مراجعته وتعديله.
- الـEntry المرسل يحتفظ بالنص النهائي immutable، لا يرتبط حيًا بنسخة Template قد تتغير لاحقًا.
- متغيرات القالب تكون allowlist صريحة مثل اسم العميل ورقم الطلب، وتُحل على الخادم مع preview قبل الإرسال.
- النطاق يبدأ `shared/team`؛ القوالب الشخصية تؤجل حتى يثبت أن لها قيمة، حتى لا تتكاثر إجابات غير مراجعة.
- يسجل `templateId` و`templateVersion` كـmetadata تحليلي اختياري، من دون جعل القالب مصدر النص.
- Macro ينفذ Commands المجال القياسية نفسها، داخل transaction أو orchestration موثقة، ولا يعدل الجداول مباشرة.

### لماذا لا ينفذ في Phase 1؟

قبل وجود محادثات حقيقية لا نعرف أكثر الردود تكرارًا. بناء مكتبة كبيرة مسبقًا ينتج قوالب غير مستخدمة أو إجابات عامة، بينما Command موحد للإرسال يكفي لتجهيز الإضافة لاحقًا بلا إعادة هيكلة.

## 6. الأتمتة

Help Scout يمثل workflow كـconditions/operators/actions ويفصل بين manual وautomatic؛ والأهم أنه يجعل الـautomatic workflow يعمل مرة واحدة على المحادثة لتجنب تشغيله بسبب أثره نفسه. [وثائق Help Scout الرسمية: Workflows](https://docs.helpscout.com/article/22-using-workflows)

توثق Zendesk مخاطر أعمق: الأتمتة المتكررة تحتاج شرطًا true-once أو إجراءً يبطل الشرط، وإلا تدخل حلقة لا نهائية؛ كما تعيد فحص حالة التذكرة عند التنفيذ لتجنب التعارض مع تحديث بشري. [وثائق Zendesk الرسمية: About automations](https://support.zendesk.com/hc/en-us/articles/4408832701850-About-automations-and-how-they-work)

### ما يستحق في المشروع

أول قواعد ذات عائد مرتفع غالبًا:

1. التعيين حسب نوع الطلب أو المجال.
2. تذكير المسؤول قبل موعد الاستحقاق.
3. إعادة الطلب غير المسند إلى queue واضحة.
4. تذكير العميل مرة واحدة بعد انتظار طويل.
5. إغلاق إداري بعد مدة من الحل، مع إمكانية إعادة الفتح عند رد العميل.
6. تصعيد الطلبات ذات الأولوية العالية أو التي تجاوزت الهدف.

### التجهيز المعماري الآن

- Event taxonomy مستقرة: created، customer_replied، admin_replied، assigned، status_changed، sla_at_risk…
- Actions تمر عبر Application Commands الموجودة، لا SQL خاص بكل قاعدة.
- `AutomationExecution` أو سجل مكافئ بمفتاح فريد `(ruleId, eventId, actionKey)` لضمان idempotency.
- إعادة قراءة الحالة قبل الفعل، مع preconditions؛ الحدث القديم لا يغير محادثة تغيرت بعده.
- حد أقصى لعمق chain وعدد الأفعال، ومنع rule من إعادة إطلاق نفسه بلا تغيير meaningful.
- ترتيب/أولوية قواعد موثق، وaudit يبين: لماذا تطابقت؟ ماذا فعلت؟ وماذا فشل؟
- worker منفصل للأحداث الزمنية، مع batching وretry/backoff وdead-letter، لا timer لكل محادثة.
- Preview أو dry-run قبل تفعيل قاعدة جديدة، وإيقاف/نسخ/versioning للقواعد.

### حكم التوقيت

تجهز هذه الحدود في Phase 1 عبر الأحداث والـoutbox والـcommands، لكن لا يبنى Generic Rule Builder. في Phase 2 تنفذ 3–5 قواعد محددة عالية العائد، إما كإعدادات بسيطة أو قواعد مُدارة. builder بصري عام لا يستحق إلا إذا صار تغيير القواعد احتياجًا متكررًا غير قابل لخدمة الفريق الهندسي.

## 7. SLA: قياسه الآن، وإدارته لاحقًا

Zendesk يعرّف SLA كأهداف response/resolution مرتبطة بشروط وأولوية وساعات عمل. [وثائق Zendesk الرسمية: Defining SLA policies](https://support.zendesk.com/hc/en-us/articles/4408829459866-Defining-SLA-policies) وتوضح Intercom أن SLA يعطي ترتيبًا للعمل العاجل، ويمكن إيقاف الساعة في حالات مثل الانتظار على العميل، مع تجنب تطبيق أكثر من SLA متعارض على المحادثة. [وثائق Intercom الرسمية: Set SLAs](https://www.intercom.com/help/en/articles/6546152-set-slas-for-conversations-and-tickets)

### القرار

- لا حاجة إلى UI كامل لسياسات SLA في Phase 1 ما لم توجد التزامات تعاقدية بالفعل.
- يجب من Phase 1 تسجيل `firstCustomerMessageAt` و`firstAdminReplyAt` وفترات `waiting_customer` و`waiting_team` و`resolvedAt` و`reopenedAt` وتاريخ كل transition.
- عند إضافة SLA، يطبق على `WorkItem` لا على كل Communication Entry، ويكون له policy/version واحدة فعالة في اللحظة نفسها.
- يسجل snapshot للهدف المطبق على الطلب حتى لا تغير السياسة الجديدة تقارير الطلبات القديمة.
- يفصل بين calendar duration وbusiness duration؛ ساعات العمل والعطلات سياسة مستقلة.
- يظهر للموظف `dueAt/atRisk/overdue` وترتيب Next SLA بدل إضافة حالات workflow جديدة.

الفائدة الحقيقية ليست شارة عد تنازلي، بل ترتيب العمل وحساب موثوق. إذا كان الفريق صغيرًا والحجم منخفضًا، يكفي في البداية “الأقدم انتظارًا” وقياس داخلي؛ SLA متكامل ينتقل إلى Phase 2.

## 8. منع تضارب الردود

هذه أعلى ميزة تشغيلية أولوية. Help Scout لا يكتفي بإظهار من يشاهد أو يكتب؛ بل يوقف إرسال الرد إذا أضيف رد/ملاحظة من موظف آخر أو وصل رد جديد من العميل لم يره المرسل. [وثائق Help Scout الرسمية: Collision Detection](https://docs.helpscout.com/article/99-prevent-duplicate-replies-with-collision-detection)

### التصميم المقترح

ضمان الصحة في Phase 1:

- يفتح الـComposer ومعه `expectedLastSequence` أو `expectedVersion`.
- عند الإرسال، يتحقق الخادم أن المحادثة لم تتغير؛ إن تغيرت يعرض الإدخالات الجديدة ويطلب مراجعة، لا يرسل بصمت.
- لكل محاولة إرسال `idempotencyKey` لمنع التكرار الناتج عن double-click أو retry شبكي.
- تخصيص sequence داخل transaction ذرية.
- الملاحظة الداخلية والرد العام كلاهما يغيران version لأن كليهما قد يغير قرار الرد.

تحسين UX في Phase 2:

- Presence مؤقت يظهر «يشاهد» أو «يكتب» مع TTL.
- لا يعتمد عليه كقفل حصري؛ انقطاع الشبكة يجعل القفل الوهمي خطيرًا.

هذا التعقيد يستحق لأنه يحمي مباشرة من موقف مرئي للعميل ويمنع فقد الثقة. مجرد assignee أو realtime presence لا يكفي لضمان الصحة.

## 9. البحث

PostgreSQL يوفر Full Text Search ويفضل GIN للنص الذي يُبحث باستمرار. [وثائق PostgreSQL الرسمية: Preferred text-search indexes](https://www.postgresql.org/docs/current/textsearch-indexes.html) كما يوفر `pg_trgm` بحث تشابه وفهارس سريعة لـ`LIKE/ILIKE`، وهو مناسب للأسماء والعناوين والأخطاء الإملائية المحدودة. [وثائق PostgreSQL الرسمية: pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)

### التصميم المرحلي

**Phase 1:**

- exact lookup برقم المحادثة/الطلب.
- بحث العميل بالاسم والبريد/الهاتف وفق الصلاحيات.
- بحث العنوان.
- نفس Search API يعيد cursor pagination ويطبق tenant/admin authorization قبل النتائج.

**Phase 2:**

- `tsvector`/GIN لمحتوى الرسائل والعناوين، مع ranking وhighlight.
- `pg_trgm` للأسماء والعناوين والأرقام المدخلة جزئيًا، مع إبقاء B-tree للمطابقة الدقيقة لأن وثائق PostgreSQL تنبه أن trigram ليس الأفضل للمساواة.
- Search projection يمكن إعادة بنائها من المصدر، وتحتوي IDs ونصًا قابلًا للبحث فقط، لا تنشئ مصدر حقيقة جديدًا.
- توضيح eventual consistency إن بُني الفهرس asynchronously.

**مستقبلي مشروط:** محرك خارجي فقط إذا أثبتت القياسات أن Postgres لا يحقق latency/ranking/operational isolation المطلوبة. ملايين الرسائل وحدها ليست سببًا آليًا؛ شكل الاستعلام، حجم الفهرس، ومعدل الكتابة هي ما يقرر.

### ما يرفض حاليًا

- OCR وفهرسة محتوى الصور/PDF: تكلفة وأمن ومعالجة عالية، وقيمته غير مثبتة.
- Vector search أو embeddings للبحث العادي: يزيد التخزين والخصوصية والتعقيد من دون حاجة.
- البحث في اسم الملف فقط يمكن إضافته، لكن محتوى المرفق نفسه يؤجل.

## 10. التحليلات

توثق Front مقاييس تشغيلية مثل أول رد، وقت الرد، وقت الحل، عدد الردود للحل، الحل من أول رد، والوقت داخل الحالة، وتربطها بتحديد الاختناقات لا بمجرد أرقام استعراضية. [وثائق Front الرسمية: Resolution report](https://help.front.com/en/articles/2339648) كما تسمح بالانتقال من المقياس إلى المحادثات الداخلة في حسابه، وهو نمط مهم لقابلية التفسير. [وثائق Front الرسمية: Metric details](https://help.front.com/en/articles/2145)

### القياسات التي تستحق

1. median وp90 لأول رد، لا المتوسط وحده.
2. median وp90 لوقت الحل، مع فصل business time.
3. backlog الحالي وعمره، خصوصًا الأقدم بلا رد.
4. نسبة إعادة الفتح.
5. الوقت في `WAITING_TEAM` مقابل `WAITING_CUSTOMER`.
6. حجم الطلبات حسب النوع/الأولوية ومعدل تغيره.
7. نسبة تحقيق SLA عند تفعيله.
8. CSAT لاحقًا بعينة بسيطة بعد الحل، وليس بعد كل رسالة.

### القرارات المعمارية

- تسجل الأحداث والـtimestamps في Phase 1؛ لوحة التحليل في Phase 2.
- يبنى Analytics Projection من الأحداث ويمكن إعادة بنائه، بدل استعلامات ثقيلة على timeline في كل فتح.
- تعريف كل مقياس يثبت ويصدر version عند تغييره؛ لا تتغير دلالة الرقم بصمت.
- يفصل auto-replies والبوتات مستقبلًا عن الرد البشري في مقاييس الأداء.
- الوصول للتقارير مستقل بصلاحية؛ أداء الموظفين بيانات حساسة.
- يجب أن يسمح كل KPI بالـdrill-down إلى مجموعة المحادثات التي كونته لتجنب “رقم غير قابل للتفسير”.

### ما لا يستحق

- Dashboard كبير في Phase 1 بلا بيانات كافية.
- Leaderboards فردية وغرضها الترتيب؛ تشجع إغلاقًا أسرع على حساب جودة الحل.
- عشرات المقاييس أو تخصيص تقارير عام مبكرًا؛ تبدأ 5–8 مؤشرات مرتبطة بقرار تشغيلي.

## 11. الإشعارات والتفضيلات

Intercom يوثق نمطين مفيدين: تفضيلات شخصية للقنوات، وتجميع عدة رسائل في push/email واحد بعد نافذة قصيرة بدل تنبيه لكل رسالة. [وثائق Intercom الرسمية: Teammate notifications](https://www.intercom.com/help/en/articles/187-how-teammates-get-notifications) كما تؤخر إشعار العميل الخارجي إذا كان يستطيع قراءة الرسالة داخل المنتج قبل انتهاء المهلة. [وثائق Intercom الرسمية: Customer notifications](https://www.intercom.com/help/en/articles/250-push-email-chat-and-post-notifications-for-customers)

وتدعم FCM مفهوم الرسائل القابلة للطي عندما يجعل الحدث الأحدث سابقه غير مهم، مع تنبيه صريح إلى أن ترتيب التسليم غير مضمون. [وثائق Firebase الرسمية: Collapsible messages](https://firebase.google.com/docs/cloud-messaging/customize-messages/collapsible-message-types)

### التصميم المقترح

من Phase 1:

- event category مستقرة: `conversation.reply`, `conversation.assigned`, `campaign.announcement`, `billing.critical`, `security.critical`…
- `dedupKey` لمنع تكرار نفس الأثر، و`groupKey` لتجميع دفعة رسائل للمحادثة نفسها.
- داخل المنصة هو المرجع؛ push/email يحمل ملخصًا ورابطًا، ولا يصبح نسخة كاملة من مصدر الرسالة.
- نافذة قصيرة تلغي الإرسال الخارجي إذا قرأ المستخدم الحدث داخل المنصة، حيث يناسب ذلك.
- الأحداث الحرجة للأمان/الفوترة لا تخضع لكتم كامل، ويكون هذا واضحًا للمستخدم.
- retries وdelivery attempts في outbox مع حالات delivery منفصلة عن read state.

في Phase 2:

- Preferences حسب **فئة الحدث × القناة**، لا toggle مستقل لكل رسالة.
- default policy مع user override، وquiet hours/digest للأحداث غير العاجلة.
- تفضيلات الأدمن تختلف عن العميل؛ mention/assignment/SLA تحتاج سياسة تشغيلية خاصة.

لا يوصى الآن بـ«إشعارات ذكية» تعتمد ML أو تعلم السلوك. يمكن تحقيق معظم القيمة بقواعد صريحة: لا تنبه المستخدم على ما قرأه، اجمع الأحداث المتقاربة، وميز critical عن informational.

## 12. المرفقات وأمان الملفات

OWASP توصي بدفاع متعدد الطبقات: allowlist للامتدادات، عدم الثقة في `Content-Type`، اسم تخزين مولد من التطبيق، حد للحجم، صلاحية للمستخدم، تخزين خارج webroot أو على host منفصل، وفحص malware/sandbox عند الإمكان. [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

### الحد الأدنى غير القابل للتأجيل في Phase 1

- تخزين private، ووصول عبر authorization ثم signed URL قصير العمر.
- فصل `originalName` للعرض عن `storageKey` العشوائي.
- allowlist ضيقة للصور المطلوبة فعليًا في الإصدار الأول، وحدود حجم وعدد لكل رسالة/محادثة/عميل.
- فحص signature/MIME الفعلي، لا header فقط.
- lifecycle واضح: `UPLOADING -> QUARANTINED -> READY | REJECTED -> DELETED`.
- لا يظهر الملف لمستلم آخر قبل `READY`.
- checksum للكشف عن فساد/تكرار النقل، مع عدم استنتاج أن نفس checksum يعني أن كل المستخدمين يحق لهم نفس الوصول.
- thumbnails/previews مشتقة وغير أصلية؛ حذف الأصل أو تقييده لا يترك variant عامًا.
- audit للوصول الإداري إلى المرفقات الحساسة وسياسة retention/delete.
- حماية preview من active content، وعدم عرض HTML/SVG/مستندات نشطة inline في Phase 1.

### ما يؤجل

- Gallery موحد على مستوى العميل: Phase 2 فقط إذا أثبت أنه يسرع التحقيق، ويظل projection/عرضًا للمرفقات المرتبطة لا مكتبة وسائط مستقلة.
- ملفات عامة الأنواع وZIP وOffice: تؤجل حتى يوجد scanning/CDR وسياسة احتفاظ مناسبة.
- نسخ متعددة كثيرة: يكتفى بالأصل وthumbnail/preview الضروريين، لا pipeline تحرير وسائط كامل.

## 13. التوسع إلى ملايين الرسائل وآلاف الحملات

### قرارات يجب تثبيتها الآن

- cursor pagination مبني على مفتاح مستقر، لا offset في timeline أو inbox الكبير.
- قوائم Inbox لا تحمل bodies والمرفقات؛ تستخدم summary projection وحقول last activity/unread.
- unread counter projection يحدث بمعاملة/حدث موثوق ويمكن reconciliate من read cursor، لا `COUNT(*)` على الرسائل عند كل request.
- broadcast content يخزن مرة واحدة، بينما recipient/audience/read/delivery هي fan-out metadata فقط.
- نشر الحملات يكون job قابلًا للاستئناف على batches مع checkpoint وidempotency، لا transaction واحدة ضخمة.
- outbox/delivery attempts لها retention وأرشفة، لأنها أسرع جداول النمو وليست سجلًا أبديًا لكل payload.
- فهارس B-tree مركبة بحسب الاستعلامات الفعلية مثل audience/updated/status/assignee، مع مراجعة `EXPLAIN` دوريًا؛ لا فهرسة كل عمود.
- فصل OLTP عن analytics عبر projection/replica لاحقًا من دون تغيير مصدر الحقيقة.

### ما لا يجب فعله مبكرًا

وثائق PostgreSQL تقول إن partitioning يكون مجديًا عادة عندما يصبح الجدول كبيرًا جدًا، وتذكر قاعدة تقريبية بأن حجمه يتجاوز ذاكرة الخادم، وتحذر من أن الاختيار السيئ وكثرة partitions يزيدان زمن التخطيط والذاكرة. [وثائق PostgreSQL الرسمية: Table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)

لذلك:

- لا partition per tenant؛ عشرات آلاف العملاء تنتج عددًا غير عملي من partitions.
- لا partitioning من Phase 1 لمجرد توقع ملايين الرسائل.
- جهّز `createdAt`/retention boundaries، وراقب حجم الجداول والفهارس وlatency وvacuum أولًا.
- عند الحاجة، time-range partitioning مرشح لجداول append-heavy مثل entries/outbox/delivery logs، لكن القرار يختبر على workload حقيقي ويأخذ قيود unique keys وforeign keys في الحسبان.
- لا Kafka ولا microservices ولا Elasticsearch لمجرد كلمة “scale”. Modular monolith + PostgreSQL + workers/outbox يكفي ما لم تظهر حاجة عزل أو throughput مقاسة.

## 14. ما يجب رفضه بوضوح

| الميزة | سبب الرفض الآن | متى يعاد تقييمها؟ |
|---|---|---|
| Rule Builder بصري عام | مساحة حالات ضخمة، صعوبة debugging والحلقات والصلاحيات قبل وجود قواعد متكررة | عندما يصبح تغيير القواعد احتياجًا أسبوعيًا متكررًا |
| Elasticsearch/OpenSearch | خدمة وتشغيل ومزامنة وخصوصية إضافية بينما PostgreSQL يملك FTS وtrigram | بعد benchmark يثبت فشل Postgres في SLO محدد |
| Vector DB/semantic search | لا يحسن البحث الدقيق بالرقم والعميل، ويضيف تكلفة وبيانات مشتقة حساسة | عند وجود use case AI مقاس وسياسة بيانات واضحة |
| OCR وفهرسة كل المرفقات | مخاطر parsing وتسريب وتكلفة عالية مقابل قيمة غير مثبتة | إذا أصبحت المرفقات مصدر معرفة أساسيًا |
| Partitioning مبكر أو per-tenant | يعقد القيود والصيانة والتخطيط قبل ظهور حجم يبرره | عند تجاوز عتبات حجم/latency/vacuum مقاسة |
| Presence كقفل إرسال | مؤشر UX غير موثوق مع انقطاع الشبكة، ولا يمنع race فعليًا | ينفذ كمكمل بعد optimistic concurrency |
| Pin وStar وحالات “مهمة” متعددة | تتداخل مع priority/assignment/views وتخلق دلالات غامضة | favorite شخصي فقط إذا أثبت الاستخدام حاجته |
| Notifications ذكية بالـML | صعوبة تفسير وقد تخفي تنبيهًا مهمًا؛ قواعد صريحة تحقق معظم القيمة | بعد نضج preference data ووجود safeguards |
| Dashboard تحليلات ضخم من اليوم الأول | بيانات قليلة ومقاييس غير مستقرة تؤدي إلى قرارات زائفة | بعد دورة تشغيل تكفي لمقارنة الفترات |
| Leaderboard أداء فردي | يشجع تحسين الرقم لا جودة الحل ويخلق سلوكًا غير مرغوب | لا يعاد إلا بهدف إداري واضح وضوابط جودة |

## 15. الـArchitectural Seams التي تستحق التجهيز الآن

هذه ليست ميزات إضافية كاملة، بل حدود صغيرة تمنع إعادة الهيكلة:

1. **Filter/Search Contract واحد** يستخدمه Inbox وSaved Views لاحقًا.
2. **Application Commands موحدة** للإرسال، التعيين، الحالة، والأولوية؛ تستخدمها الواجهة والـMacros والـAutomation.
3. **Event taxonomy + Transactional Outbox** لكل الآثار الجانبية.
4. **Optimistic version + idempotency** على إرسال الرد والتحديثات الحساسة.
5. **Timeline events كافية للقياس** مع timestamps وفترات الانتظار وactor/visibility.
6. **Notification policy resolver** يفصل الحدث عن القناة، ويدعم `dedupKey/groupKey`.
7. **Attachment lifecycle/ACL** منفصل عن MediaAsset العام.
8. **Read-model projections قابلة لإعادة البناء** للـInbox، unread، البحث، والتحليلات.
9. **Retention keys** على جداول entries/outbox/delivery logs، من دون تفعيل partitioning مسبقًا.
10. **صلاحيات مستقلة** لإدارة shared views/templates/rules/SLA والتقارير والمرفقات الحساسة.

هذه الحدود لا تغير توصية «مركز تواصل موحد». بالعكس، تمنع الأدوات المستقبلية من إنشاء مصادر رسائل أو إشعارات أو منطق فلترة موازية.

## 16. قائمة المصادر الأولية

- [Zendesk — Creating views](https://support.zendesk.com/hc/en-us/articles/4408888828570-Creating-views-to-build-customized-lists-of-tickets)
- [Zendesk — Creating macros](https://support.zendesk.com/hc/en-us/articles/4408844187034-Creating-macros-for-repetitive-ticket-responses-and-actions)
- [Zendesk — About automations](https://support.zendesk.com/hc/en-us/articles/4408832701850-About-automations-and-how-they-work)
- [Zendesk — Defining SLA policies](https://support.zendesk.com/hc/en-us/articles/4408829459866-Defining-SLA-policies)
- [Intercom — Setting up the Inbox](https://www.intercom.com/help/en/articles/10223008-setting-up-the-inbox)
- [Intercom — Inbox sorting](https://www.intercom.com/help/en/articles/6989006-inbox-sorting)
- [Intercom — Set SLAs](https://www.intercom.com/help/en/articles/6546152-set-slas-for-conversations-and-tickets)
- [Intercom — Teammate notifications](https://www.intercom.com/help/en/articles/187-how-teammates-get-notifications)
- [Intercom — Customer notifications](https://www.intercom.com/help/en/articles/250-push-email-chat-and-post-notifications-for-customers)
- [Help Scout — Collision Detection](https://docs.helpscout.com/article/99-prevent-duplicate-replies-with-collision-detection)
- [Help Scout — Workflows](https://docs.helpscout.com/article/22-using-workflows)
- [Front — Message templates](https://help.front.com/en/articles/2230)
- [Front — Resolution report](https://help.front.com/en/articles/2339648)
- [Front — Analytics metric details](https://help.front.com/en/articles/2145)
- [PostgreSQL — Full-text search indexes](https://www.postgresql.org/docs/current/textsearch-indexes.html)
- [PostgreSQL — pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [PostgreSQL — Table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [OWASP — File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Firebase — Collapsible messages](https://firebase.google.com/docs/cloud-messaging/customize-messages/collapsible-message-types)

## 17. الحكم النهائي

لا تحتاج المعمارية الأساسية إلى توسيع كبير كي تستوعب هذه الأنماط. ما تحتاجه الآن هو **ضبط العقود والحدود**: إرسال متزامن آمن، أحداث قابلة للقياس، policy موحدة للإشعارات، pipeline خاصة للمرفقات، وواجهات query/command قابلة لإعادة الاستخدام.

بعد ذلك تكون الأولوية في Phase 2: Saved Views، Reply Templates، أتمتة محدودة، SLA عملي، وبضع تقارير قابلة للتفسير. أما المحركات الخارجية، الـAI، OCR، workflow builder العام، والـpartitioning المبكر فليست علامات احتراف؛ احتراف النظام هنا هو تأجيلها حتى توجد مشكلة مقاسة تستحقها.
