# Stage 03 Progress - Auth, Tenant, and Site Creation Foundation

## What Was Implemented

- Added signup validation with normalized email and strong password rules.
- Added password hashing and verification with Node `scrypt`.
- Added session token generation, hashing, cookie construction, and reusable session creation service.
- Added login validation and login service.
- Added Prisma-backed signup repository that provisions user, tenant, theme, template, site, default sections, and trial subscription in one transaction.
- Added Prisma-backed login repository.
- Added server actions for signup and login.
- Wired signup and login forms to server actions.
- Added `Session` and `PasswordResetToken` models to Prisma schema.
- Added Prisma client singleton.

## Changed Files

- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `src/modules/auth/signup-validation.ts`
- `src/modules/auth/password-hashing.ts`
- `src/modules/auth/session-tokens.ts`
- `src/modules/auth/session-service.ts`
- `src/modules/auth/login-validation.ts`
- `src/modules/auth/login-service.ts`
- `src/modules/auth/prisma-login-repository.ts`
- `src/modules/auth/auth-action-utils.ts`
- `src/modules/onboarding/signup-provisioning.ts`
- `src/modules/onboarding/prisma-signup-repository.ts`
- `src/modules/shared/date.ts`
- `src/app/(marketing)/signup/actions.ts`
- `src/app/(marketing)/signup/page.tsx`
- `src/app/(marketing)/login/actions.ts`
- `src/app/(marketing)/login/page.tsx`
- `tests/*auth*`
- `tests/*session*`
- `tests/*signup*`
- `tests/prisma-*.test.ts`

## Architecture Decisions

- Sessions are database-backed instead of stateless JWT-only cookies. This allows revocation, impersonation safety, auditability, and future device/session management.
- Signup provisioning is behind a repository interface. The core onboarding service does not know Prisma details.
- Prisma transaction is isolated inside the adapter. Business logic remains testable without a database.
- The theme/template records are upserted during provisioning from the theme registry so first signup can work even before manual admin seed scripts exist.
- Server actions are used for internal UI mutations instead of route handlers, matching Next.js App Router best practices.

## Improvements

- Passwords are never stored or compared as plaintext.
- The raw session token is only returned to the browser cookie; the database stores a hash.
- Signup and login error messages are mapped to safe user-facing Arabic messages.
- Signup now carries a selected template code through the form.
- Signup and login pages became dynamic only where needed.

## Problems Solved

- Missing persistent sessions.
- Missing password reset token model for future forgot-password flow.
- Missing transaction boundary for creating a complete trial account.
- Potential leakage of internal auth errors to users.
- Prisma `$transaction` overload mismatch solved inside the adapter boundary.

## Test Results

- `npm test`: passed, 30 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx prisma validate`: passed.
- `npm run build`: passed.

## Remaining Risks

- Signup can still hit a slug race under concurrent requests. The database unique constraint protects data, but the next hardening pass should add retry-on-conflict behavior.
- Forgot password UI exists only as a structure; token generation and email delivery are not implemented yet.
- Dashboard is not yet protected by session-aware data loading.

## Next Stage

Build session-aware dashboard foundation and replace static demo dashboard data with tenant/site data services.
