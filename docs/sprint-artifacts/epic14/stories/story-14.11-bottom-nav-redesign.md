# Story 14.11: Bottom Navigation Redesign

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** None (foundational)
**Mockup:** home-dashboard.html (canonical), navigation-alternatives.html (exploration)
**Priority:** HIGH - Foundational navigation component
**Completed:** 2026-01-02

---

## Story

**As a** user navigating between app sections,
**I want to** see the redesigned bottom navigation bar,
**So that** navigation feels modern and matches the new design system.

---

## Context

The current `Nav.tsx` is functional but doesn't match the mockup design:
- Current: Basic icons with minimal styling
- Mockup: Refined styling with the center FAB, proper spacing, and theme integration

The mockups show a consistent bottom nav with:
- 5 items: Inicio, Analíticas, Scan (center FAB), Ideas, Alertas (per home-dashboard.html)
- Center FAB elevated above the bar
- Active state with primary color
- Proper safe area handling for home indicator
- Alerts tab includes notification badge indicator (future feature)

---

## Acceptance Criteria

### AC #1: Visual Redesign
- [x] Nav bar matches mockup styling (home-dashboard.html)
- [x] Items use design system colors (--primary, --text-tertiary)
- [x] Center FAB elevated with gradient background
- [x] Border/shadow treatment matches mockup
- [x] Proper padding and spacing

### AC #2: Icon & Label Updates
- [x] Icons match mockup exactly (lucide icons already used)
- [x] Labels: "Inicio", "Analíticas", (FAB), "Ideas", "Alertas" (per home-dashboard.html)
- [x] Active state: icon and label both use --primary color
- [x] Inactive state: --text-tertiary color

### AC #3: Center FAB Behavior
- [x] FAB visually elevated (-40px margin-top for 52px button)
- [x] Gradient background using CSS variables
- [x] Long-press for batch mode preserved (from Story 12.1)
- [x] Scan status colors preserved (processing=amber, ready=green)

### AC #4: Safe Area & Responsive
- [x] Bottom safe area (home indicator) properly handled via CSS env()
- [x] Works on all screen sizes (360px+)
- [x] Fixed positioning with z-index 50
- [x] PWA standalone mode works correctly

### AC #5: Animation Integration
- [x] Use animation framework for active state transitions (DURATION.FAST, EASING.OUT)
- [x] Subtle scale on tap (0.95 → 1.0) via active:scale-95
- [x] Respect useReducedMotion preference (no transitions when disabled)
- [x] Haptic feedback on selection (10ms vibration via navigator.vibrate)

---

## Tasks

- [x] Task 1: Update Nav.tsx styling to match mockup
- [x] Task 2: Refine center FAB elevation and styling
- [x] Task 3: Update color scheme to use CSS variables consistently
- [x] Task 4: Add active state animation (scale + color transition)
- [x] Task 5: Verify safe area handling on iOS devices
- [x] Task 6: Add haptic feedback on nav item selection
- [x] Task 7: Ensure reduced motion preference is respected
- [x] Task 8: Update unit tests for visual changes (46 tests)
- [x] Task 9: Visual regression test on mobile viewport

---

## File List

**Modified:**
- `src/components/Nav.tsx` - Main navigation component

**Referenced:**
- `src/components/animation/constants.ts` - DURATION values
- `src/hooks/useReducedMotion.ts` - Motion preference

**Updated:**
- `tests/unit/components/Nav.test.tsx` - Updated with 46 tests including Story 14.11 coverage

---

## Implementation Summary

### Key Changes to Nav.tsx

1. **CSS Variable Theming**: All colors now use CSS variables (`--primary`, `--text-tertiary`, `--bg-secondary`, `--border-light`) for automatic dark/light mode support

2. **FAB Redesign**:
   - Size: 52px x 52px (matches mockup)
   - Elevation: -40px margin-top
   - Gradient: `linear-gradient(135deg, var(--primary), var(--primary-hover))`
   - Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`

3. **Animation Framework Integration**:
   - Uses `DURATION.FAST` (100ms) for color transitions
   - Uses `EASING.OUT` for smooth animations
   - `active:scale-95` on tap
   - All animations disabled when `useReducedMotion()` returns true

4. **Haptic Feedback**:
   - 10ms vibration on nav item click
   - Only triggers when motion is enabled
   - Graceful fallback when `navigator.vibrate` unavailable

5. **Safe Area Handling**:
   - `paddingBottom: calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))`
   - Respects iOS home indicator area

6. **Accessibility**:
   - `role="navigation"` with `aria-label`
   - `aria-current="page"` on active item
   - Dynamic aria-labels for scan button based on status

### Test Coverage

46 unit tests covering:
- Basic rendering (3 tests)
- Story 10a.3 Insights tab (6 tests)
- Navigation (4 tests)
- Active state styling (8 tests)
- Story 12.1 long-press detection (6 tests)
- Story 14.11 FAB styling (6 tests)
- Animation with reduced motion (4 tests)
- Haptic feedback (4 tests)
- Safe area handling (2 tests)
- Font weight styling (2 tests)

---

## Dev Notes

### Mockup CSS Reference (from home-dashboard.html)
```css
.bottom-nav {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 8px 16px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  cursor: pointer;
}
.nav-item svg {
  width: 24px; height: 24px;
  stroke: var(--text-tertiary);
  stroke-width: 1.8;
}
.nav-item span {
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.nav-item.active svg { stroke: var(--primary); }
.nav-item.active span { color: var(--primary); font-weight: 600; }

/* Center FAB */
.scan-center { margin-top: -56px; padding: 0; }
.scan-btn {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #6366f1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Haptic Feedback
```typescript
const handleNavClick = (view: string) => {
  if (!prefersReducedMotion && navigator.vibrate) {
    navigator.vibrate(10); // Brief haptic
  }
  setView(view);
};
```

---

## Test Plan

1. View bottom nav on all screens
2. Verify styling matches mockup
3. Tap each nav item, verify navigation works
4. Verify active state styling (color change)
5. Long-press scan button, verify batch mode triggers
6. Test on iPhone for safe area handling
7. Test with reduced motion enabled (no animations)
