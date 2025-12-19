# Epic 10: Foundation + Engagement & Insight Engine

**Epic Status:** Architecture Complete - Ready for Implementation
**Architecture:** [architecture-epic10-insight-engine.md](./architecture-epic10-insight-engine.md)
**Brainstorming:** [epic-10-insight-engine-brainstorm.md](./epic-10-insight-engine-brainstorm.md)
**Total Story Points:** ~35 points
**Estimated Duration:** 3-4 weeks

---

## Epic Summary

Epic 10 transforms Gastify from a "data entry tool" into a "financial awareness companion" by implementing meaningful insight delivery at every touchpoint. The epic includes a foundational refactoring sprint, followed by the core Insight Engine with phase-based personalization.

**Key Differentiator:** Without insights, users churn. With insights, they come back.

---

## Architecture Highlights

### Phase-Based Priority System (ADR-017)

| Phase | Duration | Distribution |
|-------|----------|--------------|
| WEEK_1 | Days 0-7 | 100% Quirky/Delightful |
| WEEKS_2_3 | Days 8-21 | 66% Celebratory / 33% Actionable |
| MATURE | Day 22+ | Weekday: 66% Actionable, Weekend: 66% Celebratory |

### Key Decisions

- **ADR-015:** Client-side insight engine (no Cloud Functions)
- **ADR-016:** Hybrid storage (Firestore + localStorage)
- **ADR-017:** Phase-based priority with 33/66 sprinkle distribution

### Critical Safeguards

1. Insight generation MUST NOT block transaction save (async side-effect)
2. Fallback chain: Try insight → "building profile" → Never show nothing
3. Performance budget: <100ms per insight calculation

---

## Story Map (Architecture-Aligned)

```
Epic 10: Foundation + Engagement & Insight Engine (~35 points)
│
├── Story 10.0: Foundation Sprint (8 points) ⭐ PREREQUISITE
│   Dependencies: None
│   Deliverable: Refactored analytics, filtering service, App.tsx state cleanup
│
├── Story 10.1: InsightEngine Service Interface (3 points)
│   Dependencies: Story 10.0
│   Deliverable: types/insight.ts, services/insightEngineService.ts
│   Architecture: ADR-015, ADR-016
│
├── Story 10.2: Phase Detection & User Profile (3 points)
│   Dependencies: Story 10.1
│   Deliverable: calculateUserPhase(), UserInsightProfile Firestore doc
│
├── Story 10.3: Transaction-Intrinsic Insights (5 points)
│   Dependencies: Story 10.2
│   Deliverable: 7 cold-start insight generators
│   Insights: biggest_item, item_count, unusual_hour, weekend_warrior,
│            new_merchant, new_city, category_variety
│
├── Story 10.4: Pattern Detection Insights (5 points)
│   Dependencies: Story 10.2
│   Deliverable: 5 history-based generators + precomputed aggregates
│   Insights: merchant_frequency, category_trend, day_pattern,
│            spending_velocity, time_pattern
│
├── Story 10.5: Selection Algorithm + Sprinkle (3 points)
│   Dependencies: Stories 10.3, 10.4
│   Deliverable: selectInsight() with phase-based priority + 33/66 distribution
│   Architecture: ADR-017
│
├── Story 10.6: Scan Complete Insight Card (3 points)
│   Dependencies: Story 10.5
│   Deliverable: InsightCard.tsx, BuildingProfileCard.tsx fallback
│   Pattern: Async side-effect after save
│
├── Story 10.7: Batch Mode Summary (3 points)
│   Dependencies: Story 10.6
│   Deliverable: BatchSummary.tsx for multi-receipt sessions
│   Features: "Silenciar 4h", historical comparison, top insight
│
└── Story 10.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment, E2E verification, Firestore rules
```

---

## Stories Index

| Story | Title | Points | Status | Story File | Context File |
|-------|-------|--------|--------|------------|--------------|
| 10.0 | Foundation Sprint | 8 | Draft | [story-10.0-foundation-sprint.md](./story-10.0-foundation-sprint.md) | [context](./story-10.0-context.md) |
| 10.1 | InsightEngine Service Interface | 3 | Draft (Arch) | [story-10.1-insight-engine-core.md](./story-10.1-insight-engine-core.md) | [context](./story-10.1-context.md) |
| 10.2 | Phase Detection & User Profile | 3 | Draft (Arch) | [story-10.2-scan-complete-insights.md](./story-10.2-scan-complete-insights.md) | [context](./story-10.2-context.md) |
| 10.3 | Transaction-Intrinsic Insights | 5 | Draft (Arch) | [story-10.3-transaction-intrinsic-insights.md](./story-10.3-transaction-intrinsic-insights.md) | - |
| 10.4 | Pattern Detection Insights | 5 | Draft (Arch) | [story-10.4-pattern-detection-insights.md](./story-10.4-pattern-detection-insights.md) | - |
| 10.5 | Selection Algorithm + Sprinkle | 3 | Draft (Arch) | [story-10.5-selection-algorithm.md](./story-10.5-selection-algorithm.md) | [context](./story-10.5-context.md) |
| 10.6 | Scan Complete Insight Card | 3 | Draft (Arch) | [story-10.6-scan-complete-insight-card.md](./story-10.6-scan-complete-insight-card.md) | - |
| 10.7 | Batch Mode Summary | 3 | Draft (Arch) | [story-10.7-batch-mode-summary.md](./story-10.7-batch-mode-summary.md) | - |
| 10.99 | Epic Release Deployment | 2 | Draft | [story-10.99-epic-release-deployment.md](./story-10.99-epic-release-deployment.md) | [context](./story-10.99-context.md) |

**Note:** Stories marked "(Arch)" have been retrofitted to align with the architecture document.

---

## Implementation Order

```
Week 1: Foundation
  10.0 Foundation Sprint (8 pts) ────────────────────────►

Week 2: Core Engine + Types
  10.1 Service Interface (3 pts) ─────►
                                       10.2 Phase Detection (3 pts) ──►

Week 3: Generators + Algorithm
  10.3 Transaction-Intrinsic (5 pts) ───────►
  10.4 Pattern Detection (5 pts) ───────────►
                                            10.5 Selection Algorithm (3 pts) ──►

Week 4: UI + Release
  10.6 Insight Card (3 pts) ─────►
  10.7 Batch Mode (3 pts) ───────►
                                 10.99 Release (2 pts) ──►
```

---

## Key Files to Create

| Story | New Files |
|-------|-----------|
| 10.1 | `src/types/insight.ts`, `src/services/insightEngineService.ts` |
| 10.2 | `src/services/insightProfileService.ts` |
| 10.3 | `src/utils/insightGenerators.ts` |
| 10.4 | (adds to insightGenerators.ts) |
| 10.5 | (adds to insightEngineService.ts) |
| 10.6 | `src/components/insights/InsightCard.tsx`, `src/components/insights/BuildingProfileCard.tsx` |
| 10.7 | `src/components/insights/BatchSummary.tsx`, `src/hooks/useBatchSession.ts` |

---

## Archived Files

The following files from the original PRD-based planning have been archived to `_archive/`:

- `epic-10-prd.md` - Superseded by architecture document
- `story-10.3-weekly-summary-view.md` - Deferred to Epic F6 (Analytics Dashboard)
- `story-10.4-monthly-summary-view.md` - Deferred to Epic F6 (Analytics Dashboard)
- `story-10.6-push-notification-integration.md` - Deferred to Epic F6 (Scheduled Insights)
- `story-10.7-pattern-detection-engine.md` - Split into Stories 10.4 and 10.7

**Note:** Deferred features have been documented in [Epic F6: Analytics Dashboard & Scheduled Insights](../../planning/epics.md#epic-f6-analytics-dashboard--scheduled-insights) in the Future Backlog section of epics.md.

---

## Success Metrics

- **Cold Start Success:** New users see insight on first scan
- **Engagement Increase:** Users report app feels more "alive"
- **Insight Variety:** No repeated insights within 7 days (cooldown)
- **Performance:** <100ms insight generation
- **Fallback Rate:** <10% of scans show "building profile"

---

## Created

- **Original Date:** 2025-12-16
- **Architecture Session:** 2025-12-17
- **Author:** PM Agent (John) via BMAD Framework
- **Architecture by:** Claude (Architect Agent)
- **Reviewed by:** Gabe
