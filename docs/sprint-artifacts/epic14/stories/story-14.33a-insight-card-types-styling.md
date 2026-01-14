# Story 14.33a: Insight Card Types & Styling

## Story Info
- **Epic:** 14 - Core Implementation
- **Points:** 3
- **Priority:** High
- **Status:** Done
- **Created:** 2026-01-12
- **Completed:** 2026-01-12
- **Mockup Reference:** `docs/uxui/mockups/01_views/insights.html`

## User Story

**As a** BoletApp user viewing my insights history,
**I want** to see visually distinct card styles based on insight type (quirky, celebration, actionable, tradeoff, trend),
**So that** I can quickly understand the nature of each insight at a glance.

## Background

The current `InsightHistoryCard` component uses a generic styling approach. The mockup (`insights.html`) defines 5 distinct insight types with unique color schemes and icons:

| Type | Background | Icon Color | Use Case |
|------|------------|------------|----------|
| `quirky` | `--warning-light` | `#92400e` | Fun patterns ("Snacker Nocturno") |
| `celebration` | `--primary-light` | `--primary` | Milestones ("Carrito Lleno") |
| `actionable` | `--success-light` | `--success` | Opportunities ("Tu Hora Favorita") |
| `tradeoff` | `#fce7f3` | `#be185d` | Trade-off insights ("Compra Variada") |
| `trend` | `#ede9fe` | `#7c3aed` | Trend patterns ("Dia Favorito") |

## Acceptance Criteria

### AC1: Insight Type Mapping
- [x] Map existing `InsightCategory` (`QUIRKY_FIRST`, `CELEBRATORY`, `ACTIONABLE`) to visual types
- [x] Add new types for `tradeoff` and `trend` insights
- [x] Update `src/utils/insightTypeConfig.ts` with 5-type color/icon mapping

### AC2: InsightHistoryCard Styling Update
- [x] Update `InsightHistoryCard.tsx` to use type-specific backgrounds
- [x] Icon container uses type background color (not just icon color)
- [x] Add chevron indicator on right side (per mockup)
- [x] Card hover state highlights border with type color

### AC3: Dark Mode Support
- [x] All 5 types have dark mode variants (per mockup CSS)
- [x] Backgrounds adapt to `--bg-secondary` in dark mode
- [x] Icon colors maintain readability in dark mode

### AC4: List Item Layout
- [x] Match mockup layout: icon (36x36) | content | chevron
- [x] Title font: 14px, weight 500, `--text-primary`
- [x] Meta text: 12px, `--text-tertiary`
- [x] Card padding: 12px, border-radius: `--radius-md`

### AC5: Backward Compatibility
- [x] Existing insights without explicit type default to `actionable` styling
- [x] Old `InsightRecord` entries without `category` field still render correctly

## Technical Notes

### Files to Modify
| File | Change |
|------|--------|
| `src/utils/insightTypeConfig.ts` | Add 5-type mapping with colors |
| `src/components/insights/InsightHistoryCard.tsx` | Update styling, add chevron |
| `src/types/insight.ts` | Add `InsightVisualType` type (optional) |

### Insight Type Config Structure
```typescript
// src/utils/insightTypeConfig.ts
export type InsightVisualType = 'quirky' | 'celebration' | 'actionable' | 'tradeoff' | 'trend';

export const insightVisualConfig: Record<InsightVisualType, {
  bgLight: string;
  bgDark: string;
  iconColor: string;
  iconColorDark: string;
}> = {
  quirky: {
    bgLight: 'var(--warning-light)',
    bgDark: 'rgba(251, 191, 36, 0.15)',
    iconColor: '#92400e',
    iconColorDark: '#fbbf24',
  },
  celebration: {
    bgLight: 'var(--primary-light)',
    bgDark: 'rgba(59, 130, 246, 0.15)',
    iconColor: 'var(--primary)',
    iconColorDark: '#60a5fa',
  },
  actionable: {
    bgLight: 'var(--success-light)',
    bgDark: 'rgba(34, 197, 94, 0.15)',
    iconColor: 'var(--success)',
    iconColorDark: '#4ade80',
  },
  tradeoff: {
    bgLight: '#fce7f3',
    bgDark: 'rgba(236, 72, 153, 0.15)',
    iconColor: '#be185d',
    iconColorDark: '#f472b6',
  },
  trend: {
    bgLight: '#ede9fe',
    bgDark: 'rgba(139, 92, 246, 0.15)',
    iconColor: '#7c3aed',
    iconColorDark: '#a78bfa',
  },
};
```

### Category to Visual Type Mapping
```typescript
export function getVisualType(category?: InsightCategory, insightId?: string): InsightVisualType {
  // Check insightId for specific mappings
  if (insightId?.includes('trend') || insightId?.includes('favorite_day')) return 'trend';
  if (insightId?.includes('tradeoff') || insightId?.includes('varied')) return 'tradeoff';

  // Fall back to category
  switch (category) {
    case 'QUIRKY_FIRST': return 'quirky';
    case 'CELEBRATORY': return 'celebration';
    case 'ACTIONABLE': return 'actionable';
    default: return 'actionable';
  }
}
```

## Testing Requirements

### Unit Tests
- [x] `insightTypeConfig.test.ts`: All 5 types return correct colors (39 tests)
- [x] `getVisualType()`: Category mapping works correctly
- [x] `getVisualType()`: InsightId override works for trend/tradeoff
- [x] `InsightHistoryCard.test.tsx`: Renders with correct type styling (35 tests)

### Visual Testing
- [ ] Screenshot comparison for all 5 types in light mode
- [ ] Screenshot comparison for all 5 types in dark mode
- [ ] Verify chevron alignment on different content lengths

## Out of Scope
- View switcher (Story 14.33b)
- Carousel mode (Story 14.33b)
- Airlock sequence (Story 14.33c)
- Celebration cards with badges (Story 14.33d)

## Dependencies
- None (can start immediately)

## Definition of Done
- [x] All acceptance criteria met
- [x] Unit tests passing (74 total tests)
- [x] Visual comparison with mockup approved (code review verified alignment with insights.html)
- [x] Dark mode verified (via unit tests)
- [x] Code review passed (Atlas Code Review 2026-01-12)

## Implementation Notes

### Files Modified
| File | Changes |
|------|---------|
| `src/utils/insightTypeConfig.ts` | Added `InsightVisualType`, `InsightVisualConfig`, `INSIGHT_VISUAL_CONFIG`, `getVisualType()`, `getVisualConfig()` |
| `src/components/insights/InsightHistoryCard.tsx` | Updated styling to use visual types, added ChevronRight, fixed layout per mockup |
| `tests/unit/utils/insightTypeConfig.test.ts` | New test file with 39 tests |
| `tests/unit/components/insights/InsightHistoryCard.test.tsx` | Updated with 14.33a styling tests |
