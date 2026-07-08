# Billing Activation Module Rewrite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the billing/activation module with DRAFT→SUBMIT payment workflow, comprehensive admin review actions, and plan info in the current session.

**Architecture:** Thin service layer on top of Prisma repository. The service handles business logic (validation, audit logs, notifications); the repository handles DB queries. The CurrentSession type is extended to include `planId` and `plan` on the subscription object.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), TypeScript, Server Actions

## Global Constraints

- All Arabic labels and descriptions
- Use `src/lib/errors` for error handling (PaymentError, ValidationError)
- Use `getCurrentRequestSession()` for customer auth, `requireSuperAdminSession()` for admin auth
- Follow existing patterns: `revalidatePath` + `redirect` for actions
- Keep backward compatibility for `requestManualActivation`, `approveManualPayment`, `rejectManualPayment` method names
- Do NOT add code comments

---

### Task 1: Update Current Session Types

**Files:**
- Modify: `src/modules/auth/current-session-service.ts:33-37`

- [ ] **Add `planId` and `plan` to the subscription type**

```typescript
subscription: {
  id: string;
  planId: string | null;
  plan: { code: string; name: string; priceAmount: number; currency: string } | null;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED" | "SUSPENDED";
  currentPeriodEnd: Date | null;
} | null;
```

### Task 2: Update Prisma Current Session Repository

**Files:**
- Modify: `src/modules/auth/prisma-current-session-repository.ts`

- [ ] **Add plan relation select in the subscriptions query**

Update the subscriptions `select` block in `findActiveSessionByTokenHash` to include `planId` and `plan` with `select: { code, name, priceAmount, currency }`.

- [ ] **Shape the subscription return data to include `planId` and `plan`**

### Task 3: Rewrite Billing Activation Service

**Files:**
- Rewrite: `src/modules/billing/billing-activation-service.ts`

- [ ] **Define `BillingActivationRepository` interface** with all methods from spec
- [ ] **Implement `createBillingActivationService`** with:
  - Customer payment workflow: `createDraftPayment`, `updateDraftPayment`, `uploadPaymentProof`, `removePaymentProof`, `submitPayment`, `getCustomerActivePaymentRequest`
  - Admin review: `approvePayment`, `rejectPayment`, `requestReupload`
  - Backward compat: `requestManualActivation`, `approveManualPayment`, `rejectManualPayment`

### Task 4: Rewrite Prisma Billing Activation Repository

**Files:**
- Rewrite: `src/modules/billing/prisma-billing-activation-repository.ts`

- [ ] **Implement all repository methods** with typed Prisma client matching the Prisma schema

### Task 5: Rewrite Customer Billing Actions

**Files:**
- Rewrite: `src/app/(dashboard)/dashboard/billing/actions.ts`

- [ ] **Implement `requestActivationAction`** with DRAFT workflow, validation, media upload, redirects

### Task 6: Rewrite Admin Payment Actions

**Files:**
- Rewrite: `src/app/(admin)/admin/payments/actions.ts`

- [ ] **Implement `approvePaymentAction`**, `rejectPaymentAction`, `requestReuploadAction`, `addPaymentNoteAction`
