# Boletapp Epic Workflow Guide

**Last Updated:** 2025-12-12 (Post-Epic 8 Retrospective)
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

### NEXT: Epic 9 - Scan Enhancement & Merchant Learning

**Scope:** Integrate v2.6.0 prompt fields into Transaction type and implement merchant name learning

**Planning Approach:** Feature Epic (PRD + Tech-Spec already created)

**Key Documents for Epic 9:**
| Document | Location | Purpose |
|----------|----------|---------|
| PRD | `docs/sprint-artifacts/epic9/prd-epic9-scan-enhancement.md` | Requirements and scope |
| Tech Spec | `docs/sprint-artifacts/epic9/tech-spec-epic-9.md` | 7 stories, ~18 points |
| Epic 8 Retro | `docs/sprint-artifacts/epic8/epic-8-retrospective.md` | CI/CD standards, prompt v2.6.0 |
| Category Learning | `src/services/categoryMappingService.ts` | Pattern to follow |

**Epic 9 Scope Summary:**
- Transaction type extension: time, country, city, currency, receiptType, promptVersion
- Item category/subcategory integration
- Merchant name learning (same pattern as category learning)
- Minimal UI updates in Edit view
- Merchant mappings management in Settings

---

## Workflow Types by Epic Category

### Infrastructure/Technical Epics (No UX Changes)
**Examples:** Epic 4 (Security), Epic 4.5 (Image Storage backend), Epic 8 (Scan Testing)

```
tech-spec → create-story → story-ready → dev-story → code-review → story-done → retrospective
```

### Feature Epics (User-Facing Changes)
**Examples:** Epic 5 (Data Export), Epic 6 (Category Learning), Epic 9 (Scan Enhancement)

```
prd → tech-spec → create-story → [story cycle] → retrospective
```

**Note:** PRD optional for well-defined features. UX design optional if minimal UI changes.

### UX-Heavy Epics (Major UI/Navigation Changes)
**Examples:** Epic 7 (Analytics UX), Epic 10 (UX Redesign)

```
product-brief → prd → create-ux-design → architecture → tech-spec → create-story → [story cycle] → retrospective
```

### Platform Epics (Major Architecture Changes)
**Examples:** Epic 13 (Mobile App)

```
product-brief → research → prd → create-ux-design → architecture → tech-spec → create-story → [story cycle] → retrospective
```

---

## Quick Reference: All Workflows

| Workflow | Command | Purpose | When to Use |
|----------|---------|---------|-------------|
| **product-brief** | `/bmad:bmm:workflows:product-brief` | Define product vision | Feature epics, new capabilities |
| **prd** | `/bmad:bmm:workflows:prd` | Detailed requirements | After product-brief |
| **create-ux-design** | `/bmad:bmm:workflows:create-ux-design` | UX specifications | User-facing features |
| **architecture** | `/bmad:bmm:workflows:architecture` | Technical architecture | Complex features, new integrations |
| **tech-spec** | `/bmad:bmm:workflows:tech-spec` | Technical spec + stories | All epics |
| **create-story** | `/bmad:bmm:workflows:create-story` | Create story file | Per story |
| **story-context** | `/bmad:bmm:workflows:story-context` | Generate story context XML | Before dev-story |
| **story-ready** | `/bmad:bmm:workflows:story-ready` | Mark ready for dev | After story drafted |
| **dev-story** | `/bmad:bmm:workflows:dev-story` | Execute implementation | Development phase |
| **code-review** | `/bmad:bmm:workflows:code-review` | Senior dev review | After implementation |
| **story-done** | `/bmad:bmm:workflows:story-done` | Mark complete | After review approval |
| **retrospective** | `/bmad:bmm:workflows:retrospective` | Epic retrospective | After all stories done |
| **research** | `/bmad:bmm:workflows:research` | Deep research | New domains, integrations |
| **domain-research** | `/bmad:bmm:workflows:domain-research` | Domain exploration | Complex problem spaces |
| **brainstorm-project** | `/bmad:bmm:workflows:brainstorm-project` | Creative ideation | Early planning |

---

## Detailed Epic Sequences

### COMPLETED: Epic 7 - Analytics UX Redesign ✅

**Type:** UX-Heavy Epic (major UI/navigation changes)
**Duration:** 5 days (2025-12-05 to 2025-12-09)
**Stories:** 19 stories (7.1-7.18 + 7.99)
**Deployed:** 2025-12-09 to https://boletapp-d609f.web.app

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:product-brief` | ✅ Done |
| 2 | `/bmad:bmm:workflows:prd` | ✅ Done |
| 3 | `/bmad:bmm:workflows:architecture` | ✅ Done |
| 4 | `/bmad:bmm:workflows:tech-spec` | ✅ Done |
| 5-6 | Story cycle (19 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed 2025-12-10 |

**Key Deliverables:**
- Dual-axis breadcrumb navigation (Temporal + Category)
- Quarter and Week temporal views
- Chart dual mode (Aggregation vs Comparison)
- Stacked bar charts with tooltips
- Drill-down cards with progress bars
- App-wide theme system (Light/Dark/System, Normal/Professional)
- Floating download FAB
- Navigation label updates (History → Receipts, Trends → Analytics)

---

### COMPLETED: Epic 8 - Scan Testing & Tuning Infrastructure ✅

**Type:** Infrastructure Epic (developer tooling, no user-facing changes)
**Duration:** 3 days (2025-12-10 to 2025-12-12)
**Stories:** 9 stories (8.1-8.9), ~25 story points
**CI/CD:** Optimized from ~11 min to ~4 min (63% faster)

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:prd` | ✅ Done |
| 2 | `/bmad:bmm:workflows:tech-spec` | ✅ Done |
| 3-6 | Story cycle (9 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed 2025-12-12 |

**Key Deliverables:**
- Shared prompts library (`functions/src/prompts/`)
- Test harness CLI (run, generate, validate, analyze, compare)
- 38+ test images across multiple store types
- Prompt v2.6.0 with multi-currency, receipt types, location extraction
- CI/CD parallelization with Playwright/Firebase CLI caching
- Comprehensive documentation (QUICKSTART, ARCHITECTURE, TOKEN-ANALYSIS)

---

### CURRENT: Epic 9 - Scan Enhancement & Merchant Learning

**Type:** Feature Epic (backend infrastructure + minimal UI)
**Estimated:** ~18 story points, 5-7 days
**Stories:** 7 stories defined in tech-spec

| Step | Command | Status | Notes |
|------|---------|--------|-------|
| 1 | PRD | ✅ Done | `docs/sprint-artifacts/epic9/prd-epic9-scan-enhancement.md` |
| 2 | Tech-Spec | ✅ Done | `docs/sprint-artifacts/epic9/tech-spec-epic-9.md` |
| 3 | `/bmad:bmm:workflows:create-story` | ⏳ NEXT | Create story 9.1 file |
| 4 | `/bmad:bmm:workflows:story-context` | Pending | Generate context XML |
| 5 | `/bmad:bmm:workflows:story-ready` | Pending | Mark ready for dev |
| 6 | `/bmad:bmm:workflows:dev-story` | Pending | Execute implementation |
| 7 | `/bmad:bmm:workflows:code-review` | Pending | Senior dev review |
| 8 | `/bmad:bmm:workflows:story-done` | Pending | Mark complete |
| 9 | Repeat 3-8 for stories 9.2-9.7 | Pending | 7 stories total |
| 10 | `/bmad:bmm:workflows:retrospective` | Pending | Epic 9 retrospective |

**Epic 9 Stories:**
| Story | Points | Description |
|-------|--------|-------------|
| 9.1 | 3 | Transaction Type Extension (time, country, city, currency, receiptType, promptVersion) |
| 9.2 | 2 | Transaction Item Category Fields |
| 9.3 | 3 | Edit View Field Display |
| 9.4 | 3 | Merchant Mapping Infrastructure |
| 9.5 | 3 | Merchant Fuzzy Matching |
| 9.6 | 2 | Merchant Learning Prompt |
| 9.7 | 2 | Merchant Mappings Management UI |

**Next Action:** Run `/bmad:bmm:workflows:create-story` for Story 9.1

---

### PLANNED: Epic 10 - UX Redesign

**Type:** UX-Heavy Epic (mockups-first approach)
**Moved from:** Former Epic 9

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:product-brief` | Pending |
| 2 | `/bmad:bmm:workflows:prd` | Pending |
| 3 | `/bmad:bmm:workflows:create-ux-design` | Pending |
| 4 | `/bmad:bmm:workflows:architecture` | Pending |
| 5 | `/bmad:bmm:workflows:tech-spec` | Pending |
| 6+ | Story cycle | Pending |
| N | `/bmad:bmm:workflows:retrospective` | Pending |

---

### PLANNED: Epic 11 - Application Refactoring

**Type:** Technical Epic (code quality, no new features)
**Moved from:** Former Epic 10

---

### PLANNED: Epic 12 - Subscription & Monetization

**Type:** Business-Critical Epic (payment integration)
**Moved from:** Former Epic 11

---

### PLANNED: Epic 13 - Mobile App

**Type:** Platform Epic (major architecture)
**Moved from:** Former Epic 12

---

## Story Cycle (Repeated Per Story)

```
┌─────────────────┐
│  create-story   │  Create story file from tech-spec
└────────┬────────┘
         ↓
┌─────────────────┐
│ story-context   │  Generate context XML (optional but recommended)
└────────┬────────┘
         ↓
┌─────────────────┐
│  story-ready    │  Mark ready for development
└────────┬────────┘
         ↓
┌─────────────────┐
│   dev-story     │  Execute implementation
└────────┬────────┘
         ↓
┌─────────────────┐
│  code-review    │  Senior developer review
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Approved?│
    └────┬────┘
    YES  │  NO → Fix issues → code-review again
         ↓
┌─────────────────┐
│   story-done    │  REVIEWER marks complete (not developer!)
└─────────────────┘
```

**Process Rules (from retrospectives):**
> - Developers mark stories as "review" only. Only reviewers mark stories as "done" after approval.
> - Deployment is part of the deliverable - not complete until deployed and verified.
> - Every epic ends with a deployment story using the standard template.

---

## Team Agreements (Compiled from Retrospectives)

### From Epic 4 Retrospective
1. Developers never mark stories "done" - only reviewers do
2. Secrets awareness - pre-commit hooks active

### From Epic 4.5 Retrospective
3. Deployment is part of the deliverable
4. Branch strategy explicit in stories
5. Firebase commands in completion criteria
6. Document learnings in real-time

### From Epic 5 Retrospective
7. Every epic ends with a deployment story (using standard template)
8. CI/CD must auto-deploy to Firebase (no manual steps)
9. Team standards live in one document (`docs/team-standards.md`)
10. Update team-standards.md after each retrospective
11. Testing patterns and gotchas are documented

### From Epic 6 Retrospective
12. UX-heavy epics get formal PRD + Tech-Spec treatment
13. Design references (like Tailwind UI) are gitignored but available locally
14. Production verification is mandatory before marking epic complete
15. User flow bugs require E2E test coverage, not just unit tests
16. Domain terminology must be precise in stories ("item category" vs "transaction category")

### From Epic 7 Retrospective
17. Architecture docs improve agent consistency across stories
18. Month-aligned weeks are pragmatic for financial apps
19. Theme color preferences are subjective - let users choose
20. Chart registry pattern enables flexible visualization options

### From Epic 8 Retrospective
21. Never hardcode API keys - use environment variables
22. When a key leaks in git history, create fresh branch (don't rewrite history)
23. CI/CD time budgets: setup ~2min, test jobs ~2min each, total PR <7min
24. Lighthouse on main-only saves ~4.5min per PR
25. Parallel CI jobs with shared workspace caching

---

## Decision Tree: Which Workflows to Use?

```
Is this a user-facing feature?
├── YES: Does it need UX design?
│   ├── YES: Full sequence (product-brief → prd → create-ux-design → architecture → tech-spec)
│   └── NO: Abbreviated (prd → tech-spec)
│
└── NO: Is it infrastructure/backend only?
    ├── YES: Minimal sequence (tech-spec → stories)
    └── NO: Is it a platform change?
        ├── YES: Extended sequence (add research before prd)
        └── NO: Use judgment based on complexity
```

---

## Workflow Tips

### When to Use `research` or `domain-research`
- New payment provider integration (Mercado Pago)
- AI/ML algorithm selection
- Platform technology decisions
- Compliance/regulatory requirements
- Third-party API evaluation

### When to Skip `product-brief`
- Bug fixes
- Infrastructure improvements
- Security hardening
- Performance optimization
- Technical debt cleanup

### When to Skip `create-ux-design`
- Backend-only changes
- API modifications
- Database schema changes
- CI/CD improvements
- Security updates
- Minimal UI changes (like Epic 9)

---

## Related Documentation

- [Sprint Status](docs/sprint-artifacts/sprint-status.yaml) - Current epic/story status
- [Epics Definition](docs/planning/epics.md) - All epic definitions
- [Team Standards](docs/team-standards.md) - Team agreements and workflow standards
- [Deployment Template](docs/templates/deployment-story-template.md) - For epic final stories
- [Business Docs](docs/business/) - Pricing, costs, revenue
- [BMM Documentation](.bmad/bmm/docs/README.md) - Full BMM framework docs

### Retrospective Documents
- [Epic 1 Retro](docs/sprint-artifacts/epic1/epic-1-retro-2025-11-21.md)
- [Epic 2 Retro](docs/sprint-artifacts/epic2/epic-2-retro-2025-11-23.md)
- [Epic 3 Retro](docs/sprint-artifacts/epic3/epic-3-retro-2025-11-26.md)
- [Epic 4 Retro](docs/sprint-artifacts/epic4/epic-4-retro-2025-11-29.md)
- [Epic 4.5 Retro](docs/sprint-artifacts/epic4-5/epic-4-5-retro-2025-12-02.md)
- [Epic 5 Retro](docs/sprint-artifacts/epic5/epic-5-retro-2025-12-03.md)
- [Epic 6 Retro](docs/sprint-artifacts/epic6/epic-6-retro-2025-12-04.md)
- [Epic 7 Retro](docs/sprint-artifacts/epic7/epic-7-retro-2025-12-10.md)
- [Epic 8 Retro](docs/sprint-artifacts/epic8/epic-8-retrospective.md)

### Design References
- [Tailwind UI Templates](docs/design-references/tailwind_templates/) - Premium components (gitignored)

---

**Version:** 5.0
**Updated:** 2025-12-12
