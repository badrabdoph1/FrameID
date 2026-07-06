# Super Admin Console Architecture

## Purpose

Super Admin Console هو مركز قيادة المنصة بالكامل. ليس جدول مستخدمين، وليس CRUD تقليدي. هو Control Center لإدارة المنتج والعملاء والاشتراكات والقوالب والأمان والنسخ الاحتياطي والتشغيل اليومي.

لا يبدأ تنفيذ الواجهات قبل اكتمال مكونات المنصة الأساسية، لكن Architecture اللوحة يجب أن تكون جاهزة منذ البداية حتى تبنى باقي الأنظمة بطريقة تدعمها.

## Design Principle

لوحة الإدارة تستخدم نفس Design System الخاص بالمنصة:

- Premium.
- Minimal.
- Fast.
- Clear.
- Productive.

الفرق أنها أكثر كثافة، لكنها لا تصبح مزدحمة.

## Role-Based Access Control

الأدوار المقترحة:

- Super Admin: كل الصلاحيات.
- Operations Admin: العملاء والمواقع والدعم.
- Billing Manager: الاشتراكات والمدفوعات.
- Template Manager: القوالب والثيمات.
- Content Manager: محتوى المنصة والإشعارات.
- Support Agent: دعم العملاء مع صلاحيات محدودة.
- Security Auditor: قراءة audit/security فقط.

كل عملية حساسة تسجل في AuditLog.

## Main Navigation

الأقسام الأساسية:

- Dashboard.
- Customers.
- Sites.
- Themes.
- Templates.
- Subscriptions.
- Payments Review.
- Notifications.
- Content Management.
- Platform Settings.
- Audit Logs.
- Security Center.
- Media Management.
- SEO Management.
- Analytics.
- Support Center.
- Backup Center.
- System Health.
- Feature Flags.
- Jobs and Queue.

## Admin Dashboard as Command Center

لا يعتمد على بطاقات إحصائية فقط. يجب أن يعرض ما يحتاج المدير رؤيته يوميًا.

Widgets أساسية:

- New users today.
- Active trials.
- Trials ending soon.
- Expired accounts.
- Pending payment requests.
- Failed payments لاحقًا.
- Latest admin actions.
- Recent customer activity.
- Most used themes.
- Theme conversion rates.
- Revenue snapshot.
- Sites with SEO issues.
- Storage usage.
- Backup health.
- System health.
- Support tickets needing action.
- Suspicious login attempts.

كل Widget يجب أن يقود إلى action أو filtered view.

## Customers Management

لا تجعلها مجرد جدول. كل عميل هو Customer Workspace.

### Customer List

يحتوي على:

- name.
- email.
- phone.
- site slug.
- status.
- subscription state.
- theme.
- last activity.
- created date.
- risk flags.

يدعم:

- search.
- filters.
- saved views.
- pagination.
- bulk actions بحذر.

### Customer Workspace

ملف العميل يحتوي:

- البيانات الأساسية.
- الموقع.
- الرابط.
- القالب.
- الاشتراك.
- سجل المدفوعات.
- سجل الدخول.
- الإشعارات.
- timeline.
- audit history.
- notes داخلية.
- files/media.
- analytics.
- support history.
- feature flags.
- admin actions.

### Customer Timeline

Timeline يجب أن يعرض:

- signup.
- site created.
- slug changed.
- theme changed.
- content updated.
- payment submitted.
- payment approved/rejected.
- trial expired.
- subscription activated.
- admin impersonation.
- support notes.

## Sites Management

يدير كل مواقع المصورين.

Capabilities:

- search by slug/domain/owner.
- status filters.
- view public site.
- view dashboard as admin.
- change status.
- inspect SEO.
- inspect theme config.
- inspect media usage.
- handle slug/domain conflicts.

## Themes and Templates

فرق مهم:

- Theme: نظام عرض فعلي داخل Theme Engine.
- Template: package أو preset مبني على Theme مع preview data وإعدادات جاهزة.

Themes Management:

- theme registry view.
- version.
- status: draft/published/archived.
- supported sections.
- health checks.
- sites using theme.

Templates Management:

- showroom ordering.
- preview data.
- metadata.
- category.
- visibility.
- conversion analytics.
- publish/unpublish.

## Subscriptions

Capabilities:

- plans.
- active subscriptions.
- trials.
- expired accounts.
- manual activation.
- extension.
- suspension.
- cancellation.
- renewal history.

## Payments Review

Payment queue مخصصة للمدفوعات اليدوية.

كل طلب يعرض:

- customer.
- amount.
- method: InstaPay/Vodafone Cash.
- proof.
- reference.
- submitted time.
- risk indicators.
- previous payments.

Actions:

- approve.
- reject with reason.
- request more info.
- assign to reviewer.

## Notifications

يدير:

- in-app notifications.
- email templates لاحقًا.
- WhatsApp-ready copy لاحقًا.
- trial reminders.
- payment results.
- admin announcements.

يجب أن يدعم:

- audience selection.
- priority.
- schedule.
- status.
- delivery log.

## Content Management

يدير:

- homepage copy.
- banners.
- policy pages.
- terms.
- template showroom copy.
- platform announcement bars.
- onboarding copy.
- empty states if made configurable.

## Platform Settings

يدير:

- trial duration.
- reserved slugs.
- upload limits.
- backup settings.
- payment instructions.
- default theme/template.
- maintenance mode.
- feature flags.
- SEO defaults.

## Security Center

يعرض:

- failed login attempts.
- suspicious activity.
- admin sessions.
- impersonation logs.
- password reset activity.
- rate limit incidents.
- users with elevated roles.
- security settings.

## Media Management

Capabilities:

- storage overview.
- largest tenants.
- orphaned files.
- failed uploads.
- image processing queue.
- media policy settings.
- delete unused assets with safety checks.

## SEO Management

Capabilities:

- platform sitemap health.
- indexed sites.
- noindex previews.
- expired site policy.
- missing metadata.
- invalid OG images.
- structured data warnings.

## Analytics

Analytics يجب أن تخدم القرار التشغيلي.

Metrics:

- visitor to signup conversion.
- template preview to signup.
- signup to first edit.
- trial to activation.
- theme conversion rate.
- payment approval time.
- dashboard engagement.
- public site visits.
- storage growth.

## Support Center

Capabilities:

- customer lookup.
- internal notes.
- support status.
- issue categories.
- quick actions.
- impersonation entry.
- customer timeline.

## Impersonation

يدعم دخول المشرف إلى حساب المصور.

Rules:

- يظهر شريط واضح دائمًا.
- زر عودة إلى Admin بضغطة واحدة.
- session معزولة ومؤقتة.
- ممنوع العمليات عالية الخطورة أثناء impersonation إلا بتأكيد خاص.
- تسجل العملية كاملة في AuditLog:
  - admin user.
  - customer.
  - start time.
  - end time.
  - actions taken.
  - reason.

## Backup Center

Backup Center جزء من Super Admin وليس أداة مخفية.

تفاصيله في وثيقة Backup & Disaster Recovery.

## System Health

يعرض:

- database status.
- storage status.
- GitHub backup status.
- jobs/queue status.
- error rate.
- last deployment.
- app version.
- environment.

## Jobs and Queue

يدير:

- backup jobs.
- image processing.
- notifications.
- trial expiration.
- sitemap generation.
- cleanup jobs.

Capabilities:

- retry.
- inspect.
- cancel.
- pause.
- resume.

## Architecture Rules

- Admin UI لا يطبق business logic داخله.
- كل action يمر عبر module service.
- كل action حساس يحتاج permission check.
- كل action حساس يسجل audit.
- كل list كبيرة تستخدم pagination.
- كل view تدعم search/filter عند الحاجة.
- Admin لا يتجاوز tenant isolation إلا عبر services مصممة لذلك.

## Suggested Additional Admin Centers

### Feature Flags

لإطلاق الميزات تدريجيًا مثل Booking أو Client Gallery.

### Data Quality Center

لرؤية العملاء الذين لديهم مواقع ناقصة:

- no hero image.
- no packages.
- missing contact.
- missing SEO title.

### Revenue Operations

لاحقًا لإدارة renewals وdiscounts وmanual offers.

### Compliance Center

لاحقًا لطلبات حذف البيانات، privacy، exports.

## Implementation Timing

لا تنفذ Super Admin UI قبل:

1. Auth.
2. Tenant/Site.
3. Theme Engine.
4. Billing core.
5. Audit core.

لكن صمم schema والخدمات من البداية بحيث تدعمها.
