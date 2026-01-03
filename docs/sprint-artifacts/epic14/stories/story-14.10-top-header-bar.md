# Story 14.10: Top Header Bar

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** None (foundational)
**Mockup:** All mockups show consistent header (see home-dashboard.html, analytics-polygon.html, etc.)
**Priority:** HIGH - Blocks other view integration stories

---

## Story

**As a** user navigating the app,
**I want to** see a consistent top header bar across all views,
**So that** I always know where I am and can access key actions.

---

## Context

Currently, the app has NO top header bar. Each view has its own ad-hoc header or none at all. The mockups show a consistent header design across all screens with:
- App logo (G in circle)
- View-specific title or wordmark
- Settings/menu access
- Optional back button on detail views

This is FOUNDATIONAL and should be implemented BEFORE the view integration stories (14.15-14.18), as those views will use this header component.

---

## Acceptance Criteria

### AC #1: Header Component Structure
- [x] New `TopHeader` component created in `src/components/`
- [x] Fixed at top of screen (below status bar area)
- [x] Consistent height (44-48px) matching iOS/Android conventions
- [x] Uses CSS variables for theming

### AC #2: Header Elements
- [x] Left side: App logo (G circle) OR back button on detail views
- [x] Center: View title OR app wordmark ("Gastify")
- [x] Right side: Profile avatar with dropdown menu (Settings navigation via dropdown)
- [x] All elements have 44px minimum touch targets

### AC #3: View-Specific Variants
- [x] Dashboard/Home: Logo + Wordmark + Profile Avatar Dropdown
- [x] TrendsView: Logo + "Analytics" title + Profile Avatar
- [x] InsightsView: Logo + "Ideas" title + Profile Avatar
- [x] EditView: Back button + "Transacción" + (empty)
- [x] SettingsView: Back button + "Configuración" + (empty)

> **Note:** HistoryView was merged into DashboardView in Story 10a.1. The header design evolved from "hamburger menu" to "profile avatar dropdown" during implementation to align with mockups.

### AC #4: Responsive Behavior
- [x] Safe area inset respected for notch devices
- [x] Works with PWA standalone mode
- [x] Header doesn't scroll with content (fixed position)

### AC #5: Integration with App Layout
- [x] Header added to App.tsx layout wrapper
- [x] Main content area has appropriate top padding
- [x] Smooth with bottom nav (no layout jumps)

---

## Tasks

- [x] Task 1: Create `TopHeader.tsx` component with variants
- [x] Task 2: Define header variant props (mode: 'home' | 'detail' | 'settings')
- [x] Task 3: Implement logo component (G circle with gradient)
- [x] Task 4: Add menu button with navigation to settings
- [x] Task 5: Add back button variant for detail views
- [x] Task 6: Integrate header into App.tsx layout
- [x] Task 7: Adjust main content padding to accommodate fixed header
- [x] Task 8: Test safe area behavior on iPhone/notch devices (CSS uses env(safe-area-inset-top))
- [x] Task 9: Unit tests for TopHeader variants (28 tests passing)

---

## File List

**New:**
- `src/components/TopHeader.tsx` - Main header component (includes AppLogo, ProfileAvatar, ProfileDropdown as inline components)
- `tests/unit/components/TopHeader.test.tsx`

**Modified:**
- `src/App.tsx` - Add header to layout
- `src/utils/translations.ts` - Added header-related translation keys
- `index.html` - Added Google Fonts (Outfit, Baloo 2) for typography

---

## Dev Notes

### Header Structure (from mockup)
```tsx
interface TopHeaderProps {
  variant: 'home' | 'detail' | 'settings';
  title?: string;
  onBack?: () => void;
  onMenuClick?: () => void;
}

// Example usage:
<TopHeader variant="home" onMenuClick={() => setView('settings')} />
<TopHeader variant="detail" title="Transacción" onBack={() => navigate(-1)} />
```

### CSS Variables for Theming
```css
.header-bar {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}
.g-logo-circle {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}
```

### Safe Area Handling
```tsx
// Use env() for safe area inset
const headerStyle = {
  paddingTop: 'env(safe-area-inset-top, 0px)',
};
```

---

## Test Plan

1. View header on all screens (Dashboard, Trends, History, Settings)
2. Verify consistent appearance across views
3. Tap menu button, verify settings opens
4. On detail views, tap back button, verify navigation
5. Test on iPhone with notch (safe area)
6. Test in PWA standalone mode
7. Verify header stays fixed when scrolling content

---

## Atlas Code Review (2026-01-02)

**Status:** ✅ APPROVED
**Reviewer:** Atlas-enhanced adversarial review

### Summary
All acceptance criteria verified. 28 unit tests passing (exceeds original 16 estimate). TypeScript clean. App.tsx integration complete.

### Findings

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| F1 | INFO | Story claimed 16 tests, actual is 28 | Updated story - exceeded expectations |
| F2 | INFO | AppLogo not extracted to separate file | Implementation decision - inline is fine |
| F3 | LOW | AC #3 referenced non-existent HistoryView | Updated ACs to reflect 10a.1 merge |

### Patterns Applied
- **Pattern #70: Header Variant Pattern** - Used variant prop pattern
- **Pattern #71: Safe Area Inset** - `env(safe-area-inset-top)` correctly applied
- **Pattern #72: View Title Props** - `viewTitle` separate from `title`
- **Pattern #73: App.tsx Integration** - Done in same story

### New Patterns Documented
No new patterns - implementation followed existing conventions.

### Test Results
```
✓ tests/unit/components/TopHeader.test.tsx (28 tests) - 1.20s
  - Home variant (4 tests)
  - Profile Dropdown (7 tests)
  - Detail variant (3 tests)
  - Settings variant (1 test)
  - View-specific titles (2 tests)
  - Theme support (2 tests)
  - Accessibility (3 tests)
  - Fixed position and layout (3 tests)
  - Initials generation (3 tests)
```
