# Template Architecture

## Purpose

FrameID separates executable theme/template contracts from admin-managed template records and customer site content.

## Sources and responsibilities

### Code-defined theme/template registry

The theme registry loads theme and template definitions and validates:

- unique theme codes;
- unique template codes;
- every template references an existing theme;
- every template includes starter content;
- published templates are returned in showroom order.

This registry is the executable compatibility source for supported sections, default configuration, starter content, and renderer expectations.

### Database `Theme` and `Template`

Database records provide operational state:

- status: draft, published, archived;
- version;
- showroom order;
- preview data and settings;
- optional cover asset reference;
- relation to the owning theme.

Admin changes must not create a contract that the code renderer cannot understand.

### Customer site content

When a customer selects a template, starter content is materialized into normalized site records such as sections, packages, extras, contact data, galleries, media references, and theme configuration. The site stores `templateCode` and `templateVersion` for compatibility and diagnostics.

## Rendering path

1. Resolve the public site by slug or verified domain.
2. Check publication and lifecycle access.
3. Load theme configuration and normalized content.
4. Resolve the renderer compatible with the site's theme/template contract.
5. Render sections in supported order using persisted visibility and content.
6. Use media asset URLs referenced by domain records.

## Versioning

Template versions follow semantic intent:

- patch: compatible visual/content default correction;
- minor: additive compatible capability;
- major: contract change that may require migration or legacy rendering support.

Changing a template definition does not automatically rewrite existing customer content. Existing sites must keep working through persisted normalized data, template code/version, snapshots, defaults, or migration logic.

## Admin template management

The admin template center supports creation, editing, duplication, restoring defaults, previewing, publishing/unpublishing, archiving, ordering, and device-based image management. Sensitive changes should create audit records and revalidate showroom/preview/public surfaces.

Raw JSON is not the normal editing interface. Structured forms must map to the established preview/settings contract.

## Media in templates

Template cover, hero, and package images are uploaded from the device. Server validation checks MIME type, size, and binary signature. Stored URLs are internal output values; users are not asked to type storage paths.

## Compatibility safeguards

- Never reuse a template code for an incompatible template.
- Never remove a renderer used by existing sites without migration or legacy support.
- Preserve unknown compatible fields when updating structured JSON.
- Restore defaults by removing overrides, not by destroying unrelated data.
- Maintain starter content and renderer schema together.
- Update template documentation and changelog in the same commit as contract changes.