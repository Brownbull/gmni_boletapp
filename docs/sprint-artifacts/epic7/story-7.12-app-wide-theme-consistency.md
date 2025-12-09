# Story 7.12: App-Wide Theme & Visual Consistency

Status: done

## Story

As a **user**,
I want **the entire app to have a cohesive visual design that matches the new analytics theme**,
so that **the app feels polished and professional throughout, not just in the analytics section**.

## Acceptance Criteria

1. **AC #1:** Dashboard view uses the same card styling as analytics (rounded-xl, surface color, subtle borders)
2. **AC #2:** Transaction list items use consistent card styling with hover states
3. **AC #3:** Edit view uses the same form input styling and card layouts
4. **AC #4:** Settings view uses the same toggle button styling as chart mode toggle
5. **AC #5:** Login screen uses the theme's accent colors and surface styling
6. **AC #6:** All views use CSS custom properties for theming (--bg, --surface, --primary, --secondary, --accent)
7. **AC #7:** Dark mode works consistently across all views using the theme system
8. **AC #8:** Header areas across views have consistent styling (font sizes, spacing, alignment)
9. **AC #9:** Empty states use consistent styling (icon size, text hierarchy, spacing)
10. **AC #10:** Modal dialogs use the new theme styling (CategoryLearningPrompt, confirmations)
11. **AC #11:** Settings view includes a color theme selector with options: Default (Slate Professional) and Ni no Kuni (Ghibli-inspired)

## Tasks / Subtasks

- [x] Task 1: Implement CSS custom properties theme system (AC: #6, #7)
  - [x] Add CSS variables to index.html (via `<style>` tag)
  - [x] Define light mode variables (--bg, --surface, --primary, --secondary, --accent)
  - [x] Define dark mode variables in `.dark` class
  - [x] App.tsx applies `dark` class when theme is dark

- [x] Task 2: Update DashboardView styling (AC: #1, #2, #8)
  - [x] Update main container to use theme background
  - [x] Update transaction cards to use surface color with subtle borders
  - [x] Add hover states to transaction cards (border-accent on hover)
  - [x] Update header (greeting, date) to use theme typography
  - [x] Summary cards use CSS variables

- [x] Task 3: Update EditView styling (AC: #3, #8)
  - [x] Update form container to use theme surface
  - [x] Update input fields to use consistent styling
  - [x] Update item cards to match analytics pattern
  - [x] Update action buttons to use accent color
  - [x] Update header styling for consistency

- [x] Task 4: Update SettingsView styling (AC: #4, #8)
  - [x] Update toggle buttons to match chart mode toggle style (outlined container with accent active)
  - [x] Update card containers to use theme surface
  - [x] Update action buttons (CSV, Wipe, Sign Out) to use theme colors
  - [x] Ensure consistent spacing and typography

- [x] Task 5: Update LoginScreen styling (AC: #5)
  - [x] Update background to use gradient dark theme
  - [x] Update sign-in button styling
  - [x] Update app icon to use accent gradient
  - [x] Consistent with overall theme

- [x] Task 6: Update modal dialogs (AC: #10)
  - [x] Update CategoryLearningPrompt to use CSS variables
  - [x] Modal uses --surface, --primary, --secondary, --accent
  - [x] Consistent gradient styling for confirm button

- [x] Task 7: Update Nav component (AC: All)
  - [x] Nav uses --surface for background
  - [x] Scan button uses accent gradient
  - [x] Active/inactive states use --accent and --secondary

- [x] Task 8: Update HistoryView styling
  - [x] Transaction cards use CSS variables
  - [x] Hover states with accent border
  - [x] Pagination buttons use theme styling

- [x] Task 9: Run tests and verify (AC: All)
  - [x] TypeScript compilation passes
  - [x] 634 unit tests passing

- [x] Task 10: Implement color theme selector in Settings (AC: #11)
  - [x] Add `colorTheme` state to App.tsx (persisted to localStorage)
  - [x] Add CSS variables for Ni no Kuni (Ghibli) theme in index.html
  - [x] Add `[data-theme="ghibli"]` CSS variable definitions
  - [x] Apply `data-theme` attribute to root container based on colorTheme state
  - [x] Add color theme toggle section in SettingsView (similar to light/dark toggle)
  - [x] Pass colorTheme and setColorTheme props through component tree
  - [x] Both themes work in light and dark modes (4 combinations total)

- [x] Task 11: Run final tests and verify (AC: All)
  - [x] TypeScript compilation passes
  - [x] All 634 unit tests pass
  - [x] Visual verification of all 4 theme combinations

## Dev Notes

### Architecture Alignment

This story extends the UX redesign from Epic 7 to cover the entire application, ensuring visual consistency across all views.

**CSS Custom Properties (from UX spec):**
```css
:root {
    --bg: #f8fafc;
    --surface: #ffffff;
    --primary: #0f172a;
    --secondary: #64748b;
    --accent: #3b82f6;
    --success: #22c55e;
    --warning: #f59e0b;
    --error: #ef4444;
    --chart-1: #3b82f6;
    --chart-2: #22c55e;
    --chart-3: #f59e0b;
    --chart-4: #ef4444;
    --chart-5: #8b5cf6;
    --chart-6: #ec4899;
}

.dark {
    --bg: #0f172a;
    --surface: #1e293b;
    --primary: #f8fafc;
    --secondary: #94a3b8;
    --accent: #60a5fa;
    --success: #4ade80;
    --warning: #fbbf24;
    --error: #f87171;
}
```

**Consistent Card Styling:**
```tsx
// Standard card pattern
<div className="surface rounded-xl p-4 border border-transparent hover:border-accent transition-all">
  {/* Card content */}
</div>

// Using CSS variables with Tailwind
<div style={{ backgroundColor: 'var(--surface)' }} className="rounded-xl p-4">
  {/* Or using custom Tailwind classes */}
</div>
```

**Toggle Button Styling (matching chart mode toggle):**
```tsx
<div className="flex surface rounded-lg p-1 border border-secondary/50">
    <button className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
        active ? 'bg-accent text-white' : 'text-secondary'
    }`}>
        Option A
    </button>
    <button className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
        !active ? 'bg-accent text-white' : 'text-secondary'
    }`}>
        Option B
    </button>
</div>
```

**Scan Button Gradient (for prominent CTAs):**
```tsx
<button className="bg-gradient-to-br from-accent to-success rounded-full shadow-lg">
  {/* Content */}
</button>
```

### Views to Update

1. **DashboardView** (`src/views/DashboardView.tsx`)
   - Transaction cards with hover states
   - Header styling
   - Empty state design

2. **EditView** (`src/views/EditView.tsx`)
   - Form container styling
   - Item cards
   - Action buttons

3. **SettingsView** (`src/views/SettingsView.tsx`)
   - Toggle button groups
   - Section cards
   - Action buttons

4. **LoginScreen** (`src/views/LoginScreen.tsx`)
   - Background and container
   - Sign-in button with gradient
   - Text styling

5. **Components**
   - `CategoryLearningPrompt.tsx` - Modal styling
   - `Nav.tsx` - Already updated but verify integration
   - Any other shared components

### Theme Implementation Options

**Option A: CSS Variables in index.css**
- Add :root variables to src/index.css
- Use style={{ color: 'var(--primary)' }} in components
- Pros: Standard CSS, works everywhere
- Cons: Can't use Tailwind utilities directly

**Option B: Tailwind Config Extension**
- Extend Tailwind with theme colors
- Add custom utilities like `bg-surface`, `text-primary`
- Pros: Tailwind-native, consistent with existing code
- Cons: Requires config changes

**Recommended: Hybrid Approach**
- Add CSS variables for the theme
- Create a few Tailwind utilities for common patterns
- Use inline styles for dynamic theme values

### Dependency on Previous Stories

This story depends on **Story 7.11 (Floating Download FAB) being complete**.

### Testing Strategy

```bash
# During development
npx tsc --noEmit
npm run test:unit
npm run test:integration

# Before marking story as "review"
npm run test:all

# Manual verification
- Check all views in light mode
- Check all views in dark mode
- Verify visual consistency
```

### References

- [Source: docs/ux-design-directions.html](docs/ux-design-directions.html) - Theme definitions
- [Source: docs/architecture-epic7.md](docs/architecture-epic7.md) - Epic 7 architecture
- [Source: docs/prd-epic7.md](docs/prd-epic7.md) - PRD requirements

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/epic7/7-12-app-wide-theme-consistency.context.xml](7-12-app-wide-theme-consistency.context.xml) - Generated 2025-12-07

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. **CSS Custom Properties**: Added comprehensive theme variables to `index.html` with `:root` for light mode and `.dark` class for dark mode. Variables include: --bg, --surface, --primary, --secondary, --accent, --success, --warning, --error, and chart colors.

2. **App.tsx Theme Integration**: Modified to apply `dark` class to root container when theme is 'dark', enabling CSS variable overrides. Uses `style` props with `var()` for background and text colors.

3. **DashboardView**: Full update with CSS variables - cards use `var(--surface)`, hover states change border to `var(--accent)`, headers use `var(--primary)` and `var(--secondary)`.

4. **EditView**: Comprehensive update - form fields use CSS variable-based `inputStyle`, cards use `cardStyle`, buttons use accent gradients. Header alignment fixed with placeholder for consistency.

5. **SettingsView**: Toggle buttons now match ChartModeToggle pattern - outlined container with `var(--accent)` for active state. All icons now have consistent `strokeWidth={2}`.

6. **LoginScreen**: Uses dark gradient background (`#0f172a` to `#1e293b`), accent gradient for app icon, clean sign-in button with hover/active transforms.

7. **CategoryLearningPrompt**: Fully converted to CSS variables - modal uses `var(--surface)`, items use themed backgrounds, buttons use accent gradients.

8. **Nav Component**: Updated to use `var(--surface)` for background, `var(--accent)` and `var(--secondary)` for active/inactive states, scan button uses accent gradient.

9. **HistoryView**: Transaction cards with CSS variables, hover states with accent border, pagination buttons with theme styling.

10. **Color Theme Selector (AC#11)**: Added `colorTheme` state with 'default' and 'ghibli' options. The `data-theme` attribute is applied to the root container to activate color theme CSS variables. Persisted to localStorage for user preference retention.

11. **Ghibli/Ni no Kuni Theme**: Added `[data-theme="ghibli"]` CSS variable definitions in index.html with warm, natural colors inspired by Studio Ghibli. Includes both light and dark mode variants (4 total theme combinations: default-light, default-dark, ghibli-light, ghibli-dark).

12. **SettingsView Color Theme Toggle**: Added Palette icon and toggle section for color theme selection (Default/Ghibli). Uses same styling pattern as other settings toggles.

13. **Translations**: Added colorTheme, colorThemeDefault, colorThemeGhibli keys for both English and Spanish.

### File List

- `index.html` - Added CSS custom properties for theme system + Ghibli theme
- `src/App.tsx` - Updated to apply dark class, data-theme attribute, and colorTheme state
- `src/views/DashboardView.tsx` - Updated to use CSS variables
- `src/views/EditView.tsx` - Updated to use CSS variables
- `src/views/SettingsView.tsx` - Updated to match ChartModeToggle pattern + color theme toggle
- `src/views/LoginScreen.tsx` - Updated with gradient theme
- `src/views/HistoryView.tsx` - Updated to use CSS variables
- `src/components/Nav.tsx` - Updated to use CSS variables
- `src/components/CategoryLearningPrompt.tsx` - Updated to use CSS variables
- `src/types/settings.ts` - Added ColorTheme type
- `src/utils/translations.ts` - Added color theme translations

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Story created to ensure app-wide visual consistency with new analytics theme | SM Agent |
| 2025-12-08 | Implementation complete - all views updated to use CSS variables theme system | Dev Agent |
| 2025-12-08 | AC#11 added - Color theme selector implemented with Default and Ghibli themes | Dev Agent |

---

## Code Review Record

### Review Date
2025-12-08

### Reviewer
Senior Dev Review Agent (Claude Opus 4.5)

### Review Outcome
**✅ APPROVED**

### Acceptance Criteria Verification

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| #1 | Dashboard card styling | ✅ PASS | DashboardView.tsx:57-68 - rounded-xl, var(--surface), subtle borders |
| #2 | Transaction hover states | ✅ PASS | DashboardView.tsx:127-159 - border-color changes to var(--accent) |
| #3 | Edit view form styling | ✅ PASS | EditView.tsx:102-116 - cardStyle, inputStyle using CSS vars |
| #4 | Settings toggle styling | ✅ PASS | SettingsView.tsx:62-73 - Matches ChartModeToggle pattern |
| #5 | Login screen accent colors | ✅ PASS | LoginScreen.tsx:14-34 - Gradient accent, surface styling |
| #6 | CSS custom properties | ✅ PASS | index.html:9-82 - Full variable set defined |
| #7 | Dark mode consistency | ✅ PASS | index.html:30-40 - .dark class overrides |
| #8 | Header consistency | ✅ PASS | All views use text-2xl font-bold, CSS var colors |
| #9 | Empty state styling | ✅ PASS | Consistent 24px icons, text hierarchy |
| #10 | Modal dialogs | ✅ PASS | CategoryLearningPrompt.tsx:160-276 - Full theme integration |
| #11 | Color theme selector | ✅ PASS | SettingsView.tsx:172-195, App.tsx:52-56 - Ghibli theme |

### Test Results

| Test Suite | Result | Count |
|------------|--------|-------|
| TypeScript compilation | ✅ PASS | 0 errors |
| Unit tests | ✅ PASS | 634/634 |

### Code Quality Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| Standards compliance | Excellent | All patterns followed consistently |
| TypeScript usage | Excellent | Zero compilation errors |
| CSS variable adoption | Excellent | All views use CSS variables |
| Touch target compliance | Excellent | 44px min targets throughout |
| Icon consistency | Excellent | 24px, strokeWidth 2 |

### Security Review
No security concerns identified.

### Performance Review
No performance regressions. Inline styles have negligible impact at this scale.

### Technical Debt
None introduced. Clean implementation.

### Action Items
None required.
