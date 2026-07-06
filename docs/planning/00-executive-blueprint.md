# Photographer Website Platform - Executive Blueprint

## Context

مساحة العمل الحالية فارغة تقريبًا ولا تحتوي على تطبيق قائم أو `package.json`. التحليل اعتمد على المتطلبات التي قدمتها وعلى ملف القالب المرفق: صفحة HTML واحدة تستخدم React 18 عبر CDN، Tailwind CDN، Firebase client SDK، بيانات افتراضية داخل الملف، ولوحة تحرير مبسطة داخل نفس الصفحة.

النتيجة المقترحة هنا ليست تحسين صفحة واحدة. النتيجة هي أساس SaaS متعدد المستأجرين للمصورين، يعمل من مشروع واحد وقاعدة بيانات واحدة واستضافة واحدة، مع Theme Engine قابل للتوسع.

## Product Vision

المنتج هو منصة SaaS تمنح كل مصور موقعًا احترافيًا خلال دقائق، بدون أن يشعر أنه يبني موقعًا. المستخدم يختار قالبًا، ينشئ حسابًا، يحصل تلقائيًا على موقع ورابط ولوحة تحكم وبيانات أولية، ثم يبدأ التعديل بنمط بسيط يشبه تحرير هوية رقمية لا إدارة نظام.

وعد المنتج:

- موقع فوتوغرافي فاخر وسريع خلال دقائق.
- تجربة Mobile First حقيقية، لأن أغلب العملاء سيشاهدون الموقع من الهاتف.
- لوحة تحكم قليلة الضجيج تعتمد Auto Save ومعاينات فورية.
- قوالب حيّة وليست Screenshots.
- نظام اشتراك يبدأ بعد التجربة، مع لغة محلية واضحة: "تفعيل موقعي".

## Core Product Principles

- أقل عدد ضغطات ممكن.
- لا توجد صفحات غير ضرورية في الموقع الرئيسي.
- لا توجد بيانات ثابتة داخل القوالب.
- كل Tenant مستقل في البيانات والإعدادات والروابط والقالب.
- القالب هو منتج قابل للتسجيل والتفعيل والإصدار، وليس ملف UI عشوائي.
- الأداء والـ SEO ليسا مرحلة لاحقة؛ هما جزء من تصميم البنية.

## Planning Order

القالب الأول ليس نقطة البداية المعمارية. نقطة البداية هي خطة المنصة: المنتج، رحلة المستخدم، الـ multi-tenancy، قاعدة البيانات، الاشتراكات، الإدارة، الأداء، والأمان.

بعد تثبيت هذه الخطة، يتم التعامل مع القالب المرفق كمرحلة أخيرة: أول Theme تطبيقي يثبت أن Theme Engine يعمل. لذلك أي تحليل تفصيلي للقالب محفوظ كملحق لاحق، ولا يقود قرارات البنية الأساسية.

## Recommended Product Shape

المنصة تتكون من أربع تجارب رئيسية:

- Marketing: الصفحة الرئيسية، القوالب، الدخول، إنشاء الحساب، استعادة كلمة المرور، السياسات.
- Template Showroom: عرض القوالب ومعاينة حية مع Floating Action ثابت.
- Photographer Dashboard: إدارة الموقع، الهوية، المعرض، الباقات، التواصل، الرابط، الاشتراك.
- Admin Console: إدارة العملاء، الاشتراكات، القوالب، المحتوى، الإشعارات، العمليات.

## Key Architectural Decisions

- Next.js 15 App Router مع React Server Components للقراءات.
- PostgreSQL + Prisma كمصدر الحقيقة.
- Auth.js أو Lucia-like custom auth فوق sessions آمنة؛ لا يتم وضع أسرار في المتصفح.
- Multi-tenant بالـ `tenantId` على كل جدول حساس مع قيود وفهارس واضحة.
- Slug routing للمواقع: `/p/[siteSlug]` في البداية، ثم دعم custom domains لاحقًا.
- Theme Engine Registry: كل قالب يسجل metadata وschema وcomponents وpreviewData.
- Media storage منفصل: S3-compatible مثل Cloudflare R2 أو Supabase Storage أو S3.
- Image pipeline محسّن: `next/image`, responsive sizes, blur placeholders, CDN.
- Payments manual-first لمصر: InstaPay وVodafone Cash مع proof upload ومراجعة Admin، ثم Stripe/PayPal لاحقًا.
- Trial lifecycle واضح: `trial`, `expired`, `active`, `past_due`, `suspended`.

## Primary Risks

- بناء القوالب كصفحات منفصلة سيجعل إضافة قالب جديد مكلفة ويكسر قابلية التوسع.
- إهمال Tenant isolation مبكرًا قد يسبب تسريب بيانات بين المصورين.
- الدفع اليدوي بدون Workflow واضح سيخلق فوضى تشغيلية.
- جعل لوحة التحكم تقليدية سيضرب وعد المنتج الفاخر.
- الاعتماد على صور خام كبيرة سيقتل سرعة مواقع العملاء.
- عدم تصميم Slug وDomain model مبكرًا سيصعّب التوسع لاحقًا.

## Non-Negotiables

- لا توجد مفاتيح أو كلمات مرور في كود الواجهة.
- لا يوجد قالب يقرأ بيانات hardcoded.
- لا يوجد تعديل رابط أكثر من مرة بعد الحفظ النهائي.
- بطاقة رابط الموقع تظهر دائمًا في أول شاشة Dashboard.
- جميع صفحات مواقع المصورين تولد Metadata وOG وSitemap بشكل ديناميكي.
- كل Mutation يمر عبر تحقق صلاحيات وValidation.
- كل خطة تنفيذ لاحقة تبدأ باختبارات ومسارات قبول واضحة.
- Design System إلزامي قبل بناء الواجهات الكبيرة.
- Super Admin Console يصمم كControl Center كامل، وليس CRUD.
- Photographer Dashboard يصمم كمنتج يومي مستقل، وليس صفحات إدارة.
- Backup Center وDisaster Recovery جزء من Architecture منذ البداية.
- التنفيذ لا يبدأ إلا بعد تقرير معماري وخطة تنفيذ دقيقة ومراجعة.

## Documentation Map

- [Master Project Plan](./00-master-project-plan.md)
- [UX and Product](./01-ux-and-product.md)
- [Technical Architecture](./02-technical-architecture.md)
- [Database Design](./03-database-design.md)
- [Theme Engine](./04-theme-engine.md)
- [Dashboard, Admin, Subscriptions](./05-dashboard-admin-subscriptions.md)
- [Security, Performance, SEO, Deployment](./06-security-performance-seo-deployment.md)
- [Folder Structure and Coding Standards](./07-folder-structure-and-coding-standards.md)
- [Roadmap](./08-roadmap.md)
- [Implementation Master Plan](./09-implementation-master-plan.md)
- [Acceptance Criteria and Risks](./11-acceptance-criteria-and-risks.md)
- [Critical Analysis Report](./12-critical-analysis-report.md)
- [Auth, Permissions, and Lifecycle](./13-auth-permissions-and-lifecycle.md)
- [Module Boundaries](./14-module-boundaries.md)
- [Mandatory Architecture Rules](./15-mandatory-architecture-rules.md)
- [Super Admin Console](./16-super-admin-console.md)
- [Photographer Dashboard Product](./17-photographer-dashboard-product.md)
- [Backup and Disaster Recovery](./18-backup-disaster-recovery.md)
- [Execution Governance](./19-execution-governance.md)
- [Final Architecture Report](./20-final-architecture-report.md)
- [Detailed Pre-Implementation Plan](./21-detailed-pre-implementation-plan.md)
- [Later Theme Appendix - Noir Gold](./99-later-theme-appendix-noir-gold.md)
