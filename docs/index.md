# Boletapp Documentation Index

**Last Updated:** 2026-02-05 | **Version:** 12.0

Smart Expense Tracker PWA - AI-assisted receipt scanning and expense management.

---

## Quick Access

| Need | Document |
|------|----------|
| **System overview** | [Architecture](./architecture/architecture.md) |
| **How to run locally** | [Development Guide](./development/development-guide.md) |
| **How to run tests** | [Testing Guide](./testing/testing-guide.md) |
| **Database schema** | [Data Models](./architecture/data-models.md) |
| **API integrations** | [API Contracts](./architecture/api-contracts.md) |
| **Component list** | [Component Inventory](./development/component-inventory.md) |
| **Deployment steps** | [CI/CD Deployment Guide](./ci-cd/deployment-guide.md) |
| **File structure** | [Source Tree](./architecture/source-tree-analysis.md) |
| **Epic definitions** | [Epics](./epics.md) |
| **Sprint tracking** | [Sprint Status](./sprint-artifacts/sprint-status.yaml) |
| **Security overview** | [Security README](./security/README.md) |
| **Team standards** | [Team Standards](./team-standards.md) |
| **CI/CD pipeline** | [CI/CD Guide](./ci-cd/ci-cd-guide.md) |
| **Cost analysis** | [Cost Analysis](./business/cost-analysis.md) |
| **Contribution guide** | [CONTRIBUTING.md](../CONTRIBUTING.md) |

---

## Project Overview

- **Type:** Monolith PWA (single cohesive codebase)
- **Stack:** React 18, TypeScript 5, Vite 5, Firebase 10, Google Gemini AI
- **Architecture:** Feature-based modular SPA with Zustand + TanStack Query
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Auth (Google OAuth)
- **AI:** Google Gemini 2.5 Flash (receipt OCR)
- **Production:** https://boletapp-d609f.web.app

---

## Folder Structure

```
docs/
  index.md                     # This file - documentation entry point
  team-standards.md            # Team agreements and conventions
  epics.md                     # Epic planning reference
  bmm-workflow-status.yaml     # BMM tracking

  architecture/                # System design and technical docs
    architecture.md            # Main architecture doc (START HERE)
    api-contracts.md           # Firebase, Gemini API contracts
    cloud-functions.md         # Cloud Functions inventory
    component-patterns.md      # React component patterns
    data-models.md             # Firestore schema and types
    firestore-indexes.md       # Composite index definitions
    firestore-patterns.md      # Firestore query patterns
    project-overview.md        # Executive summary
    react-query-caching.md     # TanStack Query patterns
    source-tree-analysis.md    # Annotated file inventory
    state-management.md        # Zustand + React Query strategy
    diagrams/                  # Excalidraw and Mermaid diagrams

  business/                    # Pricing, costs, revenue
    cost-analysis.md, cost-monitoring.md, pricing-model.md,
    revenue-projections.md, README.md

  ci-cd/                       # CI/CD pipeline and deployment
    ci-cd-guide.md             # Merged CI/CD overview + setup + best practices
    deployment-guide.md        # Deployment procedures
    debugging-guide.md         # CI/CD debugging
    branching-strategy.md      # Git branching model
    deployment-story-template.md

  development/                 # Developer guides
    development-guide.md       # Local setup and workflow
    component-inventory.md     # React component catalog
    tooling/                   # WSL Chrome setup, etc.

  legal/                       # Legal docs (3 files)
  security/                    # Security docs + incidents/

  testing/                     # Testing framework docs
    testing-guide.md           # Comprehensive testing guide
    test-environment.md        # Emulator setup, test users, fixtures
    performance-baselines.md   # Lighthouse CI baselines

  uxui/                        # UX/UI design docs
    ux-design-specification.md
    motion-design-system.md
    voice-tone-guidelines.md
    mockups/                   # HTML mockups
    reference/                 # Design references
    tailwind-templates/        # Paid Tailwind UI templates (gitignored)

  sprint-artifacts/            # Sprint stories and tracking (per-epic)
  archive/                     # All archived/historical documentation
```

---

## Getting Started

### For New Developers

1. Read [Architecture](./architecture/architecture.md) for system overview
2. Follow [Development Guide](./development/development-guide.md) for local setup
3. Review [Testing Guide](./testing/testing-guide.md) for test workflow
4. Check [Team Standards](./team-standards.md) for conventions

### For AI Assistants

1. **Architecture questions:** [Architecture](./architecture/architecture.md)
2. **UI changes:** [Component Inventory](./development/component-inventory.md)
3. **Data changes:** [Data Models](./architecture/data-models.md)
4. **API patterns:** [API Contracts](./architecture/api-contracts.md)
5. **Testing:** [Testing Guide](./testing/testing-guide.md)

---

## Documentation Standards

- Markdown format with date stamps
- Cross-references using relative links
- Code examples with syntax highlighting
- Diagrams via Mermaid or Excalidraw
- Sprint artifacts organized per-epic in `sprint-artifacts/`

---

**Project:** Boletapp - Smart Expense Tracker PWA
**Maintainers:** BMAD Framework + AI-Assisted Development
