# Boletapp Documentation Index

**AI-Assisted Development Reference** | **Last Updated:** 2025-11-22 (Post-Epic 2 Story 2.2)

This is the primary entry point for AI-assisted development of Boletapp, a Smart Expense Tracker PWA.

---

## Project Overview

- **Type:** Monolith (single cohesive codebase)
- **Primary Language:** TypeScript
- **Architecture:** Modular SPA (React)
- **Status:** Production-Ready Brownfield Project
- **Production URL:** https://boletapp-d609f.web.app

### Quick Reference

- **Tech Stack:** React 18.3.1, TypeScript 5.3.3, Vite 5.4.0, Firebase 10.14.1, Google Gemini AI
- **Entry Point:** [src/main.tsx](../src/main.tsx) → [src/App.tsx](../src/App.tsx)
- **Architecture Pattern:** Modular SPA with 31 TypeScript files across 7 logical layers
- **Database:** Firebase Firestore (NoSQL, real-time sync)
- **Authentication:** Firebase Auth (Google OAuth)
- **AI Integration:** Google Gemini 2.5 Flash (receipt OCR)

**Structure:**
```
src/
├── config/     (3 files) - Firebase, Gemini, constants
├── types/      (2 files) - TypeScript interfaces
├── services/   (2 files) - Firestore & Gemini APIs
├── hooks/      (2 files) - useAuth, useTransactions
├── utils/      (7 files) - Pure functions (date, currency, csv, etc.)
├── components/ (5 files) - Reusable UI (Nav, charts, ErrorBoundary)
├── views/      (7 files) - Page components (Login, Dashboard, Scan, etc.)
├── App.tsx     - Main orchestrator
└── main.tsx    - React DOM entry
```

---

## Documentation Organization

Documentation is organized into **5 thematic folders** for easy navigation:

```
docs/
├── architecture/      # System architecture and technical design
├── development/       # Developer guides and operational docs
├── testing/           # Test environment and testing guides
├── planning/          # Epic planning and technical specs
├── reference/         # Quick reference and project scans
├── sprint-artifacts/  # BMAD sprint stories and tracking (preserved)
└── templates/         # Document templates (preserved)
```

---

## Architecture Documentation

**Location:** [`architecture/`](./architecture/)

### 1. [Architecture](./architecture/architecture.md) ⭐ **START HERE** ✨ **NOW WITH VISUAL DIAGRAMS**
Complete architecture documentation including:
- **3 Mermaid Diagrams:** System Overview, Data Flow (Receipt Scanning), Deployment Pipeline
- Modular structure (31 files explained)
- Technology stack and versions
- Component hierarchy and data flows
- Firebase & Gemini API integration
- Build and deployment process
- Security model and Firestore rules
- All 7 ADRs (including ADR-007: Documentation Strategy)

### 2. [API Contracts](./architecture/api-contracts.md)
Firebase Auth, Firestore CRUD, Gemini AI integration details

### 3. [Data Models](./architecture/data-models.md)
Firestore schema, transaction structure, data types, security rules

### 4. [Source Tree Analysis](./architecture/source-tree-analysis.md)
Annotated directory structure and file inventory

---

## Development Documentation

**Location:** [`development/`](./development/)

### 5. [Development Guide](./development/development-guide.md)
Prerequisites, local setup, running the app, testing, debugging, deployment commands

### 6. [Deployment Guide](./development/deployment-guide.md)
Deployment architecture, Firebase Hosting setup, production deployment, monitoring

### 7. [Component Inventory](./development/component-inventory.md)
Complete catalog of React components, props, responsibilities

---

## Testing Documentation

**Location:** [`testing/`](./testing/)

### 8. [Test Environment Quick Start](./testing/test-environment-quickstart.md) ⚡ **NEW** ⭐ **START HERE FOR TESTING**
Quick reference for running emulators and test data:
- 3-step quick start (emulators → UI → reset data)
- Common commands reference
- Troubleshooting guide
- Testing workflow

### 9. [Test Environment Guide](./testing/test-environment.md) ⚡ **NEW** (Epic 2)
Complete guide to test environment setup and usage:
- Firebase Emulator Suite configuration
- Test user accounts (3 users with UIDs)
- Transaction fixtures (18 realistic transactions)
- Database reset script usage
- Troubleshooting and best practices

### 10. [Test Strategy & Risk Register](./testing/test-strategy.md) ⚡ **NEW** (Epic 2)
17 test categories with risk analysis and implementation roadmap

---

## Planning Documentation

**Location:** [`planning/`](./planning/)

### 11. [Epics](./planning/epics.md)
Epic definitions and user stories

### 12. [Tech Spec](./planning/tech-spec.md)
Technical specification for Epic 1 (Production Deployment Readiness)

### Epic-Specific Planning

- **[Epic 2 Tech Spec](./sprint-artifacts/epic2/epic-2-tech-spec.md)** - Epic 2 Technical Specification (Testing Infrastructure)

---

## Reference Documentation

**Location:** [`reference/`](./reference/)

### 13. [Project Overview](./reference/project-overview.md)
Executive summary, purpose, tech stack, key features

### 14. [Project Scan Report](./reference/project-scan-report.json)
Automated project structure analysis (JSON)

---

## Sprint Artifacts (BMAD Framework)

**Location:** [`sprint-artifacts/`](./sprint-artifacts/)

### Sprint Tracking

- **[Sprint Status](./sprint-artifacts/sprint-status.yaml)** - Story tracking across all epics

### Epic 1: Production Deployment Readiness (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic1/`](./sprint-artifacts/epic1/)

- **[Epic 1 Retrospective](./sprint-artifacts/epic1/epic-1-retro-2025-11-21.md)** - Lessons learned and action items

**Epic 1 Stories (All Complete):**
1. [Story 1.1](./sprint-artifacts/epic1/1-1-refactor-to-modular-architecture.md) - Modular Architecture Migration
2. [Story 1.2](./sprint-artifacts/epic1/1-2-production-build-configuration.md) - Vite Build Pipeline
3. [Story 1.3](./sprint-artifacts/epic1/1-3-git-repository-setup.md) - Git & GitHub Setup
4. [Story 1.4](./sprint-artifacts/epic1/1-4-firebase-deployment-infrastructure.md) - Firebase Hosting Configuration
5. [Story 1.5](./sprint-artifacts/epic1/1-5-production-deployment-verification.md) - Production Deployment

### Epic 2: Testing Infrastructure & Documentation (IN PROGRESS 🚧)

**Location:** [`sprint-artifacts/epic2/`](./sprint-artifacts/epic2/)

- **[Epic 2 Evolution Document](./sprint-artifacts/epic2/epic-2-evolution.md)** - Epic 2 state tracking (Before/After)
- **[Epic 2 Tech Spec](./sprint-artifacts/epic2/epic-2-tech-spec.md)** - Comprehensive testing infrastructure specification

**Epic 2 Stories:**
1. [Story 2.1](./sprint-artifacts/epic2/2-1-documentation-epic-evolution.md) - Documentation & Epic Evolution ✅ DONE
2. [Story 2.2](./sprint-artifacts/epic2/2-2-test-environment-setup.md) - Test Environment Setup 🔍 IN REVIEW
3. Story 2.3 - Testing Framework Configuration (Ready for Dev)
4. Story 2.4 - Authentication & Security Tests (Ready for Dev)
5. Story 2.5 - Core Workflow Tests (Ready for Dev)
6. Story 2.6 - CI/CD Pipeline & Coverage Baseline (Ready for Dev)

---

## Document Templates

**Location:** [`templates/`](./templates/)

Templates for creating consistent documentation:
- Epic evolution template
- Story template (BMAD framework)

---

## Getting Started

### For New Developers

1. **Understand the App:** Start with [Architecture](./architecture/architecture.md) § Executive Summary
2. **Set Up Environment:** Follow [Development Guide](./development/development-guide.md) and [README](../README.md)
3. **Explore Code Structure:** Review [Architecture](./architecture/architecture.md) § Modular SPA Structure
4. **Review Components:** Check [Component Inventory](./development/component-inventory.md) for UI components
5. **Understand Data:** Read [Data Models](./architecture/data-models.md) for Firestore schema
6. **Run Tests:** Follow [Test Environment Quick Start](./testing/test-environment-quickstart.md) to set up testing

### For AI Assistants

When planning new features or modifications:

1. **For Architecture Questions:** Reference [Architecture](./architecture/architecture.md) - your primary source
2. **For UI Changes:** Reference [Component Inventory](./development/component-inventory.md) and component hierarchy in architecture
3. **For Data Changes:** Reference [Data Models](./architecture/data-models.md) and update Firestore security rules if needed
4. **For API Changes:** Reference [API Contracts](./architecture/api-contracts.md) for Firebase and Gemini patterns
5. **For New Features:** Follow architecture patterns and ADRs in [Architecture](./architecture/architecture.md)
6. **For Testing:** Reference [Test Strategy](./testing/test-strategy.md) and [Test Environment Guide](./testing/test-environment.md)

**Epic 2 Context:**
Epic 2 focuses on **automated testing infrastructure and enhanced documentation**. Key deliverables:
- ✅ **Visual Architecture Diagrams:** 3 Mermaid diagrams added to architecture.md
- ✅ **Epic Evolution Tracking:** Template created, Epic 2 evolution document tracking Before/After state
- ✅ **Test Strategy & Risk Register:** 17 test categories with risk levels and implementation roadmap
- ✅ **Test Environment:** 3 test users + fixtures + reset script (Story 2.2 - IN REVIEW)
- 🚧 **Testing Frameworks:** Vitest + React Testing Library + Playwright (Story 2.3)
- 🚧 **Automated Tests:** 39+ tests covering HIGH and MEDIUM risk areas (Stories 2.4-2.5)
- 🚧 **CI/CD Pipeline:** GitHub Actions running tests automatically (Story 2.6)

---

## Key Application Areas

### Authentication Flow
- **Entry:** [src/hooks/useAuth.ts](../src/hooks/useAuth.ts)
- **Implementation:** Google OAuth via Firebase Auth
- **Docs:** [API Contracts](./architecture/api-contracts.md) § Firebase Authentication

### Receipt Scanning
- **Entry:** [src/views/ScanView.tsx](../src/views/ScanView.tsx)
- **AI Service:** [src/services/gemini.ts](../src/services/gemini.ts)
- **Docs:** [API Contracts](./architecture/api-contracts.md) § Google Gemini AI

### Transaction Management
- **Entry:** [src/views/EditView.tsx](../src/views/EditView.tsx), [src/views/HistoryView.tsx](../src/views/HistoryView.tsx)
- **Service:** [src/services/firestore.ts](../src/services/firestore.ts)
- **Hook:** [src/hooks/useTransactions.ts](../src/hooks/useTransactions.ts)
- **Docs:** [Data Models](./architecture/data-models.md), [API Contracts](./architecture/api-contracts.md) § Firestore

### Analytics & Trends
- **Entry:** [src/views/TrendsView.tsx](../src/views/TrendsView.tsx)
- **Charts:** [src/components/charts/](../src/components/charts/)
- **Docs:** [Component Inventory](./development/component-inventory.md) § Charts

---

## Epic 1 Achievements

**Production Deployment Readiness** (2025-11-20 to 2025-11-21)

✅ **Completed:**
- Transformed from 621-line single-file to modular 31-file architecture
- Implemented Vite build pipeline with TypeScript
- Established Git version control on GitHub
- Configured Firebase Hosting with production deployment
- Deployed to production with HTTPS and Firestore security rules

✅ **Production URL:** https://boletapp-d609f.web.app
✅ **Repository:** https://github.com/Brownbull/gmni_boletapp

**Key Learning:** Firestore security rules are mandatory for data persistence. Without rules, Firestore denies all access by default.

---

## Quick Navigation

| Need | Document |
|------|----------|
| **System overview** | [Architecture](./architecture/architecture.md) |
| **How to run locally** | [Development Guide](./development/development-guide.md) |
| **How to run tests** | [Test Environment Quick Start](./testing/test-environment-quickstart.md) |
| **Database schema** | [Data Models](./architecture/data-models.md) |
| **API integrations** | [API Contracts](./architecture/api-contracts.md) |
| **Component list** | [Component Inventory](./development/component-inventory.md) |
| **Deployment steps** | [Deployment Guide](./development/deployment-guide.md) |
| **File structure** | [Source Tree](./architecture/source-tree-analysis.md) |
| **Epic definitions** | [Epics](./planning/epics.md) |
| **Technical specs** | [Tech Spec](./planning/tech-spec.md) |
| **Test strategy** | [Test Strategy](./testing/test-strategy.md) |

---

## Existing Project Documentation

### Setup & Configuration

- **[README.md](../README.md)** - Project overview, setup instructions, production deployment info

### Framework Documentation

The `.bmad/` directory contains the BMAD (Breakthrough Modern Agile Development) framework. This is the development methodology, not application code.

---

**Documentation Version:** 3.0
**Generated:** 2025-11-22 (Post-Epic 2 Story 2.2 - Documentation Reorganization)
**Next Update:** After Epic 2 completion
