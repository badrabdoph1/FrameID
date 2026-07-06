# Theme Engine

## Goal

نظام القوالب يجب أن يسمح بإضافة قالب جديد بدون تعديل منطق المنصة الأساسي. القالب يعرّف نفسه، بياناته الافتراضية، إعداداته، مكوناته، وقيوده.

## Theme Package Concept

كل Theme يتكون من:

- Metadata.
- Theme Config schema.
- Content schema.
- Components.
- Preview Data.
- Default Settings.
- Supported Sections.
- SEO defaults.
- Version.

مثال مفاهيمي:

- `code`: `noir-gold`
- `name`: Noir Gold
- `category`: Wedding / Luxury
- `direction`: rtl-first
- `sections`: hero, packages, extras, notes, contact, social
- `styleTokens`: ink, champagne, pearl, graphite

## Registry

يوجد Theme Registry داخل التطبيق يسجل القوالب المنشورة. قاعدة البيانات تخزن metadata وحالة النشر، والكود يحتوي renderer/components.

لماذا هذا أفضل؟

- يمنع تنفيذ كود غير موثوق من قاعدة البيانات.
- يجعل القوالب قابلة للاختبار.
- يسمح بإصدارات theme واضحة.
- يحافظ على أداء Next.js bundling.

## Rendering Flow

1. route الخاص بموقع المصور يستقبل slug.
2. يجلب Site وTenant status.
3. يجلب Theme by site.themeId.
4. يجلب sections وtheme config وcontact وpackages وgallery.
5. يمرر data إلى Theme Renderer.
6. Renderer يختار component المناسب لكل section.
7. الصفحة تنتج Metadata وStructured Data.

## Data Separation

ما يخص القالب:

- ألوان.
- Typography.
- spacing scale.
- شكل cards.
- Layout variants.
- animation preferences.
- supported sections.

ما يخص المصور:

- الاسم.
- الصور.
- الباقات.
- الأسعار.
- الخدمات الإضافية.
- واتساب وروابط التواصل.
- SEO title/description.

ما يخص المنصة:

- auth.
- billing.
- trial state.
- admin tools.
- media processing.

## First Theme: Noir Gold

القالب الأول مستوحى من الملف المرفق، لكن يعاد تصميمه كقالب احترافي.

### What to Keep

- الإحساس الداكن الفاخر.
- الذهب كلمسة خفيفة.
- Hero بصورة قوية.
- عرض الباقات بشكل بصري.
- CTA إلى واتساب أو نموذج حجز.
- دعم العربية RTL.

### What to Improve

- إزالة Admin/Login من القالب.
- إزالة Firebase وBabel وCDN runtime.
- استبدال Font Awesome بـ lucide أو icon system داخلي.
- تحويل الصور إلى MediaAsset محسّن.
- جعل النصوص والباقات والخدمات من قاعدة البيانات.
- دعم Skeleton Loading عند الحاجة.
- ضبط Motion وتخفيفه.
- تحسين contrast وfocus states.
- جعل الهاتف التجربة الأساسية.
- توليد Metadata وOG حسب المصور.

### Suggested Sections

- Hero: صورة، اسم المصور، وصف قصير، CTA.
- Packages: بطاقات باقات سحب أفقي على الهاتف، Grid هادئ على desktop.
- Extras: خدمات إضافية بسيطة.
- Gallery Preview: صور مختارة أو ألبومات.
- Notes: شروط الحجز أو ملاحظات.
- Contact: واتساب، هاتف، Instagram، Facebook.
- Footer: اسم المصور وروابط بسيطة.

## Preview Data

كل Theme يملك Preview Data منفصلًا:

- مصور وهمي.
- صور مرخصة أو assets داخل المشروع.
- باقات واقعية.
- معلومات تواصل وهمية.

لا تستخدم بيانات عميل حقيقي في preview.

## Theme Settings

إعدادات مسموحة للمستخدم:

- اختيار لون Accent من presets محدودة.
- اختيار نمط Hero: centered, editorial, split-lite حسب القالب.
- إظهار/إخفاء أقسام.
- ترتيب الأقسام.
- رفع شعار أو استخدام اسم نصي.

لا نفتح محرر CSS للمستخدم. المنتج يجب أن يحمي جودة النتيجة.

## Versioning

كل Theme له version.

عند تحديث Theme:

- التحديثات الآمنة تطبق تلقائيًا.
- التغييرات التي تكسر الشكل تحتاج migration.
- يمكن ربط Site بـ theme version محدد عند الحاجة.

## Adding New Themes

خطوات إضافة قالب جديد لاحقًا:

1. تعريف metadata.
2. تعريف supported sections.
3. بناء components.
4. إضافة preview data.
5. إضافة theme config schema.
6. تسجيله في registry.
7. إضافة screenshot/preview generation اختياري.
8. اختبار mobile، desktop، SEO، performance.

## Anti-Patterns

- لا تضع Queries داخل component الخاص بالقالب.
- لا تجعل القالب يعرف billing أو auth.
- لا تخزن JSX أو HTML كامل في قاعدة البيانات.
- لا تستخدم iframe لموقع المصور الحقيقي إلا في Showroom preview.
- لا تجعل كل قالب route مستقلًا بمنطق مكرر.
