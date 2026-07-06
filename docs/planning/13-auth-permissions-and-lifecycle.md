# Auth, Permissions, and Lifecycle

## Purpose

هذه الوثيقة تفصل من يملك ماذا، ومتى يسمح النظام بأي عملية. هذا مهم جدًا لأن المشروع Multi-Tenant، وأي غموض هنا يتحول لاحقًا إلى ثغرات أو سلوك مربك.

## Identity Model

### User

الشخص الذي يسجل الدخول.

قد يكون:

- Photographer owner.
- Admin.
- Support.
- Billing manager لاحقًا.

### Tenant

مساحة العمل الخاصة بالمصور.

في البداية:

- كل User عادي يمتلك Tenant واحد.
- كل Tenant يمتلك Site واحد.

لاحقًا:

- يمكن دعم أكثر من Site داخل Tenant.
- يمكن دعم فريق داخل Tenant.

### Site

الموقع العام الذي يراه العملاء.

يرتبط بـ:

- Tenant.
- Theme.
- Content.
- Media.
- Subscription state.

## Authentication Flow

### Signup From Template

1. الزائر يضغط "استخدام هذا القالب".
2. النظام يحفظ `selectedThemeCode` مؤقتًا.
3. الزائر يفتح signup.
4. يدخل بياناته.
5. النظام يتحقق من:
   - email format.
   - password strength.
   - phone format إن وجد.
6. ينشئ User.
7. ينشئ Tenant.
8. ينشئ Site بالقالب المختار.
9. ينشئ Trial subscription.
10. ينشئ بيانات افتراضية للموقع.
11. يبدأ session.
12. يوجه المستخدم إلى `/dashboard`.

إذا لم يكن هناك قالب مختار:

- يستخدم النظام قالبًا افتراضيًا منشورًا.

### Signup Direct

1. الزائر يفتح `/signup`.
2. ينشئ الحساب.
3. النظام يختار قالبًا افتراضيًا.
4. يوجهه إلى Dashboard مع دعوة لاختيار قالب لاحقًا.

### Login

1. المستخدم يدخل email/password.
2. النظام يطبق rate limit.
3. يتحقق من كلمة المرور.
4. ينشئ session.
5. يوجه حسب الدور:
   - admin إلى `/admin`.
   - user إلى `/dashboard`.

### Forgot Password

1. المستخدم يدخل البريد.
2. النظام يرسل رسالة عامة لا تكشف هل البريد موجود.
3. إذا كان البريد موجودًا، ينشئ token قصير العمر.
4. token يستخدم مرة واحدة.
5. بعد تغيير كلمة المرور، تلغى sessions القديمة عند الحاجة.

## Permission Matrix

| Action | Photographer Owner | Admin | Support | Billing Manager |
|---|---:|---:|---:|---:|
| View own dashboard | Yes | Yes via admin view | Limited | No |
| Edit own site content | Yes | Yes | Limited | No |
| Change own slug once | Yes | Yes | No | No |
| View own billing | Yes | Yes | Limited | Yes |
| Submit payment proof | Yes | Yes | No | No |
| Approve payment | No | Yes | No | Yes |
| Reject payment | No | Yes | No | Yes |
| Manage templates | No | Yes | No | No |
| Manage platform content | No | Yes | No | No |
| View audit logs | No | Yes | Limited | Limited |
| Suspend tenant | No | Yes | No | No |

## Resource Ownership Rules

### Site

User can access Site only if:

- `site.tenantId` equals user's active tenant id.

Admin can access any Site.

### Media

User can access Media only if:

- `media.tenantId` equals user's active tenant id.

### PaymentRequest

User can create PaymentRequest only for own Tenant.

User can view own PaymentRequests.

Admin/Billing can review all pending PaymentRequests.

### Theme

Published themes are visible to users.

Draft themes are visible only to Admin.

Archived themes:

- not selectable for new sites.
- existing sites can keep them until migration.

## Account Lifecycle

### Created

Temporary internal state during signup transaction.

### Trial

Default state after successful signup.

User can:

- edit site.
- publish site.
- upload media within limits.
- use dashboard.
- submit activation payment.

### Active

State after payment approval.

User can:

- use all core features.
- keep site public.
- renew later.

### Expired

State after trial or subscription ends.

User can:

- login.
- view dashboard.
- edit limited or full content depending on business decision.
- activate site.

Recommended:

- allow editing.
- keep data.
- show activation CTA.
- public site enters grace period.

### Suspended

Admin action for abuse or payment dispute.

User can:

- login.
- see suspension message.
- contact support.

Site:

- not publicly available or shows neutral unavailable state.

## Site Lifecycle

### Draft

Created but not fully edited.

In this product, the site can still be visible during Trial because the promise is immediate value.

### Published

Public URL works.

### Noindex Preview

Template previews and internal previews must not be indexed.

### Expired Grace

Site remains accessible for a limited time after expiration if business chooses.

Recommended:

- 7 days grace.
- then noindex.
- never delete content automatically in early product.

## Slug Lifecycle

### Initial Slug

Generated during signup from:

- name.
- phone fragment optional.
- random suffix if needed.

### One-Time Change

Rules:

- only if `slugChangeUsed = false`.
- validate format.
- check global uniqueness.
- block reserved slugs.
- write audit event.
- set `slugChangeUsed = true`.

### Admin Slug Change

Admin can change slug for support cases.

Rules:

- requires reason.
- logs audit.
- ideally creates redirect from old slug to new slug for SEO.

## Session Security

- HttpOnly cookies.
- Secure in production.
- SameSite Lax or Strict depending OAuth needs.
- Session rotation after login.
- Optional session invalidation after password reset.

## Rate Limits

Apply rate limits to:

- login.
- signup.
- forgot password.
- slug availability check.
- payment proof upload.
- contact forms if added.

## Audit Events

Must log:

- signup created tenant.
- slug changed.
- payment proof submitted.
- payment approved/rejected.
- subscription activated/expired/suspended.
- admin viewed sensitive customer profile.
- theme published/archived.
- tenant suspended.

## Transaction Boundaries

Signup should be transactional:

- User.
- Tenant.
- Site.
- Subscription.
- default content.

If any step fails, rollback or mark as incomplete with a recovery job. Do not leave a user without a Site.
