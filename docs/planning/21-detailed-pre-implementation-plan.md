# Detailed Pre-Implementation Plan

## Purpose

هذه خطة ما قبل التنفيذ. ليست كودًا، لكنها تحدد ترتيب البناء بحيث لا ننسى أي جزء مهم.

## Stage 0 - Planning Approval

### Objective

اعتماد التقرير والقواعد والخطة قبل فتح workspace التنفيذ.

### Tasks

- مراجعة Master Project Plan.
- مراجعة Mandatory Architecture Rules.
- مراجعة Super Admin Console.
- مراجعة Photographer Dashboard.
- مراجعة Backup & Disaster Recovery.
- مراجعة Final Architecture Report.

### Output

- قرار بدء التنفيذ.
- قائمة أي تعديلات نهائية.

## Stage 1 - Foundation and Design System

### Objective

بناء أساس التطبيق واللغة البصرية.

### Build

- Next.js 15 app.
- React 19.
- TypeScript strict.
- Tailwind.
- Prisma.
- PostgreSQL.
- env validation.
- route groups.
- base layouts.
- error/loading/not-found.
- Design tokens.
- UI primitives.

### Must Include

- Typography.
- Spacing.
- Radius.
- Colors.
- Shadows.
- Motion.
- Buttons.
- Inputs.
- Cards.
- Modals.
- Toasts.
- Skeletons.
- Empty states.
- Icons.

### Acceptance

- لا UI خارج Design System.
- mobile-first primitives.
- accessibility baseline.

## Stage 2 - Core Data Model

### Objective

تعريف قاعدة البيانات التي تدعم المنصة لخمس سنوات.

### Build

- User.
- Tenant.
- Site.
- SiteDomain.
- Theme.
- Template.
- SiteThemeConfig.
- SiteSection.
- Package.
- ExtraService.
- MediaAsset.
- ContactProfile.
- SEOSettings.
- Plan.
- Subscription.
- PaymentRequest.
- Notification.
- AuditLog.
- Backup entities.
- FeatureFlag.

### Acceptance

- migrations تعمل.
- indexes أساسية.
- no single JSON blob for full site.
- tenant ownership واضح.

## Stage 3 - Auth, Tenant, and Site Creation

### Objective

إنشاء المستخدم والموقع تلقائيًا بعد التسجيل.

### Build

- signup.
- login.
- forgot password.
- sessions.
- tenant creation.
- site creation.
- trial subscription.
- default data.
- selected template carry-over.

### Acceptance

- user جديد يحصل على site.
- site له slug.
- trial يعمل.
- no user without tenant/site.

## Stage 4 - Theme Engine Core

### Objective

فصل القوالب عن المنطق.

### Build

- Theme Registry.
- Theme metadata.
- Template metadata.
- preview data.
- renderer.
- section mapping.
- theme settings schema.

### Acceptance

- theme لا يقرأ database.
- no hardcoded user data.
- template preview route يعمل ببيانات demo.

## Stage 5 - Marketing and Template Showroom

### Objective

تحويل الزائر إلى مستخدم.

### Build

- homepage.
- templates showroom.
- template cards.
- live preview.
- floating preview action.
- signup from template.

### Acceptance

- preview ليس screenshot.
- preview noindex.
- selected template persists through signup.

## Stage 6 - Photographer Dashboard Core

### Objective

بناء المنتج اليومي للمصور.

### Build

- dashboard layout.
- widget system.
- mobile bottom navigation.
- site link card.
- copy/open site.
- status widgets.
- one-time slug editor.
- autosave foundation.
- notifications center.

### Acceptance

- أول شاشة command center.
- link card دائم.
- slug change مرة واحدة.
- autosave status موجود.

## Stage 7 - Photographer Editing Modules

### Objective

تمكين المصور من إدارة موقعه بسهولة.

### Build

- identity editor.
- hero editor.
- packages editor.
- extras editor.
- contact editor.
- SEO editor.
- design/theme editor.
- gallery upload.

### Acceptance

- no CRUD feeling.
- minimal clicks.
- mobile-first.
- all data saved through services.

## Stage 8 - Public Sites

### Objective

عرض مواقع المصورين بسرعة وSEO قوي.

### Build

- `/p/[slug]`.
- site data loading.
- theme rendering.
- dynamic metadata.
- OG image strategy.
- structured data.
- expired/trial behavior.

### Acceptance

- public site fast.
- no dashboard bundle.
- SEO per site.
- no hardcoded content.

## Stage 9 - Billing and Manual Payments

### Objective

تشغيل Trial ثم Activation.

### Build

- trial lifecycle.
- expired state.
- billing dashboard.
- "تفعيل موقعي".
- InstaPay.
- Vodafone Cash.
- proof upload.
- PaymentRequest.
- admin review hooks.

### Acceptance

- لا دفع قبل التجربة.
- data preserved after expired.
- manual payment reviewable.

## Stage 10 - Super Admin Core

### Objective

بناء Control Center للمنصة.

### Build

- admin layout.
- RBAC.
- admin dashboard widgets.
- customers management.
- customer workspace.
- sites management.
- payments review.
- subscriptions.
- audit logs.
- support center basic.
- security center basic.

### Acceptance

- no admin action without permission.
- no sensitive action without audit.
- customer is workspace, not row.
- impersonation designed/guarded.

## Stage 11 - Backup Center and Disaster Recovery

### Objective

منع فقدان بيانات العملاء.

### Build

- backup settings.
- manual backup.
- auto backup schedule.
- database backup.
- uploads backup.
- full backup.
- manifest.
- checksum.
- compression.
- GitHub backups branch.
- backup history.
- restore center.
- verification.
- disaster recovery runbook.

### Acceptance

- backup verified before success.
- restore guarded.
- no concurrent restore.
- audit events.
- DR plan tested conceptually.

## Stage 12 - Analytics, SEO, and Operations

### Objective

إدارة النمو والتشغيل.

### Build

- analytics events.
- conversion tracking.
- theme usage.
- trial activation funnel.
- SEO management.
- system health.
- jobs view.
- feature flags.

### Acceptance

- admin can see platform health.
- product decisions have metrics.

## Stage 13 - First Production Theme

### Objective

تحويل القالب المرفق إلى Theme احترافي بعد اكتمال المحرك.

### Build

- Noir Gold theme.
- components.
- theme settings.
- preview data.
- sections.
- mobile-first polish.
- accessibility.
- performance.

### Acceptance

- no hardcoded photographer data.
- works with any site data.
- fast public rendering.
- SEO compatible.

## Stage 14 - Hardening and Launch Readiness

### Objective

تجهيز الإطلاق التجاري.

### Build

- security review.
- performance review.
- accessibility review.
- SEO review.
- backup restore drill.
- staging.
- monitoring.
- error tracking.
- launch checklist.

### Acceptance

- tenant isolation verified.
- no secrets in client.
- backups verified.
- core flows pass.
- mobile UX approved.

## Execution Rule

لا يبدأ Stage إلا بعد اكتمال السابق أو وجود سبب موثق للتوازي.

لا يبدأ الكود قبل اعتماد Stage 0.
