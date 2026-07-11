# Templates

## Goal

Provide reusable, versioned website designs while preserving customer-owned content and compatibility for existing sites.

## Components

- theme and template definitions;
- Template Content Source;
- template registry;
- starter content;
- renderers;
- database operational records;
- admin template management;
- site content snapshots.

## Data Flow

Platform template definitions are loaded and validated by the registry. During site provisioning, starter content is materialized into customer-owned PostgreSQL records. Runtime rendering resolves the site's stored template/theme contract and reads persisted customer content. Normal template switching changes presentation only; destructive content replacement requires an explicit snapshot-protected flow.

## Important Files

- `src/modules/themes/definitions`
- `src/modules/themes/theme-registry.ts`
- `src/modules/themes/template-starter-content.ts`
- `src/app/(admin)/admin/templates/`
- `prisma/schema.prisma`
- `docs/TEMPLATE_ARCHITECTURE.md`
- `docs/TEMPLATE_SPECIFICATION.md`

## Development Notes

Do not create a parallel template contract in PostgreSQL. Keep definitions, starter content, renderers, and versions compatible. Never reuse a template code for an incompatible design.
