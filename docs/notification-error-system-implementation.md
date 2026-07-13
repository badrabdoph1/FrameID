# FrameID Unified Error Reporting & Customer Issue Center

## الهدف

النظام الحالي يفصل بين ظهور الخطأ التقني وبين بلاغ العميل:

- `ErrorLog` هو سجل كل ظهور تقني للخطأ أو التشخيص.
- `CustomerIssue` هو البلاغ الإداري الذي يراه فريق الدعم داخل «مشاكل العملاء».
- `CustomerIssueEvent` هو سجل الحركة: إنشاء، بدء مراجعة، حل، إغلاق، إعادة فتح، وإخطار العميل.

بهذا الشكل لا يرى العميل أي Stack أو Digest أو Request ID، بينما تصل التفاصيل التقنية للإدارة تلقائيًا.

## تجربة العميل

كل صفحات الأخطاء تستخدم تجربة موحدة:

- رسالة هادئة: «في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات.»
- زر «إعادة المحاولة» يعمل Refresh.
- زر «الصفحة الرئيسية».
- زر «إبلاغ الإدارة بالمشكلة».
- الملاحظة اختيارية، ولا يطلب النظام من العميل شرح المشكلة.

الصفحات المغطاة تشمل:

- `error.tsx`
- `global-error.tsx`
- `not-found.tsx`
- marketing/dashboard/admin error boundaries
- `unauthorized`
- `forbidden`
- `session-expired`
- `expired`
- `ErrorBoundary`

## التقاط التفاصيل

العميل يرسل بلاغًا عبر:

- `POST /api/customer-issues/capture`
- `POST /api/customer-issues/report`

النظام يجمع تلقائيًا:

- الوقت، route، URL، نوع الخطأ، الرسالة، stack، digest
- Request ID وCorrelation ID
- browser/device/os/screen/language/timezone/userAgent/referrer/connection
- release/build/environment
- session/tenant/site/customer/user/admin context من السيرفر فقط
- template والصفحة وآخر action مسجل

أي هوية مرسلة من العميل يتم تجاهلها. الربط بالعميل والموقع يتم من سياق موثوق على السيرفر.

## الخصوصية والتنقية

كل payload يمر عبر sanitizer قبل التخزين:

- حذف كلمات المرور، token، cookie، authorization
- حذف بيانات الدفع والحسابات الحساسة
- تنظيف query params الحساسة من الروابط
- تحديد عمق وحجم metadata

## دورة البلاغ

الحالات المدعومة:

- `NEW`
- `IN_REVIEW`
- `RESOLVED`
- `CLOSED`

الانتقالات المسموحة موجودة في `src/modules/customer-issues/state-machine.ts`.

## مركز مشاكل العملاء

المركز داخل `/admin/errors` يعرض:

- عدد البلاغات الجديدة
- عدد البلاغات قيد المراجعة
- عدد البلاغات المحلولة
- عدد البلاغات المغلقة
- ظهورات تقنية بلا بلاغ
- قائمة خفيفة لا تعرض stack أو metadata

صفحة البلاغ `/admin/errors/[id]` تعرض التفاصيل التقنية الكاملة للإدارة فقط، وتشمل:

- العميل، الموقع، الحالة، الأولوية، تاريخ الإنشاء، آخر تحديث
- Route، نوع الخطأ، الكود المتأثر
- Stack Trace وMetadata
- Browser/Device/Environment
- الأحداث والمسؤول عن المراجعة

الأفعال الإدارية:

- بدء المراجعة
- تعليم كمحلول
- إعادة فتح
- إغلاق
- إخطار العميل بالحل
- نسخ جميع التفاصيل
- فتح العميل/الموقع/سجل الأخطاء/الملف البرمجي عند توفره

## إضافة نقطة التقاط جديدة

استخدم الخدمة الموحدة بدل إنشاء نظام جديد:

- للعميل: `captureClientError()` ثم `reportCapturedError()`.
- للسيرفر/API: `createCustomerIssueService(...).captureOccurrence()`.
- للبلاغ: `reportIssue()`.
- للإدارة: `transitionIssue()` و`notifyResolved()`.

لا تعرض `error.message` الخام للمستخدم النهائي. التفاصيل التقنية تبقى داخل `ErrorLog` و«مشاكل العملاء».
