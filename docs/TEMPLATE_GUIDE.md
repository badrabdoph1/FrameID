# دليل إنشاء القوالب في FrameID

> **هذا الدليل هو المرجع الرسمي لإنشاء قوالب جديدة في منصة FrameID.**
> **يجب على أي أداة AI أو مطور قراءة هذا الدليل بالكامل قبل البدء في إنشاء قالب جديد.**

---

## نظرة عامة

القالب في FrameID هو **Presentation Adapter** يستقبل `PublicSiteViewModel` ويعرضه بشكل مرئي. القالب لا يملك بيانات عميل أو منطق أعمال أو قدرات مستقلة.

### المبادئ الأساسية

1. **Responsive Design**: القالب يعمل على جميع الأجهزة (موبايل، تابلت، ديسكتوب) تلقائياً باستخدام CSS media queries. لا توجد نسخ منفصلة للموبايل والديسكتوب.

2. **عقد موحد**: جميع القوالب يجب أن تلتزم بالعقد الموحد للمنصة (`template-contract.ts`).

3. **بيانات مشتركة**: المحتوى (الاسم، الوصف، الباقات) يأتي من مصدر مشترك (`starterContent`)، والقالب يختلف فقط في التصميم والعرض.

4. **لا بيانات ثابتة**: يمنع وضع صور أو أسماء عملاء أو نصوص أعمال ثابتة داخل مكوّن العرض.

---

## بنية القالب

كل قالب يتكون من ثلاثة أجزاء أساسية:

### 1. تعريف الثيم (Theme Definition)

```typescript
export const themeDefinition: ThemeDefinition = {
  code: "theme-code",           // كود فريد للثيم
  name: "اسم الثيم",            // اسم العرض
  version: "1.0.0",             // الإصدار
  status: "published",          // published | draft | archived
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: {              // إعدادات افتراضية
    colorPreset: "preset-name",
    layoutDensity: "editorial",
    motion: "quiet"
  }
};
```

### 2. تعريف القالب (Template Definition)

```typescript
export const templateDefinition: TemplateSummary = {
  code: "template-code",        // كود فريد للقالب
  themeCode: "theme-code",      // كود الثيم المرتبط
  name: "اسم القالب",           // اسم العرض
  status: "published",          // published | draft | archived
  showroomOrder: 1,             // ترتيب الظهور في الكتالوج
  description: "وصف القالب",    // وصف قصير
  starterContent: {             // محتوى البداية الكامل
    site: { ... },
    sections: { ... },
    contact: { ... },
    packages: [ ... ],
    extras: [ ... ],
    gallery: { ... },
    seo: { ... },
    themeSettings: { ... }
  }
};
```

### 3. مكون العرض (Presentation Component)

```typescript
export function ThemeSite({ site }: { site: PublicSiteViewModel }) {
  // عرض القالب هنا
  return <div>...</div>;
}
```

---

## العقد الموحد (Platform Contract)

### الأقسام الإلزامية

كل قالب يجب أن يدعم الأقسام الخمسة التالية بنفس الترتيب:

```typescript
const PLATFORM_TEMPLATE_SECTION_TYPES = [
  "hero",      // القسم الرئيسي
  "gallery",   // معرض الصور
  "packages",  // الباقات
  "extras",    // الخدمات الإضافية
  "contact",   // التواصل
] as const;
```

### عقد القسم

كل قسم يملك:

```typescript
type NormalizedTemplateSection = {
  type: TemplateSectionType;    // نوع القسم
  title: string;                // عنوان القسم
  description: string | null;   // وصف القسم
  sortOrder: number;            // ترتيب الظهور
  isVisible: boolean;           // حالة الظهور
  settings: Record<string, string | number>; // إعدادات خاصة
};
```

### إعدادات Hero

```typescript
type HeroSettings = {
  overlay: "none" | "soft" | "medium" | "strong";
  position: "center" | "top" | "bottom" | "left" | "right";
  height: "compact" | "screen" | "tall";
  cta: {
    label: string;
    target: "packages" | "gallery" | "contact" | "whatsapp";
  };
  eyebrow: string;
};
```

---

## محتوى البداية (Starter Content)

محتوى البداية هو البيانات الافتراضية التي تظهر عند تفعيل القالب. يجب أن يكون كاملاً ومطابقاً للـ schema.

### بنية Starter Content

```typescript
type TemplateStarterContent = {
  site: {
    title: string;
    description: string;
  };
  sections: {
    hero: {
      title: string;
      sortOrder: number;
      isVisible: boolean;
      headline: string;
      subheadline: string;
      imageUrl: string;
      overlay: HeroOverlay;
      position: HeroPosition;
      height: HeroHeight;
      cta: { label: string; target: HeroCtaTarget };
      settings: { eyebrow: string };
    };
    gallery: {
      title: string;
      sortOrder: number;
      isVisible: boolean;
      description: string;
      settings: {
        eyebrow: string;
        layout: "snap" | "grid";
        limit: number;
      };
    };
    packages: {
      title: string;
      sortOrder: number;
      isVisible: boolean;
      description: string;
      settings: {
        eyebrow: string;
        layout: "snap" | "stack";
      };
    };
    extras: {
      title: string;
      sortOrder: number;
      isVisible: boolean;
      description: string;
      settings: {
        eyebrow: string;
        layout: "compact" | "cards";
      };
    };
    contact: {
      title: string;
      sortOrder: number;
      isVisible: boolean;
      callToAction: string;
      settings: {
        eyebrow: string;
        layout: "grid" | "stack";
      };
    };
  };
  contact: {
    studioName: string;
    bio: string;
    longDescription: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string;
    facebook: string;
    tiktok: string;
    workLocation: string;
  };
  packages: Array<{
    id: string;
    name: string;
    subtitle: string;
    priceAmount: number;
    currency: string;
    features: string[];
    imageUrl: string;
    isHighlighted: boolean;
    sortOrder: number;
  }>;
  extras: Array<{
    id: string;
    name: string;
    description: string;
    priceAmount: number;
    currency: string;
    iconKey: string;
    sortOrder: number;
  }>;
  gallery: {
    album: {
      title: string;
      description: string;
      sortOrder: number;
    };
    images: Array<{
      id: string;
      url: string;
      alt: string;
      caption: string;
      sortOrder: number;
      isFeatured: boolean;
    }>;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string | null;
    robotsIndex: boolean;
    structuredData: {
      "@context": "https://schema.org";
      "@type": string;
      name: string;
      description: string;
    };
  };
  themeSettings: Record<string, unknown>;
};
```

---

## PublicSiteViewModel

القالب يستقبل `PublicSiteViewModel` الذي يحتوي على جميع البيانات المعالجة:

```typescript
type PublicSiteViewModel = {
  siteId: string;
  themeCode: string;
  publicUrl: string;
  metadata: Metadata;
  structuredData: Record<string, unknown>;
  sections: Record<string, NormalizedTemplateSection>;
  orderedSections: NormalizedTemplateSection[];
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
    overlay: HeroOverlay;
    position: HeroPosition;
    height: HeroHeight;
    cta: { label: string; target: HeroCtaTarget };
    eyebrow: string;
  };
  contact: {
    studioName: string | null;
    bio: string | null;
    longDescription: string | null;
    callToAction: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    workLocation: string;
  };
  packages: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    price: string;
    priceAmount: number;
    currency: string;
    features: string[];
    imageUrl: string | null;
    isHighlighted: boolean;
  }>;
  extras: Array<{
    id: string;
    name: string;
    description?: string | null;
    price: string;
    priceAmount: number;
    currency: string;
    iconKey: string | null;
  }>;
  gallery: Array<{
    id: string;
    url: string;
    alt: string;
    caption: string | null;
  }>;
};
```

---

## خطوات إنشاء قالب جديد

### 1. قراءة المتطلبات

قبل البدء، اقرأ:
- `docs/TEMPLATE_GUIDE.md` (هذا الملف)
- `docs/theme-template-contract.md`
- `docs/CREATE_NEW_TEMPLATE.md`
- `src/modules/themes/template-contract.ts`
- `src/modules/themes/template-starter-content.ts`
- القوالب الحالية كمراجع

### 2. إنشاء تعريف الثيم

أنشئ ملف جديد في `src/modules/themes/definitions/`:

```typescript
// src/modules/themes/definitions/my-theme.ts
import type { ThemeDefinition } from "@/modules/themes/theme-registry";
import { PLATFORM_TEMPLATE_SECTION_TYPES } from "@/modules/themes/template-contract";

export const myTheme: ThemeDefinition = {
  code: "my-theme",
  name: "اسم الثيم",
  version: "1.0.0",
  status: "published",
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: {
    colorPreset: "custom",
    layoutDensity: "editorial",
    motion: "quiet"
  }
};
```

### 3. إنشاء تعريف القالب

في نفس الملف أو ملف منفصل:

```typescript
import type { TemplateSummary } from "@/modules/themes/theme-registry";
import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";
import { OFFICIAL_TEMPLATE_STARTER_DEFAULTS as defaults } from "@/modules/themes/template-starter-defaults";

export const myTemplate: TemplateSummary = {
  code: "my-theme",
  themeCode: "my-theme",
  name: "اسم القالب",
  status: "published",
  showroomOrder: 3,
  description: "وصف القالب",
  starterContent: parseTemplateStarterContent({
    site: {
      title: defaults.photographerName,
      description: defaults.description
    },
    sections: {
      hero: {
        title: "الرئيسية",
        sortOrder: 0,
        isVisible: true,
        headline: defaults.photographerName,
        subheadline: defaults.description,
        imageUrl: "https://...",
        overlay: "medium",
        position: "center",
        height: "screen",
        cta: { label: "شاهد الباقات", target: "packages" },
        settings: { eyebrow: "Professional Photography" }
      },
      // ... باقي الأقسام
    },
    contact: {
      studioName: defaults.studioName,
      bio: defaults.description,
      longDescription: defaults.description,
      phone: "+201000000000",
      whatsapp: "+201000000000",
      email: "hello@example.com",
      instagram: "username",
      facebook: "username",
      tiktok: "@username",
      workLocation: "فريلانسر"
    },
    packages: [
      // 3 باقات على الأقل
    ],
    extras: [
      // خدمة إضافية واحدة على الأقل
    ],
    gallery: {
      album: {
        title: "معرض الأعمال",
        description: "وصف المعرض",
        sortOrder: 0
      },
      images: [
        // صورة واحدة على الأقل
      ]
    },
    seo: {
      title: defaults.photographerName,
      description: defaults.description,
      canonicalUrl: null,
      robotsIndex: true,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: defaults.photographerName,
        description: defaults.description
      }
    },
    themeSettings: {
      colorPreset: "custom",
      layoutDensity: "editorial",
      motion: "quiet"
    }
  })
};
```

### 4. تسجيل الثيم والقالب

في `src/modules/themes/definitions/index.ts`:

```typescript
import { myTheme, myTemplate } from "@/modules/themes/definitions/my-theme";

export const themeDefinitions = [
  // ... الثيمات الحالية
  myTheme
];

export const templateDefinitions = [
  // ... القوالب الحالية
  myTemplate
];
```

### 5. إنشاء مكون العرض

أنشئ ملف جديد في `src/components/themes/`:

```typescript
// src/components/themes/my-theme-site.tsx
"use client";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { TemplateBookingProvider } from "@/components/themes/template-booking-client";
import { normalizeContactHref, type NormalizedTemplateSection } from "@/modules/themes/template-contract";

export function MyThemeSite({ site }: { site: PublicSiteViewModel }) {
  const displayName = site.contact.studioName?.trim() || site.hero.headline;
  const visibleSections = site.orderedSections.filter((section) => section.isVisible);

  return (
    <TemplateBookingProvider
      packages={site.packages}
      extras={site.extras}
      siteName={displayName}
      whatsapp={site.contact.whatsapp}
      email={site.contact.email}
    >
      <div dir="rtl" className="min-h-screen">
        {/* عرض الأقسام هنا */}
        {visibleSections.map((section) => (
          <Section key={section.type} section={section} site={site} />
        ))}
      </div>
    </TemplateBookingProvider>
  );
}

function Section({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} site={site} />;
    case "gallery":
      return site.gallery.length ? <GallerySection section={section} site={site} /> : null;
    case "packages":
      return site.packages.length ? <PackagesSection section={section} site={site} /> : null;
    case "extras":
      return site.extras.length ? <ExtrasSection section={section} site={site} /> : null;
    case "contact":
      return <ContactSection section={section} site={site} />;
  }
}

// ... باقي المكونات
```

### 6. تسجيل مكون العرض

في `src/components/themes/theme-components.ts`:

```typescript
import { MyThemeSite } from "./my-theme-site";

const registry: Record<string, ThemeSiteComponent> = {
  // ... القوالب الحالية
  "my-theme": MyThemeSite,
};
```

### 7. دعم Variant في Booking Components

إذا كنت تستخدم `PackageSelectButton`, `BookingAction`, أو `BookingFAB`، يجب إضافة variant جديد في:
- `src/components/themes/template-booking-client.tsx`
- `src/components/themes/theme-booking-fab.tsx`

### 8. الاختبار

اختبر القالب على:
- ✅ الموبايل (عرض ضيق)
- ✅ التابلت (عرض متوسط)
- ✅ الديسكتوب (عرض واسع)
- ✅ جميع الأقسام تظهر بشكل صحيح
- ✅ التفاعل مع الباقات والإضافات يعمل
- ✅ روابط التواصل تعمل
- ✅ SEO و Structured Data صحيح

### 9. تشغيل الاختبارات

```bash
npm run typecheck
npm run lint
npm run build
```

---

## قواعد التصميم

### Responsive Design

استخدم CSS media queries أو Tailwind responsive classes:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* الموبايل: عمود واحد */}
  {/* التابلت: عمودين */}
  {/* الديسكتوب: 3 أعمدة */}
</div>
```

### الألوان

اختر لوحة ألوان متناسقة:
- لون أساسي (Primary)
- لون ثانوي (Secondary)
- لون الخلفية (Background)
- لون النص (Text)

### الطباعة

استخدم أحجام متدرجة:
- Headings: `text-4xl sm:text-5xl lg:text-6xl`
- Body: `text-base sm:text-lg`
- Small: `text-sm`

### المسافات

استخدم مسافات متسقة:
- Sections: `py-16 sm:py-24 lg:py-32`
- Content: `px-4 sm:px-6 lg:px-8`

---

## العلاقة مع لوحة التحكم

### ما يتحكم فيه العميل من لوحة التحكم

1. **ترتيب الأقسام**: `sortOrder`
2. **ظهور الأقسام**: `isVisible`
3. **محتوى الباقات**: الأسعار، الميزات، الصور
4. **محتوى الإضافات**: الأسعار، الأوصاف
5. **محتوى المعرض**: الصور، الأوصاف
6. **بيانات التواصل**: الهواتف، البريد، السوشيال ميديا
7. **إعدادات Hero**: الصورة، الـ overlay، الـ position، الـ height، الـ CTA

### ما يتحكم فيه القالب فقط

1. **الألوان**: لوحة الألوان
2. **الخطوط**: أنواع الخطوط وأحجامها
3. **التخطيط**: طريقة عرض الأقسام
4. **التأثيرات**: الحركات والانتقالات
5. **التصميم العام**: الشكل العام للموقع

---

## أمثلة على القوالب الحالية

### 1. Noir Gold (كلاسك)

- **الكود**: `noir-gold`
- **الأسلوب**: داكن مع لون ذهبي
- **المناسب لـ**: المصورين الذين يريدون موقعاً فاخراً كلاسيكياً

### 2. Rose Blush (أنيق وهادئ)

- **الكود**: `rose-blush`
- **الأسلوب**: فاتح مع ألوان وردية
- **المناسب لـ**: المصورين الذين يفضلون التصميم الناعم العصري

### 3. Luxe Studio (استوديو فاخر)

- **الكود**: `luxe-studio`
- **الأسلوب**: سينمائي مع لمسات نيون
- **المناسب لـ**: المصورين الذين يريدون موقعاً عصرياً فاخراً

---

## الأسئلة الشائعة

### هل يجب إنشاء نسختين للموبايل والديسكتوب؟

**لا**، النظام يستخدم Responsive Design. القالب يعمل على جميع الأجهزة تلقائياً.

### هل يمكن إضافة قسم جديد؟

**لا**، يجب أن يلتزم القالب بالأقسام الخمسة المحددة في العقد. إضافة قسم جديد تتطلب تحديث العقد، view model، لوحة التحكم، جميع القوالب، الاختبارات، والتوثيق.

### هل يمكن استخدام صور ثابتة في القالب؟

**لا**، جميع البيانات يجب أن تأتي من `starterContent` أو `PublicSiteViewModel`.

### كيف أتعامل مع الأسعار الصفرية؟

استخدم `formatTemplatePrice` من `template-contract.ts` الذي يعرض "السعر عند الطلب" تلقائياً.

### كيف أتعامل مع روابط التواصل؟

استخدم `normalizeContactHref` من `template-contract.ts` لتطبيع الروابط.

---

## التحقق النهائي

قبل نشر القالب، تأكد من:

- ✅ القالب مسجل في `definitions/index.ts`
- ✅ مكون العرض مسجل في `theme-components.ts`
- ✅ `starterContent` كامل ومطابق للـ schema
- ✅ جميع الأقسام الخمسة مدعومة
- ✅ التصميم متجاوب (Responsive)
- ✅ لا توجد بيانات ثابتة في مكوّن العرض
- ✅ الاختبارات تمر
- ✅ الـ typecheck و lint يمران
- ✅ الـ build ينجح

---

## المراجع

- `docs/CREATE_NEW_TEMPLATE.md` - خطوات إنشاء قالب جديد
- `docs/theme-template-contract.md` - العقد الموحد
- `src/modules/themes/template-contract.ts` - تنفيذ العقد
- `src/modules/themes/template-starter-content.ts` - تعريف Starter Content
- `src/modules/public-sites/public-site-view-model.ts` - تعريف View Model
- `src/components/themes/unified-template-presentation.tsx` - مثال على مكون عرض موحد

---

**آخر تحديث**: 2026-07-15
**الإصدار**: 1.0.0
