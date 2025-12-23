# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2025-12-22
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
| **Data Export** | CSV export for transactions and statistics | Epic 5 | ✅ Done |
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

## Current Development (Epic 12)

| Feature | Status | Purpose |
|---------|--------|---------|
| **Batch Mode** | Next Development | Multi-receipt capture UI with parallel processing |

**Foundation from Epic 11.1:**
- Batch image processing infrastructure exists
- Sequential API calls with credit-after-save pattern
- Ready for multi-image capture UI

## Future Roadmap (Epics 13-18) - REVISED 2025-12-22

<!-- Source: brainstorming-session-2025-12-22.md, epics.md -->

**Vision:** Transform from "reactive data entry tool" to "alive financial awareness companion"

| Epic | Name | Focus | Points |
|------|------|-------|--------|
| 12 | Batch Mode | Multi-receipt capture with parallel processing | ~25 |
| 13 | **UX Design & Mockups** | Mockup-first workflow, voice guidelines, motion system | ~34 |
| 14 | **Core Implementation** | Animation framework, polygon, celebrations | ~48 |
| 15 | **Advanced Features** | Goals/GPS, learned thresholds, Sankey/Treemap | ~46 |
| 16 | Onboarding | <60 second time-to-value, progressive disclosure | ~15 |
| 17 | Tags & Grouping | User-defined tags for project/trip tracking | ~18 |
| 18 | Achievements | Ethical gamification, milestone celebration | ~12 |

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

---

## Sync Notes

- Feature inventory aligned with sprint-status.yaml as of 2025-12-22
- Epics 10, 10a, and 11 complete - combined ~72 points in ~6 days
- Test count now at 2534+ unit tests
- Versions v9.3.0, v9.4.0, v9.5.0 deployed to production
- Combined retrospective: docs/sprint-artifacts/epic10-11-retro-2025-12-22.md
- **Brainstorming session 2025-12-22:** Epic 13-15 restructured (~128 points total)
  - Epic 13: UX Design & Mockups (mockup-first workflow)
  - Epic 14: Core Implementation (animation framework, polygon, celebrations)
  - Epic 15: Advanced Features (goals, GPS, learned thresholds)
  - Original Epics 14-16 renumbered to 16-18
  - Reference: docs/analysis/brainstorming-session-2025-12-22.md
