# Process & Strategy

> Section 7 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: retrospectives, CI/CD docs, sprint-status.yaml

## Development Workflow

1. **Epic Planning:** PRD → Architecture → Tech-Spec → Stories
2. **Story Execution:** Ready-for-Dev → In-Progress → Review → Done
3. **Code Review:** Required before merge, adversarial review style
4. **Deployment:** CI/CD auto-deploys to Firebase Hosting on main merge

## Branching Strategy (Current: 2-Branch)

| Branch | Purpose | Merges To |
|--------|---------|-----------|
| `main` | Production | - (auto-deploys) |
| `feature/*` | Feature branches | `main` |

**Hotfix Strategy:** Go directly to main

**Sync Rules:**
- Merge commits for sync PRs (not squash)
- Pre-flight sync check before epic deployments
- Hotfixes backported immediately to all branches

## Deployment Strategy

| Environment | URL | Deploy Trigger |
|-------------|-----|----------------|
| Production | Firebase Hosting | Push to `main` |
| Preview | Firebase Hosting Preview | PR created |

**CI/CD Pipeline:**
- ~4 minute pipeline time
- Parallelized jobs for speed
- Browser caching for E2E tests
- Lighthouse CI for performance monitoring (main only)

## Sprint Status Tracking

**Source of Truth:** `docs/sprint-artifacts/sprint-status.yaml`

**Story States:**
```
backlog → drafted → ready-for-dev → in-progress → review → done
```

## Team Decisions

| Decision | Date | Reason |
|----------|------|--------|
| 2-Branch Strategy | Epic 7 | Simplify branching, squash merge issues |
| Adversarial Code Review | Epic 7 | Quality gate, find issues early |
| Context Files per Story | Epic 9 | Accelerate development, preserve knowledge |
| Parallel CI Jobs | Epic 8 | 63% faster pipelines |
| Lighthouse on Main Only | Epic 8 | PR speed optimization |

## Sprint Cadence

- **Epic Duration:** Variable (typically 1-2 weeks)
- **Story Points:** 1-5 scale
- **Velocity Target:** 7+ points/day (achievable with planning)
- **Epic Completion:** Always ends with deployment story + retrospective

## Payment Provider

<!-- Synced from: pricing-model.md:163 -->

- **Chile Market:** Mercado Pago integration (future)
- **Currency:** Chilean Pesos (CLP) primary, USD for reference
- **Billing Cycle:** Monthly (annual discounts future consideration)

---

## Sync Notes

- 2-branch strategy adopted after Epic 7
- CI/CD standards from Epic 8 retrospective
- Sprint status tracking active since Epic 7
