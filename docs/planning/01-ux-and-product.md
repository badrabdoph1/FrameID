# UX and Product Architecture

## Product Positioning

المنصة ليست Website Builder عام. هي منتج متخصص للمصورين، لذلك يجب أن تختصر الاختيارات بدل أن تفتح محررًا معقدًا. المصور يريد نتيجة فخمة بسرعة، لا يريد تعلم نظام تصميم.

الشخصيات الأساسية:

- مصور مستقل يريد موقعًا سريعًا يعرض الباقات والأعمال وطرق التواصل.
- Studio صغير يحتاج رابطًا احترافيًا يرسله للعملاء.
- Admin داخلي يدير العملاء والاشتراكات والقوالب والمراجعات.

## Information Architecture

### Public Marketing

- `/` الصفحة الرئيسية.
- `/templates` Showroom القوالب.
- `/templates/[code]/preview` معاينة حية للقالب.
- `/login` تسجيل الدخول.
- `/signup` إنشاء الحساب.
- `/forgot-password` استعادة كلمة المرور.
- `/privacy` سياسة الخصوصية.
- `/terms` الشروط.

لا نضيف Blog أو About أو Features كثيرة في البداية. الهدف هو التحويل.

### Photographer Website

- `/p/[slug]` موقع المصور.
- `/p/[slug]/gallery` اختياري حسب القالب.
- `/p/[slug]/packages` اختياري حسب القالب.
- `/p/[slug]/contact` اختياري حسب القالب.

مبدئيًا يمكن أن تكون صفحة واحدة غنية، ثم تتحول إلى صفحات حسب القالب والـ SEO.

### Photographer Dashboard

- `/dashboard` أول شاشة ورابط الموقع.
- `/dashboard/design` القالب والهوية.
- `/dashboard/content` النصوص والأقسام.
- `/dashboard/gallery` الصور والألبومات.
- `/dashboard/packages` الباقات والأسعار.
- `/dashboard/contact` بيانات التواصل والحجز.
- `/dashboard/settings` اللغة، SEO، الحساب.
- `/dashboard/billing` التجربة والتفعيل.

### Admin Console

- `/admin/customers`
- `/admin/subscriptions`
- `/admin/templates`
- `/admin/content`
- `/admin/notifications`
- `/admin/payments`
- `/admin/audit`
- `/admin/settings`

## UX Flow

### Visitor to Trial

1. يدخل الزائر الصفحة الرئيسية.
2. يرى عرضًا واضحًا: موقع مصور جاهز خلال دقائق.
3. يفتح صفحة القوالب.
4. يضغط معاينة على قالب.
5. يرى موقعًا حقيقيًا ببيانات Preview.
6. يضغط "استخدام هذا القالب".
7. إن لم يكن مسجلًا، ينتقل إلى إنشاء الحساب مع حفظ القالب المختار.
8. بعد التسجيل، ينشئ النظام تلقائيًا الحساب والموقع والرابط والبيانات الافتراضية.
9. يدخل المستخدم مباشرة إلى Dashboard.

### First Dashboard Screen

الشاشة الأولى يجب أن تؤدي وظيفة واحدة: تجعل المصور يشعر أن موقعه أصبح موجودًا.

المحتوى الثابت:

- بطاقة رابط الموقع.
- زر نسخ الرابط.
- زر فتح الموقع.
- حالة الموقع: Trial / Active / Expired.

قسم تغيير الرابط:

- يظهر فقط إن لم يستخدم المستخدم فرصة تغيير الرابط.
- أثناء الكتابة تظهر الحالات: متاح، مستخدم، غير صالح.
- يعرض اقتراحات ذكية عند التعارض.
- بعد الحفظ يختفي قسم التعديل فقط، وتبقى بطاقة الرابط دائمًا.

قواعد الرابط:

- lowercase Latin.
- أرقام وشرطات فقط بجانب الحروف.
- لا يبدأ أو ينتهي بشرطة.
- منع الكلمات المحجوزة مثل `admin`, `login`, `api`, `templates`, `support`, `billing`.
- تغيير واحد فقط بعد إنشاء الموقع.

### Trial to Activation

- لا يوجد دفع قبل التجربة.
- أثناء Trial يظهر تنبيه هادئ بعدة أيام متبقية.
- عند انتهاء التجربة تتحول الحالة إلى Expired.
- لا تحذف البيانات تلقائيًا.
- المواقع Expired يمكن أن تعرض شاشة خفيفة لصاحب الموقع عند الدخول، أو تستمر لفترة Grace حسب قرار المنتج.
- CTA الأساسي: "تفعيل موقعي".

## Template Showroom

صفحة القوالب هي Showroom، لا Marketplace مزدحم.

كل Card يحتوي:

- Preview حي داخل Frame أو Thumbnail مولد من Preview حي.
- اسم القالب.
- كود القالب.
- زر معاينة.
- زر استخدام القالب.

معاينة القالب:

- تفتح صفحة القالب الحقيقية.
- تستخدم Preview Data وليس Screenshot ثابت.
- تحتوي Floating Action ثابت:
  - رجوع.
  - استخدام هذا القالب.
- في وضع المعاينة لا تظهر عناصر Dashboard ولا أدوات تحرير.

## Mobile First Design Rules

نسخة الهاتف ليست نسخة مصغرة. هي التجربة الأصلية.

قواعد الهاتف:

- Navigation سفلي أو Header مختصر حسب السياق.
- أهم إجراء يظهر بالإبهام: أسفل الشاشة أو ضمن Sticky bar.
- الحقول قصيرة ومقسمة.
- Cards بعرض ثابت نسبيًا وسحب أفقي عندما يخدم القرار البصري.
- لا توجد جداول في الهاتف؛ تتحول إلى قوائم قابلة للبحث والفلترة.
- لا توجد Modals كبيرة للحالات الأساسية؛ نستخدم Sheets أو صفحات مخصصة.

قواعد سطح المكتب:

- زيادة كثافة المعلومات بدون تحويل المنتج إلى لوحة إدارية تقليدية.
- Sidebar هادئ.
- مناطق Preview بجانب أدوات التحرير.
- لا نستخدم زخارف كثيرة. الفخامة تأتي من المساحة، التباين، التصوير، والنص.

## Design Direction

### Brand Feel

Premium, Luxury, Minimal, Elegant, Modern, Extremely Fast.

### Visual System

Palette مقترحة للمنصة:

- Ink: `#070707`
- Pearl: `#F6F3EE`
- Champagne: `#D9B977`
- Graphite: `#1C1C1C`
- Mist: `#A7A7A7`
- Signal: `#2F6BFF`

الأزرق يستخدم فقط للحالات الوظيفية، وليس كلون هوية رئيسي. الذهب يستخدم بحذر، لأن الإفراط فيه يحول الفخامة إلى قالب تقليدي.

### Typography

- Arabic UI: خط عربي واضح مثل IBM Plex Sans Arabic أو Tajawal، لكن بوزن واستخدام أدق.
- English display في قوالب الفخامة: Playfair Display أو Cormorant Garamond حسب القالب.
- Dashboard UI: sans عملي وهادئ، لا يعتمد على display fonts.

### Motion

- Motion هادئ وسريع.
- Skeleton Loading بدل Spinners قدر الإمكان.
- احترام `prefers-reduced-motion`.
- لا تعتمد تجربة القراءة على Animation.

## Copy Principles

- الأزرار تصف الفعل: "استخدام القالب"، "فتح الموقع"، "نسخ الرابط"، "تفعيل موقعي".
- لا نستخدم لغة تقنية للمصور.
- لا نقول "Subscription" في الواجهة الأساسية؛ نقول "تفعيل الموقع".
- رسائل الخطأ مباشرة: "هذا الرابط مستخدم" بدل "حدث خطأ".

## Missing Product Pieces to Add

- Onboarding checklist خفيف بعد أول دخول: الرابط، الصور، الباقات، التواصل.
- Preview mode من داخل Dashboard.
- Autosave status: محفوظ / جار الحفظ / فشل الحفظ.
- Version history محدود للمحتوى.
- Empty states فاخرة وهادئة.
- Support handoff داخل Admin للعملاء الذين تعثروا.
