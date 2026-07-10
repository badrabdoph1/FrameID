# FrameID engineering audit — 2026-07-10

## Working prompt

Perform a defensive infrastructure and deployment audit for FrameID before future production changes. Prioritize issues that could cause data loss, deployment failure, runtime crashes, broken backups, missing environment configuration, or unsafe operational behavior. Work on a separate branch, keep `main` clean, and merge only after the changes are internally consistent.

## Scope checked

- Package scripts and deployment lifecycle.
- Railway deployment configuration.
- Prisma database push behavior.
- Environment validation.
- Runtime healthcheck behavior.
- Backup and restore infrastructure.
- Current build warnings from the latest successful deployment logs.

## Critical findings

### 1. Automatic data-loss risk in deployment scripts

`npm run start` and `npm run db:deploy` previously used:

```bash
prisma db push --accept-data-loss
```

This is unsafe for production because future schema changes could silently drop columns with real data during a deployment or restart.

**Fix:**

- `start` now runs only `next start`.
- Railway keeps database sync in `preDeployCommand` through `npm run db:deploy`.
- `db:deploy` now maps to a safe deployment command without `--accept-data-loss`.
- A deliberately named `db:deploy:dangerous` script remains available for manual local/dev use only.

### 2. Railway runtime should fail safely on destructive Prisma changes

The last successful deployment showed Prisma warnings about columns that would be dropped. The deployment completed, but keeping `--accept-data-loss` in the automatic path would make future accidental data loss more likely.

**Fix:**

Railway deployment now keeps `preDeployCommand`, but it runs the safe script. If a future schema change requires destructive changes, deployment should fail instead of deleting data silently.

### 3. Healthcheck timeout and restart policy were too narrow

The existing healthcheck was enabled but had a short timeout and fewer retries.

**Fix:**

- Increased healthcheck timeout to 300 seconds.
- Increased restart retries to 10.
- Kept `/api/health` as the healthcheck path.

### 4. Environment validation was too shallow

The previous environment validator only checked whether required variables existed.

**Fix:**

Environment validation now checks:

- `DATABASE_URL` exists and is a PostgreSQL URL.
- `SESSION_SECRET` exists and is at least 32 characters.
- `NEXT_PUBLIC_APP_URL` exists and is an absolute URL.
- Optional SMTP and super-admin phone seed groups are warned about if partially configured.

### 5. Backup database dump used shell command interpolation

The database backup dumper built shell commands with `exec`, including values derived from the database URL. Even though the URL is environment-controlled, this is less safe and less reliable than argument-based execution.

**Fix:**

- Replaced shell-string `exec` usage with `spawn` / `execFile`.
- Removed shell `wc -c` usage and reads dump file size through Node `stat`.
- Prevented accidental leaking of the full `DATABASE_URL` in invalid URL errors.

## Known remaining non-blocking observations

These are not deployment blockers, but should be handled in a later cleanup PR if the goal is a completely warning-free build:

- Some admin UI pages still have minor unused import/variable warnings.
- One admin templates page uses `<img>` instead of `next/image`; this is a performance warning, not a deploy error.
- Nixpacks/Railway may still print Docker ARG/ENV secret warnings because it generates the Dockerfile from Railway environment variables. This is controlled mostly by Railway/Nixpacks configuration rather than application code.

## Recommended verification commands

```bash
npm run validate:env
npm run typecheck
npm run lint
npm run test
npm run build
```

For Railway, verify:

```bash
npm run db:deploy
npm run start
```

`db:deploy` should now fail safely if a future schema change would cause data loss.
