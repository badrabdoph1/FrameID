# Final Architecture Report Before Implementation

## Executive Decision

المشروع يجب أن يبنى كمنصة SaaS متعددة المستأجرين للمصورين، وليس كقالب أو موقع منفرد. القالب الأول يأتي في النهاية كاختبار لـ Theme Engine، وليس كأساس للبنية.

القرار المعماري الأساسي:

- Modular Monolith في البداية.
- Multi-Tenant data model.
- Theme Engine منفصل عن المنطق.
- Design System إلزامي.
- Dashboard كمنتج يومي للمصور.
- Super Admin كControl Center.
- Backup/Disaster Recovery كجزء من Architecture.

## Why Not Start From the Template

القالب المرفق جيد كإحساس بصري، لكنه ليس أساسًا معماريًا.

لو بدأنا منه سنقع في:

- hardcoded data.
- admin داخل public site.
- Firebase client logic.
- عدم وجود tenant isolation.
- صعوبة إضافة قوالب.
- صعوبة إدارة الاشتراكات.
- SEO وأداء ضعيفان.

الحل:

1. نبني Core Platform.
2. نبني Theme Engine.
3. نحول القالب إلى Theme قابل لإعادة الاستخدام.

## Core Systems

الأنظمة الأساسية:

- Auth.
- Tenants.
- Sites.
- Themes.
- Templates.
- Public Sites.
- Photographer Dashboard.
- Super Admin Console.
- Billing.
- Payments.
- Media.
- SEO.
- Notifications.
- Audit.
- Backup/Restore.
- Analytics.
- Support.
- Feature Flags.

## Key Entities

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
- BackupJob.
- BackupManifest.
- BackupSettings.
- AdminNote.
- SupportCase لاحقًا.
- FeatureFlag.

## Critical Decisions

### Multi-Tenancy

كل بيانات المستخدمين ترتبط بـ Tenant أو Site. لا يسمح بأي query حساس دون tenant scope.

### Theme Engine

القوالب للعرض فقط. المنطق في Core Platform.

### Dashboard

Dashboard ليست CRUD. هي مركز إدارة للموقع مع widgets وautosave وmobile-first navigation.

### Super Admin

Admin ليست جدول مستخدمين. هي مركز قيادة للمنصة: customers, sites, payments, security, backup, analytics, support.

### Backup

Backup لا يعتبر ناجحًا إلا بعد verification. GitHub branch مستقل يستخدم كبداية، مع توصية بالانتقال إلى S3/R2 لاحقًا.

## Major Risks and Mitigations

### Risk: Data Leak Between Tenants

Mitigation:

- tenantId everywhere.
- service-layer permission checks.
- tests.
- audit.

### Risk: Theme System Turns Hardcoded

Mitigation:

- Theme Registry.
- no data in components.
- no DB queries in themes.

### Risk: Dashboard Becomes Traditional Admin

Mitigation:

- command center.
- widgets.
- one-goal screens.
- autosave.
- mobile-first.

### Risk: Manual Payments Become Operational Mess

Mitigation:

- PaymentRequest.
- review queue.
- proof upload.
- admin notes.
- audit.

### Risk: Data Loss on Railway Failure

Mitigation:

- Backup Center.
- Full Backup.
- GitHub branch.
- manifest/checksum.
- restore runbook.

## Future Readiness

تم تصميم المنصة لتقبل لاحقًا:

- CRM.
- Booking.
- Client Gallery.
- Contracts.
- Digital Delivery.
- Blog.
- Marketplace.
- Custom domains.
- Multi-site accounts.
- Team members.

بدون إعادة بناء، بشرط الالتزام بحدود الموديولات والـ Design System.

## Implementation Recommendation

لا يبدأ التنفيذ قبل:

1. اعتماد هذا التقرير.
2. اعتماد خطة التنفيذ التفصيلية.
3. إنشاء workspace/fork للتنفيذ.
4. تنفيذ Foundation + Design System أولًا.

## Go / No-Go Criteria

Go فقط إذا:

- القواعد الإلزامية مقبولة.
- Super Admin جزء من Architecture.
- Backup جزء من Architecture.
- Photographer Dashboard مصمم كمنتج.
- لا يبدأ التنفيذ من القالب.
- التنفيذ milestone-based.

No-Go إذا:

- المطلوب بدء الكود من القالب.
- لا يوجد وقت لبناء Design System.
- لا توجد موافقة على tenant isolation والbackup والأudit.
