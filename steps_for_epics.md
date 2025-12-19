# Boletapp Epic Workflow Guide

**Last Updated:** 2025-12-17 (BMAD v6.0.0-alpha.18 Update)
**Framework:** BMad Method Module (BMM)

---

## Current Status

### COMPLETED EPICS
- Epic 1: Modular Architecture ✅
- Epic 2: Test Environment ✅
- Epic 3: E2E Testing ✅
- Epic 4: Security Hardening ✅
- Epic 4.5: Receipt Image Storage ✅
- Epic 5: Data Download & Export ✅
- Epic 6: Smart Category Learning ✅
- Epic 7: Analytics UX Redesign ✅ (2025-12-09)
- Epic 8: Scan Testing & Tuning Infrastructure ✅ (2025-12-12)
- Epic 9: Scan Enhancement & Merchant Learning ✅ (2025-12-15)

### NEXT: Epic 10 - Foundation + Engagement & Insight Engine

**Scope:** Notifications system, streak gamification, insight engine, analytics navigation improvements

**Planning Approach:** Feature Epic (PRD + Architecture already created)

**Key Documents for Epic 10:**
| Document | Location | Purpose |
|----------|----------|---------|
| PRD | `docs/sprint-artifacts/epic10/prd-epic10-insight-engine.md` | Requirements and scope |
| Architecture | `docs/sprint-artifacts/epic10/architecture-epic10-insight-engine.md` | Technical decisions |
| Sprint Status | `docs/sprint-artifacts/sprint-status.yaml` | 10 stories ready-for-dev |

---

## Workflow Types by Epic Category

### Infrastructure/Technical Epics (No UX Changes)
**Examples:** Epic 4 (Security), Epic 4.5 (Image Storage backend), Epic 8 (Scan Testing)

```
create-tech-spec → create-story → dev-story → code-review → retrospective
```

### Feature Epics (User-Facing Changes)
**Examples:** Epic 5 (Data Export), Epic 6 (Category Learning), Epic 9 (Scan Enhancement)

```
create-prd → create-tech-spec → create-story → [story cycle] → retrospective
```

**Note:** PRD optional for well-defined features. UX design optional if minimal UI changes.

### UX-Heavy Epics (Major UI/Navigation Changes)
**Examples:** Epic 7 (Analytics UX), Epic 10 (Insight Engine)

```
create-product-brief → create-prd → create-ux-design → create-architecture → create-epics-and-stories → [story cycle] → retrospective
```

### Platform Epics (Major Architecture Changes)
**Examples:** Epic 13 (Mobile App)

```
create-product-brief → research → create-prd → create-ux-design → create-architecture → create-epics-and-stories → [story cycle] → retrospective
```

---

## Quick Reference: All Workflows (BMAD v6.0.0-alpha.18)

### Analysis Phase
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **create-product-brief** | `/bmad:bmm:workflows:create-product-brief` | Define product vision | Feature epics, new capabilities |
| **research** | `/bmad:bmm:workflows:research` | Market/technical/domain research | New domains, integrations |

### Planning Phase
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **create-prd** | `/bmad:bmm:workflows:create-prd` | Detailed requirements (step-based) | After product-brief |
| **create-ux-design** | `/bmad:bmm:workflows:create-ux-design` | UX specifications | User-facing features |

### Solutioning Phase
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **create-architecture** | `/bmad:bmm:workflows:create-architecture` | Technical architecture decisions | Complex features, new integrations |
| **create-epics-and-stories** | `/bmad:bmm:workflows:create-epics-and-stories` | Break PRD into stories | After architecture |
| **check-implementation-readiness** | `/bmad:bmm:workflows:check-implementation-readiness` | Validate docs before dev | Before sprint starts |

### Implementation Phase
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **sprint-planning** | `/bmad:bmm:workflows:sprint-planning` | Generate sprint status YAML | Start of epic |
| **sprint-status** | `/bmad:bmm:workflows:sprint-status` | Check current status | Anytime |
| **create-story** | `/bmad:bmm:workflows:create-story` | Create story file | Per story |
| **dev-story** | `/bmad:bmm:workflows:dev-story` | Execute implementation | Development phase |
| **code-review** | `/bmad:bmm:workflows:code-review` | Adversarial senior review | After implementation |
| **correct-course** | `/bmad:bmm:workflows:correct-course` | Handle significant changes | When blocked |
| **retrospective** | `/bmad:bmm:workflows:retrospective` | Epic retrospective | After all stories done |

### Quick Flow (Brownfield/Fast-Track)
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **quick-dev** | `/bmad:bmm:workflows:quick-dev` | Fast implementation | Direct instructions or tech-specs |
| **create-tech-spec** | `/bmad:bmm:workflows:create-tech-spec` | Quick technical spec | Brownfield changes |

### Test Architecture (NEW in v6)
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **testarch-framework** | `/bmad:bmm:workflows:testarch-framework` | Initialize Playwright/Cypress | New test setup |
| **testarch-test-design** | `/bmad:bmm:workflows:testarch-test-design` | Test planning & design | Before implementation |
| **testarch-atdd** | `/bmad:bmm:workflows:testarch-atdd` | Generate failing tests first | TDD approach |
| **testarch-automate** | `/bmad:bmm:workflows:testarch-automate` | Expand test coverage | After implementation |
| **testarch-test-review** | `/bmad:bmm:workflows:testarch-test-review` | Review test quality | Test audits |
| **testarch-nfr** | `/bmad:bmm:workflows:testarch-nfr` | Non-functional requirements | Before release |
| **testarch-ci** | `/bmad:bmm:workflows:testarch-ci` | CI/CD pipeline setup | New CI configuration |
| **testarch-trace** | `/bmad:bmm:workflows:testarch-trace` | Requirements traceability | Quality gates |

### Diagrams
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **create-excalidraw-diagram** | `/bmad:bmm:workflows:create-excalidraw-diagram` | Architecture/UML diagrams | Technical documentation |
| **create-excalidraw-wireframe** | `/bmad:bmm:workflows:create-excalidraw-wireframe` | UI wireframes | UX design |
| **create-excalidraw-flowchart** | `/bmad:bmm:workflows:create-excalidraw-flowchart` | Process flows | Documentation |
| **create-excalidraw-dataflow** | `/bmad:bmm:workflows:create-excalidraw-dataflow` | Data flow diagrams | Architecture |

### Utility Workflows
| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **document-project** | `/bmad:bmm:workflows:document-project` | Analyze/document codebase | Brownfield projects |
| **generate-project-context** | `/bmad:bmm:workflows:generate-project-context` | Create project-context.md | AI agent context |
| **workflow-init** | `/bmad:bmm:workflows:workflow-init` | Initialize BMM project | New projects |
| **workflow-status** | `/bmad:bmm:workflows:workflow-status` | Check workflow progress | Anytime |

---

## Detailed Epic Sequences

### COMPLETED: Epic 9 - Scan Enhancement & Merchant Learning ✅

**Type:** Feature Epic (backend infrastructure + minimal UI)
**Duration:** 3 days (2025-12-13 to 2025-12-15)
**Stories:** 21 stories (9.1-9.20 + 9.99)
**Deployed:** 2025-12-15

| Step | Command | Status |
|------|---------|--------|
| 1 | PRD | ✅ Done |
| 2 | Tech-Spec | ✅ Done |
| 3-6 | Story cycle (21 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed |

---

### CURRENT: Epic 10 - Foundation + Engagement & Insight Engine

**Type:** UX-Heavy Epic (notifications, gamification, insights)
**Status:** `contexted` - 10 stories ready-for-dev
**Stories:** 10.0-10.99 (including foundation sprint and release)

| Step | Command | Status | Notes |
|------|---------|--------|-------|
| 1 | PRD | ✅ Done | `docs/sprint-artifacts/epic10/prd-epic10-insight-engine.md` |
| 2 | Architecture | ✅ Done | `docs/sprint-artifacts/epic10/architecture-epic10-insight-engine.md` |
| 3 | `/bmad:bmm:workflows:sprint-status` | ⏳ CHECK | Verify sprint-status.yaml |
| 4 | `/bmad:bmm:workflows:create-story` | ⏳ NEXT | Create story 10.0 file if needed |
| 5 | `/bmad:bmm:workflows:dev-story` | Pending | Execute implementation |
| 6 | `/bmad:bmm:workflows:code-review` | Pending | Adversarial review |
| 7 | Repeat 4-6 for remaining stories | Pending | 10 stories total |
| 8 | `/bmad:bmm:workflows:retrospective` | Pending | Epic 10 retrospective |

**Epic 10 Stories (from sprint-status.yaml):**
| Story | Status | Description |
|-------|--------|-------------|
| 10.0 | ready-for-dev | Foundation Sprint |
| 10.1 | ready-for-dev | Insight Engine Core |
| 10.2-10.x | ready-for-dev | (check sprint-status.yaml) |
| 10.99 | ready-for-dev | Epic Release Deployment |

**Next Action:** Run `/bmad:bmm:workflows:sprint-status` to see current state

---

### PLANNED: Epic 11-16 (Backlog)

See `docs/sprint-artifacts/sprint-status.yaml` for full backlog.

---

## Story Cycle (Simplified in v6)

```
┌─────────────────┐
│  create-story   │  Create story file from epics
└────────┬────────┘
         ↓
┌─────────────────┐
│   dev-story     │  Execute implementation (includes context)
└────────┬────────┘
         ↓
┌─────────────────┐
│  code-review    │  Adversarial senior developer review
│  + TEA review   │  (TEA reviews test quality if new tests added)
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Approved?│
    └────┬────┘
    YES  │  NO → Fix issues → code-review again
         ↓
┌─────────────────┐
│ Verify Deploy   │  Check https://boletapp-d609f.web.app
└────────┬────────┘
         ↓
    Story marked as "done" by reviewer
```

**Note:** The v6 workflow consolidates `story-context`, `story-ready`, and `story-done` into the `dev-story` and `code-review` workflows.

**TEA Integration (Epic 10+):** When a story adds new test files, the SM should invoke `/bmad:bmm:workflows:testarch-test-review` to have the TEA agent audit test quality.

**Process Rules (from retrospectives):**
> - Developers mark stories as "review" only. Only reviewers mark stories as "done" after approval.
> - Deployment is part of the deliverable - not complete until deployed and verified.
> - Every epic ends with a deployment story using the standard template.

---

## Team Agreements (Compiled from Retrospectives)

### From Epic 4-6 Retrospectives
1. Developers never mark stories "done" - only reviewers do
2. Secrets awareness - pre-commit hooks active
3. Deployment is part of the deliverable
4. Every epic ends with a deployment story
5. CI/CD must auto-deploy to Firebase (no manual steps)
6. Team standards live in `docs/team-standards.md`

### From Epic 7-8 Retrospectives
7. Architecture docs improve agent consistency across stories
8. CI/CD time budgets: setup ~2min, test jobs ~2min each, total PR <7min
9. Parallel CI jobs with shared workspace caching
10. Never hardcode API keys - use environment variables

### From Epic 9 Retrospective
11. UX-heavy epics get formal PRD + Architecture treatment
12. Production verification is mandatory before marking epic complete

---

## Decision Tree: Which Workflows to Use?

```
Is this a user-facing feature?
├── YES: Does it need UX design?
│   ├── YES: Full sequence (create-product-brief → create-prd → create-ux-design → create-architecture → create-epics-and-stories)
│   └── NO: Abbreviated (create-prd → create-tech-spec OR create-epics-and-stories)
│
└── NO: Is it infrastructure/backend only?
    ├── YES: Minimal sequence (create-tech-spec → stories) OR quick-dev
    └── NO: Is it a platform change?
        ├── YES: Extended sequence (add research before create-prd)
        └── NO: Use judgment based on complexity
```

---

## Test Architecture Workflows (NEW)

The BMAD v6 includes comprehensive **TestArch** workflows for E2E testing with Playwright:

### When to Use Each TestArch Workflow

| Scenario | Workflow | Purpose |
|----------|----------|---------|
| Setting up Playwright from scratch | `testarch-framework` | Scaffolds config, fixtures, CI templates |
| Planning tests before coding | `testarch-test-design` | Design test strategy at epic/system level |
| TDD approach (tests first) | `testarch-atdd` | Generate failing acceptance tests |
| Adding tests after implementation | `testarch-automate` | Expand coverage for existing code |
| Reviewing test quality | `testarch-test-review` | Audit tests against best practices |
| Pre-release validation | `testarch-nfr` | Assess performance, security, reliability |
| Setting up CI pipeline | `testarch-ci` | GitHub Actions/GitLab CI with burn-in loops |
| Quality gate decisions | `testarch-trace` | Requirements-to-tests traceability matrix |

### TestArch Knowledge Base

The framework includes 32 specialized knowledge fragments in `_bmad/bmm/testarch/knowledge/`:
- **Core patterns**: test-levels, data-factories, fixture-architecture, network-first
- **Quality**: test-quality, test-healing-patterns, selector-resilience
- **CI/CD**: ci-burn-in, timing-debugging, visual-debugging
- **Optional**: Playwright Utils library patterns (if installed)

### Optional: Playwright Utils Library

For advanced patterns, you can install:
```bash
npm install -D @seontechnologies/playwright-utils
```

Features: API request helpers, network recording, auth sessions, file utilities, burn-in detection.

---

## Workflow Tips

### When to Use `research`
- New payment provider integration (Mercado Pago)
- AI/ML algorithm selection
- Platform technology decisions
- Third-party API evaluation

### When to Skip `create-product-brief`
- Bug fixes
- Infrastructure improvements
- Security hardening
- Performance optimization

### When to Use `quick-dev`
- Small, well-defined changes
- Brownfield improvements
- Direct user instructions
- Tech-spec already exists

---

## Related Documentation

- [Sprint Status](docs/sprint-artifacts/sprint-status.yaml) - Current epic/story status
- [Epics Definition](docs/planning/epics.md) - All epic definitions
- [Team Standards](docs/team-standards.md) - Team agreements and workflow standards
- [BMM Documentation](_bmad/bmm/docs/README.md) - Full BMM framework docs

### Retrospective Documents
- [Epic 1-8 Retros](docs/sprint-artifacts/) - In respective epic folders
- [Epic 9 Retro](docs/sprint-artifacts/epic9/epic-9-retro.md)

---

## Removed Workflows (v6 Migration)

The following workflows from v5 have been consolidated or removed:

| Old Workflow | New Equivalent |
|--------------|----------------|
| `product-brief` | `create-product-brief` |
| `prd` | `create-prd` |
| `architecture` | `create-architecture` |
| `tech-spec` | `create-tech-spec` or `create-epics-and-stories` |
| `story-context` | Integrated into `dev-story` |
| `story-ready` | Integrated into `create-story` |
| `story-done` | Integrated into `code-review` |
| `brainstorm-project` | `create-product-brief` or `/bmad:core:workflows:brainstorming` |
| `domain-research` | `research` |
| `diagrams/*` | `create-excalidraw-*` |

---

**Version:** 6.0
**Updated:** 2025-12-17
