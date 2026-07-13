# Page Studio - Architectural Plan

## Overview

Page Studio is a new **independent visual page editor** for the FrameID admin panel. It enables administrators to edit platform pages (homepage, templates, pricing, login, signup, etc.) visually — exactly as visitors see them — without modifying React components directly.

---

## Core Principles

1. **Visual Editing First** — The editor shows the live page; editing happens inline.
2. **Source of Truth = Data Only** — Components remain static; only JSON/data changes.
3. **Single Source Per Page** — One canonical data file per page (no duplication).
4. **Non-Breaking** — Existing content system (`/admin/content`) continues working unchanged.
5. **Extensible** — New pages added via configuration, not code changes.
6. **Mobile-First** — Editor works on mobile admin view.
7. **Admin RBAC** — Uses existing admin permission system.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN SHELL                               │
│  (Sidebar, Topbar, Navigation, RBAC)                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PAGE STUDIO MODULE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Page Registry│  │ Data Source  │  │ Editor Core  │              │
│  │ (Definitions)│  │ Adapters     │  │ (Overlay)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
        │                │                    │
        ▼                ▼                    ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐
│ Page Config   │ │ Content       │ │ Visual Editor         │
│ - pageId      │ │ Adapters      │ │ - Live Preview        │
│ - label       │ │ - JSON File   │ │ - Inline Text Edit    │
│ - route       │ │ - Prisma DB   │ │ - Image Replace       │
│ - sections[]  │ │ - Future APIs │ │ - Section Panel       │
└───────────────┘ └───────────────┘ │ - Drag-Drop Reorder   │
                                    │ - Hidden Sections     │
                                    │ - Undo/Redo           │
                                    └───────────────────────┘
```

---

## 1. Page Registry (Page Definitions)

Each platform page is defined in a **Page Registry** — a single configuration file that declares:

```typescript
// src/modules/page-studio/registry.ts

export interface PageSectionDefinition {
  id: string;                    // Unique section ID (e.g., "hero", "benefits")
  label: string;                 // Display name (e.g., "الشريحة الرئيسية")
  description?: string;          // What this section does
  type: "static" | "dynamic";    // Static = fixed structure, Dynamic = list/array
  contentPath: string;           // JSON path in source data (e.g., "hero", "benefits")
  editableFields: EditableFieldDefinition[]; // Which fields are inline-editable
  sortable: boolean;             // Can be reordered
  hidable: boolean;              // Can be hidden/shown
  duplicatable: boolean;         // Can be duplicated
  removable: boolean;            // Can be deleted (soft-delete to hidden panel)
  defaultData?: Record<string, unknown>; // Default data for new instances
}

export interface PageDefinition {
  id: string;                    // Unique page ID (e.g., "marketing-homepage")
  label: string;                 // Display name (e.g., "الصفحة الرئيسية")
  description: string;
  route: string;                 // Public route (e.g., "/")
  previewRoute?: string;         // Optional preview route (e.g., "/?preview=1")
  sourceType: "json-file" | "prisma" | "api"; // Data source type
  sourceKey: string;             // Key to fetch data (e.g., "marketing/homepage")
  sections: PageSectionDefinition[];
  permissions: string[];         // Required admin permissions
}
```

### Phase 1: Homepage Definition

```typescript
export const HOMEPAGE_DEFINITION: PageDefinition = {
  id: "marketing-homepage",
  label: "الصفحة الرئيسية",
  description: "الصفحة الرئيسية لموقع FrameID التسويقي",
  route: "/",
  sourceType: "json-file",
  sourceKey: "marketing/homepage",
  permissions: ["content:edit", "page-studio:edit"],
  sections: [
    {
      id: "hero",
      label: "الشريحة الرئيسية (Hero)",
      description: "الشعار، العنوان، الصورة، وأزرار الإجراء",
      type: "static",
      contentPath: "hero",
      editableFields: [
        { path: "badge", type: "text", label: "الشارة" },
        { path: "headline", type: "text", label: "العنوان الرئيسي" },
        { path: "headlineHighlight", type: "text", label: "الجزء المبرز من العنوان" },
        { path: "subheadline", type: "textarea", label: "العنوان الفرعي" },
        { path: "heroImage", type: "image", label: "الصورة الرئيسية" },
        { path: "cta.label", type: "text", label: "نص الزر الرئيسي" },
        { path: "cta.href", type: "url", label: "رابط الزر الرئيسي" },
        { path: "secondaryCta.label", type: "text", label: "نص الزر الثانوي" },
        { path: "secondaryCta.href", type: "url", label: "رابط الزر الثانوي" },
      ],
      sortable: true,
      hidable: true,
      duplicatable: false,
      removable: true,
    },
    {
      id: "benefits",
      label: "المميزات (Benefits)",
      description: "بطاقات المميزات التسع",
      type: "dynamic",
      contentPath: "benefits",
      editableFields: [
        { path: "title", type: "text", label: "العنوان" },
        { path: "body", type: "textarea", label: "الوصف" },
      ],
      sortable: true,
      hidable: true,
      duplicatable: true,
      removable: true,
      defaultData: { title: "ميزة جديدة", body: "وصف الميزة" },
    },
    // ... howItWorks, templateSection, trustSection/faq, finalCta, mobileStickyCta
  ],
};
```

---

## 2. Data Source Adapters

Page Studio doesn't store data itself. It uses **adapters** to read/write to existing sources.

### Interface

```typescript
// src/modules/page-studio/adapters/source-adapter.ts

export interface PageDataSourceAdapter<TData = unknown> {
  // Read current page data
  getData(pageId: string): Promise<TData>;
  
  // Write updated page data (full replacement)
  saveData(pageId: string, data: TData, meta: SaveMeta): Promise<SaveResult>;
  
  // Get schema for validation (optional)
  getSchema?(pageId: string): ZodSchema<TData>;
  
  // Get current version/metadata
  getMetadata(pageId: string): Promise<{ version: number; updatedAt: string }>;
}

export interface SaveMeta {
  actorId: string;
  actorName: string;
  actorEmail: string;
  changeDescription?: string;
}

export interface SaveResult {
  success: boolean;
  version: number;
  commitId?: string;
  errors?: Array<{ path: string; message: string }>;
}
```

### JSON File Adapter (Phase 1 - Homepage)

```typescript
// src/modules/page-studio/adapters/json-file-adapter.ts

import { saveContent } from "@/lib/content";
import { getContent, ContentSchemas } from "@/lib/content";
import type { PageDataSourceAdapter } from "./source-adapter";

export function createJsonFileAdapter(): PageDataSourceAdapter {
  return {
    async getData(pageId) {
      // Map pageId to content schema key
      const schemaKey = pageId === "marketing-homepage" ? "marketing/homepage" : pageId;
      return getContent(schemaKey as keyof typeof ContentSchemas);
    },
    
    async saveData(pageId, data, meta) {
      const schemaKey = pageId === "marketing-homepage" ? "marketing/homepage" : pageId;
      const schema = ContentSchemas[schemaKey as keyof typeof ContentSchemas];
      if (!schema) throw new Error(`No schema for ${schemaKey}`);
      
      return saveContent(schemaKey, schema, data, { actor: meta });
    },
    
    async getMetadata(pageId) {
      const schemaKey = pageId === "marketing-homepage" ? "marketing/homepage" : pageId;
      const manifest = getManifest();
      const entry = manifest[schemaKey];
      return { version: entry?.version ?? 0, updatedAt: entry?.updatedAt ?? "" };
    }
  };
}
```

### Future: Prisma Adapter (for customer sites)

```typescript
// For tenant site editing (dashboard content)
export function createPrismaAdapter(prisma: PrismaClient): PageDataSourceAdapter {
  return {
    async getData(pageId) {
      // Fetch Site + Sections + Packages + Extras + Gallery
      // Transform to Page Studio data format
    },
    async saveData(pageId, data, meta) {
      // Write to SiteSection, Package, ExtraService, etc.
      // Create audit log
    }
  };
}
```

---

## 3. Visual Editor Core (Client-Side)

The editor runs in the browser and consists of:

### A. Page Preview (Iframe or Embedded Render)

```tsx
// src/components/page-studio/page-preview.tsx

"use client";

interface PagePreviewProps {
  pageUrl: string;           // e.g., "/" or "/?pageStudio=1"
  onSectionClick: (sectionId: string, element: HTMLElement) => void;
  onTextClick: (path: string, element: HTMLElement, currentValue: string) => void;
  onImageClick: (path: string, element: HTMLImageElement, currentSrc: string) => void;
}

export function PagePreview({ pageUrl, onSectionClick, onTextClick, onImageClick }: PagePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    // Inject editor script into iframe
    iframe.onload = () => {
      injectEditorScript(iframe.contentWindow!, {
        onSectionClick,
        onTextClick,
        onImageClick,
      });
    };
    
    iframe.src = pageUrl;
  }, [pageUrl]);
  
  if (!mounted) return <div className="aspect-video bg-gray-900 animate-pulse" />;
  
  return (
    <iframe
      ref={iframeRef}
      className="w-full aspect-video border-0 bg-white"
      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
    />
  );
}
```

### B. Injected Editor Script (Runs Inside Preview)

```typescript
// src/modules/page-studio/editor-script.ts
// This runs INSIDE the preview iframe

interface EditorScriptAPI {
  onSectionClick: (sectionId: string, rect: DOMRect) => void;
  onTextClick: (dataPath: string, rect: DOMRect, currentValue: string) => void;
  onImageClick: (dataPath: string, rect: DOMRect, currentSrc: string) => void;
}

export function injectEditorScript(window: Window, api: EditorScriptAPI) {
  // 1. Add data attributes to sections for identification
  document.querySelectorAll("[data-page-section]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const sectionId = el.getAttribute("data-page-section");
      api.onSectionClick(sectionId!, el.getBoundingClientRect());
    });
  });
  
  // 2. Make text elements editable on double-click
  document.querySelectorAll("[data-page-text]").forEach((el) => {
    el.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const path = el.getAttribute("data-page-text");
      api.onTextClick(path!, el.getBoundingClientRect(), el.textContent || "");
    });
  });
  
  // 3. Make images editable on click
  document.querySelectorAll("[data-page-image]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const path = el.getAttribute("data-page-image");
      api.onImageClick(path!, el.getBoundingClientRect(), (el as HTMLImageElement).src);
    });
  });
  
  // 4. Visual indicators (hover outlines)
  addEditorStyles();
}
```

### C. Editor Overlay (React Side)

```tsx
// src/components/page-studio/editor-overlay.tsx

interface EditorOverlayProps {
  selectedSection?: string;
  selectedTextPath?: string;
  selectedImagePath?: string;
  sections: SectionState[];
  onEditText: (path: string, value: string) => void;
  onReplaceImage: (path: string, newUrl: string) => void;
  onSectionAction: (sectionId: string, action: SectionAction) => void;
}

export function EditorOverlay({ ... }: EditorOverlayProps) {
  // Renders:
  // - Section outline highlights on hover
  // - Floating toolbar for selected section (show/hide/move/delete/duplicate/settings)
  // - Inline text editor popup
  // - Image replace dialog
  // - Hidden sections panel (sidebar)
  // - Drag-drop handle for reordering
}
```

---

## 4. Section State Management

```typescript
// src/modules/page-studio/types.ts

export interface SectionState {
  id: string;                    // Section definition ID
  definition: PageSectionDefinition;
  isVisible: boolean;
  sortOrder: number;
  data: Record<string, unknown>; // Current section data
  isHidden: boolean;             // In hidden panel
  originalIndex?: number;        // For restore from hidden
}

export interface PageEditorState {
  pageId: string;
  pageDefinition: PageDefinition;
  sections: SectionState[];      // Visible sections in order
  hiddenSections: SectionState[]; // Hidden sections (soft-deleted)
  data: Record<string, unknown>; // Full page data (source of truth)
  version: number;
  dirty: boolean;
  history: HistoryEntry[];       // For undo/redo
  historyIndex: number;
}
```

### State Operations

```typescript
// src/modules/page-studio/editor-state.ts

export function createEditorState(pageDef: PageDefinition, initialData: unknown): PageEditorState {
  const sections = pageDef.sections.map((def, index) => ({
    id: def.id,
    definition: def,
    isVisible: true,
    sortOrder: index,
    data: extractSectionData(initialData, def.contentPath),
    isHidden: false,
  }));
  
  return {
    pageId: pageDef.id,
    pageDefinition: pageDef,
    sections,
    hiddenSections: [],
    data: initialData as Record<string, unknown>,
    version: 0,
    dirty: false,
    history: [{ data: initialData, sections: [...sections] }],
    historyIndex: 0,
  };
}

// Actions
export function updateSectionData(state: PageEditorState, sectionId: string, path: string, value: unknown) { ... }
export function toggleSectionVisibility(state: PageEditorState, sectionId: string) { ... }
export function moveSection(state: PageEditorState, sectionId: string, newIndex: number) { ... }
export function duplicateSection(state: PageEditorState, sectionId: string) { ... }
export function deleteSection(state: PageEditorState, sectionId: string) { ... }
export function restoreSection(state: PageEditorState, sectionId: string) { ... }
export function reorderSections(state: PageEditorState, sectionIds: string[]) { ... }
export function undo(state: PageEditorState) { ... }
export function redo(state: PageEditorState) { ... }
```

---

## 5. Integration with Marketing Page Components

To enable visual editing, marketing page components need **data attributes** for the editor script to hook into.

### Required Changes to Components

```tsx
// Example: Hero section in homepage
// BEFORE:
<h1>{hero.headline}</h1>

// AFTER:
<h1 data-page-text="hero.headline">{hero.headline}</h1>

// Image:
<Image 
  src={hero.heroImage} 
  data-page-image="hero.heroImage"
  ...
/>

// Section wrapper:
<section data-page-section="hero" id="hero">
  ...
</section>
```

### Utility for Adding Attributes

```tsx
// src/components/page-studio/editable.tsx

export function withPageStudioAttributes<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  sectionId: string,
  fieldMap: Record<string, string> // propName -> dataPath
) {
  return function WithAttributes(props: T) {
    const enhancedProps = { ...props };
    
    // Add data-page-section to root element via wrapper
    // Add data-page-text/data-page-image to specific elements
    // This requires component cooperation or a wrapper pattern
  };
}
```

**Approach for Phase 1:** Modify the homepage components directly to add the required data attributes. This is a one-time change per page.

---

## 6. Admin Route Structure

```
/admin/page-studio                    # Page Studio dashboard (list of pages)
/admin/page-studio/[pageId]           # Visual editor for specific page
/admin/page-studio/[pageId]/settings  # Page-level settings (SEO, etc.)
```

### Navigation Integration

Add to `src/modules/admin/navigation.ts`:

```typescript
{
  id: "page-studio",
  title: "محرر الصفحات",
  shortDescription: "تحرير بصري للصفحات",
  description: "Page Studio - محرر بصري لجميع صفحات المنصة",
  accent: "violet",
  badge: "Studio",
  icon: Layout,
  links: [
    { href: "/admin/page-studio", label: "صفحات المنصة", icon: Layout },
    { href: "/admin/page-studio/marketing-homepage", label: "الصفحة الرئيسية", icon: Home },
    // Future pages added here
  ],
}
```

---

## 7. Save Flow with Git Sync

```
User clicks "Save" in Page Studio
         │
         ▼
Collect all section data → Reconstruct full page data object
         │
         ▼
Call adapter.saveData(pageId, data, { actor: currentAdmin })
         │
         ▼
JSON File Adapter → saveContent() → GitHub commit
         │
         ▼
Update manifest.json with new version
         │
         ▼
GitHub Actions deploy → Vercel preview → Production
         │
         ▼
Refresh preview iframe (or show "Changes deployed" toast)
```

---

## 8. Phase 1 Implementation Plan (Homepage Only)

### Week 1: Foundation
1. Create Page Studio module structure
2. Define `PageDefinition` types and homepage registry
3. Create JSON file adapter
4. Build admin route `/admin/page-studio/[pageId]`
5. Add to admin navigation

### Week 2: Visual Editor
1. Build `PagePreview` component (iframe-based)
2. Create editor script injection
3. Add data attributes to homepage components
4. Build `EditorOverlay` with section toolbar

### Week 3: Inline Editing
1. Text editing (double-click → inline input → save)
2. Image editing (click → media picker → replace)
3. Connect to adapter save flow

### Week 4: Section Management
1. Show/hide sections
2. Drag-drop reordering (using @dnd-kit)
3. Duplicate section
4. Delete → hidden panel
5. Restore from hidden panel

### Week 5: Polish & Safety
1. Undo/Redo (local history)
2. Dirty state tracking
3. Auto-save draft
4. Preview mode toggle
5. Mobile responsive editor
6. Accessibility (ARIA, keyboard nav)
7. Test end-to-end

---

## 9. File Structure

```
src/
├── modules/
│   └── page-studio/
│       ├── index.ts                    # Main exports
│       ├── types.ts                    # Core types
│       ├── registry.ts                 # Page definitions
│       ├── editor-state.ts             # State management
│       ├── adapters/
│       │   ├── source-adapter.ts       # Adapter interface
│       │   └── json-file-adapter.ts    # JSON file implementation
│       ├── editor-script.ts            # Injected script
│       └── utils/
│           ├── data-path.ts            # Path get/set utilities
│           └── section-utils.ts        # Section helpers
├── components/
│   └── page-studio/
│       ├── page-preview.tsx            # Iframe preview
│       ├── editor-overlay.tsx          # Overlay UI
│       ├── section-toolbar.tsx         # Section actions
│       ├── inline-text-editor.tsx      # Text edit popup
│       ├── image-replace-dialog.tsx    # Image picker
│       ├── hidden-sections-panel.tsx   # Hidden sections sidebar
│       ├── drag-drop-provider.tsx      # DnD context
│       └── page-studio-shell.tsx       # Main editor layout
├── app/
│   └── (admin)/
│       └── admin/
│           └── page-studio/
│               ├── page.tsx            # Dashboard
│               ├── [pageId]/
│               │   ├── page.tsx        # Editor page
│               │   └── actions.ts      # Server actions
│               └── layout.tsx          # Studio layout
└── lib/
    └── content/                        # Existing - used by adapter
```

---

## 10. Security & Permissions

- Reuse `requireAdminPermission("page-studio:edit")` 
- Validate all data paths against page definition
- Sanitize HTML in text fields (if rich text)
- Image uploads go through existing media pipeline
- Audit log via existing `saveContent` revision system

---

## 11. Future Extensibility

| Page | Source Type | Sections |
|------|-------------|----------|
| Homepage | JSON file | Hero, Benefits, HowItWorks, Templates, FAQ, CTA |
| Templates | JSON file | Hero, Filters, Grid, CTA |
| Pricing | JSON file | Hero, Plans, FAQ, CTA |
| Login | JSON file | Hero, Form, Help, Footer |
| Signup | JSON file | Hero, Form, Benefits, Footer |
| Checkout | JSON file | Hero, Summary, Form, Trust |
| Customer Dashboard | Prisma | Hero, Stats, Sites, Billing, Settings |
| Success/Error | JSON file | Hero, Message, Actions |

Each new page = one entry in `registry.ts` + data attributes in components.

---

## 12. Acceptance Criteria (Phase 1)

- [ ] Homepage renders in Page Studio exactly as visitors see it
- [ ] Double-click any text → inline editor → save → updates JSON + Git
- [ ] Click any image → media picker → replace → updates JSON + Git
- [ ] Section toolbar: show/hide, move up/down, drag-drop reorder, duplicate, delete
- [ ] Deleted sections go to "Hidden Sections" panel → can restore
- [ ] Drag-drop reordering works (not just buttons)
- [ ] Single source of truth: `/content/marketing/homepage.json`
- [ ] No React component modifications needed for content changes
- [ ] Admin RBAC enforced
- [ ] Mobile admin view works
- [ ] No regression in existing `/admin/content` system
- [ ] Performance: no full page reload on edits

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Iframe communication complexity | Use `postMessage` with strict origin check; fallback to same-origin embed |
| Data attribute maintenance burden | Automate with codemod; document pattern clearly |
| Git sync failures on save | Show clear error; keep local draft; retry button |
| Concurrent edits | Last-write-wins with version check; show conflict warning |
| Performance on large pages | Virtualize section list; lazy-load iframe; debounce saves |

---

*Document Version: 1.0*  
*Created: 2026-07-13*  
*Status: Ready for Implementation*