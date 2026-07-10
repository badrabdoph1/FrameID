# عقد القوالب في FrameID

هذا العقد إلزامي لأي قالب جديد يتم إضافته إلى المنصة، وأي تعديل على قالب موجود يجب أن يلتزم به حتى لا يحدث اختلاف بين لوحة تحكم العميل والموقع المنشور.

## مصادر البيانات الأساسية

كل قالب يجب أن يقرأ البيانات من `PublicSiteViewModel` فقط، بدون نصوص تسويقية ثابتة أو صور افتراضية داخل مكوّن القالب نفسه.

- اسم الموقع أو الاستوديو: `site.contact.studioName` ثم `site.metadata.title` ثم `site.hero.headline`.
- عنوان الهيرو: `site.hero.headline`.
- وصف الهيرو: `site.hero.subheadline`.
- صور الواجهة والمعرض: `site.gallery` وصور الباقات الموجودة داخل `site.packages` فقط.
- الباقات: `site.packages` بنفس الاسم والوصف والسعر والمميزات والصورة والحالة المميزة.
- الإضافات: `site.extras` بنفس الاسم والسعر والأيقونة.
- زر الحجز: `site.contact.callToAction` مع `site.contact.whatsapp` أو `site.contact.email`.

## أقسام يجب أن تكون متاحة في كل قالب

كل قالب يجب أن يحتوي على نفس مسارات الأقسام حتى تعمل أزرار التنقل بنفس الشكل:

- `home`
- `gallery`
- `packages`
- `extras`
- `contact`

## قواعد ممنوعة

- ممنوع إضافة نصوص مثل اسم القالب أو مميزات القالب داخل الموقع النهائي.
- ممنوع إضافة صور ثابتة داخل القالب إلا كبيانات seed/preview خارج مكوّن القالب.
- ممنوع ظهور ميزة في قالب وعدم ظهور نفس نوع البيانات في قالب آخر إذا كانت موجودة في `PublicSiteViewModel`.
- ممنوع إضافة حقل جديد داخل القالب فقط؛ أي ميزة جديدة لازم تتنفذ لاحقًا في لوحة العميل ولوحة الأدمن والـ view model والقوالب معًا.

## أداة الالتزام

استخدم helpers الموجودة في:

`src/components/themes/theme-contract.ts`

خصوصًا عند إنشاء قالب جديد:

- `getThemeDisplayName`
- `getThemeMobileCaption`
- `getThemeHeroImage`
- `getThemeFeaturedImage`
- `createThemeBookingHref`
- `formatThemeTotal`
- `normalizeThemeSocialUrl`
