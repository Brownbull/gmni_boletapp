# Atlas Memory - Application Knowledge Base

> **Architecture:** Sharded Knowledge Fragments
> **Last Sync:** 2026-01-14 (Story 14.30 - Atlas Code Review APPROVED)
> **Last Optimized:** 2026-01-12 (Generation 4)
> **Project:** BoletApp

---

## Memory Architecture

Atlas uses **sharded memory** for context efficiency. Knowledge stored in `knowledge/`:

| Section | File | Content |
|---------|------|---------|
| 01 | [01-purpose.md](knowledge/01-purpose.md) | App mission, target market, currency |
| 02 | [02-features.md](knowledge/02-features.md) | Feature inventory, Epic 14 + 14d status |
| 03 | [03-personas.md](knowledge/03-personas.md) | Chilean Family persona, Abuelita Test |
| 04 | [04-architecture.md](knowledge/04-architecture.md) | Tech stack, ADRs, key patterns |
| 05 | [05-testing.md](knowledge/05-testing.md) | Test metrics (3,100+ tests), CI/CD |
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

### Current Project Status

| Metric | Value |
|--------|-------|
| **Epic 14** | 26/27 stories done |
| **Epic 14d** | ✅ **11/11 stories done (COMPLETE)** |
| **Tests** | 3,146+ (84%+ coverage) |
| **Bundle** | 2.92 MB (**ALERT: needs optimization**) |

### Latest Completed (2026-01-14)
- **14.30:** ✅ Test Technical Debt - CI optimization + 30 test fixes (Atlas Code Review APPROVED)
- **14.30.5a:** ✅ Pre-Existing Test Failures fixed (filter state + translation keys)

### Epic 14d: Scan Architecture Refactor

**Key Design:** State machine with request precedence + persistence
- Request Precedence: Active request blocks ALL new requests
- Persistence: No expiration, survives logout/app close
- Credits: Reserved on API call, confirmed on success
- **Spec:** docs/sprint-artifacts/epic14d/scan-request-lifecycle.md

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
- ✅ **CI shard imbalance RESOLVED** (Story 14.30.8): Explicit test groups replace automatic sharding

---

*Entry point to Atlas's sharded knowledge. Load individual fragments for details.*
