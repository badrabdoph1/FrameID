# Authentication

## Goal

Authenticate customers and administrators, issue revocable sessions, and protect tenant/admin operations through server-side identity resolution and authorization.

## Components

- users;
- sessions;
- password reset tokens;
- secure session cookies;
- current-session repositories and services;
- admin page guards and RBAC.

## Data Flow

Login verifies credentials, creates a random raw session token, stores only its hash, and sends the raw value in an HTTP-only cookie. Each protected request resolves the cookie, hashes it, loads the session and user, checks expiration/revocation, and applies tenant or admin authorization. Logout revokes or removes the session and clears the cookie.

## Important Files

- `src/modules/auth/`
- `src/modules/admin/admin-page-guards.ts`
- `src/modules/admin/admin-rbac.ts`
- protected routes under `src/app/`
- `prisma/schema.prisma`
- `docs/AUTHENTICATION.md`

## Development Notes

Keep credentials, raw tokens, and privileged checks server-side. UI visibility is not authorization. Any change to cookie policy, session lifetime, reset flow, admin roles, or identity resolution must update the detailed authentication and security documentation.
