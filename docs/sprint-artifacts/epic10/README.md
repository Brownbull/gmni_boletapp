# Epic 10: Foundation + Engagement & Insight Engine

**Epic Status:** Planning Complete
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md)
**Total Story Points:** ~35 points
**Estimated Duration:** 3-4 weeks

---

## Epic Summary

Epic 10 transforms Boletapp from a "data entry tool" into a "financial awareness companion" by implementing meaningful insight delivery at every touchpoint. The epic includes a foundational refactoring sprint to address technical debt, followed by the core Insight Engine implementation.

**Key Differentiator:** Without insights, users churn. With insights, they come back.

---

## Story Map

```
Epic 10: Foundation + Engagement & Insight Engine (~35 points)
│
├── Story 10.0: Foundation Sprint (8 points) ⭐ PREREQUISITE
│   Dependencies: None
│   Deliverable: Refactored analytics, filtering service, App.tsx state cleanup
│
├── Story 10.1: Insight Engine Core (5 points)
│   Dependencies: Story 10.0
│   Deliverable: Insight generation service with 5 MVP insight types
│
├── Story 10.2: Scan Complete Insights (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Contextual insight toast after every save
│
├── Story 10.3: Weekly Summary View (5 points)
│   Dependencies: Story 10.1
│   Deliverable: In-app weekly digest with comparison data
│
├── Story 10.4: Monthly Summary View (5 points)
│   Dependencies: Story 10.1, 10.3
│   Deliverable: Monthly celebration + comprehensive breakdown
│
├── Story 10.5: Analytics Insight Cards (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Rotating insight cards on Analytics screen
│
├── Story 10.6: Push Notification Integration (3 points)
│   Dependencies: Stories 10.2, 10.3, 10.4 + Epic 9 PWA
│   Deliverable: Scan complete + digest notifications
│
├── Story 10.7: Pattern Detection Engine (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Time-of-day, weekend/weekday, velocity patterns
│
└── Story 10.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment, E2E verification
```

---

## Stories Index

| Story | Title | Points | Status | File |
|-------|-------|--------|--------|------|
| 10.0 | Foundation Sprint | 8 | Draft | [story-10.0-foundation-sprint.md](./story-10.0-foundation-sprint.md) |
| 10.1 | Insight Engine Core | 5 | Draft | [story-10.1-insight-engine-core.md](./story-10.1-insight-engine-core.md) |
| 10.2 | Scan Complete Insights | 3 | Draft | [story-10.2-scan-complete-insights.md](./story-10.2-scan-complete-insights.md) |
| 10.3 | Weekly Summary View | 5 | Draft | [story-10.3-weekly-summary-view.md](./story-10.3-weekly-summary-view.md) |
| 10.4 | Monthly Summary View | 5 | Draft | [story-10.4-monthly-summary-view.md](./story-10.4-monthly-summary-view.md) |
| 10.5 | Analytics Insight Cards | 3 | Draft | [story-10.5-analytics-insight-cards.md](./story-10.5-analytics-insight-cards.md) |
| 10.6 | Push Notification Integration | 3 | Draft | [story-10.6-push-notification-integration.md](./story-10.6-push-notification-integration.md) |
| 10.7 | Pattern Detection Engine | 3 | Draft | [story-10.7-pattern-detection-engine.md](./story-10.7-pattern-detection-engine.md) |
| 10.99 | Epic Release Deployment | 2 | Draft | [story-10.99-epic-release-deployment.md](./story-10.99-epic-release-deployment.md) |

---

## Critical Path

```
Week 1: Foundation
  10.0 Foundation Sprint (8 pts) ────────────────────────►

Week 2: Core Engine + First Touchpoint
  10.1 Insight Engine Core (5 pts) ─────►
                                         10.2 Scan Complete (3 pts) ──►

Week 3: Summaries + Cards
  10.3 Weekly Summary (5 pts) ─────────►
  10.4 Monthly Summary (5 pts) ─────────►
  10.5 Analytics Cards (3 pts) ──►

Week 4: Notifications + Patterns + Release
  10.6 Push Notifications (3 pts) ─────►
  10.7 Pattern Detection (3 pts) ──►
                                    10.99 Release (2 pts) ──►
```

---

## Key Technical Decisions

1. **Foundation First:** Story 10.0 must complete before feature work begins
2. **5 MVP Insight Types:** frequency, merchant_concentration, category_growth, improvement, milestone
3. **2 Deferred Types:** day_pattern and time_pattern (Story 10.7)
4. **Caching Strategy:** Weekly batch computation + on-save trigger for scan insights
5. **Notification Timing:** Friday 7pm (weekly), Last day 6pm (monthly)
6. **Ethical Design:** Celebrate savings, no shame mechanics, no streaks

---

## Dependencies

### Internal (Epic 10)
- All stories depend on 10.0 Foundation Sprint
- 10.2-10.7 depend on 10.1 Insight Engine Core
- 10.6 depends on 10.2, 10.3, 10.4 for notification triggers

### External
- Epic 9: PWA push notification infrastructure (Story 10.6)
- Existing Analytics Context and state management
- Firebase Cloud Messaging (FCM)

---

## Success Metrics

- **Engagement Increase:** Users report app feels more "alive"
- **Insight Value:** 80%+ find at least one insight type useful
- **Return Rate:** Users open app to check digests (not just scan)
- **Time-to-Insight:** <3 seconds from save to toast
- **Weekly Summary Open Rate:** >40% of active users
- **Monthly Summary Engagement:** >60% of active users

---

## Created

- **Date:** 2025-12-16
- **Author:** PM Agent (John) via BMAD Framework
- **Reviewed by:** Architect (Winston), User (Gabe)
