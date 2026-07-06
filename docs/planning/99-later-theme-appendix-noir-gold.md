# Noir Gold Theme Specification

## Source

القالب الأول مستوحى من الملف المرفق: صفحة عربية RTL لمصور باسم Ali Ahmed، بخلفية داكنة ولمسة ذهبية وباقات تصوير وخدمات إضافية وحجز واتساب.

لن نستخدمه كما هو. سنحوّله إلى Theme إنتاجي قابل لإعادة الاستخدام.

## Theme Identity

اسم مقترح: Noir Gold.

الشعور:

- سينمائي.
- هادئ.
- فاخر.
- مناسب لمصوري الزفاف والخطوبة والفعاليات الخاصة.

ليس الهدف أن يكون ذهبيًا في كل مكان. الذهب يجب أن يظهر كلحظة Highlight.

## Design Tokens

### Colors

- Background: `#050505`
- Surface: `#0F0F0F`
- Elevated: `#171717`
- Text Primary: `#F6F3EE`
- Text Muted: `#A7A7A7`
- Champagne: `#D8B46A`
- Champagne Soft: `#F1D89A`
- Border: `rgba(255,255,255,0.08)`

### Typography

- Arabic body: Tajawal أو IBM Plex Sans Arabic.
- English display: Playfair Display أو Cormorant Garamond.
- Numeric prices: English display only عند الحاجة.

### Spacing

- Mobile sections: 72px vertical.
- Desktop sections: 112px vertical.
- Card padding mobile: 20px.
- Card padding desktop: 28px.

### Radius

- Public theme cards: 16px مسموح لأن الطابع بصري.
- Dashboard cards: 8px أو أقل.

## Mobile First Layout

### Home Hero

Mobile:

```text
┌────────────────────┐
│ full image          │
│ dark overlay        │
│                    │
│ PROFESSIONAL PHOTO │
│ ALI AHMED          │
│ باقات تصوير 2026   │
│ [احجز عبر واتساب]  │
└────────────────────┘
```

Desktop:

- Hero full bleed.
- النص في المنتصف أو أسفل المنتصف.
- يظهر جزء بسيط من القسم التالي أسفل الشاشة حتى لا تصبح الصفحة جامدة.

### Packages

Mobile:

- horizontal snap cards.
- بطاقة واحدة تقريبًا في الشاشة.
- زر الاختيار واضح.
- السعر ظاهر قبل قائمة المميزات.

Desktop:

- Grid من 3 أعمدة أو carousel حسب عدد الباقات.
- الباقة المميزة أكبر قليلًا أو لها border champagne.

### Extras

Mobile:

- List compact.
- checkbox-like selection.
- price on left في RTL context بشكل واضح.

Desktop:

- 2 أو 3 أعمدة.

### Gallery

إضافة مقترحة غير موجودة في القالب الحالي:

- masonry-lite أو stacked editorial strips.
- لا نعرض عشرات الصور دفعة واحدة.
- أول 6-9 صور فقط، مع CTA "شاهد المزيد" إذا فعّل المصور Gallery page.

### Contact

بدل ملخص الحجز فقط:

- واتساب CTA.
- هاتف.
- Instagram.
- موقع العمل إن وجد.
- رسالة حجز تتكوّن من الباقة والخدمات.

## Content Schema

### Hero

- `photographerName`
- `eyebrow`
- `headline`
- `subheadline`
- `heroImageAssetId`
- `primaryActionLabel`
- `primaryActionType`

### Packages

- `name`
- `subtitle`
- `priceAmount`
- `currency`
- `features`
- `imageAssetId`
- `isHighlighted`

### Extras

- `name`
- `priceAmount`
- `currency`
- `iconKey`

### GalleryPreview

- `title`
- `assetIds`
- `layoutVariant`

### Notes

- `title`
- `items`

### Contact

- `whatsapp`
- `phone`
- `instagram`
- `facebook`
- `bookingMessageTemplate`

## Interaction Rules

- اختيار باقة يحدث بدون page reload.
- CTA واتساب يبني رسالة واضحة.
- لا نفتح modal login داخل موقع المصور.
- لا توجد admin controls في public theme.
- الأنيميشن reveal بسيط ويعمل مرة واحدة.
- عند reduced motion يتم إيقاف reveal والzoom.

## SEO Rules

- `title`: اسم المصور + نوع التصوير + المدينة إن وجدت.
- `description`: وصف قصير من Dashboard.
- OG image: hero أو image مخصصة.
- Structured Data: ProfessionalService عند توفر phone/location.
- الصور لها alt قابل للتعديل.

## Accessibility Rules

- contrast كاف.
- buttons تحمل labels واضحة.
- لا نعتمد على اللون فقط في selected state.
- focus ring ظاهر.
- الصور decorative تكون alt فارغ، صور المعرض لها alt.

## Performance Rules

- Hero image priority with sizes 100vw.
- package images lazy.
- gallery lazy.
- لا تحميل Font Awesome.
- لا تحميل React client bundle كبير للموقع العام إلا للتفاعل المطلوب.
- فصل checkout widget كـ Client Component صغير.

## What Must Be Removed From Source Template

- Firebase client config.
- hardcoded admin credentials.
- admin modal.
- Babel standalone.
- React CDN.
- Tailwind CDN.
- Font Awesome CDN.
- direct image URLs as permanent data model.
- alerts as UX.

## What Can Be Preserved

- dark luxury mood.
- package selection concept.
- extras selection concept.
- WhatsApp confirmation concept.
- Arabic RTL structure.
- gold accent as restrained identity.
