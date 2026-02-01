# Boletapp Documentation

**Last Updated:** 2026-02-01
**Version:** 6.0

---

## Overview

This folder contains all documentation for the Boletapp project, organized into thematic categories for easy navigation.

**Start Here:** [index.md](./index.md) - Complete documentation index with links to all resources

---

## Folder Organization

### [`architecture/`](./architecture/)
System architecture and technical design documentation
- System architecture (with Mermaid diagrams)
- API contracts (Firebase, Gemini AI)
- Data models (Firestore schema)
- Source tree analysis
- React Query caching patterns
- Real-time sync patterns
- **`diagrams/`** - Architecture diagrams including Excalidraw files

### [`archive/`](./archive/)
Historical documentation and deprecated files
- Old epic versions and tech specs
- Implementation reports

### [`ci-cd/`](./ci-cd/)
CI/CD pipeline and deployment documentation
- Branching strategy
- CI setup and debugging guides

### [`development/`](./development/)
Developer guides and operational documentation
- Development setup guide
- Deployment procedures
- **`tooling/wsl-chrome/`** - WSL Chrome setup for development

### [`planning/`](./planning/)
Epic planning and technical specifications
- Epic definitions (epics.md)
- Technical specifications
- **`artifacts/`** - Implementation readiness reports

### [`sprint-artifacts/`](./sprint-artifacts/)
BMAD sprint stories and tracking
- Sprint status tracking (sprint-status.yaml)
- Epic folders (epic7, epic8, epic9, etc.)
- Current epic: **Epic 14e - Feature Architecture**

### [`testing/`](./testing/)
Test environment setup and testing guides
- Test strategy & risk register
- E2E testing guides

### [`uxui/`](./uxui/)
UX/UI documentation and design assets
- UX design specification
- Motion design system
- Voice & tone guidelines
- **`mockups/`** - HTML mockups for each view
- **`reference/`** - Design reference files (color themes, design directions)

---

## Quick Access

| What You Need | Where to Find It |
|---------------|------------------|
| **Get started developing** | [development/development-guide.md](./development/development-guide.md) |
| **Understand architecture** | [architecture/architecture.md](./architecture/architecture.md) |
| **See all epics & stories** | [planning/epics.md](./planning/epics.md) |
| **Sprint tracking** | [sprint-artifacts/sprint-status.yaml](./sprint-artifacts/sprint-status.yaml) |
| **CI/CD & Branching** | [ci-cd/branching-strategy.md](./ci-cd/branching-strategy.md) |
| **UX Design Spec** | [uxui/ux-design-specification.md](./uxui/ux-design-specification.md) |

---

## Documentation Standards

All documents follow these conventions:

- **Markdown format** (.md files)
- **Date stamps** at the top of each document
- **Cross-references** using relative links
- **Code examples** with syntax highlighting
- **Diagrams** using Mermaid or Excalidraw

---

## Recent Updates

### 2026-02-01 (v6.0) - Epic 14e Feature Architecture
- Updated architecture.md with Zustand state management (7 stores)
- Updated project-overview.md with feature-based architecture
- Updated development-guide.md with new project structure and test commands
- Updated source-tree-analysis.md with feature modules and Zustand stores
- Added ADR-012 for Epic 14e architectural decisions
- Architecture now documents 2-paradigm state approach (Zustand + TanStack Query)

### 2026-01-22 (v5.0) - Documentation Consolidation (Story 14c-refactor.24)
- Deleted duplicate root files (architecture-epic7.md, prd-epic7.md)
- Moved branching-strategy.md to ci-cd/
- Moved ux-design-specification.md to uxui/
- Created uxui/reference/ for design HTML files
- Merged .archive/ into archive/
- Moved excalidraw-diagrams/ to architecture/diagrams/excalidraw/
- Moved planning-artifacts/ to planning/artifacts/
- Moved cc_chrome/ to development/tooling/wsl-chrome/
- Archived old epics.md and tech-spec.md versions
- Cleaned up non-code folders (test-results, old backups)

### Previous versions tracked in git history

---

**Documentation Maintainers:** BMAD Framework + AI-Assisted Development
**Project:** Boletapp - Smart Expense Tracker PWA
