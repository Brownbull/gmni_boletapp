# Epic 11: Quick Save & Scan Flow Optimization

**Epic Status:** Planning Complete
**Total Story Points:** ~24 points
**Estimated Duration:** 2 weeks

---

## Epic Summary

Epic 11 transforms the scan flow from a 42-74 second process into a 12-14 second Quick Save experience. By implementing **multi-image = multi-transaction** processing with clear UX feedback, introducing a Quick Save Card for high-confidence scans, and implementing a Trust Merchant system, users can save receipts in under 15 seconds.

**Key Metric:** 90% of scans should complete in <15 seconds with Quick Save.

---

## Story Map

```
Epic 11: Quick Save & Scan Flow Optimization (~24 points)
│
├── Story 11.1: One Image = One Transaction (5 points) ← REVISED
│   Dependencies: Story 10.7 (Batch Mode Summary)
│   Deliverable: Multi-image detection with "X boletas detectadas" UI,
│                each image processed as separate transaction,
│                automatic BatchSummary trigger after processing
│
├── Story 11.2: Quick Save Card Component (5 points)
│   Dependencies: Story 11.1
│   Deliverable: Summary card with Accept/Edit choice
│
├── Story 11.3: Animated Item Reveal (3 points)
│   Dependencies: Story 11.2
│   Deliverable: Progressive item appearance animation
│
├── Story 11.4: Trust Merchant System (5 points)
│   Dependencies: Story 11.2
│   Deliverable: Merchant trust tracking + auto-save prompt
│
├── Story 11.5: Scan Status Clarity (3 points)
│   Dependencies: Story 11.1
│   Deliverable: Clear processing → ready → saved states
│
└── Story 11.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment, E2E verification
```

---

## Stories Index

| Story | Title | Points | Status | File |
|-------|-------|--------|--------|------|
| 11.1 | One Image = One Transaction | 5 | Draft | [story-11.1-one-image-one-transaction.md](./story-11.1-one-image-one-transaction.md) |
| 11.2 | Quick Save Card Component | 5 | Draft | [story-11.2-quick-save-card.md](./story-11.2-quick-save-card.md) |
| 11.3 | Animated Item Reveal | 3 | Draft | [story-11.3-animated-item-reveal.md](./story-11.3-animated-item-reveal.md) |
| 11.4 | Trust Merchant System | 5 | Draft | [story-11.4-trust-merchant-system.md](./story-11.4-trust-merchant-system.md) |
| 11.5 | Scan Status Clarity | 3 | Draft | [story-11.5-scan-status-clarity.md](./story-11.5-scan-status-clarity.md) |
| 11.99 | Epic Release Deployment | 2 | Draft | [story-11.99-epic-release-deployment.md](./story-11.99-epic-release-deployment.md) |

---

## Dependencies

- **Epic 10:** Insight Engine (for scan complete insights in Quick Save flow)
- **Epic 10.0:** Foundation Sprint (useLearningPhases hook)
- **Story 10.7:** Batch Mode Summary (BatchSummary component used by Story 11.1)

---

## Success Metrics

- 90% of scans complete in <15 seconds (Quick Save path)
- <10% edit rate for Quick Save users
- Trust Merchant adoption >40% after 2 weeks
- User satisfaction increase (qualitative feedback)

---

## Created

- **Date:** 2025-12-16
- **Author:** PM Agent (John) via BMAD Framework
