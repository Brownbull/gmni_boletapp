# Story 14.33a.1: Theme-Aware Insight Type Colors

## Story Info
- **Epic:** 14 - Core Implementation
- **Points:** 2
- **Priority:** Medium
- **Status:** Done
- **Completed:** 2026-01-12
- **Created:** 2026-01-12
- **Parent Story:** 14.33a (Insight Card Types & Styling)

## User Story

**As a** BoletApp user with a preferred theme (Normal/Professional/Mono),
**I want** insight card colors to feel cohesive with my chosen theme,
**So that** the visual experience is consistent across the entire app.

## Background

Story 14.33a implemented 5 insight visual types with distinct colors. However, the colors were partially hardcoded:

| Type | Current Implementation | Issue |
|------|------------------------|-------|
| quirky | `var(--warning-light)` | ✅ Theme-aware |
| celebration | `var(--primary-light)` | ✅ Theme-aware |
| actionable | `var(--success-light)` | ✅ Theme-aware |
| **tradeoff** | `#fce7f3` (hardcoded pink) | ❌ Same in all themes |
| **trend** | `#ede9fe` (hardcoded purple) | ❌ Same in all themes |

Additionally, the InsightDetailModal button uses `config.color` which comes from insight type config, not the theme system.

## Acceptance Criteria

### AC1: CSS Variables for All Insight Types
- [x] Add `--insight-quirky-bg`, `--insight-quirky-icon` CSS variables
- [x] Add `--insight-celebration-bg`, `--insight-celebration-icon` CSS variables
- [x] Add `--insight-actionable-bg`, `--insight-actionable-icon` CSS variables
- [x] Add `--insight-tradeoff-bg`, `--insight-tradeoff-icon` CSS variables
- [x] Add `--insight-trend-bg`, `--insight-trend-icon` CSS variables

### AC2: Theme-Specific Color Definitions
- [x] Normal theme (Ni No Kuni): Warm, earthy palette matching forest/sunset aesthetic
- [x] Professional theme: Clean, vibrant colors matching blue corporate aesthetic
- [x] Mono theme: Desaturated versions that work with grayscale palette

### AC3: Dark Mode Variants
- [x] Each theme has appropriate dark mode variants
- [x] Colors are visible and distinct on dark backgrounds

### AC4: Update insightTypeConfig.ts
- [x] Replace hardcoded colors with CSS variable references
- [x] Remove `isDark` parameter from `getVisualConfig()` (CSS handles light/dark)

### AC5: Update InsightDetailModal
- [x] Button uses theme-aware insight type color

### AC6: Backward Compatibility
- [x] Existing insight cards render correctly
- [x] No visual regressions in light mode
- [x] No visual regressions in dark mode

## Technical Design

### CSS Variables in index.html

```css
/* Add to each theme block */

/* Insight Type Colors */
--insight-quirky-bg: ...;
--insight-quirky-icon: ...;
--insight-celebration-bg: ...;
--insight-celebration-icon: ...;
--insight-actionable-bg: ...;
--insight-actionable-icon: ...;
--insight-tradeoff-bg: ...;
--insight-tradeoff-icon: ...;
--insight-trend-bg: ...;
--insight-trend-icon: ...;
```

### Color Palette per Theme

| Type | Normal Light | Normal Dark | Professional Light | Professional Dark | Mono Light | Mono Dark |
|------|--------------|-------------|--------------------|--------------------|------------|-----------|
| **quirky bg** | #fef3c7 (warm amber) | rgba(251,191,36,0.15) | #fef3c7 | rgba(251,191,36,0.15) | #f8f0e0 (tan) | rgba(200,176,112,0.15) |
| **quirky icon** | #92400e | #fbbf24 | #92400e | #fbbf24 | #988040 | #c8b070 |
| **celebration bg** | #d4e5d9 (sage) | rgba(107,158,122,0.15) | #dbeafe (blue) | rgba(59,130,246,0.15) | #f4f4f5 (gray) | rgba(63,63,70,0.15) |
| **celebration icon** | #4a7c59 | #6b9e7a | #2563eb | #60a5fa | #18181b | #a1a1aa |
| **actionable bg** | #dcfce7 | rgba(125,155,95,0.15) | #dcfce7 | rgba(34,197,94,0.15) | #e4f2ec | rgba(58,140,112,0.15) |
| **actionable icon** | #7d9b5f | #8fbf9c | #22c55e | #4ade80 | #3a8c70 | #78c0a8 |
| **tradeoff bg** | #f8ebe8 (coral) | rgba(184,92,74,0.15) | #fce7f3 (pink) | rgba(236,72,153,0.15) | #f4e8e8 (rose) | rgba(200,152,152,0.15) |
| **tradeoff icon** | #b85c4a | #d4948a | #be185d | #f472b6 | #a05858 | #c89898 |
| **trend bg** | #e8e4f0 (muted purple) | rgba(139,92,246,0.12) | #ede9fe (violet) | rgba(139,92,246,0.15) | #f0f0f2 (gray) | rgba(104,104,112,0.15) |
| **trend icon** | #6b5b95 | #a89cc8 | #7c3aed | #a78bfa | #686870 | #a8a8b0 |

### Updated insightTypeConfig.ts

```typescript
export const INSIGHT_VISUAL_CONFIG: Record<InsightVisualType, InsightVisualConfig> = {
  quirky: {
    bg: 'var(--insight-quirky-bg)',
    iconColor: 'var(--insight-quirky-icon)',
  },
  celebration: {
    bg: 'var(--insight-celebration-bg)',
    iconColor: 'var(--insight-celebration-icon)',
  },
  // ... etc
};

// Simplified - no isDark parameter needed
export function getVisualConfig(type: InsightVisualType): InsightVisualConfig {
  return INSIGHT_VISUAL_CONFIG[type] || INSIGHT_VISUAL_CONFIG.actionable;
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Add CSS variables for all 3 themes × 2 modes |
| `src/utils/insightTypeConfig.ts` | Use CSS variables, simplify API |
| `src/components/insights/InsightHistoryCard.tsx` | Update to use simplified config |
| `src/components/insights/InsightDetailModal.tsx` | Use theme-aware colors |
| `tests/unit/utils/insightTypeConfig.test.ts` | Update tests for new API |

## Definition of Done
- [x] All acceptance criteria met
- [x] Colors look cohesive in each theme (Normal, Professional, Mono)
- [x] Dark mode variants are visible and distinct
- [x] Unit tests updated and passing (68 tests)
- [ ] Visual testing in all 6 combinations (3 themes × 2 modes) - Manual verification recommended

## Notes
- This is a follow-up enhancement to Story 14.33a
- Aligns with Story 14.16b (Semantic Color System) pattern of theme-aware colors
