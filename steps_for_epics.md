# Boletapp Epic Workflow Guide

**Last Updated:** 2025-12-02 (Post-Epic 4.5 Retrospective)
**Framework:** BMad Method Module (BMM)

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
**Completed:** 2025-12-02
**Deployed:** https://boletapp-d609f.web.app

| Step | Command | Output | Status |
|------|---------|--------|--------|
| 1 | `/bmad:bmm:workflows:tech-spec` | Tech spec with 4 stories | ✅ Done |
| 2-6 | Story cycle | 4.5-1: Firebase Storage Infrastructure (3 pts) | ✅ Done |
| 2-6 | Story cycle | 4.5-2: Cloud Function Image Processing (5 pts) | ✅ Done |
| 2-6 | Story cycle | 4.5-3: Client Updates & UI (3 pts) | ✅ Done |
| 2-6 | Story cycle | 4.5-4: Cascade Delete & Documentation (2 pts) | ✅ Done |
| 7 | `/bmad:bmm:workflows:retrospective` | Epic 4.5 retrospective | ✅ Done |

**Deliverables:**
- Firebase Storage with user-scoped security rules
- Cloud Functions: `analyzeReceipt` (updated), `onTransactionDeleted` (new)
- ImageViewer component with accessibility support
- Thumbnail display in HistoryView
- Cascade delete trigger for data integrity

**Key Learnings (from Retrospective):**
- Testing infrastructure is a force multiplier
- Deployment process needs explicit documentation in stories
- CI pipeline improvements compound over time
- "Absorbing failures and transforming them into resilience"

**Action Items Created:**
1. Add deployment checklist to story template
2. Document Gemini API quirks

---

### NEXT: Epic 5 - Enhanced Data Export (Feature Epic)

**Type:** Feature (user-facing, includes image export)
**Prerequisites:** Epic 4.5 complete ✅ (image export capability enabled)

| Step | Command | Output | Team |
|------|---------|--------|------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | Mary (Analyst) |
| 2 | `/bmad:bmm:workflows:prd` | Detailed PRD | Alice (PM), Mary |
| 3 | `/bmad:bmm:workflows:create-ux-design` | UX specifications | Sally (UX Designer) |
| 4 | `/bmad:bmm:workflows:architecture` | Technical architecture | Winston (Architect) |
| 5 | `/bmad:bmm:workflows:tech-spec` | Tech spec + stories | |
| 6 | `/bmad:bmm:workflows:create-story` | Story files | Paige (Tech Writer) for docs |
| 7-12 | Story cycle | Per story | |
| 13 | `/bmad:bmm:workflows:retrospective` | Retrospective | |

**Scope:**
- Aggregation levels: Yearly, Quarterly, Monthly, Weekly, Daily
- Export formats: Excel (.xlsx with tabs), CSV per level
- Image export (enabled by Epic 4.5 - imageUrls/thumbnailUrl in Transaction interface)

---

### PLANNED: Epic 6 - Smart Category Learning (Complex Feature Epic)

**Type:** Feature + AI/ML (complex backend + UX)

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | AI/ML behavior definition |
| 2 | `/bmad:bmm:workflows:domain-research` | Research | AI/ML best practices |
| 3 | `/bmad:bmm:workflows:prd` | PRD | User preference storage |
| 4 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Category override UX, learned categories |
| 5 | `/bmad:bmm:workflows:architecture` | Architecture | New Firestore collection, fuzzy matching |
| 6 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Gemini integration changes |
| 7+ | Story cycle | Per story | |
| N | `/bmad:bmm:workflows:retrospective` | Retrospective | |

---

### PLANNED: Epic 7 - Subscription & Monetization (Business-Critical Epic)

**Type:** Feature + Business (payment integration, security-critical)

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | 4-tier model (Free/Basic/Pro/Max) |
| 2 | `/bmad:bmm:workflows:research` | Research | Mercado Pago integration |
| 3 | `/bmad:bmm:workflows:prd` | PRD | Usage metering, billing flows |
| 4 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Subscription management, upgrade flows |
| 5 | `/bmad:bmm:workflows:architecture` | Architecture | Payment integration, usage tracking |
| 6 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Security review on payment flows |
| 7+ | Story cycle | Per story | |
| N | `/bmad:bmm:workflows:retrospective` | Retrospective | |

**Pricing (from Epic 4 Retro):**
- Free: $0, 30 scans/month, 60 images (2-month rolling)
- Basic: $2-3, 30 scans, 360 images (12-month rolling)
- Pro: $4-5, 300 scans, 3,600 images (12-month rolling)
- Max: $10, 900 scans, 21,600 images (24-month rolling)

---

### PLANNED: Epic 8 - Mobile App (Platform Epic)

**Type:** Platform expansion (major architecture, new deployments)

| Step | Command | Output | Special Focus |
|------|---------|--------|---------------|
| 1 | `/bmad:bmm:workflows:product-brief` | Product vision | Platform strategy decision |
| 2 | `/bmad:bmm:workflows:research` | Research | App Store requirements, in-app purchases |
| 3 | `/bmad:bmm:workflows:prd` | PRD | Mobile-specific features, offline mode |
| 4 | `/bmad:bmm:workflows:create-ux-design` | UX specs | Mobile UX patterns, touch interactions |
| 5 | `/bmad:bmm:workflows:architecture` | Architecture | Mobile arch, dual payment integration |
| 6 | `/bmad:bmm:workflows:tech-spec` | Tech spec | Platform-specific stories |
| 7+ | Story cycle | Per story | |
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

**Process Rule (from Epic 4 Retro):**
> Developers mark stories as "review" only. Only reviewers mark stories as "done" after approval.

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
- [Epics Definition](docs/planning/epics.md) - All epic definitions
- [Business Docs](docs/business/) - Pricing, costs, revenue
- [BMM Documentation](.bmad/bmm/docs/README.md) - Full BMM framework docs

---

**Version:** 2.0
**Updated:** 2025-11-29
