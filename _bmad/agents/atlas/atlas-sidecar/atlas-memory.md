# Atlas Memory - Application Knowledge Base

> **Architecture:** Sharded Knowledge Fragments
> **Last Sync:** 2026-01-17 (Epic 14c Phase 2)
> **Last Optimized:** 2026-01-17 (Generation 5)
> **Project:** BoletApp

---

## Memory Architecture

Atlas uses **sharded memory** for context efficiency. Knowledge stored in `knowledge/`:

| Section | File | Content |
|---------|------|---------|
| 01 | [01-purpose.md](knowledge/01-purpose.md) | App mission, target market, currency |
| 02 | [02-features.md](knowledge/02-features.md) | Feature inventory, Epic status |
| 03 | [03-personas.md](knowledge/03-personas.md) | Chilean Family persona, Abuelita Test |
| 04 | [04-architecture.md](knowledge/04-architecture.md) | Tech stack, ADRs, key patterns |
| 05 | [05-testing.md](knowledge/05-testing.md) | Test metrics (3,146+ tests), CI/CD |
| 06 | [06-lessons.md](knowledge/06-lessons.md) | Pattern tables, critical learnings |
| 07 | [07-process.md](knowledge/07-process.md) | 3-branch strategy, deployment |
| 08 | [08-workflow-chains.md](knowledge/08-workflow-chains.md) | 10 user journeys, scan lifecycle |
| 09 | [09-sync-history.md](knowledge/09-sync-history.md) | Sync log, project status |

---

## Quick Reference

### Critical Facts (Verified 2025-12-18)

| Fact | Value | Source |
|------|-------|--------|
| **Target Market** | Chilean families | ux-design-specification.md:10 |
| **Primary Currency** | CLP (Chilean Pesos) | pricing-model.md:164 |
| **Core Value** | "Help Chilean families answer 'Where did my money go?'" | ux-design-specification.md:12 |
| **Payment Provider** | Mercado Pago (Chile) | pricing-model.md:163 |

### Current Project Status (2026-01-17)

| Metric | Value |
|--------|-------|
| **Epic 12** | ✅ COMPLETE (6/6 stories) |
| **Epic 13** | ✅ COMPLETE (14/14 stories) |
| **Epic 14** | ✅ COMPLETE (50+ stories) |
| **Epic 14d** | ✅ COMPLETE (11/11 stories) |
| **Epic 14c** | 🔄 IN PROGRESS (10/11 stories) |
| **Tests** | 3,146+ (84%+ coverage) |
| **Bundle** | 2.92 MB (**ALERT: needs optimization**) |
| **Velocity** | ~8.6 pts/day (216 pts in 25 days) |

### Latest Milestone (2026-01-17)
- **Epic 14c:** Household Sharing - 11/14 stories complete (14c.5 infrastructure done)
- **In Progress:** Story 14c.12 (Real-Time Sync - completes cross-user cache invalidation)
- **Remaining:** 14c.9 (Analytics), 14c.11 (Error Handling), 14c.12, 14c.13 (FCM), 14c.99
- **Version:** 1.0.0-beta.1 (ready for controlled beta)

### Next Epics Roadmap

| Epic | Theme | Prep Required |
|------|-------|---------------|
| **14c** | Household Sharing | 1 story remaining |
| **14E** | Codebase Refactoring | Architecture review |
| **14F** | Invite-Only Access | Requirements definition |

### Epic 14c: Household Sharing (IN PROGRESS)

**Key Features Delivered:**
- Shared Groups with share code invitations
- View Mode Switcher (personal/group toggle)
- Transaction tagging to groups (manual + auto)
- Ownership indicators with member avatars
- Member filtering and empty states

**Spec:** docs/sprint-artifacts/epic14c/

---

## How to Use Sharded Memory

### For Queries
1. Consult `atlas-index.csv` to identify relevant fragments
2. Load ONLY the needed fragment(s) from `knowledge/`

### For Sync Operations
1. Start with 09-sync-history.md to check last sync
2. Update ONLY the affected fragment(s)
3. Record sync in 09-sync-history.md

---

## Push Alert Triggers

- Story creation affecting existing workflows
- Code review findings without test coverage
- Architecture conflicts with documented patterns
- ⚠️ **Bundle size at 2.92 MB** (code splitting needed)
- Test coverage dropping below 80%
- ✅ **CI shard imbalance RESOLVED** (Story 14.30.8): Explicit test groups

---

## Generation 5 Optimization Summary (2026-01-17)

| Fragment | Before | After | Reduction |
|----------|--------|-------|-----------|
| 06-lessons.md | 528 lines | ~230 lines | 56% |
| 09-sync-history.md | 527 lines | ~120 lines | 77% |
| 02-features.md | 209 lines | ~145 lines | 31% |
| 05-testing.md | 234 lines | ~195 lines | 17% |
| 07-process.md | 125 lines | ~105 lines | 16% |

**Total reduction:** ~500 lines (~35% smaller knowledge base)

**Backup location:** `backups/v5/`

---

*Entry point to Atlas's sharded knowledge. Load individual fragments for details.*
