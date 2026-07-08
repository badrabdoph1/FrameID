# Mobile-first UX rebuild prompt

## Goal

Rebuild FrameID's public site, customer dashboard, and admin experience around mobile use first. Every page should be usable with one hand, readable without horizontal scrolling, and focused on the next meaningful action.

## Current diagnosis

- Admin and dashboard tables are the biggest mobile blocker. Horizontal scrolling hides context and makes row actions hard to reach.
- Bottom navigation is overloaded. Customer dashboard showed eight items at once; admin showed too many top-level sections plus a menu.
- Dashboard pages mix dense operational data with setup actions. Mobile screens need progressive disclosure: summary first, details second.
- Several pages use `grid-cols-2` on the smallest screens for dense stats. This works for short numbers, but longer Arabic labels can feel cramped.
- Some route-specific pages still use custom tables instead of the shared responsive table pattern.

## Implementation rules

- Prefer cards on mobile and tables on desktop for operational data.
- Keep bottom navigation to four primary destinations plus a clear "more" menu.
- Put primary action buttons full-width on mobile when they are the next step.
- Avoid horizontal scrolling for required workflows. Horizontal scroll is acceptable only for optional media browsing.
- Use Arabic labels directly in mobile cards so data never depends on table headers off-screen.
- Preserve existing Next.js routing, auth, server actions, and Tailwind v4 setup.
- Add regression tests for every shared mobile behavior changed.

## First implementation slice

- Convert shared admin `DataTable` to mobile cards while keeping desktop tables.
- Compact customer dashboard mobile navigation to four actions plus a full "more" sheet.
- Compact admin mobile navigation to four actions plus a full menu.
- Convert the custom customers admin table to mobile cards.

## Next recommended slices

- Convert the admin error center table to mobile cards.
- Convert customer payment history to mobile cards.
- Audit dashboard form pages for full-width controls, shorter section headers, and sticky save/status placement.
- Audit public marketing pages for mobile spacing, CTA overlap, and sticky CTA bottom padding.
- Add Playwright mobile screenshots for `/`, `/dashboard`, `/admin`, `/admin/customers`, and `/admin/errors` once seeded auth/dev data is available.
