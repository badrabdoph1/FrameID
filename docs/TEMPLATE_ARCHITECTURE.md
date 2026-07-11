# Template Architecture

## Responsibility

This file describes the current template system. Decision rationale belongs in `ARCHITECTURE_DECISIONS.md`; the required template contract belongs in `TEMPLATE_SPECIFICATION.md`; the creation workflow belongs in `CREATE_NEW_TEMPLATE.md`.

## Purpose

FrameID separates platform-owned template contracts, admin-managed operational state, and customer-owned site content.

## Sources and responsibilities

### Template Content Source and code-defined registry

The Git-versioned Template Content Source is the single authoritative source for platform template content and executable compatibility. It includes theme/template definitions, starter content, supported sections, default configuration, versions, and renderer expectations.

The registry validates:

- unique theme codes;
- unique template codes;
- every template references an existing theme;
- every template includes starter content;
- published templates are returned in showroom order.

No admin form, database JSON field, preview object, or client component may create a second independent template contract.

### Database `Theme` and `Template`

Database records provide operational state and supported overrides:

- status: draft, published, archived;
- version metadata;
- showroom order;
- preview data and settings constrained by the code-defined contract;
- optional cover asset reference;
- relation to the owning theme.

Admin changes must remain compatible with the Template Content Source and an available renderer.

### Customer site content

When a customer selects a template during initial provisioning, starter content is materialized into tenant-scoped normalized site records such as sections, packages, extras, contact data, galleries, media references, and theme configuration. The site stores `templateCode` and `templateVersion` for compatibility and diagnostics.

After creation, normalized site content is customer-owned data in PostgreSQL. It is not a live copy of starter content.

## Initial provisioning flow

1. Resolve the selected published template from the Template Content Source and allowed operational state.
2. Validate its theme, starter content, and renderer contract.
3. Create the tenant and site records.
4. Materialize starter content into normalized customer tables.
5. Persist `templateCode` and `templateVersion`.
6. Publish according to the signup/publishing workflow.

## Template switching after site creation

A normal template change changes the design contract, renderer/theme configuration, and compatible visual behavior only. It must preserve the customer's normalized content.

It must not silently replace:

- contact/profile data;
- packages or extra services;
- gallery content;
- customer-written sections;
- uploaded media;
- SEO or operational data.

When the target template requires mapping, the switching service must adapt existing normalized content or provide a compatibility path. Applying starter/demo content again is not part of a normal template switch.

## Explicit content replacement

Any workflow that deliberately replaces or resets persisted site content is separate from normal template switching.

Before replacement, the system must create a `SiteContentSnapshot` containing the recoverable site state, reason, template code/version, and timestamp. Replacement must be explicit, authorized, auditable, and recoverable.

## Rendering path

1. Resolve the public site by slug or verified domain.
2. Check publication and lifecycle access.
3. Load theme configuration and normalized customer content.
4. Resolve the renderer compatible with the site's theme/template contract.
5. Render sections in supported order using persisted visibility and content.
6. Use safe media asset URLs referenced by tenant-owned records.

## Versioning

Template versions follow semantic intent:

- patch: compatible visual/content default correction;
- minor: additive compatible capability;
- major: contract change that may require migration or legacy rendering support.

Changing platform starter content or a template definition does not automatically rewrite existing customer content. Existing sites must keep working through persisted normalized data, template code/version, snapshots, defaults, compatibility adapters, or migration logic.

## Admin template management

The admin template center supports creation, editing of supported operational fields, duplication, restoring defaults, previewing, publishing/unpublishing, archiving, ordering, and device-based image management.

Admin operations must:

- respect the code-defined template contract;
- enforce RBAC server-side;
- record audit information for sensitive changes;
- revalidate showroom, preview, and public surfaces where required;
- avoid raw JSON as the normal editing interface;
- preserve unknown compatible fields when structured data is updated.

## Media in templates

Template cover, hero, and package images are uploaded from the device through the approved media pipeline. Server validation checks declared MIME type, size, and binary signature. Stored URLs are output values; users are not asked to type storage paths or internal URLs.

Binary image storage may use an approved provider, while ownership and metadata remain governed by PostgreSQL records or the platform template contract, according to whether the image is customer-owned or platform-owned.

## Compatibility safeguards

- Never reuse a template code for an incompatible template.
- Never remove a renderer used by existing sites without migration or legacy support.
- Preserve unknown compatible fields when updating structured JSON.
- Restore defaults by removing supported overrides, not by destroying unrelated data.
- Maintain starter content, template specification, and renderer schema together.
- Never overwrite customer content during a normal design/template switch.
- Create a snapshot before explicit destructive content replacement.
- Update template documentation, ADRs when decisions change, and changelog in the same commit as contract changes.