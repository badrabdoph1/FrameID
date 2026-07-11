# Media

## Goal

Provide one validated upload and persistence pipeline for customer and platform images while keeping binary storage separate from business ownership metadata.

## Components

- upload validation;
- MIME, size, and binary-signature checks;
- storage adapters/providers;
- `MediaAsset` metadata;
- tenant ownership;
- template, profile, gallery, SEO, payment, and social-image references.

## Data Flow

A device upload reaches a server-side action or route, is validated against declared type and binary signature, receives a unique safe storage key, is written through the configured storage boundary, and creates or updates PostgreSQL metadata. Domain records reference the resulting asset rather than storing raw file paths entered by users.

## Important Files

- `src/modules/media/`
- upload components/actions under `src/app/` and `src/components/`
- `public/uploads/` for local storage where configured
- `prisma/schema.prisma`
- `docs/PROJECT_CONVENTIONS.md`

## Development Notes

Do not accept user-entered internal paths as an upload workflow. Keep validation server-side, scope customer media to its tenant, avoid duplicate upload logic, and document any provider, limit, format, or ownership change.
