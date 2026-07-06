# Dashboard, Admin, and Subscriptions

## Photographer Dashboard

لوحة التحكم يجب أن تشعر كأنها مساحة تحرير هادئة، لا ERP.

### First Screen

أعلى الشاشة دائمًا:

- بطاقة رابط الموقع.
- Copy link.
- Open site.
- Status badge.

أسفلها، إذا لم يستخدم تغيير الرابط:

- حقل تغيير الرابط.
- تحقق فوري.
- اقتراحات ذكية.
- زر حفظ.

بعد الحفظ:

- يختفي قسم التعديل.
- تبقى بطاقة الرابط.

### Main Dashboard Areas

- Home: الرابط، الحالة، checklist خفيف.
- Design: اختيار القالب، ألوان محدودة، preview.
- Content: الاسم، الوصف، Hero، الملاحظات.
- Gallery: ألبومات وصور.
- Packages: باقات وأسعار وخدمات إضافية.
- Contact: واتساب، هاتف، شبكات اجتماعية.
- SEO: العنوان والوصف وصورة المشاركة.
- Billing: التجربة والتفعيل.

### Editing UX

- Auto Save للحقول البسيطة.
- Save explicit للأعمال الحساسة مثل تغيير الرابط.
- Toasts قليلة.
- حالة حفظ مرئية.
- Undo بسيط أو version history محدود لاحقًا.
- Preview site action ثابت.

### Mobile Dashboard

على الهاتف:

- Bottom nav للأقسام الأساسية.
- Sheets للتحرير السريع.
- قوائم cards بدل الجداول.
- Upload تجربة واضحة.
- أزرار كبيرة ومباعدة مناسبة.

## Admin Panel Architecture

Admin ليس نسخة أكبر من Dashboard. هو console تشغيل.

### Customers

- بحث بالاسم، البريد، الهاتف، slug.
- فلترة بالحالة: trial, active, expired, suspended.
- فتح Tenant profile.
- رؤية الموقع، القالب، آخر نشاط، حالة الدفع.
- Impersonation آمن لاحقًا مع audit واضح.

### Subscriptions

- عرض subscriptions.
- تمديد trial يدويًا.
- تفعيل/إيقاف/تعليق.
- سجل الدفع.

### Templates

- إدارة metadata.
- draft/published/archive.
- ترتيب القوالب في showroom.
- preview data.
- feature flags للقوالب الجديدة.

### Content

- إدارة محتوى الصفحة الرئيسية.
- نصوص السياسات.
- إعدادات SEO للمنصة.

### Notifications

- قوالب رسائل.
- إرسال رسائل trial ending.
- إشعارات داخل التطبيق.

### Payments

- مراجعة طلبات InstaPay/Vodafone Cash.
- رؤية proof.
- approve/reject مع سبب.
- تفعيل الاشتراك عند approve.

### Audit

- سجل عمليات admin.
- سجل تغييرات المستخدمين الحساسة.
- IP/user agent عند الحاجة.

## Subscription System

### States

- `trial`: تجربة مجانية.
- `active`: مفعل.
- `expired`: انتهت التجربة أو الاشتراك.
- `past_due`: دفع إلكتروني فشل لاحقًا.
- `cancelled`: ألغى الاشتراك.
- `suspended`: إيقاف إداري.

### Trial Policy

- إنشاء Trial تلقائي عند إنشاء الموقع.
- مدة Trial محددة في config.
- تذكير قبل الانتهاء.
- لا حذف مباشر بعد الانتهاء.
- يمكن Admin تمديد Trial.

### Manual Payments First

طرق البداية:

- InstaPay.
- Vodafone Cash.

Flow:

1. المستخدم يضغط "تفعيل موقعي".
2. يرى طرق الدفع والتعليمات.
3. يرفع إثبات الدفع أو يضع reference.
4. PaymentRequest تصبح pending.
5. Admin يراجع.
6. عند approve تتحول Subscription إلى active.
7. عند reject تظهر رسالة واضحة للمستخدم.

### Future Payments

- Stripe.
- Cards.
- PayPal.

يجب تصميم PaymentProvider abstraction من البداية، لكن لا نبني تكاملات غير مطلوبة الآن.

## Operational Recommendations

- اجعل تفعيل الدفع اليدوي سريعًا من Admin لأن هذا سيكون عنق الزجاجة.
- أضف note داخلي لكل عميل.
- أضف timeline للعميل: signup, site created, slug changed, payment pending, activated.
- لا تعرض للمستخدم كلمات مثل invoice في البداية إذا لم تكن هناك فواتير رسمية.
