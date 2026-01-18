# Process & Strategy

> Section 7 of Atlas Memory
> Last Sync: 2026-01-17
> Last Optimized: 2026-01-17 (Generation 5)
> Sources: retrospectives, CI/CD docs, sprint-status.yaml

## Development Workflow

1. **Epic Planning:** PRD → Architecture → Tech-Spec → Stories
2. **Story Execution:** Ready-for-Dev → In-Progress → Review → Done
3. **Code Review:** Required before merge, adversarial review style
4. **Deployment:** CI/CD auto-deploys to Firebase Hosting on main merge

## Branching Strategy (3-Branch)

| Branch | Purpose | Merges To |
|--------|---------|-----------|
| `main` | Production | - (auto-deploys) |
| `staging` | Pre-production | `main` via PR |
| `develop` | Integration | `staging` |
| `feature/*` | Feature branches | `develop` |

**Deploy Pipeline:** `feature/* → develop → staging → main`

**Hotfix Strategy:** Go directly to main, backport to staging and develop

**Sync Rules:**
- Merge commits for sync PRs (not squash)
- Pre-flight sync check before epic deployments
- Hotfixes backported immediately to all branches

## Deployment Strategy

| Environment | URL | Deploy Trigger |
|-------------|-----|----------------|
| Production | https://boletapp-d609f.web.app | Push to `main` |
| Preview | Firebase Hosting Preview | PR created |

**CI/CD Pipeline:**
- ~5 minute pipeline time (18 parallel jobs)
- Browser caching for E2E tests
- Lighthouse CI for performance monitoring (main only)
- Tiered testing: develop=smoke, main=full

## Sprint Status Tracking

**Source of Truth:** `docs/sprint-artifacts/sprint-status.yaml`

**Story States:**
```
backlog → drafted → ready-for-dev → in-progress → review → done
```

---

## Recent Deployments

| Story/Epic | Date | Notes |
|------------|------|-------|
| **Epic 14c Phase 2** | 2026-01-16 | Stories 14c.5-14c.10 (Shared Groups UI) |
| **Epic 14c Phase 1** | 2026-01-15 | Stories 14c.1-14c.4 (Core sharing) |
| **Combined Retro** | 2026-01-15 | Epics 12, 13, 14, 14d all COMPLETE |
| **Story 14.30.8 CI Fix** | 2026-01-14 | Explicit test groups, 18 parallel jobs |
| **Epic 14d Complete** | 2026-01-12 | Scan state machine refactor |
| **Epic 14 Complete** | 2026-01-12 | Animation, polygon, React Query |
| **Epic 13 Complete** | 2025-12-31 | 10 HTML mockups, design system |
| **Epic 12 Complete** | 2025-12-23 | Batch mode, parallel processing |

---

## Team Decisions

| Decision | Date | Reason |
|----------|------|--------|
| 3-Branch Strategy | Epic 10 | Restored conventional workflow |
| Adversarial Code Review | Epic 7 | Quality gate, find issues early |
| Context Files per Story | Epic 9 | Accelerate development, preserve knowledge |
| Parallel CI Jobs | Epic 8 | 63% faster pipelines |
| Explicit Test Groups | Story 14.30.8 | Predictable CI, no shard imbalance |
| Top-level Collections | Epic 14c | Cross-user access for shared groups |

## Sprint Cadence

- **Epic Duration:** Variable (typically 1-2 weeks)
- **Story Points:** 1-5 scale
- **Velocity Target:** ~8.6 points/day (achieved in Epics 12-14)
- **Epic Completion:** Always ends with deployment story + retrospective

## Payment Provider

- **Chile Market:** Mercado Pago integration (future)
- **Currency:** Chilean Pesos (CLP) primary, USD for reference
- **Billing Cycle:** Monthly (annual discounts future consideration)

---

## Sync Notes

- **Generation 5 (2026-01-17):** Updated deployment history through Epic 14c
- 3-branch strategy restored in Epic 10
- CI/CD optimized to ~5 min with 18 parallel jobs
- Sprint status tracking active since Epic 7
- Version: 1.0.0-beta.1
