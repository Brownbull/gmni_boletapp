# Epic Technical Specification: Production-Grade Quality & Testing Completion

Date: 2025-11-25
Author: Gabe
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 transforms Boletapp from "has tests" to "production-grade quality" by addressing all testing gaps identified in the Epic 2 retrospective. The epic focuses exclusively on quality infrastructure - no new application features are added.

**Context:** Epic 2 established a three-tier testing framework (Vitest + React Testing Library + Playwright) with 79.51% code coverage. However, the retrospective revealed critical gaps: E2E tests are skeletal placeholders that don't validate real user workflows, no branch protection exists, no accessibility or performance testing frameworks are in place, and coverage is not enforced by CI.

**Goal:** Complete the testing and quality infrastructure to production-grade standards by implementing real E2E workflows, accessibility testing, performance monitoring, and process governance. This epic closes all testing gaps from Epic 2 and establishes sustainable quality practices for future development.

## Objectives and Scope

### In Scope

- **Process Improvements:**
  - GitHub branch protection (require PR + passing CI)
  - Epic evolution document enforcement (mandatory AC in all stories)
  - CI/CD debugging guide (`act` framework usage)

- **E2E Testing Transformation:**
  - Replace 17 skeletal E2E tests with 19 meaningful workflow tests
  - Authentication & navigation workflows (5 tests)
  - Transaction management workflows (7 tests)
  - Analytics & export workflows (7 tests)

- **Accessibility Testing:**
  - @axe-core/playwright integration
  - Keyboard navigation validation
  - Screen reader label verification
  - Color contrast checks (WCAG AA)
  - 10+ accessibility tests for critical paths

- **Performance Monitoring:**
  - Lighthouse CI integration
  - Bundle size tracking (warn on 10%+ increase)
  - Performance baselines establishment

- **Coverage Enforcement:**
  - CI requires 70%+ coverage for PR merge
  - Coverage regression detection (fail on >2% drop)
  - Coverage reports in PR comments

### Out of Scope

- Visual regression testing (Chromatic, Percy) - deferred to future epics
- Load/stress testing (Artillery, k6) - low user count expected
- Cross-browser testing (Firefox, Safari, Edge) - Chrome sufficient for MVP
- Advanced monitoring (Sentry, Datadog) - Firebase Console sufficient
- Security penetration testing - external audit deferred
- New feature development - focus is quality infrastructure only
- Database schema changes
- UI/UX redesign

## System Architecture Alignment

### Alignment with Existing Architecture (Post-Epic 2)

Epic 3 does not change the application architecture (Modular SPA pattern with 31 TypeScript files). Changes are confined to:

**Testing Infrastructure Layer:**
- `tests/e2e/` - Replace skeletal tests with real workflow tests
- `tests/e2e/accessibility/` - New accessibility test files (Story 3.5)
- `.github/workflows/test.yml` - Enhanced with performance and coverage gates

**Configuration Layer:**
- `playwright.config.ts` - Accessibility testing configuration
- `lighthouserc.js` - Lighthouse CI configuration (Story 3.6)
- `package.json` - New devDependencies (@axe-core/playwright, @lhci/cli)

**Documentation Layer:**
- `docs/ci-cd/debugging-guide.md` - CI debugging documentation (Story 3.1)
- `docs/testing/accessibility-testing.md` - Accessibility testing guide (Story 3.5)
- `docs/performance/performance-baselines.md` - Performance documentation (Story 3.6)
- `CONTRIBUTING.md` - Coverage requirements documentation (Story 3.7)

**No Changes To:**
- `src/` directory (application code unchanged)
- `firestore.rules` (security model unchanged)
- `firebase.json` (hosting configuration unchanged)
- Data models, API contracts, or component architecture

## Detailed Design

### Services and Modules

Epic 3 does not introduce new application services. All changes are confined to testing infrastructure:

| Module | Responsibility | Story | Files Affected |
|--------|----------------|-------|----------------|
| **E2E Test Suite** | Real user workflow validation | 3.2, 3.3, 3.4 | `tests/e2e/*.spec.ts` |
| **Accessibility Tests** | WCAG AA compliance validation | 3.5 | `tests/e2e/accessibility/*.spec.ts` |
| **Lighthouse CI** | Performance monitoring & regression detection | 3.6 | `lighthouserc.js`, `.github/workflows/test.yml` |
| **Coverage Enforcement** | Quality gate enforcement in CI | 3.7 | `.github/workflows/test.yml`, `vitest.config.ts` |
| **Process Governance** | Branch protection & documentation enforcement | 3.1 | GitHub Settings, `CONTRIBUTING.md` |

### Data Models and Contracts

**No data model changes in Epic 3.** The existing Firestore schema remains unchanged:

```typescript
// Existing Transaction interface (unchanged)
interface Transaction {
  id: string;
  merchant: string;
  date: string;        // ISO 8601
  total: number;
  category: string;    // One of STORE_CATEGORIES
  alias?: string;
  items: Array<{
    name: string;
    price: number;
    category?: string;
  }>;
}
```

**Test Data Contracts:** E2E tests will use the existing test fixtures from Story 2.2:
- `test-user-1@boletapp.test` - 10 transaction fixtures
- `test-user-2@boletapp.test` - 8 transaction fixtures
- `admin@boletapp.test` - Administrative test user

### APIs and Interfaces

**No new API integrations.** Epic 3 uses existing integrations:

| API | Usage in Epic 3 | Notes |
|-----|-----------------|-------|
| Firebase Auth | E2E auth workflow tests | Uses emulator for test isolation |
| Cloud Firestore | E2E CRUD workflow tests | Uses emulator, reset before each test |
| Google Gemini | Receipt scanning E2E tests | Mocked in tests (existing fixtures from Story 2.4) |

**New Tool Integrations:**

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| @axe-core/playwright | Accessibility scanning | Playwright test hooks |
| @lhci/cli | Performance auditing | GitHub Actions workflow |
| lighthouse | Core Web Vitals measurement | Called by @lhci/cli |

### Workflows and Sequencing

**E2E Test Workflow Structure (Stories 3.2, 3.3, 3.4):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2E Test Execution Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Firebase Emulator Start                                      │
│     └── Auth + Firestore emulators                              │
│                                                                  │
│  2. Test Data Reset                                              │
│     └── npm run test:reset-data                                 │
│                                                                  │
│  3. Dev Server Start                                             │
│     └── Playwright webServer config                             │
│                                                                  │
│  4. Test Execution (Sequential - fileParallelism: false)        │
│     ├── Auth Workflow Tests (Story 3.2)                         │
│     │   ├── Login → Dashboard → Logout                          │
│     │   ├── Navigation between views                            │
│     │   ├── Unauthenticated redirect                            │
│     │   ├── Session persistence                                  │
│     │   └── Sign out state clearing                             │
│     │                                                            │
│     ├── Transaction Workflow Tests (Story 3.3)                  │
│     │   ├── Create → Verify → Edit → Save → Delete              │
│     │   ├── Receipt scan → Review → Save                        │
│     │   ├── Filter by date range                                │
│     │   ├── Sort transactions                                    │
│     │   ├── Data persistence across refresh                     │
│     │   ├── Pagination/scrolling                                │
│     │   └── Empty state display                                  │
│     │                                                            │
│     └── Analytics Workflow Tests (Story 3.4)                    │
│         ├── Monthly trends chart                                 │
│         ├── Category breakdown                                   │
│         ├── Date range filtering                                 │
│         ├── CSV export                                           │
│         ├── JSON export                                          │
│         ├── Empty data handling                                  │
│         └── Single transaction display                          │
│                                                                  │
│  5. Screenshot on Failure                                        │
│     └── Automatic debugging artifacts                           │
│                                                                  │
│  6. Cleanup                                                      │
│     └── Emulator shutdown, server stop                          │
└─────────────────────────────────────────────────────────────────┘
```

**CI/CD Workflow Enhancement (Stories 3.6, 3.7):**

```
┌─────────────────────────────────────────────────────────────────┐
│              Enhanced GitHub Actions Workflow                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger: Push to main OR Pull Request                          │
│                                                                  │
│  Jobs:                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Unit Tests (Vitest)                                      ││
│  │    └── Coverage threshold check: 70%                        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2. Integration Tests (RTL)                                  ││
│  │    └── Firebase emulator required                           ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 3. E2E Tests (Playwright)                                   ││
│  │    └── Includes accessibility scans (Story 3.5)             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 4. Lighthouse CI (Story 3.6)                                ││
│  │    ├── Performance: 90+                                     ││
│  │    ├── Accessibility: 90+                                   ││
│  │    ├── Best Practices: 90+                                  ││
│  │    └── SEO: 90+                                              ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 5. Coverage Gate (Story 3.7)                                ││
│  │    ├── Require 70%+ coverage                                ││
│  │    ├── Fail on >2% regression                               ││
│  │    └── Post coverage report to PR                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Branch Protection (Story 3.1):                                  │
│  ├── Require PR for merge to main                               │
│  ├── Require all status checks to pass                          │
│  └── Prevent direct pushes to main                              │
└─────────────────────────────────────────────────────────────────┘
```

## Non-Functional Requirements

### Performance

**Lighthouse CI Baselines (Story 3.6):**

| Metric | Target | Tolerance | Action on Failure |
|--------|--------|-----------|-------------------|
| Performance Score | 90+ | ±5 points | Warn (not block) |
| Accessibility Score | 90+ | ±5 points | Warn |
| Best Practices Score | 90+ | ±5 points | Warn |
| SEO Score | 90+ | ±5 points | Warn |
| First Contentful Paint | <1.5s | +0.5s | Warn |
| Time to Interactive | <3.0s | +1.0s | Warn |
| Largest Contentful Paint | <2.5s | +0.5s | Warn |

**Bundle Size Tracking:**

| Metric | Current Baseline | Warning Threshold |
|--------|------------------|-------------------|
| Total Bundle Size | ~624KB | +10% (686KB) |
| Main JS Chunk | TBD (Story 3.6) | +10% |
| Vendor Chunk | TBD (Story 3.6) | +10% |

**Test Execution Performance:**

| Test Suite | Current Time | Target Max | Notes |
|------------|--------------|------------|-------|
| Unit Tests | ~700ms | <2s | Vitest with happy-dom |
| Integration Tests | ~3s | <10s | Firebase emulator required |
| E2E Tests | ~30s | <120s | Playwright headless Chrome |
| Full CI Pipeline | ~3-5 min | <10 min | All tests + coverage + Lighthouse |

### Security

**No new security requirements in Epic 3.** Existing security model remains unchanged:

- **Authentication:** Firebase Auth with Google OAuth (unchanged)
- **Data Isolation:** Firestore security rules enforce user isolation (unchanged)
- **API Keys:** Environment variables in `.env` (unchanged)

**Testing Security:**
- E2E tests use Firebase emulator (isolated from production)
- Test users have `@boletapp.test` domain (clearly distinguishable)
- No production credentials in test code
- Gemini API mocked in E2E tests (no API key exposure)

### Reliability/Availability

**CI/CD Reliability (Stories 3.1, 3.7):**

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Test Suite Stability | 100% pass rate (no flakiness) | Sequential E2E execution, auto-wait |
| CI Pipeline Success Rate | >95% | Retry logic for transient failures |
| Branch Protection Enforcement | 100% | GitHub Settings configuration |
| Coverage Regression Prevention | Block >2% drops | CI gate enforcement |

**E2E Test Reliability:**
- Use `fileParallelism: false` to prevent emulator race conditions
- Implement `page.waitForSelector()` with appropriate timeouts
- Reset test data before each test run
- Screenshot on failure for debugging

### Observability

**Test Reporting (Story 3.6, 3.7):**

| Artifact | Format | Retention | Location |
|----------|--------|-----------|----------|
| Unit Test Results | JUnit XML | 30 days | GitHub Actions artifacts |
| Coverage Report | HTML, LCOV | 30 days | GitHub Actions artifacts |
| Lighthouse Reports | HTML, JSON | 30 days | GitHub Actions artifacts |
| E2E Screenshots | PNG | 30 days | GitHub Actions artifacts (on failure) |
| Coverage Summary | Markdown | PR lifetime | PR comments |

**Metrics to Track:**
- Test coverage percentage (overall and per-module)
- Lighthouse scores over time
- Bundle size trend
- CI pipeline execution time
- Test flakiness rate (failures on retry)

## Dependencies and Integrations

### Existing Dependencies (Unchanged)

**Production Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| firebase | ^10.14.1 | Auth, Firestore, Hosting |
| lucide-react | ^0.460.0 | Icons |
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | React DOM renderer |

**Testing Dependencies (from Epic 2):**
| Package | Version | Purpose |
|---------|---------|---------|
| @playwright/test | ^1.56.1 | E2E testing framework |
| @testing-library/react | ^16.3.0 | Component testing |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | User interaction simulation |
| @firebase/rules-unit-testing | ^3.0.4 | Firestore rules testing |
| @vitest/coverage-v8 | ^4.0.13 | Code coverage |
| vitest | ^4.0.13 | Unit test runner |
| happy-dom | ^20.0.10 | DOM environment |

### New Dependencies (Epic 3)

| Package | Version | Story | Purpose |
|---------|---------|-------|---------|
| @axe-core/playwright | ^4.x | 3.5 | Accessibility testing |
| @lhci/cli | ^0.13.x | 3.6 | Lighthouse CI runner |
| lighthouse | ^11.x | 3.6 | Performance auditing (peer dep) |

**Installation Command (Story 3.5, 3.6):**
```bash
npm install --save-dev @axe-core/playwright @lhci/cli
```

### External Service Integrations

| Service | Integration Type | Story | Notes |
|---------|------------------|-------|-------|
| GitHub Actions | CI/CD | 3.1, 3.6, 3.7 | Free tier (2000 min/month) |
| GitHub Branch Protection | Repository Settings | 3.1 | GitHub API/UI configuration |
| Firebase Emulator | Local Testing | Existing | Auth + Firestore emulators |

### Internal Dependencies (Story Ordering)

```
Story 3.1 (Process Setup)
    │
    ├──► Story 3.2 (E2E Auth) ──┐
    │                            │
    ├──► Story 3.3 (E2E Trans) ─┼──► Story 3.6 (Lighthouse)
    │                            │         │
    ├──► Story 3.4 (E2E Analytics)┘        │
    │                                       │
    └──► Story 3.5 (Accessibility) ────────┴──► Story 3.7 (Coverage Gates)
```

**Dependency Rules:**
- Story 3.1 must complete first (enables branch protection workflow)
- Stories 3.2, 3.3, 3.4 can run in parallel (E2E workflows independent)
- Story 3.5 can run in parallel with E2E stories
- Story 3.6 should wait for E2E stories (Lighthouse scans require app workflows)
- Story 3.7 should complete last (final quality gate establishment)

## Acceptance Criteria (Authoritative)

### Story 3.1: Process & Governance Setup (2 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.1.1 | GitHub branch protection enabled on `main` | Direct push blocked; PR required |
| 3.1.2 | CI status checks required before merge | PR with failing tests cannot merge |
| 3.1.3 | Story template includes epic evolution AC | Template file contains mandatory AC |
| 3.1.4 | CI/CD debugging guide created | `docs/ci-cd/debugging-guide.md` exists |
| 3.1.5 | Epic 3 evolution document updated | Story 3.1 section completed |

### Story 3.2: E2E Authentication & Navigation Workflow (3 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.2.1 | 5 auth/navigation workflow tests implemented | Replace 3 skeletal smoke tests |
| 3.2.2 | Login → Dashboard → Logout test | Complete auth flow validated |
| 3.2.3 | Navigation between all views test | Dashboard → Scan → Trends → History → Settings |
| 3.2.4 | Unauthenticated redirect test | Unauthenticated user redirected to login |
| 3.2.5 | Session persistence test | Auth persists across page refresh |
| 3.2.6 | Sign out state clearing test | Logout clears auth state |
| 3.2.7 | Real user interactions | Tests use click/type, not just assertions |
| 3.2.8 | Epic 3 evolution document updated | Story 3.2 section completed |

### Story 3.3: E2E Transaction Management Workflow (5 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.3.1 | 7 transaction workflow tests implemented | Replace 7 skeletal tests |
| 3.3.2 | Create → Verify → Edit → Delete test | Full CRUD workflow validated |
| 3.3.3 | Receipt scan → Review → Save test | Scanning workflow validated |
| 3.3.4 | Filter by date range test | Filtered results verified |
| 3.3.5 | Sort transactions test | Sort order verified |
| 3.3.6 | Data persistence test | Data persists across refresh |
| 3.3.7 | Pagination/scrolling test | Multiple transactions display |
| 3.3.8 | Empty state test | No transactions displays correctly |
| 3.3.9 | Epic 3 evolution document updated | Story 3.3 section completed |

### Story 3.4: E2E Analytics & Data Export Workflow (5 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.4.1 | 7 analytics/export workflow tests implemented | Replace 7 skeletal tests |
| 3.4.2 | Monthly trends chart test | Chart renders with data |
| 3.4.3 | Category breakdown test | Percentages calculated correctly |
| 3.4.4 | Date range filter test | Chart updates on filter |
| 3.4.5 | CSV export test | File downloads with correct data |
| 3.4.6 | JSON export test | File downloads with correct structure |
| 3.4.7 | Empty data test | "No data" message displayed |
| 3.4.8 | Single transaction test | Single item displays correctly |
| 3.4.9 | Epic 3 evolution document updated | Story 3.4 section completed |

### Story 3.5: Accessibility Testing Framework & Critical Path Tests (4 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.5.1 | @axe-core/playwright installed | Package in devDependencies |
| 3.5.2 | 10+ accessibility tests implemented | Tests for all critical paths |
| 3.5.3 | Keyboard navigation test | Tab, Enter, Escape, Space work |
| 3.5.4 | Screen reader labels test | ARIA labels, alt text, roles present |
| 3.5.5 | Color contrast test | WCAG AA (4.5:1) met |
| 3.5.6 | Focus management test | Modals, dropdowns, nav handle focus |
| 3.5.7 | Zero critical axe violations | No critical violations on any page |
| 3.5.8 | Documentation created | `docs/testing/accessibility-testing.md` |
| 3.5.9 | Epic 3 evolution document updated | Story 3.5 section completed |

### Story 3.6: Performance Baselines & Lighthouse CI (3 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.6.1 | Lighthouse CI installed and configured | @lhci/cli in devDependencies |
| 3.6.2 | GitHub Actions workflow updated | Lighthouse runs in CI |
| 3.6.3 | Performance baselines documented | Scores recorded in docs |
| 3.6.4 | Bundle size tracking configured | Warn on 10%+ increase |
| 3.6.5 | Lighthouse reports uploaded | Artifacts in GitHub Actions |
| 3.6.6 | Documentation created | `docs/performance/performance-baselines.md` |
| 3.6.7 | Baseline metrics met | Performance 90+, Accessibility 90+ |
| 3.6.8 | Epic 3 evolution document updated | Story 3.6 section completed |

### Story 3.7: Test Coverage Enforcement & CI Quality Gates (2 points)

| AC# | Criterion | Testable Condition |
|-----|-----------|-------------------|
| 3.7.1 | CI requires 70%+ coverage | Workflow fails below threshold |
| 3.7.2 | Coverage drops >2% blocked | Regression detection working |
| 3.7.3 | Coverage reports in PR comments | Bot posts coverage summary |
| 3.7.4 | Requirements documented | CONTRIBUTING.md updated |
| 3.7.5 | 65% coverage PR blocked | Verified: merge prevented |
| 3.7.6 | 71% coverage PR allowed | Verified: merge allowed |
| 3.7.7 | Epic 3 evolution document updated | Story 3.7 section completed |

## Traceability Mapping

| AC# | Spec Section | Component/File | Test Approach |
|-----|--------------|----------------|---------------|
| 3.1.1-3.1.2 | System Architecture Alignment | GitHub Settings | Manual verification |
| 3.1.3 | System Architecture Alignment | `.bmad/bmm/workflows/` | Template inspection |
| 3.1.4 | Documentation Layer | `docs/ci-cd/debugging-guide.md` | File existence |
| 3.2.1-3.2.7 | Workflows and Sequencing | `tests/e2e/auth-workflow.spec.ts` | Playwright E2E |
| 3.3.1-3.3.8 | Workflows and Sequencing | `tests/e2e/transaction-*.spec.ts` | Playwright E2E |
| 3.4.1-3.4.8 | Workflows and Sequencing | `tests/e2e/analytics-*.spec.ts` | Playwright E2E |
| 3.5.1-3.5.7 | Workflows and Sequencing | `tests/e2e/accessibility/*.spec.ts` | Playwright + axe-core |
| 3.6.1-3.6.7 | NFR: Performance | `lighthouserc.js`, `.github/workflows/test.yml` | Lighthouse CI |
| 3.7.1-3.7.6 | NFR: Reliability | `.github/workflows/test.yml`, `vitest.config.ts` | CI workflow execution |

### Epic Success Criteria Mapping

| Epic Success Criterion | Implementing Stories | Validation Method |
|------------------------|----------------------|-------------------|
| All 19 E2E tests validate real workflows | 3.2, 3.3, 3.4 | E2E test execution |
| Accessibility covers critical paths (10+) | 3.5 | Test count verification |
| Performance baselines established | 3.6 | Lighthouse CI reports |
| Branch protection prevents broken code | 3.1 | GitHub settings verification |
| Epic evolution maintained | All stories | Document inspection |
| Coverage maintained at 70%+ | 3.7 | CI coverage reports |
| Zero coverage regressions | 3.7 | CI gate verification |
| Production-grade quality standards | All stories | Full test suite passing |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **E2E Test Flakiness** | Medium | Medium | Use Playwright auto-wait, sequential execution (`fileParallelism: false`), increase emulator timeouts |
| **Accessibility Testing Learning Curve** | Medium | Low | Use automated @axe-core tool, focus on critical violations only, document findings |
| **Performance Baselines Too Strict** | Low | Low | Establish baselines from CI (not local), use "warn" mode, allow ±5 point variance |
| **Coverage Enforcement Blocks Development** | Low | Low | Apply to main only, allow <2% drops, provide testing guidance in CONTRIBUTING.md |
| **GitHub Actions Minutes Exhaustion** | Low | Medium | Free tier provides 2000 min/month; monitor usage, optimize workflow steps |

### Assumptions

| Assumption | Rationale | Risk if False |
|------------|-----------|---------------|
| Firebase emulator is stable in CI | Used successfully in Epic 2 | E2E tests will be unreliable |
| Playwright Chromium sufficient for testing | Chrome market share >65% | Miss browser-specific bugs |
| @axe-core catches meaningful accessibility issues | Industry-standard tool | False sense of accessibility |
| 79.51% coverage baseline is accurate | Epic 2 CI reports | Coverage gate may be too strict |
| Team has bandwidth for 24 story points | Single developer, ~4 weeks | Epic may exceed timeline |

### Open Questions

| Question | Owner | Due Date | Impact |
|----------|-------|----------|--------|
| Should we use coveralls.io or codecov.io for PR comments? | Dev | Story 3.7 | UX of coverage visibility |
| What Lighthouse score variance is acceptable in CI? | Dev | Story 3.6 | False positives in CI |
| Should accessibility tests block PRs or just warn? | Product | Story 3.5 | Development velocity vs. quality |
| Is branch protection rule "1 approval" needed for solo dev? | Dev | Story 3.1 | Process overhead |

## Test Strategy Summary

### Test Pyramid for Epic 3

```
                    ▲
                   /|\     E2E Tests (19 tests)
                  / | \    Stories 3.2, 3.3, 3.4
                 /  |  \   - Real user workflows
                /   |   \  - Playwright + Firebase emulator
               /----|----\
              /     |     \
             /      |      \  Accessibility Tests (10+ tests)
            /       |       \ Story 3.5
           /        |        \- @axe-core/playwright
          /---------|--------\ - Keyboard navigation
         /          |          \
        /           |           \  Integration Tests (40 existing)
       /            |            \ Epic 2 baseline
      /             |             \- Component rendering
     /______________|______________\- Firebase rules
    /               |                \
   /                |                 \ Unit Tests (14 existing)
  /                 |                  \Epic 2 baseline
 /__________________|___________________\
```

### Test Categories by Priority

| Priority | Category | Story | Tests | Target |
|----------|----------|-------|-------|--------|
| P1 | E2E User Workflows | 3.2, 3.3, 3.4 | 19 | Replace skeletal tests |
| P2 | Accessibility | 3.5 | 10+ | WCAG AA automated |
| P3 | Performance | 3.6 | N/A | Lighthouse CI baselines |
| P4 | Coverage Enforcement | 3.7 | N/A | CI quality gates |

### Testing Approach by Story

**Story 3.1 (Process Setup):** Manual verification of GitHub settings, no automated tests added.

**Story 3.2 (E2E Auth):**
- Use Playwright with Firebase Auth emulator
- Test user: `test-user-1@boletapp.test`
- Focus: Login flow, navigation, session persistence, logout

**Story 3.3 (E2E Transactions):**
- Reset test data before each test (`npm run test:reset-data`)
- Test CRUD operations with real Firestore emulator
- Mock Gemini API for receipt scanning (use existing fixtures)

**Story 3.4 (E2E Analytics):**
- Use fixture data for consistent chart rendering
- Test file download for CSV/JSON export
- Verify chart elements render (SVG/canvas presence)

**Story 3.5 (Accessibility):**
- Run `@axe-core/playwright` on each major view
- Test keyboard navigation (Tab order, Enter/Space activation)
- Validate ARIA labels using Playwright locators

**Story 3.6 (Performance):**
- Configure Lighthouse CI with `lighthouserc.js`
- Run against production build in CI
- Upload reports as GitHub Actions artifacts

**Story 3.7 (Coverage Enforcement):**
- Add coverage threshold to Vitest config
- Fail CI workflow if coverage < 70%
- Post coverage summary to PR comments

### Test Environment Requirements

| Environment | Configuration | Used By |
|-------------|---------------|---------|
| Local Development | `npm run dev` + Firebase emulator | Manual testing |
| CI Environment | GitHub Actions + emulators | Automated tests |
| Production | https://boletapp-d609f.web.app | Lighthouse CI scans |

### Quality Gates Summary

| Gate | Threshold | Enforcement | Story |
|------|-----------|-------------|-------|
| Unit/Integration Tests | All pass | Block merge | Existing |
| E2E Tests | All pass | Block merge | 3.2, 3.3, 3.4 |
| Code Coverage | 70%+ | Block merge | 3.7 |
| Coverage Regression | <2% drop | Block merge | 3.7 |
| Lighthouse Performance | 90+ | Warn only | 3.6 |
| Accessibility Violations | Zero critical | Warn only | 3.5 |

---

**Document Version:** 1.0
**Generated:** 2025-11-25
**Status:** Draft
**Next Action:** Create Story 3.1 and begin implementation
