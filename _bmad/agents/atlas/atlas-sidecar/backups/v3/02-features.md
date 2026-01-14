# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2026-01-06
> Sources: sprint-status.yaml, epics.md, PRD documents

## Core Features (Implemented)

| Feature | Purpose | Epic | Status |
|---------|---------|------|--------|
| **Receipt Scanning** | AI-powered OCR extracts transaction data from photos | Epic 1 | ✅ Done |
| **Transaction Management** | CRUD operations for transactions | Epic 1 | ✅ Done |
| **Category System** | Hierarchical: Store Category → Item Group → Subcategory | Epic 9 | ✅ Done |
| **Smart Category Learning** | Learns user preferences, auto-applies on future scans | Epic 6 | ✅ Done |
| **Merchant Learning** | Fuzzy matching for merchant name suggestions | Epic 9 | ✅ Done |
| **Subcategory Learning** | User-defined subcategory preferences | Epic 9 | ✅ Done |
| **Analytics Dashboard** | Dual-axis navigation (temporal + category) | Epic 7 | ✅ Done |
| **History Filters** | Filter by time, category, location | Epic 9 | ✅ Done |
| **Data Export** | CSV export for transactions, statistics, and aggregated products | Epic 5, 14 | ✅ Done |
| **PWA Installation** | Add to Home Screen support | Epic 9 | ✅ Done |
| **Push Notifications** | Firebase Cloud Messaging infrastructure | Epic 9 | ✅ Done |
| **Theme System** | Light/Dark modes, Normal/Professional color themes | Epic 7 | ✅ Done |
| **Pre-scan Options** | Currency and store type selection before scanning | Epic 9 | ✅ Done |
| **Location Display** | Country/city from receipt displayed in EditView | Epic 9 | ✅ Done |
| **Insight Engine** | AI-powered contextual feedback after saving transactions | Epic 10 | ✅ Done |
| **Home Screen Consolidation** | Unified Dashboard + History with shared filters | Epic 10a | ✅ Done |
| **Insights Tab** | Browse past insights with transaction navigation | Epic 10a | ✅ Done |
| **Quick Save Card** | High-confidence scan auto-accept with 85% threshold | Epic 11 | ✅ Done |
| **Animated Item Reveal** | Staggered animations with reduced motion support | Epic 11 | ✅ Done |
| **Trust Merchant System** | Auto-categorization for frequently used merchants | Epic 11 | ✅ Done |
| **Scan Status Clarity** | State machine UI for scan progress (uploading → processing → ready) | Epic 11 | ✅ Done |
| **PWA Viewport Fixes** | Dynamic viewport units (dvh) + safe area CSS properties | Epic 11 | ✅ Done |
| **Batch Image Processing** | Sequential API calls with credit-after-save pattern | Epic 11 | ✅ Done |

### Epic 10: Insight Engine (v9.3.0 - COMPLETE)
**Stories:** 9 | **Points:** ~35 | **Deployed:** 2025-12-19

| Story | Name | Key Deliverable |
|-------|------|-----------------|
| 10.0 | Foundation Sprint | Analytics refactor, filtering service, App.tsx cleanup |
| 10.1 | Insight Engine Core | InsightEngine service, InsightGenerator interface |
| 10.2 | User Phase Detection | Cold-start vs data-rich user profiling (WEEK_1, WEEKS_2_3, MATURE) |
| 10.3 | Transaction Intrinsic Insights | 7 generators: biggest_item, item_count, unusual_hour, weekend_warrior, new_merchant, new_city, category_variety |
| 10.4 | Pattern Detection Insights | 5 generators: merchant_frequency, category_trend, day_pattern, spending_velocity, time_pattern |
| 10.5 | Selection Algorithm | Phase-based priority, sprinkle distribution, cooldown filtering |
| 10.6 | Scan Complete Display | InsightCard UI with async side-effect pattern |

**ADRs Introduced:**
- ADR-015: Client-Side Insight Engine
- ADR-016: Hybrid Insight Storage (local-first with Firestore backup)
- ADR-017: Phase-Based Priority System

### Epic 10a: UX Consolidation (v9.3.0 - COMPLETE)
**Stories:** 5 | **Points:** ~13 | **Deployed:** 2025-12-21

| Story | Name | Key Deliverable |
|-------|------|-----------------|
| 10a.1 | Home Screen Consolidation | Dashboard + History merged with shared HistoryFiltersContext |
| 10a.2 | Insights Tab Implementation | Browse past insights with navigation to transactions |
| 10a.3 | Navigation Updates | Tab bar with Home/Scan/Insights/Trends/Settings |
| 10a.4 | InsightDetailModal | Full insight display with action navigation |
| 10a.5 | Extended InsightRecord | Schema extended for full content history display |

### Epic 11: Quick Save Optimization (v9.4.0, v9.5.0 - COMPLETE)
**Stories:** 7 | **Points:** ~24 | **Deployed:** 2025-12-22

| Story | Name | Key Deliverable |
|-------|------|-----------------|
| 11.1 | Batch Processing | Sequential API calls, credit-after-save pattern |
| 11.2 | Quick Save Card | 85% confidence threshold, weighted scoring |
| 11.3 | Animated Item Reveal | Staggered CSS animations, useReducedMotion hook |
| 11.4 | Trust Merchant System | Auto-save for frequently used merchants |
| 11.5 | Scan Status Clarity | State machine UI (uploading → processing → ready) |
| 11.6 | Responsive Viewport | Dynamic viewport units (dvh) + safe area CSS |
| 11.7 | Epic Integration | Final integration and polish |

### Epic 12: Batch Mode (v9.7.0 - COMPLETE)
**Stories:** 6 | **Points:** ~25 | **Deployed:** 2025-12-23

| Story | Name | Key Deliverable |
|-------|------|-----------------|
| 12.1 | Batch Capture UI | Long-press selection, thumbnail strip |
| 12.2 | Parallel Processing | Worker pattern, AbortController, max 3 concurrent |
| 12.3 | Batch Review Queue | Summary cards, confidence status |
| 12.4 | Credit Warning | Styled dialog, pre-batch validation |
| 12.5 | Batch Insights | Local aggregation, celebrateBig confetti |
| 12.99 | Epic Deployment | Production deployment, 2799 tests |

### Epic 13: UX Design & Mockups (COMPLETE)
**Stories:** 15 | **Points:** ~41 | **Completed:** 2025-12-31

| Story | Name | Key Deliverable |
|-------|------|-----------------|
| 13.1 | Critical Use Cases | 6 E2E user journeys documented |
| 13.2 | Voice & Tone | Non-judgmental messaging guidelines |
| 13.3 | Motion Design System | "Everything Breathes" spec |
| 13.4 | Design System Components | HTML/CSS reference library |
| 13.5 | Design System Reference | Extracted component reference |
| 13.6-13.13 | View Mockups | 10 HTML mockups (home, analytics, transactions, scan, goals, reports, insights, settings, nav, notifications) |
| 13.14 | Design Review | User approval, navigation updates |

**Deliverables:**
- docs/uxui/mockups/ - 10 HTML view mockups
- docs/uxui/motion-design-system.md
- docs/uxui/voice-tone-guidelines.md
- docs/uxui/use-cases-e2e.md

## Current Development (Epic 14 - IN PROGRESS)

**Status:** 19 of 23 stories done, 4 remaining
**Points:** ~65 (expanded from initial ~48)
**Tech Context:** docs/sprint-artifacts/epic14/tech-context-epic14.md
**Last Deployed:** Story 14.22 Settings View Redesign (2026-01-06)

### Completed Stories (19)

| Story | Name | Status | Key Deliverable |
|-------|------|--------|-----------------|
| 14.1 | Animation Framework | ✅ Done | Core animation utilities, useReducedMotion |
| 14.2 | Screen Transition System | ✅ Done | Staggered entry, breathing animations |
| 14.3 | Scan Overlay Flow | ✅ Done | Non-blocking overlay UI |
| 14.4 | Quick Save Path | ✅ Done | Progressive item reveal |
| 14.5 | Dynamic Polygon Component | ✅ Done | 3-6 sided spending shape |
| 14.6 | Polygon Dual Mode | ✅ Done | Merchant categories + item groups |
| 14.7 | Expanding Lava Visual | ✅ Done | Inverted metaphor overlay |
| 14.8 | Enhanced Existing Charts | ✅ Done | Pie, Bar, Stacked improvements |
| 14.9 | Swipe Time Navigation | ✅ Done | Left/right for week/month |
| 14.10 | Top Header Bar | ✅ Done | App-wide header (logo, title, menu) |
| 14.11 | Bottom Nav Redesign | ✅ Done | Nav.tsx matching mockups |
| 14.12 | Home Dashboard Refresh | ✅ Deployed | DashboardView with new design |
| 14.14 | Transaction List Redesign | ✅ Done | HistoryView with card design |
| 14.13 | Analytics Explorer Redesign | ✅ Done | Treemap + Donut + Count Mode Toggle + Multi-Level Filtering |
| 14.14b | Donut Chart Redesign | ✅ Done | Donut with drill-down navigation |
| 14.15b | Selection Mode Groups | ✅ Done | Transaction selection & grouping |
| 14.15c | Category Group Filters | ✅ Done | IconFilterBar category groups |
| 14.16 | Weekly Report Story Format | ✅ Done | Instagram-style cards |
| 14.21 | Category Color Consolidation | ✅ Done | Unified category colors |
| 14.22 | Settings View Redesign | ✅ Deployed | Hierarchical sub-views |
| 14.31 | Items History View | 🔄 In Progress | Aggregated products, CSV export, duplicate detection |

### Remaining Stories (3)

| Story | Name | Status | Points |
|-------|------|--------|--------|
| 14.14b | Donut Chart Redesign | In Progress | 13 pts |
| 14.16b | Semantic Color System | Review | 5 pts |
| 14.17-20 | Celebrations & Engagement | Ready | 10 pts |

### Multi-Level Filter Architecture (Story 14.13a + 14.13b - Completed 2026-01-10)

**Data Flow:**
```
TrendsView drill-down → buildSemanticDrillDownPath() → HistoryNavigationPayload.drillDownPath
    ↓
App.tsx handleNavigateToHistory → pendingHistoryFilters.category.drillDownPath
    ↓
HistoryView/ItemsView → matchesCategoryFilter() checks storeCategory + itemGroup + itemCategory
```

**Key Features:**
| Feature | Implementation |
|---------|---------------|
| Multi-level drill-down | `drillDownPath` tracks storeGroup → storeCategory → itemGroup → itemCategory |
| Clear All button | "✕" at start of FilterChips row (not on view titles) |
| Filter persistence | Switching transaction/item tabs preserves both filter sets |
| Multi-select filtering | Comma-separated category support in `historyFilterUtils.ts` |
| Category translation | `translateItemGroup()` for display in filter chips |

**Key Files:**
- `src/utils/historyFilterUtils.ts` - `matchesCategoryFilter()` with drillDownPath support
- `src/views/TrendsView.tsx` - `buildSemanticDrillDownPath()` helper
- `src/components/history/FilterChips.tsx` - Shows separate badges per dimension
- `tests/unit/utils/historyFilterUtils.drillDown.test.ts` - 16 unit tests

## Epic 14d: Scan Architecture Refactor (PLANNED)

**Status:** Design Complete, Ready for Implementation
**Stories:** 11 | **Points:** ~45
**Spec:** docs/sprint-artifacts/epic14d/scan-request-lifecycle.md

### Core Architecture Change

Refactoring scan flow to use a **state machine with persistence** and **request precedence**.

| Story | Name | Points | Status |
|-------|------|--------|--------|
| 14d.1 | Scan State Machine Hook | 8 | Ready |
| 14d.2 | Scan Context Provider | 5 | Ready |
| 14d.3 | Hybrid Navigation Blocking | 5 | Ready |
| 14d.4 | Single Scan Refactor | 5 | Ready |
| 14d.5 | Batch Scan Refactor | 5 | Ready |
| 14d.6 | Unified Dialog Handling | 3 | Ready |
| 14d.7 | Mode Selector Popup | 5 | **Tech-spec complete** |
| 14d.8 | FAB Visual States | 5 | Ready |
| 14d.9 | Statement Placeholder View | 2 | Ready |
| 14d.10 | State Machine Persistence | 5 | Ready |
| 14d.11 | App.tsx Cleanup | 3 | Ready |

### Key Design Decisions (Confirmed 2026-01-08)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Request Precedence | Active request blocks ALL new requests | Prevent data loss, credit confusion |
| Persistence | No expiration, survives logout/app close | User never loses work |
| Offline Handling | Error immediately, refund credit | Simple, predictable |
| Credit Timing | Reserved on API call, confirmed on success | Fair billing |

### Scan Request Lifecycle States

```
IDLE → CAPTURING → SCANNING → REVIEWING → SAVED/CANCELLED
         (no credit)  (reserved)  (spent)
```

### Mode Selector UI (Story 14d.7)

Selected design: **Style 19 - Card Compact + Credits**
- Floating card with 12px margins, rounded corners
- Header shows credit balances (super ⚡ + normal ◷)
- 3 modes with FAB icons: Single (green), Batch (amber), Statement (violet)
- Mockup: docs/uxui/mockups/00_components/scan-mode-selector.html

## Future Roadmap (Epics 15-18) - REVISED 2025-12-31

<!-- Source: brainstorming-session-2025-12-22.md, epics.md -->

**Vision:** Transform from "reactive data entry tool" to "alive financial awareness companion"

| Epic | Name | Focus | Points | Status |
|------|------|-------|--------|--------|
| 12 | Batch Mode | Multi-receipt capture with parallel processing | ~25 | ✅ COMPLETE |
| 13 | UX Design & Mockups | Mockup-first workflow, voice guidelines, motion system | ~41 | ✅ COMPLETE |
| 14 | Core Implementation | Animation framework, polygon, celebrations | ~48 | 🔄 IN PROGRESS |
| **14d** | **Scan Architecture Refactor** | **State machine, persistence, mode selector** | **~45** | **📝 PLANNED** |
| 15 | Advanced Features | Goals/GPS, learned thresholds, Treemap, Themeable Skins | ~38 | Backlog |
| 16 | Onboarding | <60 second time-to-value, progressive disclosure | ~15 | Backlog |
| 17 | Tags & Grouping | User-defined tags for project/trip tracking | ~18 | Backlog |
| 18 | Achievements | Ethical gamification, milestone celebration | ~12 | Backlog |

### Key Design Innovations (Epics 13-15)

| Innovation | Description | Epic |
|------------|-------------|------|
| **Dynamic Spending Polygon** | 3-6 sided shape based on trending categories | 14 |
| **Expanding Lava Metaphor** | Inner polygon = spending, outer = budget | 14 |
| **Savings GPS** | Goal tracking with ETA, alternate routes | 15 |
| **Emotional Airlock** | Curiosity → Playfulness → Reveal for difficult insights | 15 |
| **"Intentional or Accidental?"** | Non-judgmental spending awareness prompts | 14 |
| **"Everything Breathes"** | Motion design system with subtle animations | 13, 14 |

### Critical Use Cases (E2E Testing - Epic 13.1)

| ID | Use Case | Persona | Key Flow |
|----|----------|---------|----------|
| UC1 | First Scan Experience | New user | Scan → Progressive reveal → Quick Save → Celebration |
| UC2 | Weekly Health Check | María | Breathing polygon → Swipe story → "Intentional?" prompt |
| UC3 | Goal Progress | Diego | Check GPS → "3 days closer" → Trade-off insight |
| UC4 | Simple Summary | Rosa | Arrows ↑↓→ → "Carnes subió harto" → Confirm |
| UC5 | Out-of-Character Alert | Tomás | Airlock → Curiosity → Reveal → Response |
| UC6 | Batch Scan Session | Power user | Scan 5 → Batch summary → Quick Save all → Aggregate insight |

## Feature Dependencies

### Scan Flow Dependencies
```
Camera Capture → Gemini OCR → Merchant Mapping → Category Mapping → EditView → Save
                     ↓
              Pre-scan Options (currency, store type)
```

### Learning System Dependencies
```
User Edit → Learning Prompt → Mapping Saved → Future Scans Auto-Apply
     ↓
[Merchant | Category | Subcategory] Mappings
```

### Analytics Dependencies
```
Transactions → FilteringService → AnalyticsContext → Charts/Cards
                    ↓
         History Filters (time, category, location)
```

## Feature-to-Story Mapping

| Feature Area | Key Stories |
|--------------|-------------|
| Scanning | 1.1, 8.1-8.9, 9.1, 9.8 |
| Learning | 6.1-6.5, 9.4-9.7 |
| Analytics | 7.1-7.20 |
| Filters | 9.19 |
| Export | 5.1-5.2 |
| Insight Engine | 10.0-10.6 |
| UX Consolidation | 10a.1-10a.5 |
| Quick Save | 11.1-11.7 |
| **Animation Framework** | 14.1, 14.2 |
| **Dynamic Polygon** | 14.5, 14.6, 14.7 |
| **Scan Overlay Enhancement** | 14.3, 14.4 |
| **Enhanced Charts** | 14.8, 14.9 |
| **Weekly Reports** | 14.10 |
| **Celebrations** | 14.12, 14.13, 14.14 |
| **Intentional Prompts** | 14.11 |
| **Settings Redesign** | 14.22 |
| **Goals System** | 15.1, 15.2, 15.4 |
| **Income Tracking** | 15.3 |
| **Learned Thresholds** | 15.5, 15.6 |
| **Out-of-Character** | 15.7, 15.8 |
| **Advanced Charts** | 15.9, 15.10 |
| **Milestones** | 15.11 |
| **Social Sharing** | 15.12 |
| **Themes** | 15.13 |

---

## Sync Notes

- Feature inventory aligned with sprint-status.yaml as of 2025-12-31
- **Epics 10-13 complete** - combined ~174 points
- Test count: 2799 unit tests
- Versions v9.3.0 through v9.7.0 deployed to production
- **Epic 13 complete 2025-12-31:** 10 HTML mockups, design system, motion system
- **Epic 14 ready 2025-12-31:** All 14 stories created via atlas-create-story
- Combined retrospective: docs/sprint-artifacts/epic10-11-retro-2025-12-22.md
- **Story 14.22 created 2026-01-05:** Settings View Redesign - hierarchical sub-views matching mockup, affects Learning Flow (#3) and Trust Merchant Flow (#7)
