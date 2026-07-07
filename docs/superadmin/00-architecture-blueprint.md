# Super Admin Console — Architecture Blueprint

> **Version:** 1.0
> **Last Updated:** 2026-07-07
> **Status:** Blueprint — Ready for Implementation

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Navigation & Centers](#4-navigation--centers)
5. [Design System](#5-design-system)
6. [Data Flow & State Management](#6-data-flow--state-management)
7. [RBAC & Authorization](#7-rbac--authorization)
8. [Global Features](#8-global-features)
9. [Content Management Philosophy](#9-content-management-philosophy)
10. [Implementation Phases](#10-implementation-phases)
11. [Success Criteria](#11-success-criteria)

---

## 1. Design Philosophy

### Core Principles

1. **Product, not a page** — The admin console is an independent product with its own UX standards, not a collection of CRUD pages bolted onto the marketing site.
2. **Everything is a Center** — Every domain (customers, payments, themes, content) is a self-contained "Center" with its own workspace, actions, and views.
3. **Command over browsing** — The Command Palette (`Cmd+K`) is the primary way to navigate and act. Sidebar is secondary.
4. **Mobile-first, seriously** — The admin works on a phone. Different layout, same power.
5. **100% control from UI** — If something can't be changed from the admin, it's an architectural defect.
6. **Arabic-first (RTL)** — All layouts, components, and content are designed for RTL first. LTR is a future concern.

### Visual Identity (FrameID Admin)

| Token | Value |
|-------|-------|
| Background | `#070707` (ink) |
| Surface | `#0f0f0f` or `rgba(255,255,255,0.06)` |
| Border | `rgba(255,255,255,0.1)` |
| Accent | `#d8b46a` (champagne) |
| Text Primary | `#ffffff` |
| Text Secondary | `rgba(255,255,255,0.64)` |
| Radius | `0.5rem` (controls), `0.75rem` (panels) |
| Font | Tajawal (Arabic) + system sans |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Super Admin Console                       │
├─────────────────────────────────────────────────────────────┤
│  Layout Layer                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AdminShell (header + sidebar + command palette)      │   │
│  │ ├── GlobalSearch (Cmd+K)                             │   │
│  │ ├── QuickActions                                     │   │
│  │ ├── Breadcrumbs                                      │   │
│  │ └── Workspace (main content area)                    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Centers (Feature Modules)                                   │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐ │
│  │Dashboard │Customers │Sites │Templates │Content │Media │...│ │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘ │
├─────────────────────────────────────────────────────────────┤
│  Design System Layer                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DataTable, Modal, CommandPalette, Toast, Charts,    │   │
│  │ Timeline, ActivityFeed, InlineEdit, FormBuilder     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Services → Repositories → Prisma → PostgreSQL       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Route Structure

```
/(super-admin)/admin/
├── page.tsx                          ← Dashboard (redirect from /admin)
├── layout.tsx                        ← AdminShell wrapper
│
├── customers/
│   ├── page.tsx                      ← Customer list
│   └── [id]/
│       └── page.tsx                  ← Customer detail / workspace
│
├── sites/
│   ├── page.tsx                      ← Site list
│   └── [slug]/
│       └── page.tsx                  ← Site detail
│
├── templates/
│   ├── page.tsx                      ← Template gallery
│   └── [code]/
│       └── page.tsx                  ← Template editor
│
├── themes/
│   ├── page.tsx                      ← Theme registry
│   └── [code]/
│       └── page.tsx                  ← Theme editor
│
├── content/                          ← Platform-wide content management
│   ├── page.tsx                      ← Content overview
│   ├── pages/
│   │   └── [slug]/page.tsx           ← Individual page editor (hero, footer, etc.)
│   ├── navigation/page.tsx           ← Navigation builder
│   ├── banners/page.tsx              ← Banners & announcements
│   └── legal/page.tsx                ← Legal pages (privacy, terms)
│
├── media/
│   ├── page.tsx                      ← Media library
│   └── [id]/page.tsx                 ← Media detail / usage
│
├── marketing/
│   ├── page.tsx                      ← Marketing overview
│   ├── campaigns/page.tsx
│   ├── coupons/page.tsx
│   └── seo/page.tsx                  ← SEO center (platform-wide)
│
├── subscriptions/
│   ├── page.tsx                      ← Subscription list
│   └── [id]/page.tsx
│
├── payments/
│   ├── page.tsx                      ← Payment requests
│   └── [id]/page.tsx
│
├── backups/
│   ├── page.tsx                      ← Backup center
│   └── [id]/page.tsx                 ← Backup detail
│
├── notifications/
│   ├── page.tsx                      ← Send / manage notifications
│   └── templates/page.tsx            ← Notification templates
│
├── analytics/
│   └── page.tsx                      ← Platform analytics
│
├── security/
│   ├── page.tsx                      ← Security dashboard
│   ├── sessions/page.tsx             ← Active sessions
│   ├── audit/page.tsx                ← Audit log
│   └── roles/page.tsx                ← Role & permission management
│
├── feature-flags/
│   └── page.tsx                      ← Feature flag management
│
├── support/
│   ├── page.tsx                      ← Support tickets
│   └── [id]/page.tsx                 ← Ticket detail
│
├── settings/
│   ├── page.tsx                      ← Platform settings
│   ├── general/page.tsx              ← General settings
│   ├── branding/page.tsx             ← Branding (logo, colors, etc.)
│   ├── integrations/page.tsx         ← Integrations
│   └── team/page.tsx                 ← Admin team management
│
└── search/
    └── page.tsx                      ← Global search results (if not using palette)
```

---

## 3. Directory Structure

```
src/
├── app/
│   └── (super-admin)/
│       ├── admin/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── ... (all center routes)
│       └── admin.css                  ← Admin-specific styles
│
├── components/
│   ├── admin/                          ← Admin-specific components
│   │   ├── layout/
│   │   │   ├── admin-shell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── workspace.tsx
│   │   ├── command-palette/
│   │   │   ├── command-palette.tsx
│   │   │   └── search-results.tsx
│   │   ├── centers/
│   │   │   ├── center-page-shell.tsx   ← Wrapper for each center page
│   │   │   ├── center-header.tsx
│   │   │   └── center-actions.tsx
│   │   ├── customers/
│   │   ├── sites/
│   │   ├── content/
│   │   ├── media/
│   │   └── ...
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── stat-card.tsx
│   │       ├── timeline.tsx
│   │       ├── activity-feed.tsx
│   │       └── ...
│   │
│   └── ui/                            ← Core design system (shared with rest of app)
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── modal.tsx
│       ├── dropdown-menu.tsx
│       ├── tabs.tsx
│       ├── switch.tsx
│       ├── skeleton.tsx
│       ├── toast.tsx
│       ├── avatar.tsx
│       ├── breadcrumb.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── pagination.tsx
│       ├── tooltip.tsx
│       └── alert.tsx
│
├── modules/
│   ├── admin/                          ← Admin business logic (rebuilt)
│   │   ├── layout/
│   │   │   ├── navigation.ts          ← Navigation data & config
│   │   │   ├── search.ts              ← Global search logic
│   │   │   └── quick-actions.ts       ← Quick action definitions
│   │   ├── customers/
│   │   ├── sites/
│   │   ├── content/
│   │   ├── media/
│   │   └── ...
│   │   ├── permissions/
│   │   │   ├── roles.ts               ← Role definitions
│   │   │   ├── permissions.ts         ← Permission checks
│   │   │   └── guards.ts              ← Route protection
│   │   ├── settings/
│   │   │   ├── platform-settings.ts   ← Platform configuration CRUD
│   │   │   └── admin-team.ts          ← Admin user management
│   │   └── shared/
│   │       ├── admin-repository.ts    ← Base admin repository
│   │       └── admin-service.ts       ← Base admin service
│   │
│   └── ... (existing modules remain)
│
└── lib/
    └── admin/                          ← Admin utilities
        ├── format.ts                   ← Number/date formatting
        ├── permissions.ts              ← Permission helpers
        └── constants.ts                ← Admin constants
```

---

## 4. Navigation & Centers

### Primary Navigation (Sidebar)

The sidebar is organized into logical groups. Each group collapses/expands.

```
┌─────────────────────┐
│  FrameID Admin      │  ← Logo + platform name
├─────────────────────┤
│  ⌘K  بحث سريع...    │  ← Command palette trigger
├─────────────────────┤
│                     │
│  ◉  القيادة          │  ← Dashboard (always visible)
│                     │
│  ── التشغيل ──      │  ← Group
│  ▣  العملاء          │  ← Customer Center
│  ◧  المواقع          │  ← Sites Center
│  ⚙  الإشتراكات      │  ← Subscription Center
│  ₳  المدفوعات       │  ← Payments Center
│                     │
│  ── المحتوى ──      │
│  ✎  المحتوى          │  ← Content Center
│  🖼  الوسائط          │  ← Media Center
│  ▣  القوالب          │  ← Templates Center
│  ◈  السمات           │  ← Theme Engine Center
│                     │
│  ── التسويق ──      │
│  ◉  الحملات          │  ← Marketing Center
│  🔍  تحسين البحث     │  ← SEO Center
│                     │
│  ── المنصة ──       │
│  △  الميزات          │  ← Feature Flags
│  ☰  النسخ           │  ← Backup Center
│  ⚡  التحليلات       │  ← Analytics
│  🛡  الأمان          │  ← Security Center
│  ▲  الإشعارات       │  ← Notification Center
│  ⚐  الدعم           │  ← Support Center
│  ☰  السجل           │  ← Audit Center
│                     │
│  ── الإعدادات ──    │
│  ⚙  إعدادات المنصة   │  ← System Settings
│  ⇄  التكاملات        │  ← Integrations
│  ☰  التحديثات       │  ← Changelog / Updates
│                     │
│  ┌─────────────────┐ │
│  │ Avatar + Name   │ │  ← User menu (profile, logout)
│  └─────────────────┘ │
└─────────────────────┘
```

### Mobile Navigation

Bottom tab bar (iOS-style) on phones:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   القيادة  │  العملاء  │  المحتوى  │  المدفوعات │  ☰  │
│  (Dashboard)│(Customers)│(Content) │(Payments)│(More) │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

The 5th tab "☰ المزيد" opens a drawer with the full nav tree.

### Centers — Complete List (20 Centers)

| # | Center | Purpose | Key Actions |
|---|--------|---------|-------------|
| 1 | **Dashboard** | Command center with widgets | View metrics, trends, alerts |
| 2 | **Customers** | Full customer lifecycle management | CRUD, suspend, impersonate, notes, timeline |
| 3 | **Sites** | All photographer sites | Review, suspend, force-update theme |
| 4 | **Templates** | Template showroom management | Add, edit, publish, archive, reorder |
| 5 | **Theme Engine** | Theme definitions | Register, configure, version |
| 6 | **Content** | All platform content | Edit pages, navigation, banners, legal, emails |
| 7 | **Navigation Builder** | Menus & navigation | Header, footer, mobile nav for all site parts |
| 8 | **Media** | Central media library | Upload, browse, search, replace, detect usage |
| 9 | **Marketing** | Campaigns, coupons, referrals | Create, track, analyze campaigns |
| 10 | **SEO** | SEO for all pages & sites | Titles, descriptions, structured data, sitemaps |
| 11 | **Subscriptions** | Plan & subscription management | Plans CRUD, change plan, extend trial |
| 12 | **Payments** | Payment review & management | Approve, reject, refund, invoices |
| 13 | **Notifications** | All notification management | Send, templates, history |
| 14 | **Backups** | Backup operations | Run, restore, configure, monitor |
| 15 | **Analytics** | Platform analytics & reports | Charts, exports, trends |
| 16 | **Security** | Security & audit | Roles, permissions, sessions, threats, logs |
| 17 | **Feature Flags** | Feature toggle management | Enable/disable, target users/sites |
| 18 | **Support** | Support tickets | View, reply, resolve tickets |
| 19 | **Audit** | Complete audit trail | Search, filter, export audit log |
| 20 | **Settings** | Platform configuration | General, branding, integrations, team |

---

## 5. Design System

### New Components Needed

| Component | Priority | Description |
|-----------|----------|-------------|
| `DataTable` | 🔴 Critical | Sortable, filterable, paginated table with bulk actions |
| `Modal` | 🔴 Critical | Slide-over panel or centered dialog |
| `CommandPalette` | 🔴 Critical | `Cmd+K` search and command interface |
| `DropdownMenu` | 🔴 Critical | Context menu with actions |
| `Tabs` | 🔴 Critical | Tabbed navigation within centers |
| `Switch` | 🔴 Critical | Toggle control for boolean settings |
| `Toast` | 🔴 Critical | Success/error notifications |
| `Skeleton` | 🔴 Critical | Loading states |
| `Breadcrumb` | 🔴 Critical | Navigation breadcrumbs |
| `Select` | 🟡 High | Dropdown select with search |
| `Textarea` | 🟡 High | Multi-line input |
| `Pagination` | 🟡 High | Page navigation |
| `Tooltip` | 🟡 High | Hover tooltips |
| `Alert` | 🟡 High | Inline alerts |
| `Avatar` | 🟡 Medium | User avatars |
| `ProgressBar` | 🟡 Medium | Progress indication |
| `Chart` | 🟡 Medium | Simple charts (SVG-based, no heavy library) |
| `Timeline` | 🟡 Medium | Activity timeline |
| `ActivityFeed` | 🟡 Medium | Real-time activity stream |
| `StatCard` | 🟡 Medium | Metric display card |
| `InlineEdit` | 🟡 Medium | Click-to-edit text |
| `FormBuilder` | 🟢 Nice | Dynamic form rendering from JSON schema |

### Component Principles

- All components support `className` override via `cn()`
- All components are RTL-aware (no hardcoded `left`/`right`)
- Loading, empty, error states are built into DataTable, StatCard, etc.
- Keyboard navigation supported in CommandPalette, DataTable, Select

---

## 6. Data Flow & State Management

### Server Components First

Following Next.js 15 App Router conventions:

1. **Page = Server Component** — Fetches data, passes to client components
2. **Interactivity = Client Component** — Only the interactive parts are `"use client"`
3. **Mutations = Server Actions** — All data mutations use Server Actions

### Pattern:

```
Page (Server)
├── CenterShell (Server)
│   ├── CenterHeader (Server) — Title, description, actions
│   ├── DataTable (Client) — Sort, filter, select rows
│   ├── Modal (Client) — Create/edit form
│   └── Toast (Client) — Success/error feedback
```

### Data Fetching Strategy

- List pages: Server component fetches data, passes to client DataTable
- Detail pages: Server component fetches data, renders sections
- Search: Server Action returns JSON results for Command Palette
- Dashboard: Multiple parallel fetches for widgets

### Caching Strategy

- Force-dynamic for admin (real-time data)
- `revalidatePath()` after mutations
- No ISR for admin pages

---

## 7. RBAC & Authorization

### Role Definitions

| Role | slug | Level | Access |
|------|------|-------|--------|
| Super Admin | `super_admin` | 100 | Everything |
| Operations Admin | `operations_admin` | 80 | Customers, Sites, Content, Support |
| Billing Manager | `billing_manager` | 60 | Payments, Subscriptions, Invoices |
| Template Manager | `template_manager` | 60 | Templates, Themes |
| Support Agent | `support_agent` | 40 | Customers (read), Support tickets |
| Security Auditor | `security_auditor` | 30 | Audit log (read-only), Security (read-only) |
| User | `user` | 0 | No admin access |

### Permission Model

Each center defines a set of permissions:

```typescript
type Permission = {
  center: string;      // e.g., "customers"
  action: "view" | "create" | "edit" | "delete" | "impersonate" | "suspend";
};
```

Each role maps to a set of permissions. The check is:

```typescript
function hasPermission(userRole: string, center: string, action: string): boolean
```

### Guard Implementation

```typescript
// Server-side guard in every admin page
async function requireAdminPermission(center: string, action: string) {
  const session = await getCurrentRequestUserSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, center, action)) redirect("/admin");
  return session;
}
```

---

## 8. Global Features

### 8.1 Command Palette (`Cmd+K`)

- Opens with `Cmd+K` or `Ctrl+K`
- Searches: customers, sites, pages, settings, actions
- Results grouped by category
- Keyboard navigable (↑↓ to move, Enter to select)
- Quick actions: "Create backup", "Send notification", "Suspend customer"

**Search scope:**
- Customers (name, email, phone)
- Sites (slug, title)
- Templates (name, code)
- Themes (name, code)
- Admin pages (by name)
- Settings (by name)
- Quick actions

### 8.2 Global Search Page

- Full-page search with advanced filters
- Search across all entities with type filters
- Results with preview snippets

### 8.3 Quick Actions

Available from the command palette or a FAB:

- Create backup
- Send platform notification
- View recent errors
- New customer
- New template

### 8.4 Bulk Actions

DataTable supports multi-select with bulk actions:

- Delete selected
- Export selected
- Change status (activate/suspend)
- Send notification

### 8.5 Inline Editing

- Click on text values to edit inline
- Auto-save on blur
- Undo support where feasible

---

## 9. Content Management Philosophy

### The Problem

Currently, all platform content (hero text, feature descriptions, footer links, email templates, legal pages, banners, etc.) is hardcoded in React components or TypeScript files. Changing any text requires a code change and redeployment.

### The Solution: Centralized Content System

A `PlatformContent` model stores all editable content as key-value pairs with versioning:

```prisma
model PlatformContent {
  id        String   @id @default(cuid())
  key       String   @unique           // e.g., "home.hero.headline"
  value     Json                       // The content value (string, object, array)
  type      String   @default("text")  // text, rich-text, image, json
  group     String                     // e.g., "home", "emails", "legal"
  label     String                     // Human-readable label
  locale    String   @default("ar")    // For future i18n
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### What Content Becomes Editable

| Group | Keys | Currently Hardcoded In |
|-------|------|----------------------|
| **Home Page** | Hero headline, subheadline, trust signals, feature cards | `src/app/(marketing)/page.tsx` |
| **Templates** | Template descriptions, preview images | `src/modules/marketing/platform-content.ts` |
| **Auth Pages** | Login/signup titles, descriptions, help text | `src/app/(marketing)/login/page.tsx`, `signup/page.tsx` |
| **Legal** | Privacy policy, Terms of service | Static pages |
| **Emails** | Password reset email, notification templates | `src/modules/auth/password-reset-delivery.ts` |
| **SEO Defaults** | Default meta titles, descriptions | `src/app/layout.tsx` |
| **Platform** | Platform name, tagline, stats | `src/app/layout.tsx`, `src/modules/marketing/platform-content.ts` |
| **Navigation** | Nav items, footer links | `src/components/layout/marketing-nav.tsx` |
| **Banners** | Announcement banners, promotion text | Nonexistent (need creation) |
| **Errors** | 404 text, error messages | `src/app/not-found.tsx` |
| **Theme Defaults** | Default theme config values | `src/modules/themes/definitions/noir-gold.ts` |

### Implementation

1. Add `PlatformContent` model to Prisma
2. Create seed data from current hardcoded values
3. Build Content Center UI to browse/edit all content
4. Replace hardcoded values with `getPlatformContent(key)` calls
5. Add `revalidatePath()` on content update

This is a **Phase 2** task. For Phase 1, the admin console will have the Content Center interface ready, and the actual replacement of hardcoded values happens in a migration pass.

---

## 10. Implementation Phases

### Phase 1: Foundation (This Sprint)

| Task | Description | Estimated Files |
|------|-------------|-----------------|
| 1.1 | Admin layout with sidebar, header, workspace | 5 files |
| 1.2 | Design System: Button, Badge, Card (enhance existing) | 3 files |
| 1.3 | Design System: DataTable with pagination, sort, search | 2 files |
| 1.4 | Design System: Modal, Dropdown, Toast, Skeleton | 5 files |
| 1.5 | Design System: Tabs, Switch, Select, Breadcrumb | 5 files |
| 1.6 | Command Palette with global search | 3 files |
| 1.7 | RBAC system with permission guards | 3 files |
| 1.8 | Dashboard center with widgets | 4 files |
| 1.9 | Customer Center (list + detail + actions) | 6 files |
| 1.10 | Sites Center (list + detail) | 4 files |
| 1.11 | Payments Center (review + approve/reject) | 3 files |
| 1.12 | Backup Center (list + run + settings) | 3 files |
| 1.13 | Settings Center (general + branding) | 3 files |
| 1.14 | Tests for all new modules | ~15 files |

### Phase 2: Content & Media

| Task | Description |
|------|-------------|
| 2.1 | PlatformContent model & migration |
| 2.2 | Content Center UI |
| 2.3 | Navigation Builder |
| 2.4 | Media Center |
| 2.5 | Replace hardcoded content with PlatformContent |
| 2.6 | Legal page editor |

### Phase 3: Advanced Features

| Task | Description |
|------|-------------|
| 3.1 | Analytics Center with charts |
| 3.2 | Marketing Center (campaigns, coupons) |
| 3.3 | Notification Center + templates |
| 3.4 | Theme Engine Center |
| 3.5 | Templates Center |
| 3.6 | Feature Flags Center |
| 3.7 | SEO Center |
| 3.8 | Security Center (advanced) |
| 3.9 | Audit Center |
| 3.10 | Support Center |
| 3.11 | Subscription Center |

### Phase 4: Polish

| Task | Description |
|------|-------------|
| 4.1 | Mobile navigation (bottom tab bar) |
| 4.2 | Quick actions FAB |
| 4.3 | Inline editing |
| 4.4 | Bulk actions across all centers |
| 4.5 | Export functionality |
| 4.6 | Keyboard shortcuts |
| 4.7 | Performance optimization |
| 4.8 | End-to-end tests |

---

## 11. Success Criteria

The admin console is considered complete when:

1. ✅ **Every** entity in the database can be viewed, created, edited, or deleted from the UI
2. ✅ **Every** text/content element visible to end-users can be changed from the Content Center without code changes
3. ✅ **All** 20 centers are implemented with list + detail views
4. ✅ **Command Palette** searches across all entities and actions
5. ✅ **Mobile UI** provides equivalent functionality to desktop
6. ✅ **RBAC** properly restricts access by role
7. ✅ **DataTable** supports sorting, filtering, pagination, and bulk actions
8. ✅ **All existing tests pass**, and new tests cover admin modules
9. ✅ **Production build** succeeds
10. ✅ **No hardcoded content** remains in the admin UI (all text is localizable)

---

*This blueprint is a living document. As implementation progresses, update sections as needed.*
