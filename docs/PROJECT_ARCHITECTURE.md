# FrameID project architecture

## Platform source of truth

The Git repository is the source of truth for:

- application code;
- templates and themes;
- platform-owned public content;
- platform pages and documentation;
- repository-managed configuration.

Changes to these assets follow the Git workflow: admin or developer change, commit, push, and deployment.

## Customer data source of truth

PostgreSQL and uploaded files are the source of truth for:

- accounts and customers;
- customer sites and site configuration;
- subscriptions, packages, orders, payments, and messages;
- customer media and uploaded files;
- operational records and audit data.

Customer data is not stored permanently in the platform Git branch.

## Backup architecture

GitHub backup branches are the official external backup store.

The official pipeline is:

1. Build the local artifact.
2. Generate manifest and checksums.
3. Verify locally.
4. Upload to GitHub.
5. Verify the GitHub copy.
6. Persist remote metadata.
7. Mark the job completed.

Restore uses the local artifact when present and verified. Otherwise it downloads the artifact from GitHub, verifies it, and restores it.

Retention policy:

- 20 database backups;
- 10 full backups.

A full migration combines the Git repository for platform code/content with a verified `FULL` backup for PostgreSQL customer data and uploads.

Legacy local-only snapshots and automatic restore paths are disabled and are not part of the production disaster-recovery architecture.

Platform-managed configuration is versioned under `content/` and platform assets under `public/platform/`. Admin mutations create Git commits and revision entries; PostgreSQL rows for plans, themes, templates, payment configuration, and platform flags are runtime mirrors rebuilt by the production seed. Customer records and `public/uploads` never become source files.
