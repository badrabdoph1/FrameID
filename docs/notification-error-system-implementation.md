# FrameID Production Notification & Error System

## الهدف

تم توحيد مسار الإشعارات والأخطاء داخل FrameID بحيث يحصل المستخدم على رسالة عربية واضحة، ويحصل فريق التطوير على تفاصيل تشخيصية قابلة للنسخ والتتبع.

## القرار المعماري

بدلاً من إنشاء Toasts منفصلة داخل الصفحات، أصبح التعامل يتم عبر خدمات موحدة:

- `notify.success()`
- `notify.info()`
- `notify.warning()`
- `notify.error()`
- `processError()`
- `logger`
- `createAction()`

هذا يجعل أي جزء جديد في المنصة يستخدم نفس النظام بدل تنفيذ رسائل خاصة به.

## مسار الخطأ

1. يحدث الخطأ في UI أو API أو Server Action.
2. يتم تمريره إلى `processError()`.
3. يتم تصنيفه إلى Error Code موحد مثل `FID-AUTH-001` أو `FID-DB-002`.
4. يتم إنشاء `Request ID` و `Correlation ID`.
5. يتم إخفاء التفاصيل التقنية عن المستخدم.
6. يتم تسجيل التفاصيل في `ErrorLog`.
7. يظهر للمستخدم إشعار عربي واضح مع زر نسخ تفاصيل الخطأ.

## تفاصيل النسخ

زر نسخ تفاصيل الخطأ ينسخ:

- Error Code
- Message
- Route
- Method
- Timestamp
- Request ID
- Correlation ID
- Browser
- Platform
- User Agent
- User ID
- Tenant ID
- Suggestion
- Metadata
- Stack/Cause في Development فقط

## Request ID و Correlation ID

تم تحديث `middleware.ts` ليولد ويمرر:

- `x-request-id`
- `x-correlation-id`
- `x-pathname`
- `x-method`
- `x-url`

وبالتالي يمكن ربط الخطأ بين Frontend و API و Server Actions.

## Logging

تم تحديث `logger` ليعمل بمستويات:

- DEBUG
- INFO
- WARN
- ERROR
- FATAL

ويقوم بتسجيل الأحداث في `ErrorLog`، مع الاحتفاظ بـ console فقط كوسيلة عرض إضافية وليست مصدر الحقيقة.

## Notification Center

تم تحسين مركز الإشعارات داخل الإدارة ليشمل:

- Success
- Warning
- Info
- Error
- بحث
- فلترة
- إحصائيات
- تفاصيل تشخيصية داخل جسم الإشعار عند توفرها

## Error Center

مركز الأخطاء يدعم:

- عدد الأخطاء
- الأخطاء المفتوحة
- البحث
- الفلترة حسب التصنيف والمستوى
- نسخ التفاصيل
- عرض Request ID و Correlation ID
- حل المشكلة وتسجيل من قام بالحل

## UX

تم تصميم الإشعارات لتكون:

- Dark Mode friendly
- Responsive
- Accessible
- Keyboard friendly
- فيها زر إغلاق
- فيها animation خفيفة
- لا تغلق رسائل الخطأ تلقائياً حتى ينسخ المستخدم التفاصيل أو يغلقها بنفسه

## ملاحظات مستقبلية

- يمكن لاحقاً إضافة أعمدة `requestId`, `correlationId`, `route` إلى جدول `NotificationLog` بدلاً من حفظها داخل `body`، لكن تم تجنب تعديل schema كبير في هذه المرحلة لمنع كسر الإنتاج.
- يفضل تحويل Server Actions القديمة تدريجياً لاستخدام `createAction()` للحصول على نفس شكل النتائج والتشخيص.
