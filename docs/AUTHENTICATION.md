# Authentication

## Scope

FrameID has customer authentication for the main application and a separate admin access path. Authentication proves identity; authorization is enforced separately through tenant boundaries and admin RBAC.

## Customer sessions

The customer session cookie is named `frameid_session`.

- Raw tokens are generated with 32 cryptographically random bytes and encoded as base64url.
- Only the SHA-256 hash is persisted in the `Session.tokenHash` column.
- The raw token is stored only in the browser cookie.
- Default session lifetime is 30 days.
- Cookies are HTTP-only, `SameSite=Lax`, scoped to `/`, and secure in production.

The raw token must never be logged, stored in application JSON, exposed to client JavaScript, or placed in URLs.

## Session resolution

`getCurrentRequestSession()` performs the authenticated customer request flow:

1. Read the `frameid_session` cookie.
2. Hash and resolve it through the current-session repository.
3. Reject missing, expired, revoked, deleted, or otherwise invalid context.
4. Load the associated user, tenant, site, subscription, and request context.
5. Synchronize customer lifecycle state.
6. If lifecycle synchronization expires a trial or subscription, re-read the session context before returning it.

`getCurrentRequestUserSession()` provides the user-level session variant for flows that do not require the complete tenant/site context.

## Login

A login flow must:

- normalize and validate the identifier;
- verify the stored password hash using the established password service;
- reject soft-deleted or unauthorized accounts;
- create a new database session with expiry and request metadata;
- set the secure session cookie;
- avoid revealing whether a specific account exists through unsafe error differences.

## Signup

Signup is an authentication and provisioning transaction, not only a user insert.

It validates identity data, checks identifier/slug availability, reads current admin lifecycle settings, and provisions the user, tenant, trial subscription, site, selected theme/template content, and initial session. Trial dates must derive from one timestamp and the configured trial duration.

## Logout and revocation

Logout must revoke/delete the server-side session as defined by the current session service and clear the browser cookie. Clearing only the cookie is insufficient for security-sensitive revocation.

Administrative or security workflows may revoke sessions through server-side session state. Revoked sessions must never be accepted even if their cookie has not expired.

## Password reset

`PasswordResetToken` rows are hashed, expiring, and single-use. Password recovery must:

- generate an unpredictable raw token;
- persist only its hash;
- apply expiry and used-at checks;
- invalidate or revoke appropriate existing sessions after a successful reset according to current policy;
- avoid account enumeration in the request response;
- send the raw token only through the approved recovery channel.

## Admin authentication

Admin pages resolve the current admin independently and redirect unauthenticated access to `/admin/login`. After authentication, every admin center/action is authorized through the central permission matrix and server-side guards.

Being authenticated as a user does not imply admin authorization. UI visibility is never sufficient authorization.

## Tenant isolation

After authentication, every customer read or mutation must remain scoped to the authenticated tenant and site. IDs supplied by the client must be verified against that scope before access.

## Sensitive data rules

Never expose or log:

- raw session tokens;
- password hashes;
- raw password reset tokens;
- session/admin secrets;
- database credentials;
- private provider credentials.

Use generic user-facing authentication errors and structured internal diagnostics without secrets.

## Security change checklist

Changes to login, signup, cookies, session duration, token hashing, reset, revocation, admin login, or lifecycle/session interaction require:

- threat and backward-compatibility review;
- tests for success, expiry, revocation, and forbidden access;
- updates to this document and `DATA_FLOW.md`;
- a `CHANGELOG.md` entry;
- typecheck, lint, tests, and production build.