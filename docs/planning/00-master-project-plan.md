# Photographer Website Platform - Master Project Plan

## 1. Product Vision

المنتج هو منصة SaaS متخصصة للمصورين تمنح كل مصور موقعًا احترافيًا كاملًا خلال دقائق، مع لوحة تحكم ورابط وبيانات وقالب وإعدادات مستقلة، وكل ذلك يعمل من مشروع واحد وقاعدة بيانات واحدة واستضافة واحدة.

الرؤية ليست بناء صفحة أسعار أو قالب ثابت. الرؤية هي بناء هوية رقمية جاهزة للمصور: رابط يرسله للعميل، معرض أعمال، باقات، طرق تواصل، حضور بصري، وقابلية تفعيل بعد تجربة مجانية.

المنتج يجب أن يشعر بأنه:

- Premium.
- Luxury.
- Minimal.
- Elegant.
- Modern.
- Extremely Fast.

القاعدة الأساسية: المصور لا يريد بناء موقع. هو يريد أن يظهر كعلامة احترافية فورًا.

## 2. Product Scope

### What We Build First

- موقع رئيسي بسيط للتحويل.
- Showroom للقوالب.
- معاينة حية للقوالب.
- إنشاء حساب.
- إنشاء موقع تلقائي بعد التسجيل.
- Dashboard للمصور.
- أول شاشة Dashboard تحتوي رابط الموقع وتغيير الرابط مرة واحدة.
- Trial مجاني.
- Admin Console لإدارة العملاء والاشتراكات والقوالب.
- نظام دفع يدوي بعد التجربة: InstaPay وVodafone Cash.

### What We Do Not Build First

- محرر حر مثل Webflow.
- عشرات صفحات تسويق.
- قوالب كثيرة قبل إتقان القالب الأول.
- دفع Stripe/PayPal في النسخة الأولى.
- custom domains في أول إطلاق، لكن نصمم لها من البداية.
- Marketplace مفتوح للقوالب.

## 3. Target Users

### Photographer

يريد موقعًا جميلًا بسرعة، لا يريد إعدادات تقنية، ولا يريد شرحًا طويلًا. أهم ما يريده:

- رابط جاهز.
- مظهر احترافي.
- تعديل الصور والباقات والتواصل بسهولة.
- تجربة مجانية قبل الدفع.

### Visitor / Client

يريد أن يرى أعمال المصور وأسعاره وطريقة التواصل بسرعة، غالبًا من الهاتف.

### Platform Admin

يريد إدارة العملاء والاشتراكات والمدفوعات والقوالب والمحتوى بدون الدخول في قاعدة البيانات.

## 4. Core Business Flow

1. الزائر يدخل الموقع الرئيسي.
2. يفتح صفحة القوالب.
3. يجرّب قالبًا من Demo حي.
4. يضغط "استخدام هذا القالب".
5. إن لم يكن مسجلًا، ينتقل لإنشاء الحساب.
6. بعد التسجيل، ينشئ النظام تلقائيًا:
   - الحساب.
   - Tenant.
   - الموقع.
   - الرابط.
   - القالب.
   - البيانات الافتراضية.
   - Trial subscription.
7. يدخل مباشرة إلى Dashboard.
8. يرى رابط موقعه أولًا.
9. يعدل بياناته.
10. بعد التجربة يضغط "تفعيل موقعي".
11. يرسل إثبات الدفع.
12. Admin يراجع ويفعل الحساب.

## 5. Information Architecture

### Public Platform

- `/`
- `/templates`
- `/templates/[code]/preview`
- `/login`
- `/signup`
- `/forgot-password`
- `/privacy`
- `/terms`

هذه الصفحات كافية في البداية. أي صفحة إضافية يجب أن تخدم التحويل أو الثقة بشكل مباشر.

### Photographer Website

- `/p/[slug]`

في المرحلة الأولى تكون صفحة واحدة قوية. لاحقًا:

- `/p/[slug]/gallery`
- `/p/[slug]/packages`
- `/p/[slug]/contact`

### Photographer Dashboard

- `/dashboard`
- `/dashboard/design`
- `/dashboard/content`
- `/dashboard/gallery`
- `/dashboard/packages`
- `/dashboard/contact`
- `/dashboard/seo`
- `/dashboard/billing`
- `/dashboard/settings`

### Admin Console

- `/admin/customers`
- `/admin/subscriptions`
- `/admin/payments`
- `/admin/templates`
- `/admin/content`
- `/admin/notifications`
- `/admin/audit`
- `/admin/settings`

## 6. UX Strategy

التجربة Mobile First حقيقية. الهاتف ليس نسخة مصغرة من desktop، بل هو التجربة الأصلية.

### UX Rules

- أقل عدد ضغطات.
- أهم إجراء دائمًا واضح.
- لا نعرض خيارات كثيرة قبل الحاجة.
- لا نستخدم مصطلحات تقنية.
- لا نجعل المصور يختار من عشرات settings.
- Auto Save للتعديلات اليومية.
- حفظ صريح للقرارات الحساسة مثل تغيير الرابط.

### First Dashboard Screen

أول شاشة يجب أن تقول للمصور: "موقعك أصبح جاهزًا".

تحتوي دائمًا على:

- رابط الموقع.
- زر نسخ الرابط.
- زر فتح الموقع.
- حالة الحساب.

ثم قسم تغيير الرابط:

- يظهر فقط إذا لم يستخدم فرصة التغيير.
- يتحقق أثناء الكتابة.
- يعرض: متاح، مستخدم، غير صالح.
- يقدم اقتراحات ذكية.
- بعد الحفظ يختفي قسم التعديل فقط.
- بطاقة الرابط تظل موجودة دائمًا.

## 7. Product Architecture

المنتج ينقسم إلى أنظمة واضحة:

- Marketing System.
- Auth System.
- Tenant System.
- Site System.
- Theme System.
- Dashboard System.
- Admin System.
- Subscription System.
- Payment Review System.
- Media Storage System.
- SEO System.
- Notification System.
- Audit System.
- Design System.
- Backup and Disaster Recovery System.
- Security Center.
- Analytics System.
- Feature Flags System.
- Support System.

كل نظام له مسؤولية واضحة ولا يخلط واجهة المستخدم بمنطق البيانات.

قواعد معمارية إلزامية:

- كل شيء قابل للتوسع لخمس سنوات.
- لا تكرار للكود.
- لا hardcoded data داخل Components.
- Theme Engine هو المصدر الوحيد للقوالب.
- Dashboard يستخدم Layout وWidgets موحدة.
- كل شيء قابل للإدارة من Dashboard أو Super Admin حسب الملكية.
- الأداء أهم من التأثيرات.
- Accessibility إلزامية.
- Mobile First حقيقي.
- التنفيذ لا يبدأ إلا بعد تقرير معماري وخطة تنفيذ دقيقة.

## 8. Technical Architecture

### Stack

- Next.js 15.
- React 19.
- TypeScript.
- Tailwind CSS.
- Prisma.
- PostgreSQL.
- Object Storage للصور.
- Redis لاحقًا للكاش والـ queues.

### Architectural Style

نبدأ بـ Modular Monolith منظم. هذا أفضل من microservices في البداية لأنه:

- أسرع في التطوير.
- أسهل في الاختبار.
- أقل تكلفة.
- يمكن تقسيمه لاحقًا إذا ظهرت الحاجة.

### Next.js Strategy

- Server Components للقراءات.
- Client Components فقط للتفاعل.
- Server Actions للتعديلات من الواجهة.
- Route Handlers للويبهوكس، الرفع، والتكاملات الخارجية.
- Node.js runtime افتراضيًا.

## 9. Multi-Tenant Strategy

كل مصور داخل Tenant مستقل.

كل Tenant يمتلك:

- Owner user.
- Site.
- Theme config.
- Content.
- Media.
- Subscription.
- Settings.

قواعد العزل:

- كل جدول محتوى يحتوي `tenantId` أو يرتبط بكيان يحتويه.
- كل Query حساسة تمر عبر service يتحقق من `tenantId`.
- Admin فقط يستطيع العبور بين tenants.
- كل عملية Admin حساسة تسجل في AuditLog.

هذا الجزء غير قابل للتأجيل. أي خطأ هنا قد يسبب تسريب بيانات بين العملاء.

## 10. Database Design

الكيانات الرئيسية:

- User.
- Tenant.
- Site.
- SiteDomain.
- Theme.
- SiteThemeConfig.
- SiteSection.
- Package.
- ExtraService.
- GalleryAlbum.
- MediaAsset.
- GalleryImage.
- ContactProfile.
- SEOSettings.
- Plan.
- Subscription.
- PaymentRequest.
- Notification.
- AuditLog.

### Database Principles

- لا نخزن كل محتوى الموقع في JSON واحد.
- لا نخزن الصور داخل PostgreSQL.
- لا نضع بيانات المصور داخل القالب.
- لا نربط slug بالمستخدم فقط؛ slug خاص بالموقع.
- نستخدم indexes منذ البداية للبحث والتصفية.

## 11. Authentication Flow

### Signup

1. المستخدم يختار قالبًا أو يدخل signup مباشرة.
2. يدخل الاسم والبريد والهاتف وكلمة المرور.
3. النظام ينشئ User.
4. النظام ينشئ Tenant.
5. النظام ينشئ Site.
6. النظام ينشئ Trial subscription.
7. النظام يدخل المستخدم إلى Dashboard.

### Login

- email/password.
- session آمنة HttpOnly.
- حماية من brute force.
- رسائل خطأ غير كاشفة.

### Password Reset

- token قصير العمر.
- token يستخدم مرة واحدة.
- لا نكشف إن كان البريد موجودًا أم لا.

## 12. Theme Engine

القالب ليس صفحة منفصلة. القالب هو حزمة منظمة:

- Metadata.
- Theme Config.
- Components.
- Preview Data.
- Settings.
- Supported Sections.
- Schema.

قواعد Theme Engine:

- لا بيانات ثابتة داخل القالب.
- لا queries داخل Components.
- القالب يستقبل data جاهزة.
- إضافة قالب جديد لا تتطلب تعديل جوهر النظام.
- preview يستخدم بيانات demo منفصلة.

القالب الأول يأتي في نهاية التخطيط كتطبيق على هذه القواعد، وليس مصدر البنية.

## 13. Dashboard Architecture

Dashboard هو واجهة تحرير هادئة، وليس لوحة تحكم مزدحمة.

Dashboard هو المنتج اليومي الحقيقي للمصور. يجب أن يكون مركز قيادة للموقع، لا صفحات CRUD.

الأقسام:

- Home.
- Design.
- Content.
- Gallery.
- Packages.
- Contact.
- SEO.
- Billing.
- Settings.

قواعد Dashboard:

- Mobile First.
- Auto Save حيث يناسب.
- Preview دائمًا قريب.
- Empty states واضحة.
- لا جداول على الهاتف.
- لا مصطلحات تقنية.

أول شاشة تعرض:

- رابط الموقع.
- نسخ الرابط.
- فتح الموقع.
- حالة الاشتراك.
- حالة الموقع.
- آخر الزيارات.
- آخر التعديلات.
- آخر الإشعارات.
- آخر نسخة محفوظة.
- Quick actions.

التنقل Mobile First:

- Bottom Navigation للهاتف.
- Navigation هادئ ومختصر لسطح المكتب.
- لا Sidebar ضخم كبداية.

## 14. Admin Panel Architecture

Admin Console لإدارة التشغيل.

Super Admin Console هو Control Center للمنصة بالكامل، وليس مجرد إدارة مستخدمين.

الأقسام:

- Dashboard.
- Customers.
- Sites.
- Subscriptions.
- Payments Review.
- Payments.
- Themes.
- Templates.
- Content.
- Notifications.
- Audit.
- Settings.
- Security Center.
- Media Management.
- SEO Management.
- Analytics.
- Support Center.
- Backup Center.
- System Health.
- Feature Flags.
- Jobs and Queue.

قواعد Admin:

- Search وfilters وpagination.
- Audit لكل عملية حساسة.
- صلاحيات داخلية متعددة لاحقًا.
- لا يمكن لمستخدم عادي الوصول لأي admin route.

إدارة العملاء تكون Customer Workspace كاملًا يحتوي:

- البيانات الأساسية.
- الموقع والرابط والقالب.
- الاشتراك والمدفوعات.
- سجل الدخول.
- الإشعارات.
- Timeline.
- Audit History.
- ملاحظات داخلية.
- الملفات.
- الإحصائيات.
- دعم Impersonation مع شريط واضح وAudit كامل.

## 15. Subscription System

الحالات:

- Trial.
- Active.
- Expired.
- Past_due لاحقًا.
- Cancelled.
- Suspended.

الدفع يأتي بعد التجربة فقط.

CTA الأساسي:

- "تفعيل موقعي"

طرق الدفع الأولى:

- InstaPay.
- Vodafone Cash.

طرق لاحقة:

- Stripe.
- Cards.
- PayPal.

النظام يجب أن يفصل بين Subscription وPaymentRequest حتى نستطيع دعم الدفع اليدوي والإلكتروني لاحقًا.

## 16. Storage Strategy

الصور أهم مورد في المنتج، لذلك يجب إدارتها باحتراف.

نستخدم object storage مثل:

- Cloudflare R2.
- AWS S3.
- Supabase Storage.

كل صورة لها metadata:

- width.
- height.
- size.
- mime type.
- blur hash.
- dominant color.
- alt text.

قواعد:

- لا رفع غير محدود.
- ضغط وتحسين.
- lazy loading.
- hero فقط priority.
- حذف الملفات غير المستخدمة بعد مدة.

## 16.1 Backup and Disaster Recovery Strategy

النظام يجب أن يدعم Backup Center داخل Super Admin.

أنواع النسخ:

- Database Backup.
- Uploads Backup.
- Full Backup.

المتطلبات:

- Manual Backup.
- Auto Backup.
- GitHub backups branch مستقل عن main.
- Manifest لكل نسخة.
- SHA-256 checksum.
- compression قابل للتعديل.
- encryption قبل رفع النسخ.
- verification قبل اعتبار النسخة ناجحة.
- Restore Center من Local أو GitHub.
- Auto Restore آمن فقط عند empty database وبشروط واضحة.
- Audit لكل عملية.
- خطة Disaster Recovery لفقدان Railway بالكامل.

المرحلة الأولى تستخدم Railway + GitHub، لكن الخطة يجب أن تسمح لاحقًا بـ S3/R2 كخيار أقوى.

## 17. Security Plan

أهم المخاطر:

- تسريب بيانات بين tenants.
- أسرار في الواجهة.
- upload غير آمن.
- bypass للصلاحيات.
- brute force على login.
- Admin misuse.

الحماية:

- validation لكل input.
- ownership checks.
- rate limiting.
- signed upload URLs.
- HttpOnly sessions.
- password hashing قوي.
- audit logs.
- environment variables للأسرار.

## 18. Performance Strategy

مواقع المصورين يجب أن تكون سريعة جدًا.

قواعد:

- Server-rendered public pages.
- أقل JavaScript ممكن.
- image optimization.
- lazy loading للمعارض.
- caching حسب site version.
- pagination للصور.
- عدم تحميل dashboard code في public site.

مقاييس مستهدفة:

- LCP أقل من 2.5s.
- CLS أقل من 0.1.
- INP أقل من 200ms.

## 19. SEO Strategy

### Platform SEO

- metadata للصفحات الأساسية.
- sitemap.
- robots.
- OG image.
- structured data للمنصة.

### Photographer Site SEO

لكل موقع:

- title.
- description.
- canonical.
- OG image.
- structured data.
- sitemap entry.

Preview pages:

- noindex.
- لا تدخل sitemap.

Expired sites:

- noindex بعد grace period.
- لا حذف للبيانات.

## 20. Deployment Strategy

المرحلة الأولى:

- Vercel للتطبيق.
- Managed PostgreSQL.
- Object storage.
- Error tracking.
- Backups.

البيئات:

- Development.
- Staging.
- Production.

قواعد النشر:

- migrations قبل release.
- smoke tests بعد release.
- rollback plan.
- feature flags للقوالب الجديدة والدفع الإلكتروني.

## 21. Folder Structure

هيكل مقترح:

```text
src/
  app/
    (marketing)/
    (dashboard)/
    (admin)/
    p/[slug]/
    api/
  modules/
    auth/
    tenants/
    sites/
    themes/
    dashboard/
    admin/
    billing/
    media/
    seo/
    audit/
  components/
    ui/
    layout/
    feedback/
  themes/
    registry.ts
    [theme-code]/
  lib/
    db/
    env/
    validation/
    permissions/
    storage/
    cache/
```

## 22. Coding Standards

- TypeScript strict.
- no hardcoded secrets.
- validation schemas.
- services لعمليات البيانات.
- tests للعزل والصلاحيات.
- Server Components افتراضيًا.
- Client Components للتفاعل فقط.
- لا `any` إلا بسبب واضح.
- لا بيانات ثابتة داخل القوالب.

## 23. Main Weaknesses to Avoid

- بناء القالب الأول كصفحة ثابتة.
- خلط Admin داخل موقع المصور.
- تأجيل multi-tenant isolation.
- بناء dashboard كبير قبل تشغيل رحلة التسجيل.
- تجاهل الصور والأداء.
- جعل الدفع اليدوي بلا queue واضحة.
- جعل preview صفحات قابلة للفهرسة.
- فتح حرية تصميم واسعة للمصور تفسد جودة النتيجة.

## 24. Professional Improvements Suggested

- ابدأ بموقع واحد لكل حساب، مع تصميم قاعدة البيانات لدعم أكثر من موقع لاحقًا.
- استخدم Theme Registry بدل تخزين HTML/JS في قاعدة البيانات.
- اجعل Dashboard يركز على المحتوى وليس التصميم الحر.
- اجعل الدفع اليدوي PaymentRequest workflow واضحًا.
- صمم custom domains من البداية كجدول ونموذج، لكن لا تنفذها في أول نسخة.
- اجعل كل موقع له content version لتسهيل cache invalidation.
- أضف AuditLog مبكرًا لأنه يصعب إضافته بعد العمليات.

## 25. Roadmap

### Phase 1 - Foundation

- Next.js setup.
- Prisma/PostgreSQL.
- Auth.
- Tenant/Site models.
- Basic routes.
- Design System foundation.
- Mandatory architecture rules.

### Phase 2 - Acquisition Flow

- Home.
- Templates showroom.
- Live preview.
- Signup with selected template.
- automatic site creation.

### Phase 3 - Dashboard MVP

- Link card.
- One-time slug change.
- Photographer command center.
- Content editing.
- Packages.
- Contact.
- Preview.
- Auto Save core.

### Phase 4 - Theme Engine

- Registry.
- Renderer.
- DB-driven content.
- First production theme.

### Phase 5 - Trial and Activation

- Trial lifecycle.
- Expired state.
- InstaPay/Vodafone Cash.
- Admin approval.

### Phase 6 - Admin Console

- Super Admin architecture.
- Admin Dashboard.
- Customers.
- Customer Workspace.
- Sites.
- Subscriptions.
- Payments.
- Templates.
- Audit.
- Security Center.
- Support Center.

### Phase 6.5 - Backup and Disaster Recovery

- Backup Center.
- Manual Backup.
- Auto Backup settings.
- GitHub backup branch.
- Manifest/checksum.
- Restore Center.
- Disaster Recovery workflow.

### Phase 7 - Hardening

- Performance.
- SEO.
- Security.
- Monitoring.
- Backups.

### Phase 8 - Growth

- More themes.
- Custom domains.
- Stripe/PayPal.
- Advanced galleries.
- Client proofing.
- Multi-language sites.

## 26. Final Planning Decision

نبدأ من المنصة والبنية ورحلة المستخدم، ثم نبني Theme Engine، ثم نضع القالب الأول فوقه.

القالب ليس الأساس. الأساس هو:

- Multi-tenant product.
- Fast site generation.
- clean dashboard.
- safe data model.
- scalable theme system.

بعد تثبيت ذلك، يصبح القالب الأول مجرد أول تطبيق ناجح على النظام.
