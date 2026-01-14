# Atlas Memory - Application Knowledge Base

> **Architecture:** Sharded Knowledge Fragments
> **Last Sync:** 2026-01-10
> **Project:** BoletApp
> **Sync Status:** All 9 sections synced

---

## Memory Architecture

Atlas uses **sharded memory** for context efficiency. Knowledge is stored in separate files under `knowledge/`:

| Section | File | Last Sync | Content |
|---------|------|-----------|---------|
| 01 | [01-purpose.md](knowledge/01-purpose.md) | 2025-12-18 | App mission, target market, currency, value proposition |
| 02 | [02-features.md](knowledge/02-features.md) | 2026-01-10 | Feature inventory, Epic 14 + **14d** status, **Story 14.13b filter persistence** |
| 03 | [03-personas.md](knowledge/03-personas.md) | 2025-12-18 | Chilean Family persona, Abuelita Test, user goals |
| 04 | [04-architecture.md](knowledge/04-architecture.md) | 2026-01-10 | Tech stack, ADRs, data model, **filter persistence pattern** |
| 05 | [05-testing.md](knowledge/05-testing.md) | 2026-01-06 | Test metrics (3,100+ tests, 84%+ coverage), CI/CD |
| 06 | [06-lessons.md](knowledge/06-lessons.md) | 2026-01-10 | Retrospective learnings, **filter persistence lessons** |
| 07 | [07-process.md](knowledge/07-process.md) | 2026-01-06 | 3-branch strategy, deployment, sprint tracking |
| 08 | [08-workflow-chains.md](knowledge/08-workflow-chains.md) | 2026-01-08 | 11+ user journeys, **Epic 14d scan lifecycle** |
| 09 | [09-sync-history.md](knowledge/09-sync-history.md) | 2026-01-10 | Sync log, documents tracked, drift detection |

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
| **Current Epic** | Epic 14 (Core Implementation) + **Epic 14d** (Scan Refactor - Design Complete) |
| **Last Deployed** | Story 14.22 Settings View Redesign (2026-01-06) |
| **Test Coverage** | 84%+ (3,118+ tests passing) |
| **Bundle Size** | 2.0 MB (above 1MB threshold - needs optimization) |

### Epic 14d: Scan Architecture Refactor (In Progress)

**Key Design:** State machine with request precedence + persistence
- Request Precedence: Active request blocks ALL new requests
- Persistence: No expiration, survives logout/app close
- Credits: Reserved on API call, confirmed on success
- Offline: Error immediately, refund credit
- **Spec:** docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
- **Mockup:** docs/uxui/mockups/00_components/scan-mode-selector.html (Style 19)

**Story 14d.4 Breakdown (2026-01-09):**
Analysis revealed ~107 state setter usages → divided into 4 sub-stories:
- **14d.4a** (3 pts): State Bridge Layer - `useScanStateBridge` hook (READY)
- **14d.4b** (5 pts): Consumer Migration - Views/dialogs use ScanContext
- **14d.4c** (5 pts): State Variable Removal - Remove 8 useState from App.tsx
- **14d.4d** (5 pts): pendingScan Migration - Complex persistence state
Total: 18 pts (revised from 8 pts)

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
- **ALERT: Bundle size at 2.0 MB** (exceeded 1MB threshold - code splitting needed)
- Test coverage dropping below 80% (currently 84%+, 3,118+ tests)

---

*This file is the entry point to Atlas's sharded knowledge system. Load individual fragments for detailed information.*
