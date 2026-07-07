# Content Studio Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build file-based Content Studio foundation with Marketing Website content management.

**Architecture:** Zod schema validation → JSON files in `content/` → `React.cache()` loader → Server Actions for writes with auto-backup.

**Tech Stack:** Next.js 15, Zod, `node:fs`, TypeScript, Tailwind 4

## Global Constraints
- All content files live in `content/` directory at project root
- Every write validates against Zod schema first
- Every write creates a backup in `content/.backups/`
- All reads go through `React.cache()` wrapper
- Content files use the envelope format: `{$schema, version, updatedAt, data}`
- Zod schemas use `.passthrough()` for forward compatibility
- Admin pages require super admin session via `requireSuperAdminSession()`

---

## Task List

### Task 1: Create content/ directory with initial JSON files

**Files:**
- Create: `content/manifest.json`
- Create: `content/marketing/homepage.json`
- Create: `content/marketing/faq.json`
- Create: `content/marketing/navigation.json`
- Create: `content/marketing/footer.json`
- Create: `content/legal/privacy.json`
- Create: `content/legal/terms.json`
- Create: `content/seo/metadata.json`
- Create: `content/settings/platform.json`

**Interfaces:**
- Produces: JSON files following the envelope format `{$schema, version, updatedAt, data}`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p content/{marketing,legal,seo,settings,templates,.backups}
```

- [ ] **Step 2: Create manifest.json**

```json
{
  "$schema": "manifest",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "marketing/homepage": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "marketing/faq": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "marketing/navigation": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "marketing/footer": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "legal/privacy": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "legal/terms": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "seo/metadata": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" },
    "settings/platform": { "version": 1, "updatedAt": "2026-07-07T00:00:00.000Z" }
  }
}
```

- [ ] **Step 3: Create marketing/homepage.json**

Read all EXISTING content from `src/modules/marketing/platform-content.ts` and `src/app/(marketing)/page.tsx` and create the initial JSON. Include: hero section, benefits cards, how-it-works steps, trust section (betaMessage), final CTA, mobile CTA text.

```json
{
  "$schema": "marketing/homepage",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "hero": {
      "badge": "منصة مواقع للمصورين",
      "headline": "بدل ما تتوه أعمالك بين إنستغرام وواتساب—",
      "headlineHighlight": "موقع واحد يضم كل شيء ويخلّي العميل يثق فيك.",
      "subheadline": "ارفع صورك، حدد أسعارك، وشارك الرابط. موقعك جاهز في دقائق.",
      "heroImage": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85",
      "cta": { "label": "ابدأ التجربة المجانية", "href": "/signup" },
      "secondaryCta": { "label": "شاهد القوالب", "href": "/templates" },
      "trustPoints": [
        { "text": "تجربة مجانية ١٤ يوم" },
        { "text": "بدون بطاقة بنكية" },
        { "text": "موقع جاهز خلال دقائق" }
      ]
    },
    "benefits": [
      { "title": "بدل ما يتوه شغلك في منشنات—صورتك تتكلم وحدها", "body": "بدون إعلان ولا تاغ—معرض مرتب يركز على صورتك." },
      { "title": "بدل ما تشرح الباقات لكل عميل—حطها مرة وحدة", "body": "العميل يشوف الأسعار ويقرر بنفسه. بدون رسايل ولا استفسارات." },
      { "title": "بدل ما ينحفظ رابط طويل—اسمك فقط", "body": "رابط خاص: frameid.app/p/اسمك. تشاركه في ثانية." },
      { "title": "بدل ما تنزل عالديركت ومحد يلقاك—ظهور في قوقل", "body": "موقعك يظهر في البحث—عملاء جدد يلقونك بدون إعلانات." },
      { "title": "بدل ما تنتظر مبرمج كل مرة—عدّل بنفسك", "body": "صور، أسعار، قوالب—من لوحتك وفي دقائق." },
      { "title": "بدل ما يمل العميل ويحول لغيرك—فتح فوري", "body": "موقعك يفتح بالثانية على الجوال والكمبيوتر." }
    ],
    "howItWorks": [
      { "step": 1, "title": "اختر قالب", "body": "شوف القوالب الجاهزة واختار اللي يمثل شغلك." },
      { "step": 2, "title": "سجل", "body": "بس بريد إلكتروني وكلمة سر. ولا بطاقة." },
      { "step": 3, "title": "حدث", "body": "ارفع صورك، حدد أسعارك، واكتب بيانات التواصل." },
      { "step": 4, "title": "انشر", "body": "موقعك جاهز—شارك الرابط وخل العملاء يحجزون." }
    ],
    "trustSection": {
      "badge": "الثقة أولاً",
      "title": "ليه تثق في FrameID؟",
      "message": "FrameID لسه جديد. نبي رأيك يكون جزء من تطويره. جرب وقلنا وش تحب نضيف."
    },
    "faqSectionTitle": "ليه تثق في FrameID؟",
    "templateSection": {
      "badge": "شوف بنفسك",
      "title": "هذا شكل موقعك.",
      "subtitle": "اختر قالب يناسب تخصصك وخل موقعك جاهز خلال دقائق."
    },
    "finalCta": {
      "title": "جاهز تبدأ؟ موقعك ينتظرك.",
      "subtext": "١٤ يوم تجربة مجانية—بدون بطاقة وبدون التزام.",
      "cta": { "label": "ابدأ التجربة المجانية", "href": "/signup" }
    },
    "mobileStickyCta": {
      "label": "جرب FrameID مجاناً",
      "buttonText": "ابدأ الآن",
      "href": "/signup"
    }
  }
}
```

- [ ] **Step 4: Create marketing/faq.json**

```json
{
  "$schema": "marketing/faq",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "items": [
      { "question": "هل أحتاج بطاقة ائتمان للتجربة؟", "answer": "لا أبداً. ١٤ يوم مجاناً بدون إضافة أي بيانات دفع. جرب وقرر بعدين." },
      { "question": "وين راح يظهر موقعي؟", "answer": "رابط خاص: frameid.app/p/اسمك. تقدر تشاركه في واتساب، إنستغرام، أو بطاقة عملك." },
      { "question": "وش يصير بعد التجربة؟", "answer": "موقعك يبقى موجود ومحتواك محفوظ. تقدر تفعل الاشتراك بأي خطة تناسبك." },
      { "question": "هل ينفع موقعي لجوالات العملاء؟", "answer": "كل القوالب مصممة للجوال والكمبيوتر—العميل يفتح الرابط ويشوف كل شيء بسرعة." },
      { "question": "كم التكلفة بعد التجربة؟", "answer": "الخطط تبدأ من ٢٩ ريال شهرياً. تقدر تلغي أي وقت. وما نخزّن بيانات بطاقتك إلا لما تقرر الاشتراك." }
    ]
  }
}
```

- [ ] **Step 5: Create marketing/navigation.json**

```json
{
  "$schema": "marketing/navigation",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "links": [
      { "label": "القوالب", "href": "/templates" },
      { "label": "دخول", "href": "/login" },
      { "label": "إنشاء حساب", "href": "/signup" }
    ],
    "cta": { "label": "إنشاء حساب", "href": "/signup" }
  }
}
```

- [ ] **Step 6: Create marketing/footer.json**

```json
{
  "$schema": "marketing/footer",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "description": "منصة عربية تمنح المصورين مواقع احترافية بقوالب حية وروابط خاصة، مع تجربة مجانية قبل الدفع.",
    "quickLinks": [
      { "label": "القوالب", "href": "/templates" },
      { "label": "سياسة الخصوصية", "href": "/privacy" },
      { "label": "الشروط والأحكام", "href": "/terms" }
    ],
    "cta": { "title": "ابدأ الآن", "subtitle": "جرب FrameID مجانًا لمدة 14 يومًا، بدون بطاقة ائتمان.", "label": "ابدأ التجربة المجانية", "href": "/signup" },
    "copyright": "© 2026 FrameID. جميع الحقوق محفوظة."
  }
}
```

- [ ] **Step 7: Create legal/privacy.json**

Extract content from `src/app/(marketing)/privacy/page.tsx`.

```json
{
  "$schema": "legal/privacy",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "title": "سياسة الخصوصية",
    "lastUpdated": "2026-01-01",
    "sections": [
      { "title": "المقدمة", "body": "نحن في FrameID نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية." },
      { "title": "المعلومات التي نجمعها", "body": "نجمع المعلومات التي تقدمها عند إنشاء حساب: الاسم، البريد الإلكتروني، رقم الهاتف. بالإضافة إلى معلومات الاستخدام مثل الصفحات التي تزورها." },
      { "title": "كيف نستخدم معلوماتك", "body": "نستخدم معلوماتك لتقديم الخدمة وتحسينها والتواصل معك بشأن التحديثات والعروض." },
      { "title": "حماية المعلومات", "body": "نستخدم إجراءات أمنية لحماية معلوماتك من الوصول غير المصرح به." },
      { "title": "اتصل بنا", "body": "للاستفسارات حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني." }
    ]
  }
}
```

- [ ] **Step 8: Create legal/terms.json**

Extract from `src/app/(marketing)/terms/page.tsx`.

```json
{
  "$schema": "legal/terms",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "title": "الشروط والأحكام",
    "lastUpdated": "2026-01-01",
    "sections": [
      { "title": "القبول", "body": "باستخدامك لـ FrameID فإنك توافق على هذه الشروط والأحكام." },
      { "title": "الحساب", "body": "أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور." },
      { "title": "الخدمة", "body": "نقدم منصة لإنشاء المواقع. نحن غير مسؤولين عن المحتوى الذي تنشره." },
      { "title": "الدفع", "body": "جميع المدفوعات تتم وفقاً للأسعار المعلنة. يمكنك الإلغاء في أي وقت." },
      { "title": "اتصل بنا", "body": "للاستفسارات حول الشروط والأحكام، يمكنك التواصل معنا." }
    ]
  }
}
```

- [ ] **Step 9: Create seo/metadata.json**

```json
{
  "$schema": "seo/metadata",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "defaultTitle": "FrameID | موقع مصور—موقع خاص باسمك يضم أعمالك وباقاتك",
    "titleTemplate": "%s | FrameID",
    "description": "موقع خاص للمصورين: معرض أعمال، باقات وأسعار، رابط خاص، بدون برمجة. جرب ١٤ يوم مجاناً.",
    "siteUrl": "https://frameid.app",
    "locale": "ar_EG",
    "openGraph": {
      "title": "FrameID | موقع خاص باسمك—يضم أعمالك وباقاتك",
      "description": "خلال دقائق، حول صورك إلى موقع متكامل: معرض أعمال، باقات، رابط خاص. جرب مجاناً.",
      "siteName": "FrameID",
      "images": [
        { "url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85", "width": 1200, "height": 630, "alt": "FrameID—منصة مواقع للمصورين" }
      ]
    },
    "twitter": {
      "card": "summary_large_image",
      "title": "FrameID | موقع خاص باسمك—يضم أعمالك وباقاتك",
      "description": "موقع متكامل للمصور: معرض، باقات، رابط خاص. جرب مجاناً.",
      "images": ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85"]
    }
  }
}
```

- [ ] **Step 10: Create settings/platform.json**

```json
{
  "$schema": "settings/platform",
  "version": 1,
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "data": {
    "name": "FrameID",
    "logo": "/logo.svg",
    "favicon": "/favicon.ico",
    "tagline": "مواقع احترافية للمصورين",
    "accentColor": "#C9A96E",
    "locale": "ar",
    "direction": "rtl"
  }
}
```

---

### Task 2: Build content library — types & Zod schemas

**Files:**
- Create: `src/lib/content/schemas/marketing.ts`
- Create: `src/lib/content/schemas/legal.ts`
- Create: `src/lib/content/schemas/seo.ts`
- Create: `src/lib/content/schemas/settings.ts`
- Create: `src/lib/content/schemas/templates.ts`
- Create: `src/lib/content/schemas/index.ts`
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/errors.ts`

**Interfaces:**
- Produces: All Zod schemas + TypeScript types + ContentError classes

- [ ] **Step 1: Create schemas/marketing.ts**

```typescript
import { z } from "zod";

export const CtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
}).passthrough();

export const HeroSchema = z.object({
  badge: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string(),
  subheadline: z.string().min(1),
  heroImage: z.string().url(),
  cta: CtaSchema,
  secondaryCta: CtaSchema,
  trustPoints: z.array(z.object({ text: z.string() }).passthrough()),
}).passthrough();

export const BenefitSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough();

export const HowItWorkSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough();

export const TemplateSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  subtitle: z.string(),
}).passthrough();

export const TrustSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  message: z.string(),
}).passthrough();

export const FinalCtaSchema = z.object({
  title: z.string(),
  subtext: z.string(),
  cta: CtaSchema,
}).passthrough();

export const MobileStickyCtaSchema = z.object({
  label: z.string(),
  buttonText: z.string(),
  href: z.string(),
}).passthrough();

export const HomepageDataSchema = z.object({
  hero: HeroSchema,
  benefits: z.array(BenefitSchema),
  howItWorks: z.array(HowItWorkSchema),
  trustSection: TrustSectionSchema,
  templateSection: TemplateSectionSchema,
  finalCta: FinalCtaSchema,
  mobileStickyCta: MobileStickyCtaSchema,
}).passthrough();

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
}).passthrough();

export const FaqDataSchema = z.object({
  items: z.array(FaqItemSchema),
}).passthrough();

export const NavLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
}).passthrough();

export const NavigationDataSchema = z.object({
  links: z.array(NavLinkSchema),
  cta: CtaSchema,
}).passthrough();

export const FooterDataSchema = z.object({
  description: z.string(),
  quickLinks: z.array(NavLinkSchema),
  cta: z.object({
    title: z.string(),
    subtitle: z.string(),
    label: z.string(),
    href: z.string(),
  }).passthrough(),
  copyright: z.string(),
}).passthrough();

export const MarketingSchemas = {
  "marketing/homepage": HomepageDataSchema,
  "marketing/faq": FaqDataSchema,
  "marketing/navigation": NavigationDataSchema,
  "marketing/footer": FooterDataSchema,
} as const;
```

- [ ] **Step 2: Create schemas/legal.ts**

```typescript
import { z } from "zod";

export const LegalSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough();

export const LegalDataSchema = z.object({
  title: z.string().min(1),
  lastUpdated: z.string(),
  sections: z.array(LegalSectionSchema),
}).passthrough();

export const LegalSchemas = {
  "legal/privacy": LegalDataSchema,
  "legal/terms": LegalDataSchema,
} as const;
```

- [ ] **Step 3: Create schemas/seo.ts**

```typescript
import { z } from "zod";

export const OGImageSchema = z.object({
  url: z.string().url(),
  width: z.number(),
  height: z.number(),
  alt: z.string(),
}).passthrough();

export const SEODataSchema = z.object({
  defaultTitle: z.string(),
  titleTemplate: z.string(),
  description: z.string(),
  siteUrl: z.string().url(),
  locale: z.string(),
  openGraph: z.object({
    title: z.string(),
    description: z.string(),
    siteName: z.string(),
    images: z.array(OGImageSchema),
  }).passthrough(),
  twitter: z.object({
    card: z.string(),
    title: z.string(),
    description: z.string(),
    images: z.array(z.string()),
  }).passthrough(),
}).passthrough();

export const SEOSchemas = {
  "seo/metadata": SEODataSchema,
} as const;
```

- [ ] **Step 4: Create schemas/settings.ts**

```typescript
import { z } from "zod";

export const PlatformDataSchema = z.object({
  name: z.string().min(1),
  logo: z.string(),
  favicon: z.string(),
  tagline: z.string(),
  accentColor: z.string(),
  locale: z.string(),
  direction: z.string(),
}).passthrough();

export const SettingsSchemas = {
  "settings/platform": PlatformDataSchema,
} as const;
```

- [ ] **Step 5: Create schemas/templates.ts**

```typescript
import { z } from "zod";

export const TemplateEntrySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  previewImage: z.string().url(),
  category: z.string(),
  order: z.number().int().nonnegative(),
  isPublished: z.boolean(),
}).passthrough();

export const TemplateRegistryDataSchema = z.object({
  items: z.array(TemplateEntrySchema),
}).passthrough();

export const TemplateSchemas = {
  "templates/registry": TemplateRegistryDataSchema,
} as const;
```

- [ ] **Step 6: Create schemas/index.ts**

```typescript
import type { z } from "zod";
import { MarketingSchemas } from "./marketing";
import { LegalSchemas } from "./legal";
import { SEOSchemas } from "./seo";
import { SettingsSchemas } from "./settings";
import { TemplateSchemas } from "./templates";

export * from "./marketing";
export * from "./legal";
export * from "./seo";
export * from "./settings";
export * from "./templates";

export const ContentSchemas = {
  ...MarketingSchemas,
  ...LegalSchemas,
  ...SEOSchemas,
  ...SettingsSchemas,
  ...TemplateSchemas,
} as const;

export type ContentSchemaKey = keyof typeof ContentSchemas;
export type ContentSchemaType<T extends ContentSchemaKey> = z.infer<(typeof ContentSchemas)[T]>;
```

- [ ] **Step 7: Create types.ts**

```typescript
import type { ContentSchemaKey, ContentSchemaType } from "./schemas";

export type { ContentSchemaKey, ContentSchemaType };

export type ContentEnvelope = {
  $schema: string;
  version: number;
  updatedAt: string;
};

export type ContentFile<T> = ContentEnvelope & { data: T };

export type ContentManifest = {
  [key: string]: {
    version: number;
    updatedAt: string;
  };
};

export type FullManifest = ContentEnvelope & { data: ContentManifest };

export type SaveResult =
  | { success: true; version: number }
  | { success: false; errors: { path: string; message: string }[] };

export type ContentType = ContentSchemaKey;
```

- [ ] **Step 8: Create errors.ts**

```typescript
export class ContentNotFoundError extends Error {
  constructor(type: string) {
    super(`Content file not found: ${type}`);
    this.name = "ContentNotFoundError";
  }
}

export class ContentValidationError extends Error {
  public readonly errors: { path: string; message: string }[];

  constructor(type: string, errors: { path: string; message: string }[]) {
    super(`Validation failed for ${type}: ${errors.map(e => e.message).join(", ")}`);
    this.name = "ContentValidationError";
    this.errors = errors;
  }
}
```

- [ ] **Step 9: Build to verify**

Run: `npm run build` and confirm it passes with no TypeScript errors.

---

### Task 3: Build content loader (React.cache + fs.read)

**Files:**
- Create: `src/lib/content/loader.ts`

**Interfaces:**
- Consumes: `ContentSchemas`, `ContentNotFoundError`, types
- Produces: `loadContent<T>(type: string, schema: ZodType<T>): T` — cached per request

- [ ] **Step 1: Create loader.ts**

```typescript
import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { z } from "zod";
import { ContentNotFoundError, ContentValidationError } from "./errors";

const CONTENT_DIR = join(process.cwd(), "content");

function readRawContent(type: string): unknown {
  const filePath = join(CONTENT_DIR, `${type}.json`);
  if (!existsSync(filePath)) {
    throw new ContentNotFoundError(type);
  }
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function parseEnvelope(raw: unknown): { data: unknown; version: number; updatedAt: string } {
  const envelope = raw as { data?: unknown; version?: number; updatedAt?: string };
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid content file: must be an object");
  }
  return {
    data: envelope.data,
    version: envelope.version ?? 0,
    updatedAt: envelope.updatedAt ?? "",
  };
}

export const getContent = cache(function getContent<T>(
  type: string,
  schema: z.ZodType<T>,
): T & { _version: number; _updatedAt: string } {
  const raw = readRawContent(type);
  const { data, version, updatedAt } = parseEnvelope(raw);
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ContentValidationError(
      type,
      result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    );
  }
  return { ...result.data, _version: version, _updatedAt: updatedAt };
});

export function getContentPath(type: string): string {
  return join(CONTENT_DIR, `${type}.json`);
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build` and confirm it compiles.

---

### Task 4: Build content writer + backup + manifest

**Files:**
- Create: `src/lib/content/writer.ts`
- Create: `src/lib/content/backup.ts`
- Create: `src/lib/content/manifest.ts`

**Interfaces:**
- Consumes: types, schemas, loader internals
- Produces: `saveContent`, `getManifest`, `createBackup`

- [ ] **Step 1: Create backup.ts**

```typescript
import "server-only";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content");
const BACKUP_DIR = join(CONTENT_DIR, ".backups");

export function createBackup(type: string): string | null {
  const sourcePath = join(CONTENT_DIR, `${type}.json`);
  if (!existsSync(sourcePath)) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(BACKUP_DIR, `${type}/${timestamp}.json`);
  const backupDir = dirname(backupPath);

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  copyFileSync(sourcePath, backupPath);
  return backupPath;
}

export function listBackups(type: string): string[] {
  const backupDir = join(BACKUP_DIR, type);
  if (!existsSync(backupDir)) return [];
  return readFileSync(backupDir, "utf-8") // simplified - just returns dir listing hint
    .split("\n")
    .filter(Boolean);
}
```

Wait, `readFileSync` on a directory won't work. Let me use `readdirSync` instead.

- [ ] **Step 1 (revised): Create backup.ts**

```typescript
import "server-only";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content");
const BACKUP_DIR = join(CONTENT_DIR, ".backups");

export function createBackup(type: string): string | null {
  const sourcePath = join(CONTENT_DIR, `${type}.json`);
  if (!existsSync(sourcePath)) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(BACKUP_DIR, `${type}/${timestamp}.json`);
  const backupDir = dirname(backupPath);

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  copyFileSync(sourcePath, backupPath);
  return backupPath;
}

export function listBackups(type: string): string[] {
  const backupDir = join(BACKUP_DIR, type);
  if (!existsSync(backupDir)) return [];
  return readdirSync(backupDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
}
```

- [ ] **Step 2: Create manifest.ts**

```typescript
import "server-only";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FullManifest, ContentManifest } from "./types";

const MANIFEST_PATH = join(process.cwd(), "content", "manifest.json");

export function readManifest(): FullManifest {
  if (!existsSync(MANIFEST_PATH)) {
    return {
      $schema: "manifest",
      version: 1,
      updatedAt: new Date().toISOString(),
      data: {},
    };
  }
  const raw = readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw);
}

export function updateManifestEntry(type: string, version: number): void {
  const manifest = readManifest();
  manifest.data[type] = {
    version,
    updatedAt: new Date().toISOString(),
  };
  manifest.version += 1;
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

export function getManifestData(): ContentManifest {
  return readManifest().data;
}
```

- [ ] **Step 3: Create writer.ts**

```typescript
import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:fs";
import type { z } from "zod";
import { createBackup } from "./backup";
import { updateManifestEntry } from "./manifest";
import { getContent } from "./loader";
import { ContentValidationError } from "./errors";
import type { SaveResult } from "./types";

const CONTENT_DIR = join(process.cwd(), "content");

export function saveContent(
  type: string,
  schema: z.ZodType,
  data: unknown,
): SaveResult {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  }

  let currentVersion = 0;
  try {
    const current = getContent(type, schema);
    currentVersion = (current as unknown as { _version: number })._version ?? 0;
  } catch {
    /* file may not exist yet — first save */
  }

  createBackup(type);

  const newVersion = currentVersion + 1;
  const envelope = {
    $schema: type,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    data: result.data,
  };

  const filePath = join(CONTENT_DIR, `${type}.json`);
  writeFileSync(filePath, JSON.stringify(envelope, null, 2), "utf-8");

  updateManifestEntry(type, newVersion);

  return { success: true, version: newVersion };
}
```

- [ ] **Step 4: Build to verify**

Run: `npm run build` and confirm it compiles.

---

### Task 5: Build public API (index.ts)

**Files:**
- Create: `src/lib/content/index.ts`

**Interfaces:**
- Produces: All public exports: `getContent`, `saveContent`, `getManifest`, typed wrappers

- [ ] **Step 1: Create index.ts**

```typescript
import { getContent as loadContent } from "./loader";
import { saveContent as writeContent } from "./writer";
import { getManifestData } from "./manifest";
import { ContentSchemas, ContentSchemaKey, ContentSchemaType } from "./schemas";
import type { SaveResult, ContentManifest } from "./types";

export type { SaveResult, ContentManifest, ContentSchemaKey, ContentSchemaType };

export function getContent<T extends ContentSchemaKey>(type: T): ContentSchemaType<T> & { _version: number; _updatedAt: string } {
  const schema = ContentSchemas[type];
  if (!schema) throw new Error(`Unknown content type: ${type}`);
  return loadContent(type as string, schema) as ContentSchemaType<T> & { _version: number; _updatedAt: string };
}

export function saveContent(type: ContentSchemaKey, data: unknown): SaveResult {
  const schema = ContentSchemas[type];
  if (!schema) throw new Error(`Unknown content type: ${type}`);
  return writeContent(type as string, schema, data);
}

export function getManifest(): ContentManifest {
  return getManifestData();
}

export { ContentSchemas };
```

- [ ] **Step 2: Build to verify**

Run: `npm run build` and confirm it compiles.

---

### Task 6: Refactor homepage + legal pages to load from content files

**Files:**
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/app/(marketing)/privacy/page.tsx`
- Modify: `src/app/(marketing)/terms/page.tsx`
- Remove (later): `src/modules/marketing/platform-content.ts` (keep for now, reduce usage)

**Interfaces:**
- Consumes: `getContent("marketing/homepage")`, `getContent("seo/metadata")`, `getContent("marketing/faq")`, `getContent("legal/privacy")`, `getContent("legal/terms")`

- [ ] **Step 1: Refactor homepage metadata**

Replace the hardcoded `metadata` export in `page.tsx` to load from content files:

```typescript
import { getContent } from "@/lib/content";

// In the page file, replace hardcoded metadata:
function loadMetadata() {
  const seo = getContent("seo/metadata");
  return {
    title: seo.defaultTitle,
    description: seo.description,
    alternates: { canonical: seo.siteUrl },
    openGraph: { ...seo.openGraph, url: seo.siteUrl },
    twitter: { ...seo.twitter },
  } satisfies Metadata;
}

export const metadata = loadMetadata();
```

- [ ] **Step 2: Refactor homepage component**

Replace all hardcoded imports from `platform-content.ts` with `getContent()` calls.

```typescript
// At top of page.tsx, replace imports:
// - Remove: benefitCards, betaMessage, faqItems, getTemplatePreviewImage, howItWorks, photographerTypes
// - Add: getContent from "@/lib/content"

export default function HomePage() {
  const homepage = getContent("marketing/homepage");
  const faq = getContent("marketing/faq");
  const templates = getPublishedTemplates();
  const { hero, benefits, howItWorks, templateSection, trustSection, finalCta, mobileStickyCta } = homepage;

  // Use these variables instead of hardcoded text throughout the JSX:
  // hero.badge, hero.headline, hero.headlineHighlight, hero.subheadline, etc.
  // benefits.map(...), howItWorks.map(...), faq.items.map(...)
  // templateSection.badge, templateSection.title, templateSection.subtitle
  // trustSection.badge, trustSection.title, trustSection.message
  // finalCta.title, finalCta.subtext, finalCta.cta
  // mobileStickyCta.label, mobileStickyCta.buttonText, mobileStickyCta.href
}
```

Implementation details for the JSX changes:
1. Hero: `{hero.badge}` → badge, `{hero.headline}` → first h1 line, `{hero.headlineHighlight}` → champagne span, `{hero.subheadline}` → p, `hero.heroImage` → Image src, `hero.cta.label/href` → primary button, `hero.secondaryCta.label/href` → secondary button, `hero.trustPoints.map(...)` → trust badges
2. Template section: `{templateSection.badge}`, `{templateSection.title}`, `{templateSection.subtitle}`
3. Photographer types still inline or can be added to homepage content
4. Benefits: `benefits.map(...)`
5. How it works: `howItWorks.map(...)`
6. FAQ: `faq.items.map(...)` + keep `jsonLd` using `faq.items`
7. Trust section: `{trustSection.badge}`, `{trustSection.title}`, `{trustSection.message}`
8. Final CTA: `{finalCta.title}`, `{finalCta.subtext}`, `{finalCta.cta.label}`, `{finalCta.cta.href}`
9. Mobile sticky: `{mobileStickyCta.label}`, `{mobileStickyCta.buttonText}`, `{mobileStickyCta.href}`

- [ ] **Step 3: Refactor footer.html in marketing-footer.tsx**

Check MarketingFooter component and update to read from footer content:

```typescript
// In src/components/layout/marketing-footer.tsx
import { getContent } from "@/lib/content";

export function MarketingFooter() {
  const footer = getContent("marketing/footer");
  // Use footer.description, footer.quickLinks, footer.cta, footer.copyright
}
```

- [ ] **Step 4: Refactor marketing-nav.tsx**

Check MarketingNav component and update to read from navigation content:

```typescript
// In src/components/layout/marketing-nav.tsx
import { getContent } from "@/lib/content";

export function MarketingNav() {
  const nav = getContent("marketing/navigation");
  // Use nav.links, nav.cta
}
```

- [ ] **Step 5: Refactor privacy page**

```typescript
// In src/app/(marketing)/privacy/page.tsx
import { getContent } from "@/lib/content";

export default function PrivacyPage() {
  const privacy = getContent("legal/privacy");
  return (
    <div className="container-page py-10">
      <h1>{privacy.title}</h1>
      <p>آخر تحديث: {privacy.lastUpdated}</p>
      {privacy.sections.map((section) => (
        <div key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Refactor terms page**

Same pattern as privacy page using `getContent("legal/terms")`.

- [ ] **Step 7: Refactor metadata in layout.tsx**

Update `src/app/layout.tsx` to load SEO metadata from `getContent("seo/metadata")`:

```typescript
import { getContent } from "@/lib/content";

const seo = getContent("seo/metadata");

export const metadata: Metadata = {
  title: {
    default: seo.defaultTitle,
    template: seo.titleTemplate,
  },
  description: seo.description,
  metadataBase: new URL(seo.siteUrl),
};
```

- [ ] **Step 8: Build and verify**

Run: `npm run build`. Fix any TypeScript or lint errors. Verify the homepage renders correctly.

---

### Task 7: Build Content Studio shell + layout

**Files:**
- Create: `src/app/(admin)/admin/content/layout.tsx`
- Modify: `src/app/(admin)/admin/content/page.tsx`

**Interfaces:**
- Consumes: `requireSuperAdminSession()`, `AdminPageShell`
- Produces: Admin content pages structure

- [ ] **Step 1: Create content layout with sidebar**

```typescript
// src/app/(admin)/admin/content/layout.tsx
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { ContentStudioShell } from "@/components/content/content-studio-shell";

export const dynamic = "force-dynamic";

export default async function AdminContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdminSession();

  return <ContentStudioShell>{children}</ContentStudioShell>;
}
```

- [ ] **Step 2: Create ContentStudioShell component**

Create `src/components/content/content-studio-shell.tsx`:

```typescript
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  Globe, FileText, Search, Settings as SettingsIcon,
  Layout, type LucideIcon,
} from "lucide-react";

const contentNav: { label: string; items: { label: string; href: string; icon: LucideIcon }[] }[] = [
  {
    label: "التسويق",
    items: [
      { label: "الصفحة الرئيسية", href: "/admin/content/marketing/homepage", icon: Globe },
      { label: "الأسئلة الشائعة", href: "/admin/content/marketing/faq", icon: FileText },
      { label: "التنقل", href: "/admin/content/marketing/navigation", icon: Layout },
      { label: "الفوتر", href: "/admin/content/marketing/footer", icon: Layout },
    ],
  },
  {
    label: "القانون",
    items: [
      { label: "الخصوصية", href: "/admin/content/legal/privacy", icon: FileText },
      { label: "الشروط", href: "/admin/content/legal/terms", icon: FileText },
    ],
  },
  {
    label: "النظام",
    items: [
      { label: "SEO", href: "/admin/content/seo", icon: Search },
      { label: "الإعدادات", href: "/admin/content/settings", icon: SettingsIcon },
    ],
  },
];

export function ContentStudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full gap-0">
      <aside className="w-64 shrink-0 border-l border-white/[0.06] bg-white/[0.02] p-4 overflow-y-auto hidden lg:block">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white">مركز المحتوى</h2>
          <p className="text-xs text-white/40 mt-1">إدارة محتوى المنصة</p>
        </div>
        {contentNav.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2 px-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-champagne/10 text-champagne font-medium"
                        : "text-white/60 hover:text-white/80 hover:bg-white/[0.04]",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite content page.tsx as dashboard**

```typescript
// src/app/(admin)/admin/content/page.tsx
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { getManifest } from "@/lib/content";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { ContentStudioDashboard } from "@/components/content/content-studio-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireSuperAdminSession();
  const manifest = getManifest();

  return (
    <AdminPageShell
      badge="المحتوى"
      title="مركز المحتوى"
      description="إدارة محتوى المنصة بالكامل من هنا"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "مركز المحتوى" }]}
    >
      <ContentStudioDashboard manifest={manifest} />
    </AdminPageShell>
  );
}
```

- [ ] **Step 4: Create ContentStudioDashboard component**

Create `src/components/content/content-studio-dashboard.tsx` — shows stats (number of content files, total versions, latest edits) with quick links to each editor.

- [ ] **Step 5: Build to verify**

Run: `npm run build` and confirm.

---

### Task 8: Build content editor components

**Files:**
- Create: `src/components/content/content-form.tsx`
- Create: `src/components/content/text-field.tsx`
- Create: `src/components/content/textarea-field.tsx`
- Create: `src/components/content/array-editor.tsx`
- Create: `src/components/content/save-status.tsx`
- Create: `src/components/content/content-page-shell.tsx`

- [ ] **Step 1: Create save-status.tsx**

```typescript
"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SaveStatusBadge({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === "saving" && (
        <><Loader2 className="size-3 animate-spin text-white/50" /><span className="text-white/50">جاري الحفظ...</span></>
      )}
      {status === "saved" && (
        <><CheckCircle2 className="size-3 text-success" /><span className="text-success">تم الحفظ</span></>
      )}
      {status === "error" && (
        <><XCircle className="size-3 text-danger" /><span className="text-danger">{error ?? "فشل الحفظ"}</span></>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create content-form.tsx**

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SaveStatusBadge } from "./save-status";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ContentForm({
  title, description, children, onSave, initialStatus = "idle",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => Promise<{ success: boolean; error?: string }>;
  initialStatus?: SaveStatus;
}) {
  const [status, setStatus] = useState<SaveStatus>(initialStatus);
  const [error, setError] = useState<string>();

  const handleSave = useCallback(async () => {
    setStatus("saving");
    setError(undefined);
    try {
      const result = await onSave();
      if (result.success) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setError(result.error);
      }
    } catch {
      setStatus("error");
      setError("حدث خطأ غير متوقع");
    }
  }, [onSave]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="text-sm text-white/40 mt-1">{description}</p>}
        </div>
        <SaveStatusBadge status={status} error={error} />
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create text-field.tsx**

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function TextField({
  label, value, onChange, placeholder, dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl" | "auto";
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir ?? "rtl"}
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-champagne/40 focus:bg-champagne/[0.03] transition-colors"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create textarea-field.tsx**

```typescript
"use client";

export function TextareaField({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/70">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-champagne/40 focus:bg-champagne/[0.03] transition-colors resize-y"
      />
    </div>
  );
}
```

- [ ] **Step 5: Create array-editor.tsx**

```typescript
"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";

export function ArrayEditor<T extends { id?: string }>({
  items,
  onChange,
  renderItem,
  onAdd,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onUpdate: (updated: T) => void) => React.ReactNode;
  onAdd: () => T;
  addLabel?: string;
}) {
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, updated: T) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id ?? index} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-white/30">#{index + 1}</span>
            <button
              onClick={() => handleRemove(index)}
              className="text-white/20 hover:text-danger transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          {renderItem(item, index, (updated) => handleUpdate(index, updated))}
        </div>
      ))}
      <button
        onClick={() => onChange([...items, onAdd()])}
        className="flex items-center gap-2 text-sm text-champagne hover:text-champagne/80 transition-colors"
      >
        <Plus className="size-3.5" />
        {addLabel ?? "إضافة"}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create content-page-shell.tsx**

```typescript
import { AdminPageShell } from "@/components/layout/admin-page-shell";

export function ContentPageShell({
  badge, title, description, children,
}: {
  badge: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPageShell
      badge={badge}
      title={title}
      description={description}
      breadcrumbs={[
        { label: "القيادة", href: "/admin" },
        { label: "مركز المحتوى", href: "/admin/content" },
        { label: title },
      ]}
    >
      {children}
    </AdminPageShell>
  );
}
```

- [ ] **Step 7: Build to verify**

Run: `npm run build`

---

### Task 9: Build marketing content editors

**Files:**
- Create: `src/app/(admin)/admin/content/marketing/page.tsx`
- Create: `src/app/(admin)/admin/content/marketing/homepage/page.tsx`
- Create: `src/app/(admin)/admin/content/marketing/faq/page.tsx`
- Create: `src/app/(admin)/admin/content/marketing/navigation/page.tsx`
- Create: `src/app/(admin)/admin/content/marketing/footer/page.tsx`
- Create: `src/app/(admin)/admin/content/marketing/actions.ts`

- [ ] **Step 1: Create marketing server actions**

```typescript
// src/app/(admin)/admin/content/marketing/actions.ts
"use server";

import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { saveContent } from "@/lib/content";
import type { SaveResult } from "@/lib/content";

export async function saveHomepageAction(data: unknown): Promise<SaveResult> {
  await requireSuperAdminSession();
  return saveContent("marketing/homepage", data);
}

export async function saveFaqAction(data: unknown): Promise<SaveResult> {
  await requireSuperAdminSession();
  return saveContent("marketing/faq", data);
}

export async function saveNavigationAction(data: unknown): Promise<SaveResult> {
  await requireSuperAdminSession();
  return saveContent("marketing/navigation", data);
}

export async function saveFooterAction(data: unknown): Promise<SaveResult> {
  await requireSuperAdminSession();
  return saveContent("marketing/footer", data);
}
```

- [ ] **Step 2: Create marketing overview page**

`src/app/(admin)/admin/content/marketing/page.tsx`:
- Lists all editable sections (homepage, FAQ, navigation, footer)
- Shows current version and last update time from manifest
- Quick links to each editor

- [ ] **Step 3: Create homepage editor**

`src/app/(admin)/admin/content/marketing/homepage/page.tsx`:
- Load homepage content: `getContent("marketing/homepage")`
- Display form sections:
  - **Hero**: badge, headline, headlineHighlight, subheadline, heroImage URL
  - **CTA Buttons**: primary + secondary CTA labels and hrefs
  - **Trust Points**: array editor
  - **Benefits**: array editor (title + body)
  - **How It Works**: array editor (step, title, body)
  - **Template Section**: badge, title, subtitle
  - **Trust Section**: badge, title, message
  - **Final CTA**: title, subtext, CTA
  - **Mobile Sticky CTA**: label, buttonText, href
- Auto-save via ContentForm + server action

- [ ] **Step 4: Create FAQ editor**

`src/app/(admin)/admin/content/marketing/faq/page.tsx`:
- Load FAQ content: `getContent("marketing/faq")`
- Array editor for FAQ items (question + answer)
- Auto-save

- [ ] **Step 5: Create navigation editor**

`src/app/(admin)/admin/content/marketing/navigation/page.tsx`:
- Load navigation content: `getContent("marketing/navigation")`
- Array editor for links (label + href)
- CTA editor

- [ ] **Step 6: Create footer editor**

`src/app/(admin)/admin/content/marketing/footer/page.tsx`:
- Load footer content: `getContent("marketing/footer")`
- Text fields for description, copyright
- Array editor for quick links
- CTA section editor

- [ ] **Step 7: Build to verify**

Run: `npm run build`

---

### Task 10: Build SEO + Platform Settings editors

**Files:**
- Create: `src/app/(admin)/admin/content/seo/page.tsx`
- Create: `src/app/(admin)/admin/content/settings/page.tsx`
- Create: `src/app/(admin)/admin/content/seo/actions.ts`
- Create: `src/app/(admin)/admin/content/settings/actions.ts`

- [ ] **Step 1: Create SEO server actions + page**

SEO editor page:
- Load: `getContent("seo/metadata")`
- Fields: defaultTitle, titleTemplate, description, siteUrl, locale
- OpenGraph sub-section: title, description, siteName, images array (url, width, height, alt)
- Twitter sub-section: card, title, description, images

- [ ] **Step 2: Create Platform Settings server actions + page**

Settings editor page:
- Load: `getContent("settings/platform")`
- Fields: name, logo, favicon, tagline, accentColor, locale, direction

- [ ] **Step 3: Build to verify**

Run: `npm run build`

---

### Task 11: Final build and verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

- [ ] **Step 2: Fix any type errors or lint warnings**

- [ ] **Step 3: Verify the content directory has all expected files**

```bash
ls -la content/marketing/ content/legal/ content/seo/ content/settings/
```

- [ ] **Step 4: Verify homepage reads from content (start dev server and check)**

```bash
npm run dev
# Visit http://localhost:3000 and verify all content renders
```
