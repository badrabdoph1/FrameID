# Acceptance Criteria and Risk Register

## Product Acceptance Criteria

### Visitor Flow

- الزائر يستطيع فهم المنتج من أول شاشة.
- يستطيع فتح القوالب في أقل من ضغطة واحدة من الصفحة الرئيسية.
- يستطيع معاينة قالب حقيقي.
- يستطيع استخدام القالب من المعاينة.
- إذا سجل بعد اختيار قالب، لا يفقد اختياره.

### Site Creation

- بعد إنشاء الحساب يتم إنشاء الموقع تلقائيًا.
- المستخدم لا يرى شاشة إعداد طويلة قبل الحصول على الرابط.
- رابط الموقع يعمل فورًا.
- البيانات الافتراضية مناسبة للقالب المختار.

### Dashboard First Screen

- بطاقة الرابط ثابتة دائمًا.
- copy link يعمل.
- open site يعمل.
- تغيير الرابط مرة واحدة فقط.
- رسائل توفر الرابط تظهر أثناء الكتابة.

### Trial

- لا يوجد دفع قبل إنشاء الموقع.
- الحالة Trial واضحة.
- انتهاء Trial لا يحذف البيانات.
- CTA "تفعيل موقعي" يظهر في الوقت المناسب.

### Admin

- Admin يستطيع رؤية كل العملاء.
- Admin يستطيع مراجعة الدفع اليدوي.
- Admin يستطيع تفعيل الاشتراك.
- كل عملية حساسة تسجل في audit.

## Technical Acceptance Criteria

- لا توجد أسرار في client bundle.
- كل query حساس مربوط بـ tenantId.
- كل mutation يتحقق من ownership.
- preview pages noindex.
- photographer pages لها metadata ديناميكية.
- الصور تستخدم pipeline محسّن.
- build ينجح بدون warnings خطيرة.
- توجد اختبارات عزل tenant.

## Design Acceptance Criteria

- الهاتف هو التجربة الأساسية.
- لا توجد واجهة مزدحمة.
- الأزرار الأساسية واضحة باللمس.
- Dashboard لا يشبه لوحة admin تقليدية.
- القالب الأول يحافظ على الفخامة بدون إفراط في الذهب.
- motion هادئ ويمكن تعطيله.

## Risk Register

### Risk: Tenant Data Leak

الخطورة: عالية جدًا.

السبب: multi-tenant في قاعدة واحدة.

التخفيف:

- services مركزية.
- اختبارات ownership.
- audit admin.
- لا queries مباشرة عشوائية في UI.

### Risk: Theme System Becomes Hardcoded

الخطورة: عالية.

السبب: بناء أول قالب كصفحة واحدة.

التخفيف:

- Theme Registry من البداية.
- sections schemas.
- preview data منفصل.
- ممنوع data ثابتة داخل components.

### Risk: Manual Payments Create Operational Delay

الخطورة: متوسطة إلى عالية.

السبب: مراجعة بشرية.

التخفيف:

- Admin payment queue واضحة.
- notifications.
- proof upload.
- internal notes.
- SLA داخلي للمراجعة.

### Risk: Sites Become Slow Due to Images

الخطورة: عالية.

السبب: المصورون يرفعون صورًا كبيرة.

التخفيف:

- limits.
- image metadata.
- compression/transforms.
- lazy loading.
- CDN.

### Risk: Dashboard Overbuilt

الخطورة: متوسطة.

السبب: محاولة بناء Website Builder عام.

التخفيف:

- presets لا حرية مفتوحة.
- لا custom CSS.
- sections محدودة.
- UX focused على قرارات المصور الحقيقية.

### Risk: SEO Pollution From Preview/Expired Pages

الخطورة: متوسطة.

السبب: صفحات كثيرة low-value.

التخفيف:

- preview noindex.
- expired noindex بعد grace.
- sitemap فقط للمواقع المنشورة والمسموح فهرستها.

### Risk: Future Custom Domains Are Painful

الخطورة: متوسطة.

السبب: عدم تصميم Domain model مبكرًا.

التخفيف:

- SiteDomain table من البداية.
- canonical URL abstraction.
- routing layer لا يفترض `/p/[slug]` إلى الأبد.

## Open Product Decisions

- مدة Trial: 7، 14، أم 30 يومًا؟
- هل Expired site يظل ظاهرًا للزوار أم يعرض صفحة انتهاء؟
- هل المصور يستطيع تغيير القالب أثناء Trial؟
- هل نسمح بأكثر من موقع لكل حساب لاحقًا؟
- هل لغة المنصة عربية فقط في البداية أم bilingual؟
- هل مطلوب فواتير رسمية أم إثبات دفع بسيط؟

## Recommended Initial Decisions

- Trial: 14 يومًا.
- Expired: لا حذف، الموقع العام يتحول إلى noindex بعد grace period.
- تغيير القالب: مسموح قبل التفعيل مع تحذير بسيط.
- موقع واحد لكل حساب في البداية.
- العربية أولًا، مع data model يدعم الإنجليزية.
- الدفع اليدوي بإثبات فقط في النسخة الأولى.
