# Technical Architecture

## Stack

- Next.js 15 App Router.
- React 19.
- TypeScript strict mode.
- Tailwind CSS.
- Prisma.
- PostgreSQL.
- S3-compatible object storage.
- Redis لاحقًا للكاش والـ queues والـ rate limiting.
- Background jobs عبر queue مثل BullMQ أو managed queues عند الحاجة.

## High-Level Architecture

النظام Monolith منظم في البداية، وليس Microservices. هذا أفضل للسرعة والجودة في المرحلة الأولى، مع حدود واضحة تسمح بالفصل لاحقًا.

الوحدات الرئيسية:

- Marketing module.
- Auth module.
- Tenant/Site module.
- Theme module.
- Dashboard module.
- Admin module.
- Billing module.
- Media module.
- Notification module.
- SEO module.
- Audit module.

## Runtime Strategy

- صفحات القراءة العامة تستخدم Server Components.
- Mutations من الواجهة تستخدم Server Actions.
- Webhooks وملفات upload endpoints وAPIs الخارجية تستخدم Route Handlers.
- Runtime الافتراضي Node.js، وليس Edge، لأن Prisma وعمليات الصور والويبهوكس تحتاج بيئة مستقرة.

## Multi-Tenant Model

كل مستخدم مصور يمتلك `tenant` أو `workspace` واحدًا في البداية. يمكن دعم أكثر من موقع لكل مستخدم لاحقًا.

العزل:

- كل جدول محتوى يحتوي `tenantId`.
- كل Query في طبقة البيانات يشترط `tenantId`.
- Unique constraints تكون مركبة عند الحاجة مثل `tenantId + slug`.
- Admin وحده يستطيع القراءة عبر tenants.
- كل Server Action يتحقق من session وtenant قبل التعديل.

## Routing Strategy

المرحلة الأولى:

- Platform: `example.com`
- Photographer sites: `example.com/p/[slug]`

المرحلة الثانية:

- Subdomains: `[slug].example.com`

المرحلة الثالثة:

- Custom domains.

يجب تصميم قاعدة البيانات من البداية لدعم `siteDomain` وdomain verification حتى لو لم نفعله في أول إطلاق.

## Data Access Pattern

- لا نستخدم API داخلية لكل قراءة.
- Server Components تقرأ من Prisma مباشرة عبر services.
- Client Components تستقبل بيانات serialized فقط.
- Server Actions هي المسار الأساسي للتعديل.
- Route Handlers للويبهوكس، الدفع، الملفات، public APIs.

## Caching Strategy

- Public photographer pages: cache by site/theme/content version.
- Dashboard: no public cache، لكن يمكن caching للقراءات غير الحساسة.
- عند تعديل محتوى موقع، يتم تحديث `site.publishedVersion` أو `contentVersion`.
- نستخدم tags مثل `site:${siteId}` و`theme:${themeId}` عند تطبيق Cache Components أو revalidation.

## Image and Media Pipeline

- رفع الصور إلى object storage.
- تخزين metadata: width, height, blurHash, mimeType, size, dominantColor.
- إنشاء مشتقات أو الاعتماد على Image CDN.
- منع صور أكبر من حد معين.
- دعم ترتيب الصور والألبومات.
- Lazy loading للمعارض.
- Hero image فقط priority.

## Theme Rendering

كل موقع مصور يعرض من route موحد:

- يجلب site by slug.
- يجلب theme registry entry.
- يجلب content blocks وsettings.
- يمرر البيانات إلى renderer.
- renderer يختار components حسب theme + section type.

لا ننسخ route لكل قالب. القالب Plugin-like داخل نفس التطبيق.

## Background Jobs

نحتاج jobs لـ:

- توليد blurHash أو image metadata.
- إرسال إشعارات انتهاء Trial.
- تذكير الدفع.
- معالجة payment proof.
- إنشاء sitemap chunks لاحقًا.
- حذف ملفات غير مستخدمة بعد مدة.

في البداية يمكن تنفيذ بعضها بشكل scheduled jobs بسيطة، لكن يجب ألا توضع في request lifecycle.

## Observability

- Structured logs.
- Error tracking مثل Sentry.
- Audit logs للتعديلات الحساسة.
- Metrics: signup conversion, template use, activation rate, expired recovery, LCP per site.
- Admin activity history.

## Scalability Notes

التصميم يستهدف مئات الآلاف من المستخدمين، لذلك:

- لا يتم تحميل كل مواقع المصورين أو القوالب في memory.
- فهارس واضحة على `slug`, `tenantId`, `status`, `createdAt`.
- media خارج قاعدة البيانات.
- محتوى القالب structured JSON محدود ومدروس، وليس dump عشوائي.
- admin lists تعتمد pagination وsearch indexes.
- sitemap مقسم عند التوسع.
