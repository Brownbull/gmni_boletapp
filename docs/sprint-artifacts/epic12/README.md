# Epic 12: Batch Mode

**Epic Status:** Planning Complete
**Total Story Points:** ~25 points
**Estimated Duration:** 2 weeks

---

## Epic Summary

Epic 12 enables users who accumulate receipts to process multiple images in one session. With parallel processing and batch review, users can efficiently handle a day's or week's worth of receipts with clear credit cost transparency.

**Target User:** ~50% of users who save receipts for later processing.

---

## Story Map

```
Epic 12: Batch Mode (~25 points)
│
├── Story 12.1: Batch Capture UI (5 points)
│   Dependencies: Epic 11 completed
│   Deliverable: Multi-image capture interface with preview strip
│
├── Story 12.2: Parallel Processing Service (5 points)
│   Dependencies: Story 12.1
│   Deliverable: Concurrent image processing with status tracking
│
├── Story 12.3: Batch Review Queue (5 points)
│   Dependencies: Story 12.2
│   Deliverable: Summary cards with individual edit option
│
├── Story 12.4: Credit Warning System (3 points)
│   Dependencies: Story 12.1
│   Deliverable: Pre-batch credit check and warning display
│
├── Story 12.5: Batch Save & Insights (3 points)
│   Dependencies: Stories 12.3, Epic 10 Insight Engine
│   Deliverable: Save all action + aggregate batch insight
│
└── Story 12.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment, E2E verification
```

---

## Stories Index

| Story | Title | Points | Status | File |
|-------|-------|--------|--------|------|
| 12.1 | Batch Capture UI | 5 | Draft | [story-12.1-batch-capture-ui.md](./story-12.1-batch-capture-ui.md) |
| 12.2 | Parallel Processing Service | 5 | Draft | [story-12.2-parallel-processing-service.md](./story-12.2-parallel-processing-service.md) |
| 12.3 | Batch Review Queue | 5 | Draft | [story-12.3-batch-review-queue.md](./story-12.3-batch-review-queue.md) |
| 12.4 | Credit Warning System | 3 | Draft | [story-12.4-credit-warning-system.md](./story-12.4-credit-warning-system.md) |
| 12.5 | Batch Save & Insights | 3 | Draft | [story-12.5-batch-save-insights.md](./story-12.5-batch-save-insights.md) |
| 12.99 | Epic Release Deployment | 2 | Draft | [story-12.99-epic-release-deployment.md](./story-12.99-epic-release-deployment.md) |

---

## Dependencies

- **Epic 11:** Quick Save Card pattern for batch review
- **Epic 10:** Insight Engine for batch insights

---

## Success Metrics

- Batch mode adoption >30% of active users
- Time savings: 60 seconds for 5 receipts vs 4+ minutes sequential
- Credit warning prevents insufficient credit errors
- Batch insight engagement >50%

---

## Created

- **Date:** 2025-12-16
- **Author:** PM Agent (John) via BMAD Framework
