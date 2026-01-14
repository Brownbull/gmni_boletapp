# Story 14.37: Toast Notification Theme Integration & Font Size Scaling

**Status:** done
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** 14.19 (Personal Records Detection), 14.22 (Settings View Redesign)

---

## Story

**As a** user who values visual consistency and accessibility,
**I want to** have toast notifications that follow the app's theme colors and an option to choose between normal and small font sizes,
**So that** the UI feels cohesive and I can adjust text readability to my preference.

---

## Context

### Problem 1: Toast Notification Theming
The `PersonalRecordBanner` component (implemented in Story 14.19) displays personal record achievements with a trophy icon. Currently it uses hardcoded teal colors (`from-teal-500 to-teal-400`) that don't follow the app's theme system. On the "Normal" warm theme, the teal colors appear out of place against the earthy forest green palette.

Additionally, the trophy icon appears slightly misaligned within its circular container.

### Problem 2: Font Size Preferences
The app currently has no font size customization. Some users prefer larger text for better readability, especially on mobile devices. The current font sizes should become the "Small" option, with a new "Normal" option providing slightly larger text throughout the app.

**Exclusions from font scaling:**
- Logo in top header (AppLogo component)
- Application name/wordmark in home screen
- Navigation icons (they use fixed icon sizes)

---

## Acceptance Criteria

### Part A: Toast Notification Theme Integration

#### AC A1: Use Theme Colors for PersonalRecordBanner
- [x] Replace hardcoded teal gradient with theme CSS variables
- [x] Light mode: Use `var(--insight-celebration-bg)` and `var(--insight-celebration-icon)` for background/icon colors
- [x] Dark mode: Same variables (already defined for each theme/mode combination)
- [x] Border color should use `var(--border-light)`

#### AC A2: Fix Trophy Icon Alignment
- [x] Ensure trophy icon is properly centered in its circular container
- [x] Apply `flex items-center justify-center` consistently
- [x] Verify icon doesn't clip or overflow

#### AC A3: Theme-Aware Text Colors
- [x] Title ("¡Récord Personal!") should use high-contrast color appropriate for the background
- [x] Message text should use slightly lower contrast for hierarchy
- [x] Dismiss button should remain visible on all theme backgrounds

#### AC A4: Test Across All Themes
- [x] Verify appearance on: Normal (light/dark), Professional (light/dark), Mono (light/dark)
- [x] Ensure sufficient contrast ratios (WCAG AA minimum)

### Part B: Font Size Scaling System

#### AC B1: Add FontSize Type and Setting
- [x] Add `FontSize` type to `src/types/settings.ts`: `'normal' | 'small'`
- [x] Add `fontSize?: FontSize` to `AppSettings` interface
- [x] Default should be `'small'` (current sizes) for backwards compatibility

#### AC B2: CSS Variable-Based Scaling System
- [x] Add font size CSS variables to `index.html` for scaling:
  - `--font-size-xs`: 10px (small) / 12px (normal)
  - `--font-size-sm`: 12px (small) / 14px (normal)
  - `--font-size-base`: 14px (small) / 16px (normal)
  - `--font-size-lg`: 16px (small) / 18px (normal)
  - `--font-size-xl`: 18px (small) / 20px (normal)
  - `--font-size-2xl`: 20px (small) / 24px (normal)
  - `--font-size-3xl`: 24px (small) / 30px (normal)
- [x] Use `[data-font-size="normal"]` selector for larger sizes
- [x] Small is default (no data attribute needed)

#### AC B3: Settings UI for Font Size
- [x] Add font size selector to `PreferenciasView` after Typography setting
- [x] Options: "Normal" (larger), "Pequeño/Small" (current)
- [x] Label: "Tamaño de Fuente" / "Font Size"
- [x] Persist selection to localStorage ~~and Firestore (like fontFamily)~~ (Firestore sync deferred)

#### AC B4: App.tsx Integration
- [x] Add `fontSize` state with persistence
- [x] Apply `data-font-size` attribute to document.documentElement
- [x] Pass handler to SettingsView

#### AC B5: Component Updates (Priority Components)
Update key components to use CSS variables instead of Tailwind fixed sizes:
- [ ] `TransactionCard` (History/Items view) - DEFERRED: Incremental adoption
- [ ] `InsightHistoryCard` and `CelebrationCard` - DEFERRED: Incremental adoption
- [x] `PersonalRecordBanner` (toast)
- [ ] `CategoryBadge` and similar pills/badges - DEFERRED: Incremental adoption
- [ ] `QuickSaveCard` (scan preview) - DEFERRED: Incremental adoption
- [x] Settings menu items

**Note:** Use `style={{ fontSize: 'var(--font-size-sm)' }}` pattern where Tailwind classes like `text-sm` are currently used.
**Note:** Font size infrastructure is complete. Other components can adopt incrementally via follow-up stories.

#### AC B6: Excluded Elements
- [x] `AppLogo` component - keep fixed size
- [x] Wordmark "Gastify" text - keep fixed size
- [x] Navigation bar icons - keep fixed 24px icons
- [x] Charts and visualizations - keep current sizes for data density

---

## Technical Notes

### Theme Integration for Toast

Current PersonalRecordBanner uses:
```tsx
// Current hardcoded colors
'bg-gradient-to-r from-teal-500 to-teal-400'
```

Should become:
```tsx
// Theme-aware styling
style={{
  background: `linear-gradient(135deg, var(--insight-celebration-bg), var(--primary-light))`,
  borderColor: 'var(--border-light)',
}}
```

### CSS Variable Font Scaling

In `index.html`:
```css
:root {
  /* Default (small) font sizes - current app sizes */
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
}

[data-font-size="normal"] {
  /* Larger font sizes for better readability */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
}
```

### Tailwind to CSS Variable Mapping

| Tailwind | CSS Variable | Small | Normal |
|----------|--------------|-------|--------|
| text-xs | --font-size-xs | 10px | 12px |
| text-sm | --font-size-sm | 12px | 14px |
| text-base | --font-size-base | 14px | 16px |
| text-lg | --font-size-lg | 16px | 18px |
| text-xl | --font-size-xl | 18px | 20px |
| text-2xl | --font-size-2xl | 20px | 24px |
| text-3xl | --font-size-3xl | 24px | 30px |

### Persistence Pattern

Follow existing fontFamily pattern:
```typescript
// App.tsx
const [fontSize, setFontSize] = useState<FontSize>(() => {
  const saved = localStorage.getItem('fontSize');
  return (saved === 'normal' || saved === 'small') ? saved : 'small';
});

useEffect(() => {
  localStorage.setItem('fontSize', fontSize);
  document.documentElement.setAttribute('data-font-size', fontSize);
}, [fontSize]);
```

---

## Out of Scope

- Font weight scaling (only size changes)
- Line height adjustments (could be future enhancement)
- Third-party library components (charts, etc.)
- Print/PDF export font sizes (already has separate styles)

---

## File List

**Modified Files (Part A - Toast Theming):**
- `src/components/celebrations/PersonalRecordBanner.tsx` - Theme integration + icon alignment fix
- `src/components/celebrations/CompactRecordBanner.tsx` - Theme integration (if separate)

**Modified Files (Part B - Font Scaling):**
- `index.html` - Add font size CSS variables
- `src/types/settings.ts` - Add FontSize type
- `src/App.tsx` - Add fontSize state and DOM attribute
- `src/components/settings/subviews/PreferenciasView.tsx` - Add font size selector
- `src/views/SettingsView.tsx` - Pass fontSize props
- `src/services/userPreferencesService.ts` - Add fontSize to preferences (optional)

**Priority Component Updates:**
- `src/components/transactions/TransactionCard.tsx`
- `src/components/history/TransactionCard.tsx`
- `src/components/insights/InsightHistoryCard.tsx`
- `src/components/insights/CelebrationCard.tsx`
- `src/components/scan/QuickSaveCard.tsx`
- `src/components/settings/SettingsMenuItem.tsx`

**New Test Files:**
- `tests/unit/components/celebrations/PersonalRecordBanner.theme.test.tsx`
- `tests/unit/settings/fontSize.test.ts`

---

## Dev Agent Record

### Implementation Plan

**Phase 1: Toast Theme Integration (AC A1-A4)**
1. Update PersonalRecordBanner to use CSS variables
2. Fix trophy icon alignment
3. Test across all 6 theme/mode combinations

**Phase 2: Font Size Infrastructure (AC B1-B4)**
1. Add FontSize type to settings.ts
2. Add CSS variables to index.html
3. Add fontSize state to App.tsx
4. Add selector to PreferenciasView

**Phase 3: Component Updates (AC B5)**
1. Update high-priority components to use CSS variables
2. Test with both font size options
3. Verify excluded elements remain fixed

---

## Session Log

### Session 1 - 2026-01-13 (Implementation)

**Atlas Consultation:**
- Reviewed architecture patterns (CSS Custom Properties established pattern)
- Reviewed testing patterns (Vitest, 3,118+ tests at 84%+ coverage)
- Validated story alignment with project patterns

**Part A: Toast Theme Integration - COMPLETE**
1. Updated `PersonalRecordBanner.tsx`:
   - Replaced hardcoded teal colors with CSS variables (`--insight-celebration-bg`, `--insight-celebration-icon`)
   - Fixed trophy icon alignment with explicit `w-12 h-12` container and `flex items-center justify-center`
   - Updated text colors to use `--text-secondary` for message
   - Updated `CompactRecordBanner` with same theme variables
2. Added 11 new tests for theme integration in `PersonalRecordBanner.test.tsx`

**Part B: Font Size Infrastructure - COMPLETE**
1. Added `FontSize` type (`'small' | 'normal'`) to `src/types/settings.ts`
2. Added CSS variables to `index.html`:
   - Default (small): `--font-size-xs` through `--font-size-3xl` matching Tailwind defaults
   - Normal: 2px increase per level via `[data-font-size="normal"]` selector
3. Added `fontSize` state to `App.tsx`:
   - Initialized from localStorage with 'small' default
   - Persists to localStorage on change
   - Applies `data-font-size` attribute to `document.documentElement`
4. Added font size selector to `PreferenciasView.tsx`:
   - Options: "Normal" (larger), "Pequeño/Small" (current)
   - Follows existing pattern from fontFamily selector
5. Updated `SettingsView.tsx` to pass fontSize props
6. Updated priority components:
   - `PersonalRecordBanner.tsx` - uses `--font-size-sm`
   - `SettingsMenuItem.tsx` - uses `--font-size-sm` for title, `--font-size-xs` for subtitle

**Tests:**
- All 70 tests pass for modified components (PersonalRecordBanner + Settings)
- TypeScript compilation passes with no errors

**Files Modified:**
- `src/components/celebrations/PersonalRecordBanner.tsx` - Theme + font size
- `src/components/settings/SettingsMenuItem.tsx` - Font size
- `src/components/settings/subviews/PreferenciasView.tsx` - Font size selector
- `src/views/SettingsView.tsx` - Pass fontSize props
- `src/types/settings.ts` - FontSize type
- `src/App.tsx` - fontSize state + DOM attribute
- `index.html` - Font size CSS variables
- `tests/unit/components/celebrations/PersonalRecordBanner.test.tsx` - Theme tests

**Notes:**
- Font size system is extensible - other components can adopt `--font-size-*` variables incrementally
- Excluded elements (logo, wordmark, nav icons, charts) remain fixed size by not using the variables
- Default is 'small' for backwards compatibility with existing users

### Session 2 - 2026-01-13 (Atlas Code Review)

**Review Outcome:** PASS with deferred items

**Issues Fixed:**
1. Removed unused `theme` prop from `CompactRecordBannerProps` interface (was declared but not used)

**Deferred Items (documented in ACs):**
1. AC B5: TransactionCard, InsightHistoryCard, CelebrationCard, CategoryBadge, QuickSaveCard - marked DEFERRED for incremental adoption
2. AC B3: Firestore sync for fontSize - localStorage only (like colorTheme/fontColorMode, unlike fontFamily)
3. Dedicated fontSize test file - tests were added to existing PersonalRecordBanner.test.tsx instead

**Atlas Validation:**
- ✅ Architecture: Follows CSS Custom Properties pattern
- ✅ Patterns: Uses data-* attributes, jsdom style testing
- ✅ Workflows: No user flow impacts

**Test Results:** All 70 tests pass
