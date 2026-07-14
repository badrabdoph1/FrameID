# Public Living Guided Journey — Implementation Plan

**Goal:** Implement the approved public-site guided journey without changing the existing Smart Tips implementation or adding motion dependencies.

**Architecture:** A marketing-only client controller discovers explicit journey sources in the rendered pages, runs a small deterministic state machine, and renders one source-originated message at a time. Suppression is stored per public moment in a new local-storage namespace; route continuity uses a short-lived session-storage carry token. Existing Smart Tips are removed only from the root mount and mounted unchanged inside the dashboard route group.

**Constraints:** Work on `main`, preserve unrelated changes, leave all files uncommitted, use transform/opacity-first CSS, support reduced motion, and never add a public-journey effect to Dashboard.

---

## Task 1: Lock the behavior contract with failing tests

**Files:**
- Create: `tests/public-living-journey-state.test.ts`
- Create: `tests/public-living-journey-memory.test.ts`
- Create: `tests/public-living-journey-config.test.ts`

1. Test the approved moment registry, Egyptian copy, route matching, and preview sequencing.
2. Test source → message → dismissing → halo transfer → complete state transitions.
3. Test per-moment suppression, page-visit visibility, and expiring route carry tokens.
4. Run the focused tests and confirm they fail because the implementation does not exist.

## Task 2: Implement the pure journey core

**Files:**
- Create: `src/components/public-journey/journey-config.ts`
- Create: `src/components/public-journey/journey-state.ts`
- Create: `src/components/public-journey/journey-memory.ts`
- Create: `src/components/public-journey/journey-telemetry.ts`

1. Add typed moment definitions and centralized FrameID voice.
2. Implement deterministic state transitions and storage adapters.
3. Add no-PII browser telemetry helpers.
4. Run the focused tests to green and typecheck.

## Task 3: Build the lightweight visual runtime test-first

**Files:**
- Create: `tests/public-living-journey.test.tsx`
- Create: `src/components/public-journey/public-living-journey.tsx`
- Create: `src/components/public-journey/journey-message.tsx`
- Create: `src/components/public-journey/public-living-journey.module.css`

1. Test delayed activation, one active message, checkbox suppression, staged dismissal, reduced motion, idle reminder, and route carry.
2. Implement the controller with observers/timers and no per-frame React scroll state.
3. Implement collision-aware message placement, short curved connector, source halo, card personality variants, cascade, Micro Reward, and one-shot Idle Hint.
4. Run component tests, typecheck, and lint the new files.

## Task 4: Integrate public sources and isolate Smart Tips

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/marketing/home-page-renderer.tsx`
- Modify: `src/app/(marketing)/templates/page.tsx`
- Modify: `src/app/(marketing)/templates/[code]/preview/page.tsx`
- Modify: `src/app/(marketing)/signup/page.tsx`
- Modify: `src/components/auth/signup-form.tsx`

1. Move the unchanged `SmartTipRouter` mount from root to the dashboard route group.
2. Mount the new journey only in the marketing route group.
3. Add stable public journey source attributes to the home CTA, templates grid/cards, preview screen, use-template CTA, and signup submit CTA.
4. Show a compact selected-template confirmation in signup to preserve continuity.
5. Keep real CTAs fully interactive and preserve direct-entry behavior.

## Task 5: Verify responsiveness, accessibility, and regressions

**Files:**
- Update focused marketing tests only where integration assertions are needed.

1. Run focused tests, full test suite, typecheck, and lint.
2. Start the local app and inspect iPhone-size, Android-size, and desktop layouts.
3. Confirm cards do not cover their CTA, key imagery, or headings; confirm keyboard/focus and reduced-motion behavior.
4. Confirm Smart Tips source/config/styles are unchanged and only their mount scope changed.
5. Report any environment-limited checks and leave changes uncommitted for review.

