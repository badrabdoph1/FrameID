# Module Boundaries

## Purpose

هذه الوثيقة تحدد مسؤولية كل جزء من النظام. الهدف أن يبقى المشروع نظيفًا عندما يكبر، وأن لا يتحول كل شيء إلى ملفات ضخمة تعرف كل شيء عن كل شيء.

## Auth Module

### Owns

- signup.
- login.
- logout.
- password reset.
- sessions.
- password hashing.

### Does Not Own

- إنشاء الموقع.
- اختيار القالب.
- الاشتراك.

### Collaborates With

- Tenant module أثناء signup.
- Audit module للأحداث الحساسة.

## Tenant Module

### Owns

- Tenant creation.
- Tenant status.
- owner relationship.
- tenant-level permissions.

### Does Not Own

- محتوى الموقع.
- القالب.
- الدفع التفصيلي.

### Collaborates With

- Site module لإنشاء الموقع.
- Billing module لحالة الاشتراك.

## Site Module

### Owns

- Site record.
- slug.
- publish state.
- site settings.
- one-time slug change.

### Does Not Own

- Theme rendering.
- Payment approval.
- Auth sessions.

### Collaborates With

- Theme module لاختيار القالب.
- SEO module للmetadata.
- Media module للصور.

## Theme Module

### Owns

- Theme registry.
- theme metadata.
- theme config schema.
- renderer selection.
- preview data.

### Does Not Own

- بيانات المصور.
- Admin permissions.
- Billing.

### Collaborates With

- Site module لمعرفة themeId.
- Content modules لتمرير البيانات.

## Dashboard Module

### Owns

- UX screens للمصور.
- orchestration بين content/site/media/billing.
- client interaction states.

### Does Not Own

- business rules العميقة.
- direct database access من client.

### Collaborates With

- كل modules تقريبًا عبر services/actions.

## Content Module

### Owns

- Site sections.
- packages.
- extras.
- contact profile.
- editable text.

### Does Not Own

- Theme component rendering.
- Billing.

### Collaborates With

- Theme module لتطابق schemas.
- SEO module لتوليد description عند الحاجة.

## Media Module

### Owns

- uploads.
- storage keys.
- media metadata.
- image limits.
- signed URLs.
- cleanup jobs.

### Does Not Own

- ترتيب المعرض وحده إلا من خلال Gallery module/content.
- تصميم عرض الصور.

### Collaborates With

- Site/Gallery modules.
- Storage provider.

## Billing Module

### Owns

- plans.
- subscriptions.
- status transitions.
- trial expiration.
- activation.

### Does Not Own

- مراجعة إثبات الدفع التفصيلية وحدها.
- Auth.

### Collaborates With

- Payment module.
- Notification module.
- Tenant module.

## Payment Module

### Owns

- PaymentRequest.
- manual payment proof.
- provider abstraction.
- payment review status.

### Does Not Own

- subscription rules النهائية.

### Collaborates With

- Billing module لتفعيل الاشتراك.
- Admin module للمراجعة.
- Media module لإثبات الدفع.

## Admin Module

### Owns

- admin screens.
- customer search.
- payment review UI.
- template management UI.
- operational actions.

### Does Not Own

- business rules نفسها.

### Collaborates With

- Billing, Payment, Theme, Tenant, Audit.

## SEO Module

### Owns

- metadata generation.
- canonical URLs.
- sitemap logic.
- robots rules.
- structured data.

### Does Not Own

- المحتوى الأصلي.
- theme rendering.

### Collaborates With

- Site, Content, Theme.

## Notification Module

### Owns

- in-app notifications.
- email/whatsapp-ready message events later.
- templates.
- read state.

### Does Not Own

- business event decisions.

### Collaborates With

- Billing for trial ending.
- Payment for review result.
- Admin for broadcasts.

## Audit Module

### Owns

- audit event recording.
- actor/action/entity metadata.
- admin-sensitive activity.

### Does Not Own

- authorization decisions.

### Collaborates With

- all modules.

## Dependency Rule

UI can call actions/services.

Services can call database and other services intentionally.

Themes cannot call database.

Client components cannot access secrets.

Admin UI cannot bypass module services.

## Anti-Coupling Rules

- Auth must not create database content directly without Tenant/Site services.
- Theme must not know Billing.
- Billing must not know Theme.
- Media must not know Dashboard.
- Admin must not implement business rules inline.
- Site slug validation must live in one place only.
