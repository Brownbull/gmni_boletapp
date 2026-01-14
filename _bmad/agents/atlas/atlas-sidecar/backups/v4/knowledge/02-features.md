# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2026-01-10
> Last Optimized: 2026-01-10 (Generation 3)
> Sources: sprint-status.yaml, epics.md, PRD documents

## Core Features (Implemented)

| Feature | Purpose | Epic |
|---------|---------|------|
| Receipt Scanning | AI-powered OCR extracts transaction data | Epic 1 |
| Transaction Management | CRUD operations for transactions | Epic 1 |
| Category System | Hierarchical: Store Category → Item Group → Subcategory | Epic 9 |
| Smart Category Learning | Auto-applies learned preferences on future scans | Epic 6 |
| Merchant Learning | Fuzzy matching for merchant suggestions | Epic 9 |
| Analytics Dashboard | Dual-axis navigation (temporal + category) | Epic 7 |
| History Filters | Filter by time, category, location, groups | Epic 9, 14 |
| Data Export | CSV export for transactions and aggregated items | Epic 5, 14 |
| PWA Installation | Add to Home Screen, push notifications | Epic 9 |
| Theme System | Light/Dark modes, Normal/Professional/Mono themes | Epic 7, 14 |
| Insight Engine | 12 generators, phase-based selection | Epic 10 |
| Quick Save | 85% confidence threshold, weighted scoring | Epic 11 |
| Trust Merchant | Auto-categorization for trusted merchants | Epic 11 |
| Batch Processing | Multi-receipt capture, parallel API calls | Epic 12 |

## Completed Epics Summary

| Epic | Stories | Deployed | Key Deliverables |
|------|---------|----------|------------------|
| Epic 10 | 9 | 2025-12-19 | InsightEngine, 12 generators, ADRs 015-017 |
| Epic 10a | 5 | 2025-12-21 | Home+History merged, Insights tab |
| Epic 11 | 7 | 2025-12-22 | QuickSaveCard, trust merchants, PWA viewport |
| Epic 12 | 6 | 2025-12-23 | Batch capture, parallel processing, 2799 tests |
| Epic 13 | 15 | 2025-12-31 | 10 HTML mockups, design system, motion system |

## Current Development: Epic 14 (IN PROGRESS)

**Status:** 22 of 23 stories done | **Points:** ~65 | **Last Deployed:** 2026-01-12

### Completed Stories
14.1-14.11 (Animation, Polygon, Nav), 14.12-14.14 (Dashboard, Analytics, History), 14.14b (Donut), 14.15b-15c (Selection, Filters), 14.16-14.16b (Reports, Semantic Colors), 14.17-14.20 (Intentional Prompts, Celebrations, Records, Session Messaging), 14.21-14.22 (Colors, Settings), 14.23-14.29 (Unified Editor, Firestore, React Query), **14.13a-14.13b-14.13.3** (Multi-Level Filters, Sankey), **14.31** (Items View), **14.33a** (Insight Card Types)

### Story 14.33a: Insight Card Types & Styling (COMPLETE)

**Features:**
- 5 visual insight types: `quirky`, `celebration`, `actionable`, `tradeoff`, `trend`
- Type-specific background colors and icon colors
- Full dark mode support with distinct dark variants
- Chevron indicator on cards, hover border animation
- Backward compatible - defaults to `actionable` for old records

**Key Files:**
- `src/utils/insightTypeConfig.ts` - Visual config, `getVisualType()`, `getVisualConfig()`
- `src/components/insights/InsightHistoryCard.tsx` - Updated styling per mockup

**Test Coverage:** 74 tests (39 config + 35 component)

### Remaining Stories
| Story | Name | Points | Status |
|-------|------|--------|--------|
| 14.33b | View Switcher & Carousel | 5 | Ready for Dev |
| 14.33c | Airlock Sequence | 3 | Ready for Dev |
| 14.33d | Celebration Records Display | 3 | Ready for Dev |

### Multi-Level Filter Architecture (Stories 14.13a + 14.13b)

**Data Flow:**
```
TrendsView drill-down → drillDownPath → matchesCategoryFilter() → Multi-dimension filtering
```

**Key Features:**
- `drillDownPath` tracks storeGroup → storeCategory → itemGroup → itemCategory
- Clear All button in FilterChips row
- Filter persistence when switching transaction/item tabs
- Default temporal filter: current month

**Reference**: `src/utils/historyFilterUtils.ts`, `src/contexts/HistoryFiltersContext.tsx`

### Period Comparison Analytics (Story 14.13.2)

**Period-over-Period Comparison:**
```
Week mode:    Current week vs Previous week
Month mode:   Current month vs Previous month
Quarter mode: Current quarter vs Previous quarter
Year mode:    Current year vs Previous year
```

**Key Features:**
- `getPreviousPeriod()` utility handles year boundary edge cases
- ISO week number calculation for week-level comparison
- Change direction types: 'up' | 'down' | 'same' | 'new'
- Semantic colors: red = spending up (bad), green = spending down (good)
- "nuevo" badge for categories with no previous period data

**Reference**: `src/utils/periodComparison.ts`, `TrendListItem` in `TrendsView.tsx`

### Sankey Flow Diagram (Story 14.13.3) - IN PROGRESS

**Purpose:** Visualize spending flow from store categories to item categories

**Architecture:**
```
TrendsView → SankeyChart → SankeyIconNode (Phase 5)
                ↓
         ECharts (flow lines) + React overlay (icon nodes)
```

**Key Components:**
- `src/components/analytics/SankeyChart.tsx` - Main chart with hybrid rendering
- `src/components/analytics/SankeyIconNode.tsx` - Icon nodes with progress-ring borders
- `src/utils/sankeyDataBuilder.ts` - Data transformation (29 tests)

**Hierarchy Modes:**
- `2-level`: Store Categories → Item Categories (default)
- `3-level-groups`: Store Groups → Store Cats → Item Groups
- `3-level-categories`: Store Cats → Item Groups → Item Cats
- `4-level`: Full hierarchy (Store Groups → Store Cats → Item Groups → Item Cats)

**Phase 5 Features (2026-01-11):**
- Icon nodes with progress-ring borders (conic-gradient)
- Dynamic title shows clicked category + percentage
- No navigation on click (self-contained exploration)
- 2-icon view mode selector

**Current Issues Being Fixed:**
1. Diagram height too compressed (400px → 500px)
2. Node bars overlapping (nodeGap 12 → 20)
3. Title with percentage not displaying (props not passed)

**Reference**: `docs/sprint-artifacts/epic14/stories/story-14.13.3-tendencia-sankey-diagram.md`

## Epic 14d: Scan Architecture Refactor (IN PROGRESS)

**Status:** 5 of 11 stories done | **Points:** ~45

| Story | Name | Status |
|-------|------|--------|
| 14d.1 | Scan State Machine Hook | ✅ Done |
| 14d.2 | Scan Context Provider | ✅ Done |
| 14d.3 | Hybrid Navigation Blocking | ✅ Done |
| 14d.4a-4e | State Migration | ✅ Done |
| 14d.5a | Core Batch State Migration | 🔄 Phase 0-1 Done |
| 14d.5a-phase2 | App.tsx Batch Migration | ⏳ Ready |
| 14d.5b-5e | Processing, Results, Dialogs | Ready |
| 14d.6-14d.11 | Dialogs, Mode Selector, FAB, etc. | Ready |

### Story 14d.5a Progress (2026-01-10)

**Phase 0-1 COMPLETE:**
- `src/utils/imageUtils.ts` - Thumbnail generation utilities extracted
- `src/views/BatchCaptureView.tsx` - Uses `useScanOptional()` with props fallback
- 20/20 tests passing
- Option A decision documented (full migration, no dual-sync)

**Phase 2 PENDING (separate story):**
- 64 App.tsx usages to migrate
- `useScanStateBridge` batch sync removal (~60 lines)

### Key Design Decisions
| Decision | Choice |
|----------|--------|
| Request Precedence | Active request blocks ALL new requests |
| Persistence | No expiration, survives logout/app close |
| Credit Timing | Reserved on API call, confirmed on success |

**Spec:** `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

## Future Roadmap (Epics 15-18)

| Epic | Name | Focus | Status |
|------|------|-------|--------|
| 14d | Scan Architecture Refactor | State machine, persistence, mode selector | 🔄 IN PROGRESS |
| 15 | Advanced Features | Goals/GPS, learned thresholds, Themeable Skins | Backlog |
| 16 | Onboarding | <60 second time-to-value | Backlog |
| 17 | Tags & Grouping | User-defined tags for project/trip tracking | Backlog |
| 18 | Achievements | Ethical gamification, milestones | Backlog |

## Feature Dependencies

### Scan Flow
```
Camera → Gemini OCR → Merchant Mapping → Category Mapping → EditView → Save
```

### Learning System
```
User Edit → Learning Prompt → Mapping Saved → Future Scans Auto-Apply
```

### Analytics
```
Transactions → FilteringService → AnalyticsContext → Charts → Drill-down
```

---

## Sync Notes

- Generation 3 optimization: Consolidated completed epic details
- Test count: 3,100+ unit tests
- Versions v9.3.0 through v10.x.x deployed
- Epic 14d key decisions documented for scan refactor
