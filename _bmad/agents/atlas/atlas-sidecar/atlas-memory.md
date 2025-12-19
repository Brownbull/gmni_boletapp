# Atlas Memory - Application Knowledge Base

> **Architecture:** Sharded Knowledge Fragments
> **Last Sync:** 2025-12-18
> **Project:** BoletApp
> **Sync Status:** All 9 sections synced

---

## Memory Architecture

Atlas uses **sharded memory** for context efficiency. Knowledge is stored in separate files under `knowledge/`:

| Section | File | Last Sync | Content |
|---------|------|-----------|---------|
| 01 | [01-purpose.md](knowledge/01-purpose.md) | 2025-12-18 | App mission, target market, currency, value proposition |
| 02 | [02-features.md](knowledge/02-features.md) | 2025-12-18 | Feature inventory, Epic 10 status, roadmap |
| 03 | [03-personas.md](knowledge/03-personas.md) | 2025-12-18 | Chilean Family persona, Abuelita Test, user goals |
| 04 | [04-architecture.md](knowledge/04-architecture.md) | 2025-12-18 | Tech stack, ADRs, data model, patterns |
| 05 | [05-testing.md](knowledge/05-testing.md) | 2025-12-18 | Test metrics (1,219+ tests, 84%+ coverage), CI/CD |
| 06 | [06-lessons.md](knowledge/06-lessons.md) | 2025-12-18 | Retrospective learnings, patterns to follow/avoid |
| 07 | [07-process.md](knowledge/07-process.md) | 2025-12-18 | 3-branch strategy, deployment, sprint tracking |
| 08 | [08-workflow-chains.md](knowledge/08-workflow-chains.md) | 2025-12-18 | 4 critical user journeys, impact matrix |
| 09 | [09-sync-history.md](knowledge/09-sync-history.md) | 2025-12-18 | Sync log, documents tracked, drift detection |

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
| **Current Epic** | Epic 10 (Foundation + Insight Engine) |
| **Last Deployed** | Story 10.1 InsightEngine Service Interface (2025-12-18) |
| **Test Coverage** | 84%+ (1,057+ unit, 328+ integration) |
| **Bundle Size** | 948KB (approaching 1MB threshold) |

---

## How to Use Sharded Memory

### For Queries
1. Consult `atlas-index.csv` to identify relevant fragments
2. Load ONLY the needed fragment(s) from `knowledge/`
3. Common patterns:
   - Purpose questions → 01-purpose.md
   - Feature questions → 02-features.md
   - User/persona questions → 03-personas.md
   - Architecture/tech questions → 04-architecture.md
   - Testing questions → 05-testing.md
   - "What went wrong" → 06-lessons.md
   - Process/deployment → 07-process.md
   - User journey questions → 08-workflow-chains.md
   - Sync status → 09-sync-history.md

### For Sync Operations
1. Start with 09-sync-history.md to check last sync
2. Identify which source documents have changed
3. Update ONLY the affected fragment(s)
4. Record sync in 09-sync-history.md

---

## Push Alert Triggers (Always Active)

Monitoring for:
- Story creation affecting existing workflows
- Code review findings without test coverage
- Architecture conflicts with documented patterns
- Bundle size approaching 1MB threshold (currently 948KB)
- Test coverage dropping below 80% (currently 84%+)

---

*This file is the entry point to Atlas's sharded knowledge system. Load individual fragments for detailed information.*
