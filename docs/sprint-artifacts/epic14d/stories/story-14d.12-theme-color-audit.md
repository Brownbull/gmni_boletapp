# Story 14d.12: Theme Color Consistency Audit

**Epic:** 14d - Scan Architecture Refactor
**Points:** 3
**Priority:** MEDIUM
**Status:** Ready for Dev
**Depends On:** None (can be done in parallel with other work)

## Description

Audit all UI components to ensure they use CSS theme variables instead of hardcoded Tailwind color classes. This ensures consistent theming across Nature, Modern, and Minimalist themes in both light and dark modes.

## Background

During Story 14d.4b testing, we discovered that some components (like TrustMerchantPrompt) were using hardcoded Tailwind colors (`bg-green-600`, `border-slate-300`) instead of CSS variables (`var(--primary)`, `var(--border-light)`). This causes visual inconsistency when users switch themes.

### The Problem

Components using hardcoded colors like:
- `bg-green-600` instead of `var(--primary)` or `var(--success)`
- `text-slate-700` instead of `var(--text-primary)`
- `border-slate-300` instead of `var(--border-light)`
- `bg-blue-100` instead of `var(--primary-light)`

### Available CSS Variables

From `index.html`, the following CSS variables are defined for each theme:

**Colors:**
```css
--primary          /* Main brand color (forest green in Nature) */
--primary-hover    /* Hover state for primary */
--primary-light    /* Light tint of primary */
--secondary        /* Secondary accent color */
--success          /* Success state color */
--warning          /* Warning state color */
--error            /* Error state color */
```

**Text:**
```css
--text-primary     /* Main text color */
--text-secondary   /* Muted/secondary text */
--text-tertiary    /* Even more muted text */
--text-muted       /* Most muted text */
```

**Backgrounds:**
```css
--bg-primary       /* Main background */
--bg-secondary     /* Card/elevated background */
--bg-tertiary      /* Subtle background differentiation */
```

**Borders:**
```css
--border-light     /* Light borders */
--border-medium    /* Medium borders */
```

## Deliverables

### Phase 1: Audit (Research)

1. **Scan all components** for hardcoded Tailwind color classes
2. **Document findings** in a checklist format
3. **Prioritize** by visibility/frequency of use

### Phase 2: Fix (Implementation)

1. **Update each component** to use CSS variables via `style={{ }}` or custom classes
2. **Test each fix** in all 3 themes × 2 modes = 6 combinations
3. **Verify no regressions** in existing functionality

## Technical Specification

### Search Patterns for Hardcoded Colors

Use these grep patterns to find potential issues:

```bash
# Hardcoded greens (should be --primary or --success)
grep -rn "bg-green-\|text-green-\|border-green-" src/components/

# Hardcoded blues (should be --primary or --secondary)
grep -rn "bg-blue-\|text-blue-\|border-blue-" src/components/

# Hardcoded slates/grays (should be --text-*, --bg-*, --border-*)
grep -rn "bg-slate-\|text-slate-\|border-slate-" src/components/
grep -rn "bg-gray-\|text-gray-\|border-gray-" src/components/

# Hardcoded reds/oranges (should be --error or --warning)
grep -rn "bg-red-\|text-red-\|border-red-" src/components/
grep -rn "bg-orange-\|text-orange-\|border-orange-\|bg-amber-\|text-amber-" src/components/
```

### Replacement Pattern

**Before (hardcoded):**
```tsx
<button className="bg-green-600 hover:bg-green-700 text-white">
  Save
</button>
```

**After (themed):**
```tsx
<button
  className="text-white transition-colors"
  style={{
    backgroundColor: 'var(--primary)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
>
  Save
</button>
```

Or for simpler cases without hover:
```tsx
<div style={{
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-light)',
}}>
```

### Components Already Fixed (Reference)

- `TrustMerchantPrompt.tsx` - Fixed in Story 14d.4b code review

### Known Components to Audit

Based on codebase patterns, likely candidates:

**High Priority (User-facing dialogs/modals):**
- [ ] `src/components/scan/CurrencyMismatchDialog.tsx`
- [ ] `src/components/scan/TotalMismatchDialog.tsx`
- [ ] `src/components/scan/QuickSaveCard.tsx`
- [ ] `src/components/scan/ScanCompleteModal.tsx`
- [ ] `src/components/batch/ConfirmationDialog.tsx`
- [ ] `src/components/batch/CreditWarningDialog.tsx`

**Medium Priority (Common UI elements):**
- [ ] `src/components/Nav.tsx`
- [ ] `src/components/CategorySelectorOverlay.tsx`
- [ ] `src/components/ProfileDropdown.tsx`
- [ ] `src/components/InsightCard.tsx`

**Lower Priority (Settings/Admin):**
- [ ] `src/components/settings/*`
- [ ] `src/components/TrustedMerchantsList.tsx`

## Acceptance Criteria

### AC1: Audit Complete
- [ ] All components in `src/components/` scanned for hardcoded colors
- [ ] Findings documented with file:line references
- [ ] Components prioritized by impact

### AC2: High Priority Fixed
- [ ] All dialog/modal components use CSS variables
- [ ] Tested in Nature theme (light + dark)
- [ ] Tested in Modern theme (light + dark)
- [ ] Tested in Minimalist theme (light + dark)

### AC3: Medium Priority Fixed
- [ ] Navigation and common UI components use CSS variables
- [ ] No visual regressions in any theme/mode combination

### AC4: Documentation Updated
- [ ] Component styling guidelines documented (if not already)
- [ ] CSS variable reference added to developer docs

### AC5: No Regression
- [ ] All existing tests pass
- [ ] Manual smoke test of main user flows

## Out of Scope

- Changes to the CSS variables themselves (that's a design decision)
- Adding new themes
- Refactoring to use a CSS-in-JS solution
- Views in `src/views/` (focus on reusable components first)

## Testing Strategy

### Manual Testing Matrix

For each fixed component, test in:

| Theme | Mode | Status |
|-------|------|--------|
| Nature | Light | [ ] |
| Nature | Dark | [ ] |
| Modern | Light | [ ] |
| Modern | Dark | [ ] |
| Minimalist | Light | [ ] |
| Minimalist | Dark | [ ] |

### Automated Testing

- Existing component tests should still pass
- No new tests required (this is a styling change)

## Notes

- Prefer `style={{ }}` over creating new CSS classes for one-off fixes
- For buttons with hover states, may need `onMouseEnter`/`onMouseLeave` handlers
- Some components intentionally use specific colors (e.g., error states = red) - use `--error` variable
- White text on colored buttons should remain `text-white` (not themed)
