# Boletapp Epic Workflow Guide

**Last Updated:** 2025-12-04 (Post-Epic 6 Retrospective)
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

### NEXT: Epic 7 - Analytics UX Redesign

**Scope Change:** Original Epic 7 (Subscription & Monetization) moved to Epic 8. New Epic 7 focuses on UX polish before monetization.

**Planning Approach:** Full PRD + Tech-Spec (Option A - formal planning for UX-heavy epic)

**Key Documents for Epic 7 Planning:**
| Document | Location | Purpose |
|----------|----------|---------|
| Epic 6 Retro | `docs/sprint-artifacts/epic6/epic-6-retro-2025-12-04.md` | UX issues identified |
| Tailwind Templates | `docs/design-references/tailwind_templates/` | Premium UI components (gitignored) |
| Team Standards | `docs/team-standards.md` | Agreements and patterns |
| Existing Analytics | `src/views/TrendsView.tsx` | Current implementation |

**Epic 7 Scope Summary:**
- Fix bugs: Month selection off-by-one, icon inconsistencies, translation gaps
- Add views: Quarter view, Week view in Month
- UX Architecture: Dual-axis navigation (Temporal + Category on every view)
- Consistent top bar: Period selector, back navigation, graph type selector
- Category-specific download: Yearly summary for single category
- New graph types: Modern visualizations with Settings toggles

---

## Workflow Types by Epic Category

### Infrastructure/Technical Epics (No UX Changes)
**Examples:** Epic 4 (Security), Epic 4.5 (Image Storage backend)

```
tech-spec → create-story → story-ready → dev-story → code-review → story-done → retrospective
```

### Feature Epics (User-Facing Changes)
**Examples:** Epic 5 (Data Export), Epic 6 (Category Learning), Epic 7 (Subscriptions)

```
product-brief → prd → create-ux-design → architecture → tech-spec → create-story → [story cycle] → retrospective
```

### Platform Epics (Major Architecture Changes)
**Examples:** Epic 8 (Mobile App)

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

### COMPLETED: Epic 4 - Security Hardening (Infrastructure Epic) ✅

| Step | Command | Output |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:tech-spec` | Tech spec with 4 stories |
| 2 | `/bmad:bmm:workflows:create-story` | Story file (repeat per story) |
| 3 | `/bmad:bmm:workflows:story-ready` | Mark ready for dev |
| 4 | `/bmad:bmm:workflows:dev-story` | Execute implementation |
| 5 | `/bmad:bmm:workflows:code-review` | Senior dev review |
| 6 | `/bmad:bmm:workflows:story-done` | Mark complete |
| 7 | Repeat 2-6 for each story | 4 stories total |
| 8 | `/bmad:bmm:workflows:retrospective` | Epic 4 retrospective ✅ |

**Note:** Infrastructure epic - skipped PRD/UX as no user-facing changes.

---

### COMPLETED: Epic 4.5 - Receipt Image Storage (Infrastructure Epic) ✅

**Type:** Infrastructure (backend focus, minimal UI changes)
**Duration:** 3 days (2025-11-29 to 2025-12-02)
**Stories:** 4 stories, 13 story points

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:tech-spec` | ✅ Done |
| 2-6 | Story cycle (4 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed 2025-12-02 |

**Key Deliverables:**
- Firebase Storage with security rules
- Cloud Function image processing (Sharp, thumbnails)
- ImageViewer component with accessibility
- Cascade delete trigger

---

### COMPLETED: Epic 5 - Data Download & Export (Feature Epic) ✅

**Type:** Feature (user-facing, subscription-gated exports)
**Duration:** 2 days (2025-12-02 to 2025-12-03)
**Stories:** 5 stories, 335+ tests
**Deployed:** 2025-12-03 to https://boletapp-d609f.web.app

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:tech-spec` | ✅ Done 2025-12-02 |
| 2-6 | Story cycle (5 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed 2025-12-03 |

**Key Deliverables:**
- CSV export utilities (RFC 4180, UTF-8 BOM, injection prevention)
- Basic data export from Settings (all users)
- Premium transaction export from Analytics (Pro/Max)
- Premium statistics export (Pro/Max)
- Upgrade prompt modal (placeholder for Epic 7)
- Subscription tier hook (mock for Epic 7)

**Note:** Epic 5 used abbreviated flow (tech-spec only, no PRD/UX) because export functionality was well-defined and primarily backend work with minimal UI.

---

### NEXT: Epic 6 Preparation (Before Starting Epic 6)

**Type:** Infrastructure/Process Improvements
**Source:** Epic 5 Retrospective Action Items

| Step | Action | Owner | Deliverable |
|------|--------|-------|-------------|
| 1 | Create Team Standards doc | Bob (SM) | `docs/team-standards.md` |
| 2 | Create Deployment Story Template | Bob (SM) | `docs/templates/deployment-story-template.md` |
| 3 | Document Vitest gotcha | Charlie (Dev) | Section in team-standards.md |
| 4 | (Optional) Gemini API docs | Charlie (Dev) | `docs/integrations/gemini-api-notes.md` |

**Team Standards Document Should Include:**
- Team Agreements from Epics 1-5 retrospectives
- Workflow Standards (branching, PRs, deployment, testing)
- Document Index (links to all key project docs)
- Lessons Learned (patterns and anti-patterns)

---

### COMPLETED: Epic 6 - Smart Category Learning ✅

**Type:** Feature + AI/ML (complex backend + UX)
**Duration:** 2 days (2025-12-03 to 2025-12-04)
**Stories:** 7 stories, 450+ tests
**Deployed:** 2025-12-04 via CI/CD auto-deploy

| Step | Command | Status |
|------|---------|--------|
| 1 | `/bmad:bmm:workflows:tech-spec` | ✅ Done 2025-12-03 |
| 2-6 | Story cycle (7 stories) | ✅ All done |
| 7 | `/bmad:bmm:workflows:retrospective` | ✅ Completed 2025-12-04 |

**Key Deliverables:**
- CI/CD auto-deploy to Firebase (Story 6.0)
- Category mapping infrastructure (Firestore service, types, security rules)
- Fuzzy matching engine (fuse.js integration)
- Category learning prompt (UI on category edit)
- Auto-apply on receipt scan
- Mappings management UI in Settings
- Visual indicator (📖) for learned categories

**Bugs Fixed During Deploy:**
1. Category learning prompt timing
2. Item group tracking vs transaction category
3. Multi-item learning support

---

### PLANNED: Epic 7 - Analytics UX Redesign (UX-Heavy Epic)

**Type:** UX Redesign (major UI/navigation changes)
**Planning:** Full PRD + Tech-Spec (formal planning required)
**Estimated:** ~31 story points

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | UX architecture definition |
| 2 | `/bmad:bmm:workflows:prd` | PRD | Detailed UX requirements |
| 3 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Dual-axis navigation, consistent top bar |
| 4 | `/bmad:bmm:workflows:architecture` | Architecture | Component structure, state management |
| 5 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Stories with ACs |
| 6+ | Story cycle | Per story | |
| N-1 | **FINAL STORY: Deployment & Release** | Use deployment template | Release story |
| N | `/bmad:bmm:workflows:retrospective` | Retrospective | |

**Epic 7 Scope (from Epic 6 Retro):**

**Bugs to Fix:**
- Month selection off-by-one (select October, get November)
- Icon size inconsistency between views
- Bottom bar layout shifts
- Spanish interface showing English labels

**Features to Add:**
- Quarter view (Year → Quarter → Month)
- Week view in Month (Month → Week → Day)
- Category-specific yearly summary download

**UX Architecture (Major):**
- Dual-axis navigation model (Temporal + Category on every view)
- Consistent top bar pattern (period selector, back nav, graph selector)
- Same fonts, icons, positions across all temporal levels
- Graph type selector with Settings toggles

**Download Behavior:**
| View Level | Download Content |
|------------|------------------|
| Year, Quarter | Yearly summary |
| Month, Week, Day | Full transactions for month |

**Design Reference:** `docs/design-references/tailwind_templates/` (gitignored - premium content)

**Priority:** UX/Navigation first, new graph types second (can split into 7A/7B if needed)

---

### PLANNED: Epic 8 - Subscription & Monetization (Business-Critical Epic)

**Type:** Feature + Business (payment integration, security-critical)
**Moved from:** Original Epic 7 (deferred for UX polish in new Epic 7)

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | 4-tier model (Free/Basic/Pro/Max) |
| 2 | `/bmad:bmm:workflows:research` | Research | Mercado Pago integration |
| 3 | `/bmad:bmm:workflows:prd` | PRD | Usage metering, billing flows |
| 4 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Subscription management, upgrade flows |
| 5 | `/bmad:bmm:workflows:architecture` | Architecture | Payment integration, usage tracking |
| 6 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Security review on payment flows |
| 7+ | Story cycle | Per story | |
| N-1 | Deployment & Release story | Use template | |
| N | `/bmad:bmm:workflows:retrospective` | Retrospective | |

**Integration with Epic 5:**
- Epic 5 created `useSubscriptionTier()` hook with mock returning `true`
- Epic 8 will replace mock with actual Firestore subscription check
- Single-file change in `src/hooks/useSubscriptionTier.ts`

**Pricing (from Epic 4 Retro):**
- Free: $0, 30 scans/month, 60 images (2-month rolling)
- Basic: $2-3, 30 scans, 360 images (12-month rolling)
- Pro: $4-5, 300 scans, 3,600 images (12-month rolling)
- Max: $10, 900 scans, 21,600 images (24-month rolling)

---

### PLANNED: Epic 9 - Mobile App (Platform Epic)

**Type:** Platform expansion (major architecture, new deployments)
**Moved from:** Original Epic 8

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | Platform strategy decision |
| 2 | `/bmad:bmm:workflows:research` | Research | App Store requirements, in-app purchases |
| 3 | `/bmad:bmm:workflows:prd` | PRD | Mobile-specific features, offline mode |
| 4 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Mobile UX patterns, touch interactions |
| 5 | `/bmad:bmm:workflows:architecture` | Architecture | Mobile arch, dual payment integration |
| 6 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Platform-specific stories |
| 7+ | Story cycle | Per story | |
| N-1 | Deployment & Release story | Use template | |
| N | `/bmad:bmm:workflows:retrospective` | Retrospective | |

**Platform Options:**
- React Native (code sharing with web)
- PWA enhancement (minimal native code)
- Capacitor/Ionic (hybrid)
- Native development (maximum integration)

---

## Story Cycle (Repeated Per Story)

```
┌─────────────────┐
│  create-story   │  Create story file from epic
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

---

## Decision Tree: Which Workflows to Use?

```
Is this a user-facing feature?
├── YES: Does it need UX design?
│   ├── YES: Full sequence (product-brief → prd → create-ux-design → architecture → tech-spec)
│   └── NO: Abbreviated (product-brief → prd → architecture → tech-spec)
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

---

## Related Documentation

- [Sprint Status](docs/sprint-artifacts/sprint-status.yaml) - Current epic/story status
- [Epics Definition](docs/epics.md) - All epic definitions
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

### Design References
- [Tailwind UI Templates](docs/design-references/tailwind_templates/) - Premium components (gitignored)

---

**Version:** 4.0
**Updated:** 2025-12-04
