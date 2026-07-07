# Content Studio — Phase 1 Design

**Date:** 2026-07-07
**Status:** Draft
**Author:** AI Architect

## Objective

Build the foundation for a file-based Content Studio that serves as the single source of truth for all FrameID platform content. Phase 1 covers the content infrastructure layer plus the Marketing Website editor.

## Principles

1. **File-based source of truth** — All platform content lives in `content/` as JSON files. The database is never the source of truth for platform content.
2. **Schema-first** — Every content file has a corresponding Zod schema. No unvalidated writes.
3. **Immutable history** — Every edit creates a backup. The manifest tracks all versions.
4. **No rebuild required** — Edits take effect immediately. The app reads files at request time.
5. **Git-ready** — All artifacts (content files + backups + manifest) are designed for future git sync.

## Content Directory Structure

```
content/
  manifest.json                       # Tracks every file: version, updatedAt
  marketing/
    homepage.json                     # Hero, subheadline, benefits, how-it-works, CTAs
    faq.json                          # FAQ items array
    navigation.json                   # Navigation links (with i18n-ready structure)
    footer.json                       # Footer content, links, social
  legal/
    privacy.json                      # Privacy policy sections
    terms.json                        # Terms & conditions sections
  seo/
    metadata.json                     # Default title, description, OG, Twitter
  settings/
    platform.json                     # Platform name, logo, accent color, brand text
  templates/
    registry.json                     # Template names, descriptions, preview images
  .backups/
    marketing/homepage/2026-07-07T12-00-00.json
    faq/2026-07-07T12-00-00.json
    ...
```

## File Format

Every content file follows this envelope:

```json
{
  "$schema": "marketing/homepage",
  "version": 1,
  "updatedAt": "2026-07-07T12:00:00.000Z",
  "data": {
    "hero": { ... },
    "benefits": [ ... ],
    ...
  }
}
```

- `$schema`: Identifies the content type (maps to Zod schema key).
- `version`: Incremented on every write. Used for diffing and future git sync.
- `updatedAt`: ISO timestamp of last write.
- `data`: The actual content payload, validated against the schema.

## Library Architecture: `src/lib/content/`

```
src/lib/content/
  types.ts           # All TypeScript types (inferred from Zod)
  schemas/
    marketing.ts     # Zod schemas for homepage, faq, nav, footer
    legal.ts         # Zod schemas for privacy, terms
    seo.ts           # Zod schemas for metadata
    settings.ts      # Zod schemas for platform settings
    templates.ts     # Zod schemas for template registry
    index.ts         # Aggregates all schemas
  loader.ts          # Reads and caches content files (React.cache)
  writer.ts          # Validates, backs up, writes content files
  backup.ts          # Backup file manager
  manifest.ts        # Manifest.json reader/writer
  errors.ts          # ContentValidationError, ContentNotFoundError
  index.ts           # Public API: getContent, saveContent, getManifest
  git.ts             # Git abstraction layer (placeholder for Phase 2 sync)
```

## Core API

### `getContent<T>(type: string): T`

- Reads `content/{type}.json`
- Caches per request via `React.cache()`
- Validates with Zod
- Returns typed data or throws `ContentNotFoundError`

### `saveContent(type: string, data: unknown): SaveResult`

1. Validate `data` against the Zod schema for `type`
2. If invalid → return `{ success: false, errors: ZodError[] }`
3. Read existing file (if any)
4. Backup: copy existing file to `content/.backups/{type}/{timestamp}.json`
5. Write new file with `version + 1` and fresh `updatedAt`
6. Update `manifest.json`
7. Clear the React.cache entry for this content type
8. Return `{ success: true, version: number }`

### `getManifest(): ContentManifest`

- Returns the full manifest with versions and timestamps for every content file.

## Admin UI Structure

```
src/app/(admin)/admin/content/
  page.tsx                     # Content Studio dashboard (overview + stats)
  layout.tsx                   # Content Studio layout (sidebar navigation)
  marketing/
    page.tsx                   # Marketing overview (list of editable sections)
    homepage/page.tsx          # Homepage editor (hero, benefits, how-it-works, CTAs)
    faq/page.tsx               # FAQ editor (add/remove/reorder questions)
    navigation/page.tsx        # Navigation editor
    footer/page.tsx            # Footer editor
  legal/
    page.tsx                   # Legal pages overview
    privacy/page.tsx           # Privacy policy editor (sections-based)
    terms/page.tsx             # Terms editor (sections-based)
  seo/
    page.tsx                   # SEO metadata editor
  settings/
    page.tsx                   # Platform settings editor
```

### Content Studio Layout

- Left sidebar with content type sections (Marketing, Legal, SEO, Settings)
- Active section indicator
- Breadcrumb navigation
- Currently editing indicator
- Save-all status bar at top

## Editor Components

```
src/components/content/
  content-form.tsx          # Form wrapper with auto-save
  text-field.tsx            # Text input with debounce (1.5s)
  textarea-field.tsx        # Multi-line text with debounce
  rich-text.tsx             # Rich text area (for legal pages)
  image-picker.tsx          # Image URL selector with preview
  array-editor.tsx          # Sortable array editor (for FAQ, benefits, steps)
  section-card.tsx          # Content section card (title, preview, edit button)
  save-status.tsx           # Save status indicator (idle/saving/saved/error)
  validation-error.tsx      # Validation error display
  content-sidebar.tsx       # Content metadata sidebar (version, updatedAt, backup)
  content-preview.tsx       # Preview panel (iframe or side-by-side)
```

## Editor UX

- **Auto-save**: Debounced 1.5 seconds after the user stops typing.
- **Save status**: Shows "تم الحفظ" / "جاري الحفظ..." / "خطأ في الحفظ" with color-coded badge.
- **Validation**: Inline error messages under each field. Save is blocked until valid.
- **Backup**: Every save creates a timestamped backup before overwriting.
- **Preview**: Side panel shows how the content will look on the live site.
- **Version info**: Each file shows version number and last updated time.

## Content Types (Phase 1)

### Marketing Homepage
```typescript
type HomepageContent = {
  hero: {
    badge: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    heroImage: string;
    cta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    trustPoints: { text: string }[];
  };
  benefits: {
    title: string;
    body: string;
  }[];
  howItWorks: {
    step: number;
    title: string;
    body: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  trustSection: {
    badge: string;
    title: string;
    message: string;
  };
  finalCta: {
    title: string;
    subtext: string;
    cta: { label: string; href: string };
  };
};
```

### Navigation
```typescript
type NavigationContent = {
  links: {
    label: string;
    href: string;
  }[];
  cta: { label: string; href: string };
};
```

### Footer
```typescript
type FooterContent = {
  description: string;
  quickLinks: { label: string; href: string }[];
  cta: { label: string; href: string };
  copyright: string;
};
```

## SEO Metadata
```typescript
type SEOContent = {
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  siteUrl: string;
  locale: string;
  openGraph: {
    title: string;
    description: string;
    siteName: string;
    images: { url: string; width: number; height: number; alt: string }[];
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
  };
};
```

## Legal Pages
```typescript
type LegalContent = {
  title: string;
  lastUpdated: string;
  sections: {
    title: string;
    body: string; // Markdown or plain text
  }[];
};
```

## Migration Strategy

1. Create `content/` directory with initial JSON files extracted from existing `platform-content.ts` and hardcoded page data
2. Build `src/lib/content/` library (types, schemas, loader, writer)
3. Build admin Content Studio shell + marketing editor
4. Refactor homepage (`page.tsx`) to read from `content-loader`
5. Refactor privacy/terms pages to read from `content-loader`
6. Keep old `platform-content.ts` in place but read from content files

## Git Readiness

- All content files are plain JSON in the project root
- Backups are timestamped, creating a natural audit trail
- `manifest.json` enables quick diff detection
- Future: Content Sync Engine can commit changes to a separate git branch
- The `git.ts` module will abstract git operations (stub for now)

## Future Phase Roadmap

- **Phase 2**: Legal + SEO + Platform Settings editors
- **Phase 3**: Templates + Media manager
- **Phase 4**: Emails + Notifications + Translation
- **Phase 5**: Editor Pro (undo/redo, diff, version browser, GitHub Sync)

## Forward Compatibility (Schema Evolution)

- Zod schemas use `.passthrough()` to preserve unknown keys in the JSON file.
- When a new field is added to the schema, existing files remain valid (they get the default or `undefined`).
- The `$schema` field in each file allows future schema migration logic.
- Never remove a field from a schema without a migration path.

## Key Design Decisions

1. **JSON over YAML/TS**: Easy to parse, write, validate. No extra dependencies.
2. **React.cache for reading**: Simplest caching strategy. No external cache needed.
3. **Zod over JSON Schema**: Type-safe, composable, native TypeScript integration.
4. **Backup-first writes**: Never overwrite without backing up. Safety net for content editors.
5. **Single `data` envelope**: The `version`/`updatedAt`/`$schema` metadata stays clean and separate from content data.
6. **No hot-reload needed**: File reads happen per-request. Edit a file and refresh to see changes.
