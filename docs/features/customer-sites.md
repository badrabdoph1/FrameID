# Customer Sites

## Goal

Provision, edit, publish, and render tenant-owned photographer websites while preserving customer content, publication state, domain resolution, and template compatibility.

## Components

- tenants and sites;
- slugs and verified domains;
- theme configuration;
- sections, contact profiles, packages, extras, galleries, and SEO settings;
- content snapshots;
- publishing state and public-site read models.

## Data Flow

Signup provisions a tenant and site, applies approved starter content, stores the selected template code/version, and publishes according to the onboarding workflow. Dashboard mutations update tenant-scoped normalized records. Public requests resolve a slug or verified domain, enforce site/lifecycle status, load the public read model, and render through the compatible template/theme renderer.

## Important Files

- site and provisioning modules under `src/modules/`
- customer dashboard and public routes under `src/app/`
- platform URL resolver
- `prisma/schema.prisma`
- `docs/DATA_FLOW.md`
- `docs/TEMPLATE_ARCHITECTURE.md`

## Development Notes

Preserve tenant scope and customer-owned content. Template switching must not silently replace content. Destructive replacement requires explicit intent and a content snapshot. Publishing, slug, domain, and lifecycle changes must remain coordinated and documented.
