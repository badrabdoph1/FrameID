# Mandatory Architecture Rules

## Purpose

هذه القواعد إلزامية. أي تنفيذ لاحق يجب أن يثبت أنه يحترمها قبل اعتباره مقبولًا. إذا تعارضت ميزة سريعة مع هذه القواعد، يتم تعديل الميزة لا القاعدة.

## CTO Principle

لا يتم تنفيذ التعليمات كما هي إذا كان هناك حل أفضل. دور المعماري هنا هو اقتراح الأفضل، شرح السبب، ذكر المزايا والعيوب، ثم اعتماد القرار الأنسب للمنتج على المدى الطويل.

المنتج يجب أن يبنى كمنصة عالمية قابلة للنمو لخمس سنوات، لا كمشروع إطلاق أول فقط.

## 1. Everything Must Scale

لا يبنى أي جزء على احتياج الإصدار الأول فقط.

يجب أن يسمح النظام لاحقًا بإضافة:

- CRM.
- Booking.
- Client Gallery.
- Contracts.
- Digital Delivery.
- Blog.
- Marketplace.
- Invoices.
- Custom domains.
- Team members.
- Multi-site accounts.

بدون إعادة بناء المشروع.

القاعدة العملية:

- استخدم modules وحدود واضحة.
- صمم entities بحيث تدعم التوسع.
- لا تربط Dashboard بقالب واحد.
- لا تجعل Site يساوي صفحة واحدة دائمًا.

## 2. No Code Duplication

أي منطق يستخدم أكثر من مرة يجب أن يتحول إلى:

- Service.
- Component.
- Hook.
- Utility.
- Validation schema.
- Shared policy.

أمثلة إلزامية:

- slug validation في مكان واحد.
- tenant permission checks في مكان واحد.
- payment status transitions في Billing service.
- upload validation في Media service.
- theme section rendering في Theme renderer.

## 3. Dashboard Uses Unified Layout

Dashboard ليست صفحات منفصلة متنافرة.

يجب أن تعتمد على:

- Layout موحد.
- Widget system.
- Reusable cards.
- Shared empty states.
- Shared autosave indicator.
- Shared mobile navigation.

كل شاشة Dashboard يجب أن تبدو جزءًا من نفس المنتج.

## 4. Everything Must Be Manageable

أي نص أو صورة أو إعداد أو لون أو banner أو page أو notification يجب أن يكون قابلًا للإدارة من Super Admin Console أو Dashboard حسب الملكية.

الاستثناء الوحيد:

- design tokens الأساسية للنظام يمكن أن تكون في الكود، لكن قيم theme/user-facing content يجب أن تكون قابلة للإدارة.

لا يجوز إعادة نشر المشروع لتغيير:

- نص homepage.
- محتوى banner.
- ترتيب templates.
- رسالة notification.
- إعدادات backup.
- إعدادات trial.
- صفحات policy.

## 5. Theme Engine Is the Only Source of Templates

القوالب مسؤولة عن العرض فقط.

لا تحتوي القوالب على:

- business logic.
- billing logic.
- auth logic.
- database queries.
- hardcoded content.
- admin behavior.

كل المنطق داخل Core Platform.

## 6. No Hardcoded Data

لا توجد داخل Components:

- أسماء.
- صور.
- أسعار.
- نصوص.
- ألوان مستخدم/قالب قابلة للتعديل.
- روابط.
- أرقام واتساب.
- بيانات اجتماعية.

كل شيء يأتي من:

- database.
- platform settings.
- theme config.
- design tokens.
- environment variables للأسرار فقط.

## 7. Design System Required

يجب إنشاء Design System كامل قبل بناء الواجهات الكبيرة.

يشمل:

- Typography.
- Spacing scale.
- Radius scale.
- Shadows.
- Colors.
- Motion.
- Icons.
- Buttons.
- Inputs.
- Cards.
- Modals.
- Toasts.
- Badges.
- Tabs.
- Skeletons.
- Empty states.
- Navigation.
- Data display.

المنصة كلها تستخدم نفس Design System:

- Marketing.
- Auth.
- Dashboard.
- Super Admin.
- Public sites controls.

## 8. Same Design Language

لا يسمح بأن تبدو صفحة مختلفة عن باقي المنصة.

يمكن أن تختلف القوالب العامة للمصورين لأنها Themes، لكن واجهات المنصة نفسها يجب أن تبقى متماسكة.

## 9. Performance Before Effects

أي Animation لا تضيف قيمة حقيقية يتم حذفها.

القاعدة:

- Motion للتوجيه لا للإبهار.
- لا animation تعطل القراءة.
- لا تأثير بصري يضر LCP أو INP.
- reduced motion إلزامي.

## 10. Accessibility

النظام يجب أن يحقق أفضل ممارسات:

- Keyboard navigation.
- Focus states.
- ARIA عند الحاجة.
- Contrast.
- Screen readers.
- semantic HTML.
- no color-only state.
- target sizes مناسبة للهاتف.

## 11. True Mobile First

لا يتم تصغير نسخة Desktop.

العمل يبدأ من الهاتف:

- user flow.
- navigation.
- editing.
- upload.
- widgets.
- primary actions.

ثم يتم توسيع التجربة لسطح المكتب.

## 12. Dashboard Auto Save

التعديلات اليومية تحفظ تلقائيًا.

لا نعتمد على زر "حفظ" في كل صفحة.

الاستثناءات التي تحتاج تأكيدًا صريحًا:

- تغيير الرابط.
- حذف صور كثيرة.
- تغيير القالب.
- تعطيل الموقع.
- عمليات billing.
- restore backup.

## 13. One Goal Per Screen

كل شاشة تجيب عن سؤال واحد.

أمثلة:

- Home: ما حالة موقعي الآن؟
- Gallery: كيف أرفع وأنظم صوري؟
- Packages: كيف أعدل باقاتي؟
- Billing: كيف أفعّل موقعي؟

لا تكدس كل شيء في شاشة واحدة.

## 14. Global-Product UX Bar

يجب أن يشعر المستخدم بجودة قريبة من:

- Apple.
- Linear.
- Framer.
- Notion.
- Raycast.

هذا لا يعني نسخهم. يعني:

- وضوح.
- سرعة.
- اختصار.
- تفاصيل مصقولة.
- ثقة.

## 15. Future Ready

كل قرار هندسي يراجع بسؤال:

هل سيبقى هذا القرار مناسبًا بعد خمس سنوات؟

إذا لا، يجب البحث عن حل أمتن حتى لو كان أبطأ قليلًا الآن.

## Required Architecture Review Questions

قبل تنفيذ أي milestone:

- هل هذا قابل للتوسع؟
- هل يكرر منطقًا موجودًا؟
- هل يمكن إدارته من Admin/Dashboard؟
- هل يحافظ على Theme Engine كالمصدر الوحيد للقوالب؟
- هل يحتوي على hardcoded data؟
- هل يستخدم Design System؟
- هل يعمل Mobile First؟
- هل يحترم accessibility؟
- هل الأداء متضرر من تأثيرات غير ضرورية؟
- هل يمكن إضافة CRM/Booking/Gallery/Contracts لاحقًا دون إعادة بناء؟

## Final Rule

إذا كان المطلوب المكتوب أقل جودة من حل معماري أفضل، يتم توثيق البديل واعتماده بعد شرح المزايا والعيوب. الهدف هو أفضل منصة، لا مجرد تنفيذ حرفي.
