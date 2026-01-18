# Process & Strategy

> Section 7 of Atlas Memory
> Last Sync: 2025-12-31
> Sources: retrospectives, CI/CD docs, sprint-status.yaml

## Development Workflow

1. **Epic Planning:** PRD → Architecture → Tech-Spec → Stories
2. **Story Execution:** Ready-for-Dev → In-Progress → Review → Done
3. **Code Review:** Required before merge, adversarial review style
4. **Deployment:** CI/CD auto-deploys to Firebase Hosting on main merge

## Branching Strategy (Current: 3-Branch)

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
| 3-Branch Strategy | Epic 10 | Restored conventional workflow (develop → staging → main) |
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

## Recent Deployments

| Story | Date | Environment | Notes |
|-------|------|-------------|-------|
| **Story 14.30.8 CI Fix** | 2026-01-14 | Production | PR #148→#149 - Fixed useBatchReview & LearnMerchantDialog infinite loops. heavy-1 tests: 1m vs 10m timeout. 18 parallel CI jobs. |
| **Story 14.12 UI Refinements** | 2026-01-03 | Production | PR #136→#137 - Header sizing (72px), treemap badges with count-up, polygon dark mode fix, Recientes padding reduction, responsive 320px+ |
| **Story 14.12 Home Dashboard** | 2026-01-03 | Production | PR #135 - Carousel with 3 views (treemap, polygon, bump chart), month picker, 3 themes |
| **Epic 14 Stories 14.1-14.11** | 2026-01-02 | Production | PR #134 - Animation framework, screen transitions, polygon components, nav redesign |
| **Epic 12 Complete (12.5, 12.99)** | 2025-12-23 | Production | v9.7.0 - Batch insights with aggregate summary, 2799 tests |
| **Epic 12 Stories 12.1-12.4** | 2025-12-22 | Production | v9.6.0 - Batch Mode: Multi-image capture, parallel processing, batch review queue, credit warning. PR #127. 43 files, 8925 insertions, 200+ tests |
| **Stories 11.2-11.6** | 2025-12-22 | Production | v9.5.0 - Quick Save Card, Animated Item Reveal, Trust Merchants, Scan Status, Viewport Adaptation. PRs #119→#120→#121. 46 files, 5576 insertions |
| **Story 11.1** | 2025-12-21 | Production | v9.4.0 - Batch processing, 49 new tests, PR #116→#117→#118 |
| **v9.1.0 Duplicate Fix** | 2025-12-20 | Production | PR #106 - Simplified duplicate detection (date/merchant/amount/country), new duplicate_detected insight |
| **Epic 10 Complete** | 2025-12-19 | Production | PR #102 - Full Insight Engine: 12 generators, phase-based selection, batch mode |

## Epic 13 Documentation (2025-12-31)

| Deliverable | Status |
|-------------|--------|
| 10 HTML Mockups | ✅ Complete |
| Motion Design System | ✅ Complete |
| Voice & Tone Guidelines | ✅ Complete |
| Design System Reference | ✅ Complete |
| Critical Use Cases (E2E) | ✅ Complete |

## Epic 14 Ready-for-Dev (2025-12-31)

All 14 stories created with Atlas workflow analysis:
- Animation Framework (5 pts)
- Dynamic Polygon (11 pts)
- Celebrations (8 pts)
- Weekly Reports (5 pts)
- Enhanced Charts (6 pts)

---

## Sync Notes

- 3-branch strategy restored in Epic 10 (develop → staging → main)
- CI/CD standards from Epic 8 retrospective
- Sprint status tracking active since Epic 7
- **Epic 13 complete (2025-12-31):** Design phase with 10 HTML mockups
- **Epic 14 Phase 3 in progress (2026-01-03):** Story 14.12 UI refinements deployed. Phase 3 View Integration complete.
- **Next:** Story 14.13 Analytics Polygon Integration ready-for-dev
