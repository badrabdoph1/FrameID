# Create a New Template

Follow this procedure. Do not create a second template registry or bypass the existing renderer architecture.

## 1. Read first

- `AI_DEVELOPMENT_RULES.md`
- `TEMPLATE_ARCHITECTURE.md`
- `TEMPLATE_SPECIFICATION.md`
- the current theme definitions, starter-content types, registry, seed, renderer, and admin template code.

## 2. Choose identity

- Select a unique, permanent template code.
- Reuse an existing theme when its section/config contract is sufficient.
- Add a new theme only when a genuinely different renderer/config contract is required.
- Select an initial semantic version, normally `1.0.0`.

## 3. Define executable contract

Add the template to the existing code-defined definitions with:

- code, name, theme code, status and showroom order;
- description;
- complete starter content matching the established type;
- only sections supported by the theme.

The registry must still pass uniqueness, theme-reference, and starter-content validation.

## 4. Implement or reuse rendering

- Reuse the theme renderer when possible.
- When a new renderer is necessary, keep it data-driven and free from customer-specific hard coding.
- Support mobile and desktop.
- Read normalized public-site content and theme config.
- Provide safe fallbacks for missing historic fields.

## 5. Seed/admin integration

Ensure the seed/admin synchronization creates or updates the database `Theme` and `Template` records without duplicating source ownership. Admin preview/edit fields must map to the same established contract.

## 6. Media

Use device upload through the existing validated media pipeline. Do not add text inputs asking for URLs or file-system paths. Preserve existing images if replacement upload fails.

## 7. Provisioning

Verify that signup/template selection materializes starter content into the correct normalized site records and stores `templateCode` plus `templateVersion`.

## 8. Testing

At minimum test:

- registry accepts the new definition;
- code/theme references are unique and valid;
- starter content can be provisioned;
- renderer handles defaults and missing optional data;
- admin preview works;
- public route renders on mobile/desktop;
- old templates/sites remain unaffected.

Run typecheck, lint, relevant tests, and production build.

## 9. Documentation and changelog

In the same commit:

- update `TEMPLATE_ARCHITECTURE.md` if architecture changed;
- update `TEMPLATE_SPECIFICATION.md` if the contract changed;
- update this procedure if steps changed;
- append a `CHANGELOG.md` entry with compatibility and migration status.

## 10. Release

Publish the database template only after renderer, starter content, preview, media, compatibility, tests, and documentation are complete. Never repurpose an existing template code for a new incompatible design.