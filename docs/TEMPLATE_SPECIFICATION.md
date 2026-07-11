# Template Specification

Every FrameID template must satisfy this contract.

## Identity

- Stable unique `code`.
- Human-readable `name`.
- Existing `themeCode`.
- Explicit `version`.
- Status: draft, published, or archived.
- Deterministic showroom order.
- Description and complete starter content.

## Theme contract

A theme definition must provide:

- stable code and version;
- supported section types;
- default configuration;
- a content schema compatible with the renderer.

A template must not reference unsupported sections or fields that its renderer ignores.

## Starter content

Starter content must be valid, non-sensitive example content that can be materialized into normalized site data. It should cover the intended first-run experience without pretending that example data is customer-completed work.

Typical content areas include:

- hero/identity text;
- sections and visibility/order;
- packages and features;
- extra services;
- contact/social placeholders;
- gallery examples or empty-state guidance;
- theme configuration.

## Preview/settings data

- Must be JSON-serializable.
- Must remain compatible with structured admin forms.
- Must preserve unrelated compatible fields during partial updates.
- Image overrides use internally generated URLs after upload.
- Default-image restoration removes the override rather than writing a fake path.

## Publishing rules

A template is showroom-visible only when its effective status is published. Publishing must not bypass registry validation, theme existence, starter-content validation, or renderer compatibility.

## Compatibility

- Template code is immutable after use by customer sites.
- Version changes must follow the versioning rules in `TEMPLATE_ARCHITECTURE.md`.
- Existing sites using older versions must render or receive a documented migration.
- Removing fields requires fallback behavior or migration.
- Adding required fields requires defaults for historic data.

## Quality requirements

- Responsive desktop/mobile rendering.
- No client-visible raw JSON or storage paths.
- Accessible semantic structure and meaningful image alt text where data exists.
- No hard-coded customer identity in the renderer.
- Public rendering must use persisted site content, not admin preview state.
- Tests must cover registry validity and any new transformation or compatibility rule.

## Documentation requirement

Any change to this specification must update `TEMPLATE_ARCHITECTURE.md`, `CREATE_NEW_TEMPLATE.md` when procedure changes, and `CHANGELOG.md`.