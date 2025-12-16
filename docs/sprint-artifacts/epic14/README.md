# Epic 14: Onboarding & Progressive Disclosure

**Epic Status:** Planning Complete
**Total Story Points:** ~15 points
**Estimated Duration:** 1-2 weeks

---

## Epic Summary

Epic 14 achieves time-to-value under 60 seconds for new users through demo walkthrough, progressive feature unlocking, and smart defaults. Based on research showing that time-to-value < 60 seconds is the clearest pattern for successful apps.

**Key Insight:** Empty dashboards with no direction cause immediate bounce.

---

## Story Map

```
Epic 14: Onboarding & Progressive Disclosure (~15 points)
│
├── Story 14.1: Demo Mode Walkthrough (5 points)
│   Dependencies: None
│   Deliverable: Mockup-based intro, skippable, persistent "Getting Started"
│
├── Story 14.2: Feature Unlocking System (5 points)
│   Dependencies: Story 14.1
│   Deliverable: Progressive reveal based on data, unlock notifications
│
├── Story 14.3: Onboarding Checklist (3 points)
│   Dependencies: Story 14.1
│   Deliverable: Persistent progress indicator, celebration on completion
│
├── Story 14.4: Smart Defaults (2 points)
│   Dependencies: None
│   Deliverable: Sensible initial settings, first-run suggestions
│
└── Story 14.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment
```

---

## Stories Summary

| Story | Title | Points | Key Deliverable |
|-------|-------|--------|-----------------|
| 14.1 | Demo Mode Walkthrough | 5 | Mockup intro to scan→insight flow, skip option, "Getting Started" access |
| 14.2 | Feature Unlocking System | 5 | Gated features (5/15/60 txns), unlock notifications |
| 14.3 | Onboarding Checklist | 3 | Progress indicator, completion celebration |
| 14.4 | Smart Defaults | 2 | Pre-filled examples, sensible settings |
| 14.99 | Epic Release Deployment | 2 | Time-to-value < 60s verification |

---

## Feature Gating Rules

| Feature | Unlock Requirement |
|---------|-------------------|
| Weekly Digest | 5 transactions |
| Category Insights | 15 transactions |
| Month Comparison | 30 transactions |
| Predictions | 60 transactions |

---

## Key Principles

1. **One CTA Per Screen:** Simplify decision points during onboarding
2. **Learning by Doing:** Checklists outperform product tours
3. **Progressive Disclosure:** Prevent overwhelm by revealing features gradually
4. **Returnable:** "Getting Started" always accessible from Settings

---

## Dependencies

- **Epic 10:** Features to unlock (insights, summaries)
- **Epic 11:** Quick Save as primary first action

---

## Research References

- [reddit_post.md](../../uxui/research/reddit_post.md) - Engagement lessons from entrepreneurs

---

## Created

- **Date:** 2025-12-16
- **Author:** PM Agent (John) via BMAD Framework
