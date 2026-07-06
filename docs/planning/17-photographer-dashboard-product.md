# Photographer Dashboard Product Architecture

## Purpose

Photographer Dashboard هو المنتج اليومي الحقيقي للعميل. يجب ألا يكون صفحات CRUD. هو مركز إدارة الموقع، مصمم لشخص لا يملك خبرة تقنية ويريد نتيجة احترافية بسرعة.

## Product Bar

يجب أن يشعر المستخدم أنه يستخدم منتجًا بمستوى:

- Apple.
- Notion.
- Framer.
- Shopify.
- Linear.

المعنى العملي:

- تجربة هادئة.
- قرارات قليلة.
- نتائج واضحة.
- تحرير سريع.
- حفظ تلقائي.
- هاتف أولًا.

## Core Dashboard Principle

Dashboard ليست مرتبطة بقالب معين.

هي تدير:

- Site.
- Content.
- Media.
- Packages.
- Contact.
- SEO.
- Subscription.
- Theme config.

Theme Engine هو الذي يعرض هذه البيانات.

## Navigation Strategy

لا نبدأ بـ Sidebar ضخم.

### Mobile

الاقتراح:

- Bottom Navigation للأقسام الأساسية:
  - Home.
  - Edit.
  - Gallery.
  - Billing.
  - More.

داخل Edit تظهر tabs أو sheets:

- Identity.
- Packages.
- Contact.
- SEO.
- Design.

السبب:

- أسهل للإبهام.
- يقلل الازدحام.
- مناسب للاستخدام اليومي.

### Desktop

الاقتراح:

- Quiet side rail صغير.
- Content canvas في الوسط.
- Preview/action panel عند الحاجة.

ليس sidebar تقليدي مليء بعشرين عنصرًا.

## Dashboard Home as Photographer Command Center

أول شاشة ليست مجرد رابط. هي مركز قيادة خفيف.

Widgets أساسية:

- Site link card.
- Copy link.
- Open site.
- Subscription status.
- Site status.
- Last visits.
- Last edits.
- Recent notifications.
- Last saved version.
- Trial remaining days.
- Quick actions.

Quick actions:

- Edit hero.
- Add photos.
- Edit packages.
- Preview site.
- Activate my site.

Widget link section:

- يظهر دائمًا.
- تغيير الرابط يظهر فقط إن لم يستخدم الفرصة.

## One Goal Per Screen

كل شاشة لها هدف واحد:

- Gallery: رفع وتنظيم الصور.
- Packages: تعديل الباقات والخدمات.
- Contact: جعل العملاء يستطيعون التواصل.
- Design: اختيار القالب وتخصيص محدود.
- SEO: تحسين ظهور الموقع ومشاركة الرابط.
- Billing: تفعيل الموقع وإدارة الحالة.

## Editing Experience

### Preferred Pattern

Inline editing + side sheets + live preview.

بدل فتح عشر صفحات:

- المستخدم يضغط section.
- يظهر editor خفيف.
- يرى autosave.
- يستطيع preview.

### Auto Save Strategy

التعديلات اليومية تحفظ تلقائيًا:

- debounce 600-1000ms للحقول النصية.
- optimistic UI.
- autosave indicator:
  - محفوظ.
  - جار الحفظ.
  - تعذر الحفظ.
- retry آمن.
- conflict handling لاحقًا.

العمليات التي تحتاج تأكيد:

- تغيير الرابط.
- حذف album.
- حذف عدة صور.
- تغيير القالب.
- تعطيل الموقع.
- restore version.

## Theme Editing

يجب أن يكون بسيطًا:

- اختيار قالب.
- preview قبل التبديل.
- ألوان محدودة من presets.
- ترتيب الأقسام.
- إظهار/إخفاء أقسام.

لا:

- CSS حر.
- تحكم كامل في spacing.
- خيارات لا يفهمها المصور.

التصميم يحمي المستخدم من إفساد النتيجة.

## Content Management

المصور يدير:

- الاسم والهوية.
- وصف قصير.
- صور Hero.
- الباقات.
- الخدمات الإضافية.
- المعرض.
- وسائل التواصل.
- SEO.
- إعدادات الموقع.
- الاشتراك.

كل ذلك بأقل خطوات.

## Gallery and Upload Experience

متطلبات:

- drag and drop على desktop.
- multi-upload.
- camera roll friendly على mobile.
- compression.
- progress indicators.
- cancel/retry.
- reorder.
- album cover.
- preview.
- alt text optional.

تحسينات مقترحة:

- auto-detect image orientation.
- suggest best hero images لاحقًا.
- warn on low-resolution images.
- storage usage indicator.
- duplicate detection لاحقًا.

## Notifications

نظام إشعارات داخلي غير مزعج.

أنواع:

- Trial ending.
- Payment status.
- Site health.
- Upload completed.
- Backup/system messages للمدير فقط.
- SEO missing fields.
- New feature announcements.

Priorities:

- Critical.
- Important.
- Info.

لا تعرض كل شيء كtoast. بعض الإشعارات تظهر في notification center فقط.

## Site Health Widget

اقتراح مهم:

اعرض للمصور درجة جاهزية بسيطة:

- رابط جاهز.
- صورة رئيسية موجودة.
- باقات موجودة.
- واتساب موجود.
- SEO title موجود.
- معرض يحتوي صور.

ليس كضغط مزعج، بل كقائمة هادئة تساعده يصل لموقع مكتمل.

## Performance Strategy

- تحميل Home أولًا.
- lazy load heavy editors.
- lazy load gallery management.
- paginate media.
- virtualize large lists عند الحاجة.
- لا تحميل Theme preview إلا عند فتحه.
- cache dashboard shell.
- Server Components للقراءات.
- Client Components فقط للتفاعل.

## Future Extensibility

Dashboard يجب أن يقبل إضافة:

- Booking.
- Contracts.
- Client Gallery.
- Digital Delivery.
- CRM.
- Blog.
- Store/Marketplace.

لذلك:

- navigation modular.
- widgets registry.
- feature flags.
- module cards.
- permissions per module.

## Suggested Future Modules

### Booking

- availability.
- inquiry forms.
- booking requests.
- calendar.

### Client Gallery

- private galleries.
- password protection.
- favorite selection.
- download permissions.

### Contracts

- contract templates.
- signature status.
- payment terms.

### Digital Delivery

- deliver albums.
- download tracking.
- expiry dates.

### CRM

- leads.
- clients.
- notes.
- status pipeline.

### Blog

- articles.
- SEO content.
- stories.

## Architecture Rules

- Dashboard UI uses shared widgets.
- No page-specific duplicated controls.
- All mutations use services/actions.
- Auto save has one shared mechanism.
- Notification system shared.
- Upload flow shared.
- Theme-specific UI is not embedded in Dashboard.

## Implementation Timing

Dashboard Home comes early because it proves value.

Advanced editors come after:

1. Site system.
2. Theme Engine.
3. Media system.
4. Autosave service.
5. Audit basics.
