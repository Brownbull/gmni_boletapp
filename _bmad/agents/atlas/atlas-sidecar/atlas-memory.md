# Atlas Memory - Application Knowledge Base

> **Architecture:** Sharded Knowledge Fragments
> **Last Sync:** 2026-01-29 (Story 14e-29d APPROVED - Placeholder Handler Documentation Pattern)
> **Last Optimized:** 2026-01-24 (Generation 5)
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

### Critical Facts (Verified 2026-01-24)

| Fact | Value | Source |
|------|-------|--------|
| **Target Market** | Chilean families | ux-design-specification.md:10 |
| **Primary Currency** | CLP (Chilean Pesos) | pricing-model.md:164 |
| **Core Value** | "Help Chilean families answer 'Where did my money go?'" | ux-design-specification.md:12 |
| **Payment Provider** | Mercado Pago (Chile) | pricing-model.md:163 |

### Current Status Summary (2026-01-24)

| Metric | Value |
|--------|-------|
| **Epic 14c-refactor** | ✅ COMPLETE (36 stories) |
| **Epic 14e** | 🔄 IN PROGRESS (Feature Architecture) |
| **Tests** | 5,759+ (84%+ coverage) |
| **Bundle** | 2.92 MB ⚠️ |
| **App.tsx** | 3,850 lines (from 4,800) |

> **Full status:** See [09-sync-history.md](knowledge/09-sync-history.md)

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

## Generation 5 Optimization Summary (2026-01-24)

| Fragment | Before | After | Reduction |
|----------|--------|-------|-----------|
| atlas-memory.md | 120 lines | ~70 lines | 42% |
| 02-features.md | 743 lines | ~400 lines | 46% |
| 04-architecture.md | 769 lines | ~550 lines | 28% |
| 06-lessons.md | 387 lines | ~300 lines | 22% |
| 09-sync-history.md | 186 lines | ~100 lines | 46% |

**Key changes:**
- Removed duplicate project status (single source in 09-sync-history.md)
- Archived reverted Epic 14c cache optimization patterns
- Consolidated completed epic story tables
- Fixed generation numbering (sync ≠ optimization generations)

**Backup location:** `backups/v5/`

---

*Entry point to Atlas's sharded knowledge. Load individual fragments for details.*
