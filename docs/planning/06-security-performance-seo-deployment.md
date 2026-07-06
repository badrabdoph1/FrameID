# Security, Performance, SEO, and Deployment

## Security Plan

### Authentication

- Password hashing قوي مثل Argon2 أو bcrypt بتكلفة مناسبة.
- Sessions آمنة باستخدام HttpOnly cookies.
- CSRF protection عند الحاجة.
- Email verification.
- Password reset tokens قصيرة العمر.
- Rate limiting على login, signup, password reset, slug checks.

### Authorization

- كل Server Action يتحقق من:
  - هل المستخدم مسجل؟
  - هل يملك tenant؟
  - هل يملك هذا resource؟
  - هل العملية مسموحة حسب status؟

Admin permissions:

- admin.
- support.
- billing manager.

لا نستخدم role واحد لكل شيء عند التوسع.

### Tenant Isolation

- `tenantId` في كل جداول المحتوى.
- Services مركزية تمنع Queries عشوائية.
- اختبارات عزل: مستخدم لا يستطيع تعديل بيانات Tenant آخر.
- Audit لأي عملية Admin عابرة للـ tenants.

### Input and Upload Security

- Validation باستخدام schema مثل Zod.
- Sanitization للنصوص التي تظهر في الموقع.
- منع SVG upload للمستخدمين إلا بمعالجة آمنة.
- فحص mime type والحجم.
- signed upload URLs.
- منع path traversal في storage keys.

### Secrets

- لا أسرار في client.
- كل API keys في environment variables.
- فصل dev/staging/prod.
- تدوير المفاتيح عند الحاجة.

## Performance Strategy

### Public Sites

- Server-rendered.
- Hero image priority only.
- Gallery lazy loading.
- `next/image` لكل الصور.
- responsive sizes لكل صورة.
- minimal JavaScript.
- عدم تحميل Dashboard code في مواقع المصورين.
- تقسيم Theme bundles.
- Skeletons عند انتظار بيانات dashboard فقط.

### Dashboard

- تحميل تدريجي للأقسام.
- optimistic UI عند Auto Save.
- debounce للحفظ والتحقق من slug.
- pagination للصور والعملاء.
- تجنب client fetching غير الضروري.

### Database

- فهارس على حقول البحث والتصفية.
- pagination cursor-based للقوائم الكبيرة.
- عدم تخزين الصور في PostgreSQL.
- logs للـ slow queries.

### Target Metrics

- LCP لمواقع المصورين أقل من 2.5s على 4G جيد.
- CLS أقل من 0.1.
- INP أقل من 200ms للواجهات المهمة.
- Dashboard first useful view أقل من 2s بعد auth.

## SEO Strategy

### Platform SEO

- Metadata ثابت للصفحة الرئيسية والقوالب.
- sitemap للصفحات الأساسية.
- robots واضح.
- OG image للمنصة.
- Schema للمنظمة والمنتج عند الحاجة.

### Photographer Site SEO

لكل موقع:

- title.
- description.
- canonical.
- OG image.
- robotsIndex حسب حالة الموقع والاشتراك.
- structured data: LocalBusiness أو ProfessionalService حسب البيانات.
- sitemap entry.
- clean URLs.

### Expired Sites

قرار مهم:

- إن كان الموقع expired، يمكن منع الفهرسة بعد grace period.
- لا نعرض بيانات حساسة.
- يجب ألا يسبب expired mass pages ضرر SEO للمنصة.

### Template Preview SEO

- صفحات preview لا تفهرس.
- تستخدم `noindex`.
- لا تظهر في sitemap.

## Deployment Strategy

### Environments

- Development.
- Staging.
- Production.

### Recommended Hosting

المرحلة الأولى:

- Vercel للتطبيق.
- Managed PostgreSQL مثل Neon/Supabase/Render/Railway حسب الميزانية.
- Cloudflare R2 أو S3-compatible storage للصور.

المرحلة المتقدمة:

- Containerized deployment مع Next standalone.
- Redis مشترك للكاش والـ queues.
- CDN أمام الصور والمواقع.

### Release Process

- migrations عبر Prisma.
- staging قبل production.
- smoke tests بعد النشر.
- rollback plan.
- feature flags للقوالب الجديدة والدفع الإلكتروني.

### Backups

- نسخ PostgreSQL يومية.
- point-in-time recovery إن أمكن.
- lifecycle policy للصور.
- backup verification شهريًا.

## Monitoring

- Error tracking.
- uptime checks.
- performance monitoring.
- database slow query monitoring.
- payment pending queue health.
- storage usage alerts.

## Compliance and Privacy

- سياسة خصوصية واضحة.
- حذف أو تعطيل الحساب بطلب المستخدم.
- عدم مشاركة بيانات العملاء.
- التحكم في ظهور بيانات التواصل.
- logs لا تخزن كلمات مرور أو tokens.
