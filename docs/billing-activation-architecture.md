# FrameID Billing Activation Architecture

## Goal

Build a complete activation system, not a simple payment page. The flow converts a new trial user into a paid customer through a clear, auditable workflow controlled from the admin console.

## Customer journey

1. User creates an account.
2. System creates account, tenant, site, trial subscription, and dashboard.
3. Customer uses the site during the free trial.
4. Dashboard shows subscription status, trial end, remaining days, current plan, and activation CTA.
5. When the trial is near expiry, the system shows warning messages.
6. When the trial expires, the activation flow becomes the main path.
7. Customer selects a plan.
8. Customer selects a payment method.
9. Customer sees admin-managed payment instructions and accounts.
10. Customer creates a draft request.
11. Customer uploads payment proof.
12. Customer previews, replaces, or deletes the proof before submission.
13. Customer submits the request.
14. Request is locked for review.
15. Admin approves, rejects, or requests proof re-upload.
16. On approval, subscription is activated and the site is restored/published.

## Admin journey

The admin payment center reviews activation requests with:

- customer data
- site data
- current subscription data
- selected plan
- payment method and account
- amount and currency
- reference number
- proof image
- request activity timeline
- rejection reason
- internal notes
- audit events

Admin actions supported by the architecture:

- approve payment
- reject payment with reason
- request proof re-upload
- add internal note
- cancel request
- reopen through draft/re-upload flow
- extend trial from customer admin tools
- grant a fresh trial from subscription messaging overrides
- end/suspend/activate customer subscription through customer admin tools
- send notifications

## Subscription experience integration

Billing and dashboard no longer invent separate subscription notices.
Both surfaces consume a shared resolved "subscription experience" payload that contains:

- message visibility, title, description, and tone;
- timer visibility and remaining days when applicable;
- action button type, label, target, and optional custom link.

Resolution order is:

1. tenant override
2. global admin default
3. system fallback

This lets admin control activation and subscription communication from one place without duplicating rules between lifecycle cards, billing alerts, and manual exception handling.

## Service architecture

### BillingActivationService

Owns the payment request state machine and business rules:

- DRAFT can move to SUBMITTED or CANCELLED.
- SUBMITTED can move to UNDER_REVIEW, CANCELLED, APPROVED, REJECTED, or DRAFT for re-upload.
- UNDER_REVIEW can move to APPROVED, REJECTED, DRAFT, or CANCELLED.
- APPROVED can move to REFUNDED.
- Proof is required before submission.
- Plan and payment account are required before submission.
- Submitted requests are locked against customer edits.

### PrismaBillingActivationRepository

Maps the billing service to Prisma while keeping schema-safe writes:

- uses `currentPeriodEnd` and `expiresAt` for subscription cancellation
- uses `Site.status` and `isPublished` for site suspension/restoration
- calculates DateTime updates in TypeScript
- fetches subscription status before recording SubscriptionChange

### PaymentSettingsService

Keeps all payment data in the database:

- method labels
- descriptions
- QR codes
- account numbers
- owner names
- bank data
- phone numbers
- IBAN/SWIFT
- instructions
- notes

No payment number is stored in code.

## Security rules

- Customers can only access their own tenant payment requests.
- Customers cannot edit submitted requests.
- Customers cannot submit without proof.
- Customers cannot use inactive payment methods.
- Customers cannot use accounts from another payment method.
- File type and size are validated server-side.
- Admin actions are protected by admin session guards.
- Every important mutation writes a payment log and/or audit log.

## Implemented changes in this branch

- Hardened billing activation service.
- Fixed Prisma repository mismatches.
- Removed broken DateTime increment logic for trial extension.
- Removed hardcoded manual activation amount from customer action flow.
- Added server-side validation for plan, payment method, account, ownership, request status, and proof files.
- Rebuilt the customer billing page as a guided activation workflow.
- Added default Payment Settings seed rows for InstaPay, Vodafone Cash, Stripe, and PayPal.

## Recommended next iteration

- Add dedicated `TrialLifecycleService` for cron-based expiry and grace-period handling.
- Add admin bulk filters/search to payment center.
- Add email dispatch templates for every status transition.
- Add automated tests for the request state machine and authorization rules.
- Replace PaymentMethod enum with a database-driven method code string if custom future payment methods are required without schema changes.
