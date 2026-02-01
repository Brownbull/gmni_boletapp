# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Optimized: 2026-02-01 (Generation 6)
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
| Epic 11 | 7 | 2025-12-22 | QuickSaveCard, trust merchants, PWA viewport |
| Epic 12 | 6 | 2025-12-23 | Batch capture, parallel processing |
| Epic 13 | 15 | 2025-12-31 | 10 HTML mockups, design system, motion system |
| Epic 14 | 50+ | 2026-01-15 | Animation, polygon, analytics, React Query |
| Epic 14d | 11 | 2026-01-12 | Scan state machine, navigation blocking |
| Epic 14c-refactor | 36 | 2026-01-24 | App.tsx 4,800→3,850 lines, handler hooks |

---

## Epic 14e: Feature-Based Architecture (🔄 IN PROGRESS)

**Status:** ~45 stories | **Started:** 2026-01-24

### Goals
- Extract features from App.tsx to standalone modules
- Migrate React Context to Zustand stores
- Reduce App.tsx from ~3,850 to ~1,500 lines
- Enable better code splitting

### Progress by Part

| Part | Focus | Status | Stories |
|------|-------|--------|---------|
| 1 | Modal Manager | ✅ Complete | 14e-1 to 14e-5 |
| 2 | Scan Feature Extraction | ✅ Complete | 14e-6 to 14e-11 |
| 3 | Batch Review Feature | ✅ Complete | 14e-12 to 14e-16 |
| 4 | Simple Features | 🔄 In Progress | 14e-17 to 14e-22 |
| 5 | App Shell | 🔄 In Progress | 14e-23 to 14e-25 |
| 6 | Stores & Cleanup | 🔄 In Progress | 14e-34 to 14e-45 |

### Key Deliverables
- 7 Zustand stores (scan, batch-review, navigation, transaction-editor, settings, insight, modal)
- Feature modules (`src/features/{name}/`)
- Handler extraction pattern
- NavigationContext → useNavigationStore migration
- ScanContext → useScanStore migration (complete)

**Spec:** `docs/sprint-artifacts/epic14e-feature-architecture/`

---

## Epic 14d-v2: Shared Groups v2 (BACKLOG)

**Status:** Ready | **Blocked by:** Epic 14e

### Key Changes from 14c
- Single `sharedGroupId` (not array) - eliminates `array-contains` limitations
- Changelog-driven sync - explicit removal events
- Double-gate privacy model - group + user opt-in
- Manual sync buttons - no complex auto-sync

**Spec:** `docs/sprint-artifacts/epic14d-shared-groups-v2/`

---

## Future Roadmap

| Epic | Focus | Status |
|------|-------|--------|
| 14F | Invite-Only Access | Planning |
| 15 | Advanced Features (Goals/GPS) | Backlog |
| 16 | Onboarding (<60s time-to-value) | Backlog |
| 17 | Tags & Grouping | Backlog |
| 18 | Achievements | Backlog |

---

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

### Generation 6 (2026-02-01)
- Consolidated 30+ "Story Created" sections into summary tables
- Removed per-story workflow impact details
- Reduced file from 27KB to ~5KB

### Generation 5 (2026-01-24)
- Added Epic 14e progress tracking
- Consolidated Epic 14c-refactor summary

**Story details:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/`
