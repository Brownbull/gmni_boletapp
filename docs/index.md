# Boletapp Documentation Index

**AI-Assisted Development Reference** | **Last Updated:** 2026-01-24 (Epic 14e-feature-architecture planning)

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

Documentation is organized into **10+ thematic folders** for easy navigation:

```
docs/
├── architecture/      # System architecture and technical design (diagrams in diagrams/)
├── archive/           # Historical documentation and deprecated files
├── business/          # Pricing, costs, revenue projections
├── ci-cd/             # CI/CD pipeline (branching-strategy.md moved here)
├── development/       # Developer guides and operational docs (tooling/wsl-chrome/)
├── planning/          # Epic planning and technical specs (artifacts/ for reports)
├── reference/         # Quick reference and project scans
├── security/          # Security documentation and audit reports
├── sprint-artifacts/  # BMAD sprint stories and tracking
├── templates/         # Document templates
├── testing/           # Test environment and testing guides
└── uxui/              # UX/UI documentation (mockups/, reference/, ux-design-specification.md)
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
- All 8 ADRs (including ADR-008: Security Hardening)

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

## Business Documentation

**Location:** [`business/`](./business/)

### [Business Overview](./business/README.md)
Strategic decisions, pricing model, and business documentation index

### [Pricing Model](./business/pricing-model.md)
4-tier subscription structure (Free/Basic/Pro/Max), feature allocation, retention policies

### [Cost Analysis](./business/cost-analysis.md)
Detailed breakdown of infrastructure costs (Storage, Gemini API, Cloud Functions, Firestore)

### [Revenue Projections](./business/revenue-projections.md)
Scenario modeling at 10K, 25K, 50K, 100K users with multiple price points

---

## Security Documentation

**Location:** [`security/`](./security/)

### [Security Overview](./security/README.md)
Security practices, tools, and guidelines for developers

### [OWASP Top 10 Checklist](./security/owasp-checklist.md)
Validation against OWASP Top 10 (2021) security categories with evidence

### [Security Audit Report](./security/audit-report.md)
Epic 4 security audit findings and improvements

### [Incident Response](./security/incident-response.md)
Security incident response procedures

### [Secrets Scan Report](./security/secrets-scan-report.md)
gitleaks scan results and configuration details

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

### 11. [Performance Baselines](./performance/performance-baselines.md) ⚡ **NEW** (Epic 3)
Lighthouse CI performance baselines and bundle size tracking

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

### Epic 2: Testing Infrastructure & Documentation (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic2/`](./sprint-artifacts/epic2/)

- **[Epic 2 Evolution Document](./sprint-artifacts/epic2/epic-2-evolution.md)** - Epic 2 state tracking (Before/After)
- **[Epic 2 Tech Spec](./sprint-artifacts/epic2/epic-2-tech-spec.md)** - Comprehensive testing infrastructure specification
- **[Epic 2 Retrospective](./sprint-artifacts/epic2/epic-2-retro-2025-11-23.md)** - Lessons learned and action items

**Epic 2 Stories (All Complete):**
1. [Story 2.1](./sprint-artifacts/epic2/2-1-documentation-epic-evolution.md) - Documentation & Epic Evolution ✅
2. [Story 2.2](./sprint-artifacts/epic2/2-2-test-environment-setup.md) - Test Environment Setup ✅
3. [Story 2.3](./sprint-artifacts/epic2/2-3-testing-framework-configuration.md) - Testing Framework Configuration ✅
4. [Story 2.4](./sprint-artifacts/epic2/2-4-authentication-security-tests.md) - Authentication & Security Tests ✅
5. [Story 2.5](./sprint-artifacts/epic2/2-5-core-workflow-tests.md) - Core Workflow Tests ✅
6. [Story 2.6](./sprint-artifacts/epic2/2-6-cicd-pipeline-coverage-baseline.md) - CI/CD Pipeline & Coverage Baseline ✅

### Epic 3: Production-Grade Quality & Testing Completion (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic3/`](./sprint-artifacts/epic3/)

- **[Epic 3 Evolution Document](./sprint-artifacts/epic3/epic-3-evolution.md)** - Epic 3 state tracking (Before/After)
- **[Epic 3 Tech Spec](./sprint-artifacts/epic3/epic-3-tech-spec.md)** - Quality & testing specification

**Epic 3 Stories (All Complete):**
1. [Story 3.1](./sprint-artifacts/epic3/3-1-process-governance-setup.md) - Process & Governance Setup ✅
2. [Story 3.2](./sprint-artifacts/epic3/3-2-e2e-auth-navigation-workflow.md) - E2E Auth & Navigation Workflow ✅
3. [Story 3.3](./sprint-artifacts/epic3/3-3-e2e-transaction-management-workflow.md) - E2E Transaction Management Workflow ✅
4. [Story 3.4](./sprint-artifacts/epic3/3-4-e2e-analytics-export-workflow.md) - E2E Analytics & Export Workflow ✅
5. [Story 3.5](./sprint-artifacts/epic3/3-5-accessibility-testing-framework.md) - Accessibility Testing Framework ✅
6. [Story 3.6](./sprint-artifacts/epic3/3-6-performance-baselines-lighthouse-ci.md) - Performance Baselines & Lighthouse CI ✅
7. [Story 3.7](./sprint-artifacts/epic3/3-7-coverage-enforcement-quality-gates.md) - Coverage Enforcement & Quality Gates ✅

### Epic 4: Security Hardening & Penetration Testing (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic4/`](./sprint-artifacts/epic4/)

- **[Epic 4 Tech Spec](./sprint-artifacts/epic4/tech-spec.md)** - Security hardening specification

**Epic 4 Stories (All Complete):**
1. [Story 4.1](./sprint-artifacts/epic4/4-1-secrets-detection-prevention.md) - Secrets Detection & Prevention ✅
2. [Story 4.2](./sprint-artifacts/epic4/4-2-gemini-api-protection.md) - Gemini API Protection ✅
3. [Story 4.3](./sprint-artifacts/epic4/4-3-dependency-static-security.md) - Dependency & Static Security ✅
4. [Story 4.4](./sprint-artifacts/epic4/4-4-security-documentation.md) - Security Documentation ✅

### Epic 4.5: Receipt Image Storage (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic4-5/`](./sprint-artifacts/epic4-5/)

- **[Epic 4.5 Tech Spec](./archive/tech-spec-epic4.5-nov2025.md)** - Image storage technical specification (archived)

**Epic 4.5 Stories (All Complete):**
1. [Story 4.5-1](./sprint-artifacts/epic4-5/4-5-1-firebase-storage-infrastructure.md) - Firebase Storage Infrastructure ✅
2. [Story 4.5-2](./sprint-artifacts/epic4-5/4-5-2-cloud-function-image-processing.md) - Cloud Function Image Processing ✅
3. [Story 4.5-3](./sprint-artifacts/epic4-5/4-5-3-client-updates-ui.md) - Client Updates & UI ✅
4. [Story 4.5-4](./sprint-artifacts/epic4-5/4-5-4-cascade-delete-documentation.md) - Cascade Delete & Documentation ✅

**Epic 4.5 Achievements:**
- ✅ **Firebase Storage:** User-scoped image storage with security rules
- ✅ **Image Processing:** Server-side compression with sharp (1200x1600 max, 80% JPEG)
- ✅ **Thumbnails:** Auto-generated 120x160 thumbnails for list views
- ✅ **UI Components:** ImageViewer modal for viewing full-size receipts
- ✅ **Cascade Delete:** Firestore trigger automatically deletes images when transaction deleted
- ✅ **Documentation:** ADR-009 documents architectural decisions

### Epic 5: Data Download & Export (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic5/`](./sprint-artifacts/epic5/)

- **[Epic 5 Retrospective](./sprint-artifacts/epic5/epic-5-retro-2025-12-03.md)** - Lessons learned and action items

**Epic 5 Stories (All Complete):**
1. [Story 5-1](./sprint-artifacts/epic5/5-1-csv-export-utilities.md) - CSV Export Utilities ✅
2. [Story 5-2](./sprint-artifacts/epic5/5-2-basic-data-export-settings.md) - Basic Data Export (Settings) ✅
3. [Story 5-3](./sprint-artifacts/epic5/5-3-subscription-tier-check-infrastructure.md) - Subscription Tier Check Infrastructure ✅
4. [Story 5-4](./sprint-artifacts/epic5/5-4-premium-transaction-export.md) - Premium Transaction Export ✅
5. [Story 5-5](./sprint-artifacts/epic5/5-5-premium-statistics-export-upgrade-prompt.md) - Premium Statistics Export & Upgrade Prompt ✅

**Epic 5 Achievements:**
- ✅ **CSV Utilities:** RFC 4180 compliant, UTF-8 BOM for Excel, CSV injection prevention
- ✅ **Basic Export:** All users can download data from Settings (date, total, merchant)
- ✅ **Subscription Infrastructure:** useSubscriptionTier hook ready for Epic 7
- ✅ **Premium Transaction Export:** Pro/Max users download full transaction data from Analytics
- ✅ **Premium Statistics Export:** Pro/Max users download yearly aggregated statistics
- ✅ **Upgrade Prompt:** Modal for non-subscribers with upgrade CTA
- ✅ **Tests:** 335+ tests (137 unit, 167 integration, 31 E2E)
- ✅ **Deployed:** 2025-12-03 to https://boletapp-d609f.web.app

### Epic 6: Smart Category Learning (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic6/`](./sprint-artifacts/epic6/)

- **[Epic 6 Retrospective](./sprint-artifacts/epic6/epic-6-retro-2025-12-04.md)** - Lessons learned and action items

**Epic 6 Stories (All Complete):**
1. [Story 6.1](./sprint-artifacts/epic6/story-6.1-cicd-auto-deploy.md) - CI/CD Auto-Deploy ✅
2. [Story 6.2](./sprint-artifacts/epic6/story-6.2-category-mapping-infrastructure.md) - Category Mapping Infrastructure ✅
3. [Story 6.3](./sprint-artifacts/epic6/story-6.3-fuzzy-matching-engine.md) - Fuzzy Matching Engine ✅
4. [Story 6.4](./sprint-artifacts/epic6/story-6.4-category-learning-prompt.md) - Category Learning Prompt ✅
5. [Story 6.5](./sprint-artifacts/epic6/story-6.5-auto-apply-on-receipt-scan.md) - Auto-Apply on Receipt Scan ✅
6. [Story 6.6](./sprint-artifacts/epic6/story-6.6-epic-release-deployment.md) - Epic Release & Deployment ✅

**Epic 6 Achievements:**
- ✅ **CI/CD Auto-Deploy:** GitHub Actions workflow deploys to Firebase on main branch merge
- ✅ **Category Mapping Infrastructure:** Firestore collection for user-specific category preferences
- ✅ **Fuzzy Matching Engine:** Levenshtein distance algorithm with 0.7 threshold for merchant matching
- ✅ **Category Learning Prompt:** Non-intrusive UI prompt when user changes item category
- ✅ **Auto-Apply on Receipt Scan:** Learned categories automatically applied to new scans
- ✅ **Visual Indicator:** Book icon (📖) shows items with learned category applied
- ✅ **Tests:** 450+ tests (177 unit, 242 integration, 31 E2E)
- ✅ **Deployed:** 2025-12-04 to https://boletapp-d609f.web.app

### Epic 7: Analytics UX Redesign (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic7/`](./sprint-artifacts/epic7/)

- **[Epic 7 Tech Spec](./sprint-artifacts/epic7/epic-7-tech-spec.md)** - Analytics redesign specification

**Epic 7 Stories (All Complete):**
1. [Story 7.1](./sprint-artifacts/epic7/story-7.1-chart-mode-registry.md) - Chart Mode Registry ✅
2. [Story 7.2](./sprint-artifacts/epic7/story-7.2-quarter-week-views.md) - Quarter/Week Temporal Views ✅
3. [Story 7.3](./sprint-artifacts/epic7/story-7.3-temporal-breadcrumb.md) - Temporal Breadcrumb Navigation ✅
4. [Story 7.4](./sprint-artifacts/epic7/story-7.4-category-breadcrumb.md) - Category Breadcrumb Navigation ✅
5. [Story 7.5](./sprint-artifacts/epic7/story-7.5-dual-mode-toggle.md) - Dual Mode Toggle (Aggregation/Comparison) ✅
6. [Story 7.6](./sprint-artifacts/epic7/story-7.6-drill-down-cards.md) - Drill-Down Detail Cards ✅
7. [Story 7.7](./sprint-artifacts/epic7/story-7.7-chart-animations.md) - Chart Animations ✅
8. [Story 7.8](./sprint-artifacts/epic7/story-7.8-export-integration.md) - Export Integration ✅
9. [Story 7.9](./sprint-artifacts/epic7/story-7.9-breadcrumb-icons.md) - Icon-Only Breadcrumb States ✅
10. [Story 7.10](./sprint-artifacts/epic7/story-7.10-navigation-labels.md) - Navigation Label Updates ✅
11. [Story 7.11](./sprint-artifacts/epic7/story-7.11-theme-selector.md) - Theme Selector ✅
12. [Story 7.12](./sprint-artifacts/epic7/story-7.12-visual-consistency.md) - Visual Consistency ✅
13. [Story 7.13](./sprint-artifacts/epic7/story-7.13-bug-fixes.md) - Bug Fixes & Stabilization ✅
14. [Story 7.99](./sprint-artifacts/epic7/story-7.99-epic-release-deployment.md) - Epic Release & Deployment ✅

**Epic 7 Achievements:**
- ✅ **Chart Mode Registry:** Centralized chart mode management with state persistence
- ✅ **Temporal Navigation:** Year → Quarter → Month → Week drill-down with icon-only breadcrumbs
- ✅ **Category Navigation:** All → Category → Merchant drill-down hierarchy
- ✅ **Dual Mode Toggle:** Switch between Aggregation (total spending) and Comparison (period-over-period) views
- ✅ **Drill-Down Cards:** Interactive summary cards with tap-to-drill functionality
- ✅ **Theme Selector:** Light, Dark, and System theme modes in Settings
- ✅ **Navigation Labels:** Updated "History" → "Receipts", "Trends" → "Analytics"
- ✅ **Tests:** 977+ tests (677 unit, 300 integration)
- ✅ **Deployed:** 2025-12-09 to https://boletapp-d609f.web.app

### Epic 14c-refactor: Cleanup & Refactor (COMPLETE ✅)

**Location:** [`sprint-artifacts/epic14c-refactor/`](./sprint-artifacts/epic14c-refactor/)

- **[Epics Document](./sprint-artifacts/epic14c-refactor/epics.md)** - Epic breakdown and stories
- **[App Architecture Final](./sprint-artifacts/epic14c-refactor/app-architecture-final.md)** - Architecture analysis

**Epic 14c-refactor Achievements:**
- ✅ **Shared Groups Stub:** Disabled broken shared groups, preserved UI shells
- ✅ **App Architecture Refactor:** Extracted 6,033 lines to composition hooks
- ✅ **Handler Extraction:** 4 handler hooks (Transaction, Navigation, Dialog, Scan)
- ✅ **View Composition:** 7 view props hooks (Dashboard, History, Trends, etc.)
- ✅ **Documentation Consolidation:** Reorganized docs/ structure
- ✅ **Test Cleanup:** Consolidated vitest configs, fixed test failures

### Epic 14e: Feature-Based Architecture (PLANNED 📋)

**Location:** [`sprint-artifacts/epic14e-feature-architecture/`](./sprint-artifacts/epic14e-feature-architecture/)

- **[Epics Document](./sprint-artifacts/epic14e-feature-architecture/epics.md)** - Epic breakdown and 24 stories
- **[Architecture Decision](./sprint-artifacts/epic14e-feature-architecture/architecture-decision.md)** - Hybrid architecture design

**Epic 14e Scope:**
- 📋 **Hybrid Architecture:** Feature Slicing (primary) + State Machines (complex flows)
- 📋 **Modal Manager:** Centralized modal rendering with Zustand store
- 📋 **Scan Feature:** XState machine + processScan extraction (600 lines)
- 📋 **Batch Review Feature:** XState machine for batch review flow
- 📋 **Simple Features:** Categories, Credit, Transactions extraction
- 📋 **Target:** App.tsx reduced from ~3,850 lines to 500-800 lines
- 📋 **Total:** 24 stories, ~72 story points across 5 parts

---

## Team Standards

**Location:** [`team-standards.md`](./team-standards.md)

### [Team Standards & Knowledge Base](./team-standards.md) - **NEW** (Epic 5 Retro)
Single source of truth for:
- Team agreements from all retrospectives
- Workflow standards (branching, PRs, deployment)
- Testing standards and patterns
- Security standards
- Document index
- Lessons learned and known gotchas

---

## Document Templates

**Location:** [`templates/`](./templates/)

Templates for creating consistent documentation:
- Epic evolution template
- Story template (BMAD framework)
- **[Deployment Story Template](./templates/deployment-story-template.md)** - **NEW** (Epic 5 Retro) - For final story of each epic

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

**Epic 3 Achievements:**
Epic 3 focused on **production-grade quality and testing completion**. Key deliverables:
- ✅ **Process & Governance:** Multi-branch strategy (main/develop/staging), branch protection
- ✅ **E2E Test Workflows:** 28 E2E tests covering auth, navigation, transactions, analytics
- ✅ **Accessibility Testing:** 16 tests with @axe-core/playwright for WCAG 2.1 Level AA
- ✅ **Performance Baselines:** Lighthouse CI with playwright-lighthouse, bundle size tracking
- ✅ **Coverage Enforcement:** Thresholds enforced in CI (45% lines, 30% branches)
- ✅ **PR Coverage Comments:** vitest-coverage-report-action integration
- ✅ **19-Step CI Pipeline:** Complete GitHub Actions workflow with quality gates

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
| **Performance baselines** | [Performance Baselines](./performance/performance-baselines.md) |
| **Security overview** | [Security README](./security/README.md) |
| **OWASP checklist** | [OWASP Checklist](./security/owasp-checklist.md) |
| **Pricing model** | [Pricing Model](./business/pricing-model.md) |
| **Cost analysis** | [Cost Analysis](./business/cost-analysis.md) |
| **Contribution guidelines** | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| **CI/CD pipeline** | [CI/CD README](./ci-cd/README.md) |
| **Team standards** | [Team Standards](./team-standards.md) |
| **Deployment template** | [Deployment Story Template](./templates/deployment-story-template.md) |

---

## Existing Project Documentation

### Setup & Configuration

- **[README.md](../README.md)** - Project overview, setup instructions, production deployment info

### Framework Documentation

The `.bmad/` directory contains the BMAD (Breakthrough Modern Agile Development) framework. This is the development methodology, not application code.

---

**Documentation Version:** 11.0
**Generated:** 2026-01-24 (Epic 14e planning)
**Next Update:** After Epic 14e Part 1 completion
