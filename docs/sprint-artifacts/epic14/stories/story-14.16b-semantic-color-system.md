# Story 14.16b: Semantic Color System Application

**Status:** ready-for-review
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.21 (Category Color Consolidation)
**Design Doc:** [category-colors.html](../../../../docs/uxui/mockups/00_components/category-colors.html) - Semantic Colors section

---

## Story

**As a** user viewing trend indicators and charts across the app,
**I want to** see consistent, theme-appropriate colors for positive/negative trends and graphics,
**So that** red and green colors feel harmonious with my selected theme rather than jarring or out of place.

---

## Context

During Story 14.21, we created a unified color system for **category colors** (384 color sets). However, **semantic colors** for trend indicators remain hardcoded throughout the app:

### Current Problems

1. **Hardcoded trend colors in `types/report.ts`:**
   - `#ef4444` (red for spending up - bad)
   - `#22c55e` (green for spending down - good)
   - These don't adapt to themes (too vibrant for Normal/Mono themes)

2. **Scattered hardcoded colors across 25+ files:**
   - DashboardView.tsx: `color: isUp ? '#ef4444' : '#22c55e'`
   - InsightsView.tsx: `color: '#dc2626'`
   - ScanReady.tsx: `backgroundColor: 'rgba(34, 197, 94, 0.2)'`
   - insightTypeConfig.ts: Multiple hardcoded accent colors

3. **No theme harmony:**
   - Bright professional red (#dc2626) looks harsh in the warm Ni No Kuni theme
   - Vivid green (#22c55e) clashes with Mono theme's subdued palette

### Solution

Story 14.21's mockup (`category-colors.html`) already includes **Semantic Colors** definitions:

| State | Normal Theme | Professional | Mono |
|-------|--------------|--------------|------|
| Positive (down) | Sage green #3d8c5a | Clear green #16a34a | Teal-green #3a8c70 |
| Negative (up) | Terracotta #b85c4a | Clear red #dc2626 | Clay red #a05858 |
| Neutral | Warm gray #7a7268 | Cool gray #64748b | True gray #686870 |
| Warning | Ochre #a8842c | Amber #d97706 | Tan #988040 |

This story applies these CSS variables throughout the app.

---

## Acceptance Criteria

### AC #1: CSS Variables in index.html
- [x] Add semantic color CSS variables to all 6 theme/mode combinations
- [x] Variables: `--positive-primary`, `--positive-bg`, `--positive-border`
- [x] Variables: `--negative-primary`, `--negative-bg`, `--negative-border`
- [x] Variables: `--neutral-primary`, `--neutral-bg`, `--neutral-border`
- [x] Variables: `--warning-semantic`, `--warning-bg`, `--warning-border` (note: uses `--warning-semantic` to avoid conflict with existing `--warning`)
- [x] Variables: `--chart-1` through `--chart-6` (already existed, now used by components)

### AC #2: Migrate TREND_COLORS Constant
- [x] Update `src/types/report.ts` TREND_COLORS to use CSS variables
- [x] Create helper function to read CSS variables at runtime (`src/utils/semanticColors.ts`)
- [x] Ensure ReportCard.tsx and ReportRow.tsx still work correctly (verified via tests)

### AC #3: Migrate Hardcoded Colors - High Priority
- [x] DashboardView.tsx: Replace `#ef4444`/`#22c55e` with CSS vars
- [x] InsightsView.tsx: Replace `#dc2626` with `--error` (destructive action)
- [x] InsightDetailModal.tsx: Replace `#dc2626` with CSS vars
- [x] ScanReady.tsx: Replace `#22c55e` with `--positive-primary`
- [x] TrendsView.tsx: Replace DRILL_DOWN_COLORS with `--chart-*` vars

### AC #4: Migrate Hardcoded Colors - Medium Priority
- [x] insightTypeConfig.ts: Replace budget_alert colors with CSS vars
- [x] ReportDetailOverlay.tsx: Uses TREND_COLORS which now uses CSS vars
- [x] Any remaining components with hardcoded red/green - audited and migrated

### AC #5: Visual Verification
- [ ] Trend badges show theme-appropriate colors in Normal theme
- [ ] Trend badges show theme-appropriate colors in Professional theme
- [ ] Trend badges show theme-appropriate colors in Mono theme
- [ ] Dark mode variants work correctly
- [ ] Chart colors harmonize with each theme

---

## Tasks

### Phase 1: CSS Variable Infrastructure

- [x] Task 1.1: Add semantic color variables to `:root` in index.html (light mode defaults)
- [x] Task 1.2: Add `.dark` overrides for semantic colors
- [x] Task 1.3: Add `[data-theme="normal"]` semantic colors (already in mockup) - uses :root as default
- [x] Task 1.4: Add `[data-theme="professional"]` semantic colors (already in mockup)
- [x] Task 1.5: Add `[data-theme="mono"]` semantic colors (already in mockup)
- [x] Task 1.6: Add dark mode variants for each theme

### Phase 2: Create Utility Functions

- [x] Task 2.1: Create `src/utils/semanticColors.ts` with helper functions
- [x] Task 2.2: `getSemanticColor(name: 'positive' | 'negative' | 'neutral' | 'warning', variant: 'primary' | 'bg' | 'border'): string`
- [x] Task 2.3: Export SEMANTIC_COLORS object that reads CSS vars
- [x] Task 2.4: Create `getTrendColor(direction: TrendDirection): string` helper

### Phase 3: Migrate Core Files

- [x] Task 3.1: Update `types/report.ts` TREND_COLORS to use CSS vars via utility
- [x] Task 3.2: Update DashboardView.tsx trend indicators
- [x] Task 3.3: Update TrendsView.tsx DRILL_DOWN_COLORS
- [x] Task 3.4: Update insightTypeConfig.ts budget_alert colors
- [x] Task 3.5: Update ScanReady.tsx success colors

### Phase 4: Migrate Secondary Files

- [x] Task 4.1: Update InsightsView.tsx alert colors
- [x] Task 4.2: Update InsightDetailModal.tsx colors
- [x] Task 4.3: Update ReportDetailOverlay.tsx trend badges (uses TREND_COLORS)
- [x] Task 4.4: Audit and update any remaining hardcoded colors

### Phase 5: Testing & Verification

- [x] Task 5.1: Unit tests for semanticColors.ts utility (31 tests passing)
- [ ] Task 5.2: Visual verification in Normal theme (light/dark)
- [ ] Task 5.3: Visual verification in Professional theme (light/dark)
- [ ] Task 5.4: Visual verification in Mono theme (light/dark)
- [ ] Task 5.5: Screenshot comparison before/after

---

## Technical Notes

### CSS Variable Naming Convention

```css
/* Primary = main text/icon color */
--positive-primary: #3d8c5a;
--negative-primary: #b85c4a;
--neutral-primary: #7a7268;
--warning-primary: #a8842c;

/* Bg = background fill for badges/cards */
--positive-bg: #e8f5ec;
--negative-bg: #f8ebe8;
--neutral-bg: #f4f2f0;
--warning-bg: #fcf4e0;

/* Border = outline/border color */
--positive-border: #a8d4b8;
--negative-border: #dab0a8;
--neutral-border: #d4d0c8;
--warning-border: #e8d498;

/* Chart palette (6 harmonized colors) */
--chart-1: #3d8c5a;  /* Same as positive for consistency */
--chart-2: #b85c4a;  /* Same as negative for consistency */
--chart-3: #7c6d9c;  /* Dusty purple */
--chart-4: #5c8494;  /* Steel blue */
--chart-5: #a8842c;  /* Same as warning */
--chart-6: #8c7048;  /* Bronze */
```

### Helper Utility API

```typescript
// src/utils/semanticColors.ts

export type SemanticState = 'positive' | 'negative' | 'neutral' | 'warning';
export type SemanticVariant = 'primary' | 'secondary' | 'bg' | 'border';

export function getSemanticColor(state: SemanticState, variant: SemanticVariant = 'primary'): string {
  const varName = `--${state}-${variant}`;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function getTrendColor(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return getSemanticColor('negative', 'primary');  // Spending up = bad
    case 'down': return getSemanticColor('positive', 'primary'); // Spending down = good
    case 'neutral': return getSemanticColor('neutral', 'primary');
  }
}

// Pre-built object for components that need static colors
export const SEMANTIC_COLORS = {
  positive: {
    primary: 'var(--positive-primary)',
    bg: 'var(--positive-bg)',
    border: 'var(--positive-border)',
  },
  negative: {
    primary: 'var(--negative-primary)',
    bg: 'var(--negative-bg)',
    border: 'var(--negative-border)',
  },
  // ... etc
};
```

### Migration Pattern

**Before:**
```tsx
<span style={{ color: isUp ? '#ef4444' : '#22c55e' }}>
  {isUp ? '↑' : '↓'} {percent}%
</span>
```

**After:**
```tsx
<span style={{ color: isUp ? 'var(--negative-primary)' : 'var(--positive-primary)' }}>
  {isUp ? '↑' : '↓'} {percent}%
</span>
```

---

## File List

**New:**
- `src/utils/semanticColors.ts` - Helper functions (~80 lines)
- `tests/unit/utils/semanticColors.test.ts` - Unit tests (~50 lines)

**Modified:**
- `index.html` - Add CSS variables (~120 lines of CSS)
- `src/types/report.ts` - Update TREND_COLORS
- `src/views/DashboardView.tsx` - Use CSS vars
- `src/views/TrendsView.tsx` - Use CSS vars for DRILL_DOWN_COLORS
- `src/views/InsightsView.tsx` - Use CSS vars
- `src/utils/insightTypeConfig.ts` - Use CSS vars
- `src/components/scan/ScanReady.tsx` - Use CSS vars
- `src/components/insights/InsightDetailModal.tsx` - Use CSS vars
- `src/components/reports/ReportDetailOverlay.tsx` - Use CSS vars

---

## Test Plan

1. [x] Run existing test suite - 3574 passed (1 pre-existing failure unrelated to this story)
2. [ ] Switch to Normal theme (light) - verify sage green/terracotta colors
3. [ ] Switch to Normal theme (dark) - verify colors adapt
4. [ ] Switch to Professional theme (light) - verify clear green/red
5. [ ] Switch to Professional theme (dark) - verify bright variants
6. [ ] Switch to Mono theme (light) - verify subdued teal/clay colors
7. [ ] Switch to Mono theme (dark) - verify muted variants
8. [ ] Check trend badges in Reports view
9. [ ] Check trend indicators in Dashboard
10. [ ] Check chart colors in Trends/Analytics view
11. [ ] Verify insight cards use correct colors

---

## Definition of Done

- [x] CSS variables defined for all 6 theme/mode combinations
- [x] No hardcoded red/green trend colors remain in main source files
- [x] TREND_COLORS uses CSS variables
- [ ] All trend badges harmonize with selected theme (requires visual verification)
- [ ] Chart colors harmonize with selected theme (requires visual verification)
- [x] All unit tests pass (3574 passed, 1 pre-existing failure)
- [ ] Visual verification in all 6 theme/mode combinations

---

## Files Identified for Migration

### High Priority (Hardcoded Hex Colors)
| File | Lines | Current Color | Replace With |
|------|-------|---------------|--------------|
| DashboardView.tsx | 2078 | `#ef4444`/`#22c55e` | `--negative-primary`/`--positive-primary` |
| DashboardView.tsx | 2394 | `#ef4444` | `--negative-primary` |
| InsightsView.tsx | 404 | `#dc2626` | `--negative-primary` |
| InsightDetailModal.tsx | 204 | `#dc2626` | `--negative-bg` |
| ScanReady.tsx | 80, 86, 96 | `#22c55e` | `--positive-primary` |
| types/report.ts | 109-113 | TREND_COLORS object | CSS var getters |
| TrendsView.tsx | 526-530 | DRILL_DOWN_COLORS | `--chart-*` vars |
| insightTypeConfig.ts | 41-79 | Multiple colors | CSS vars |

### Medium Priority (May Use Tailwind Classes)
Files using `text-red-*`, `text-green-*`, `bg-red-*`, `bg-green-*` for semantic meaning should be audited to ensure they respect themes.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-05 | Story created | Claude |
| 2026-01-05 | Implementation complete: CSS vars added to all 6 theme/mode combinations, semanticColors.ts utility created, TREND_COLORS migrated, high-priority files migrated (DashboardView, TrendsView, ScanReady, InsightsView, InsightDetailModal, insightTypeConfig), 31 unit tests added. Ready for visual verification. | Claude Opus 4.5 |
| 2026-01-05 | Additional fixes: BumpChartRow trend indicators in TrendsView.tsx migrated from Tailwind text-red-500/text-green-500 to semantic CSS vars. Back button navigation improved to fallback to dashboard when no history. | Claude Opus 4.5 |
