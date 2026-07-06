# Database Design

## Design Goals

- Tenant isolation واضح.
- دعم قالب واحد لكل موقع في البداية مع قابلية التغيير لاحقًا.
- Content model مرن بدون جعل كل شيء JSON عشوائي.
- دعم Trial وActivation والدفع اليدوي ثم الدفع الإلكتروني.
- دعم Admin operations وAudit.
- SEO لكل موقع ولكل صفحة.

## Core Entities

### User

يمثل الشخص الذي يدخل المنصة.

حقول أساسية:

- `id`
- `email`
- `name`
- `phone`
- `passwordHash` أو external auth id
- `emailVerifiedAt`
- `role`: user, admin, support
- `createdAt`, `updatedAt`

### Tenant

يمثل مساحة عمل المصور.

حقول أساسية:

- `id`
- `ownerUserId`
- `displayName`
- `status`: trial, active, expired, suspended
- `trialStartedAt`
- `trialEndsAt`
- `createdAt`, `updatedAt`

### Site

يمثل موقع المصور.

حقول أساسية:

- `id`
- `tenantId`
- `themeId`
- `slug`
- `slugChangeUsed`
- `title`
- `description`
- `locale`: ar, en, ar-en
- `isPublished`
- `publishedVersion`
- `createdAt`, `updatedAt`

قيود:

- `slug` unique global.
- reserved slugs ممنوعة في validation ويفضل في جدول منفصل.
- `tenantId` index.

### SiteDomain

لدعم custom domains لاحقًا.

حقول:

- `id`
- `siteId`
- `domain`
- `status`: pending, verified, failed
- `verificationToken`
- `verifiedAt`

### Theme

تعريف القالب المسجل في النظام.

حقول:

- `id`
- `code`
- `name`
- `status`: draft, published, archived
- `version`
- `category`
- `previewImageAssetId`
- `defaultConfig`
- `contentSchema`
- `createdAt`, `updatedAt`

### SiteThemeConfig

إعدادات القالب الخاصة بموقع معين.

حقول:

- `id`
- `siteId`
- `themeId`
- `config`
- `createdAt`, `updatedAt`

### SiteSection

يمثل أقسام الموقع القابلة للترتيب.

حقول:

- `id`
- `siteId`
- `type`: hero, gallery, packages, extras, contact, notes, social, testimonials
- `title`
- `data`
- `sortOrder`
- `isVisible`
- `createdAt`, `updatedAt`

ملاحظة: `data` يكون JSON محدود حسب section schema، وليس حاوية فوضوية لكل شيء.

### Package

باقات المصور.

حقول:

- `id`
- `siteId`
- `name`
- `subtitle`
- `priceAmount`
- `currency`
- `features`
- `imageAssetId`
- `isHighlighted`
- `sortOrder`
- `isActive`

### ExtraService

الخدمات الإضافية.

حقول:

- `id`
- `siteId`
- `name`
- `priceAmount`
- `currency`
- `iconKey`
- `sortOrder`
- `isActive`

### GalleryAlbum

حقول:

- `id`
- `siteId`
- `title`
- `slug`
- `description`
- `coverAssetId`
- `sortOrder`
- `isVisible`

### MediaAsset

حقول:

- `id`
- `tenantId`
- `storageKey`
- `url`
- `mimeType`
- `width`
- `height`
- `sizeBytes`
- `blurHash`
- `dominantColor`
- `alt`
- `createdAt`

### GalleryImage

حقول:

- `id`
- `albumId`
- `assetId`
- `caption`
- `sortOrder`

### ContactProfile

حقول:

- `id`
- `siteId`
- `phone`
- `whatsapp`
- `email`
- `instagram`
- `facebook`
- `locationLabel`
- `bookingMessageTemplate`

### SEOSettings

حقول:

- `id`
- `siteId`
- `title`
- `description`
- `ogAssetId`
- `robotsIndex`
- `canonicalUrl`
- `structuredDataOverrides`

### Subscription

حقول:

- `id`
- `tenantId`
- `status`: trial, active, expired, past_due, cancelled
- `planId`
- `currentPeriodStart`
- `currentPeriodEnd`
- `activatedAt`
- `expiresAt`

### Plan

حقول:

- `id`
- `code`
- `name`
- `priceAmount`
- `currency`
- `billingInterval`
- `features`
- `isActive`

### PaymentRequest

للدفع اليدوي.

حقول:

- `id`
- `tenantId`
- `subscriptionId`
- `method`: instapay, vodafone_cash, stripe, paypal
- `amount`
- `currency`
- `status`: pending, approved, rejected, expired
- `reference`
- `proofAssetId`
- `adminNote`
- `createdAt`, `reviewedAt`

### Notification

حقول:

- `id`
- `tenantId`
- `type`
- `title`
- `body`
- `readAt`
- `createdAt`

### AuditLog

حقول:

- `id`
- `actorUserId`
- `tenantId`
- `action`
- `entityType`
- `entityId`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

## Indexing Plan

- `User.email` unique.
- `Site.slug` unique.
- `Site.tenantId` index.
- `Tenant.ownerUserId` index.
- `SiteSection.siteId + sortOrder` index.
- `Package.siteId + sortOrder` index.
- `MediaAsset.tenantId + createdAt` index.
- `Subscription.tenantId + status` index.
- `PaymentRequest.status + createdAt` index.
- `AuditLog.tenantId + createdAt` index.

## Data Lifecycle

- عند إنشاء حساب من قالب:
  - إنشاء User.
  - إنشاء Tenant بحالة trial.
  - إنشاء Site بـ slug مقترح.
  - إنشاء SiteThemeConfig من defaultConfig.
  - إنشاء SiteSections من preview/default data.
  - إنشاء SEOSettings افتراضي.
  - إنشاء ContactProfile فارغ جزئيًا.
  - إنشاء Subscription trial.

- عند انتهاء Trial:
  - Tenant status يصبح expired.
  - Subscription status يصبح expired.
  - لا حذف للبيانات.
  - notifications وemail/whatsapp reminders حسب السياسة.

## Important Database Warnings

- لا تجعل كل محتوى الموقع JSON واحد في جدول Site. سيصبح صعب البحث، النسخ، التحقق، والترقية.
- لا تجعل الباقات والخدمات داخل Theme Config. هذه بيانات المصور وليست بيانات القالب.
- لا تجعل slug مرتبطًا بالمستخدم فقط؛ يجب أن يرتبط بالموقع.
- لا تعتمد على soft delete وحده بدون Audit للعمليات الحساسة.
