# boletapp - Epic Breakdown

**Date:** 2025-11-20
**Project Level:** Quick Flow

---

## Epic 1: Production Deployment Readiness

**Slug:** production-deployment

### Goal

Transform the boletapp single-file prototype into a production-ready, maintainable application with proper modular architecture, version control, and automated deployment to Firebase Hosting. Enable sustainable development practices and make the application accessible to end users.

### Scope

**In Scope:**
- Refactor main.tsx (621 lines) into modular component structure
- Establish Vite build pipeline with TypeScript configuration
- Set up proper dependency management via npm
- Initialize Git repository and push to https://github.com/Brownbull/gmni_boletapp
- Configure Firebase Hosting with deployment automation
- Deploy application to production with HTTPS
- Environment variable management for secure configuration
- Update all project documentation

**Out of Scope:**
- New features or functionality changes
- UI/UX redesign
- Database schema modifications
- Automated testing framework (deferred)
- Multi-environment setup (staging/prod)
- Custom domain configuration
- Performance optimizations beyond build improvements

### Success Criteria

1. ✅ Application successfully refactored from single-file to modular structure with no feature regressions
2. ✅ Code tracked in Git repository at https://github.com/Brownbull/gmni_boletapp
3. ✅ Production build process functional (`npm run build` succeeds)
4. ✅ Application deployed and accessible via Firebase Hosting URL with HTTPS
5. ✅ All existing features work identically in deployed production environment
6. ✅ Environment variables externalized (no hardcoded API keys in source)
7. ✅ Documentation updated to reflect new architecture and deployment process

### Dependencies

**External:**
- Firebase project already configured (Auth + Firestore)
- Google Gemini API key available
- GitHub repository created: https://github.com/Brownbull/gmni_boletapp
- Node.js 18+ and npm installed locally

**Internal:**
- Existing main.tsx contains all functional application code
- Comprehensive brownfield documentation already generated

---

## Story Map - Epic 1

```
Epic 1: Production Deployment Readiness (14 points total)
│
├── Story 1.1: Refactor to Modular Architecture (5 points)
│   Dependencies: None
│   Deliverable: Modular src/ structure with Vite build working
│
├── Story 1.2: Production Build Configuration (2 points)
│   Dependencies: Story 1.1
│   Deliverable: Environment variables, build scripts, production-ready config
│
├── Story 1.3: Git Repository Setup (2 points)
│   Dependencies: Stories 1.1, 1.2
│   Deliverable: Code pushed to GitHub with proper .gitignore
│
├── Story 1.4: Firebase Deployment Infrastructure (3 points)
│   Dependencies: Stories 1.1, 1.2
│   Deliverable: Firebase Hosting configured and tested
│
└── Story 1.5: Production Deployment & Verification (2 points)
    Dependencies: Stories 1.1, 1.2, 1.3, 1.4
    Deliverable: Application live at Firebase URL, fully functional
```

---

## Stories - Epic 1

### Story 1.1: Refactor to Modular Architecture

As a developer,
I want the single-file application refactored into a modular component structure,
So that the codebase is maintainable, testable, and follows modern development practices.

**Acceptance Criteria:**

AC #1: All code from main.tsx extracted into logical modules (components/, utils/, hooks/, services/)
AC #2: Vite development server runs successfully with hot module replacement
AC #3: TypeScript compilation succeeds with no errors
AC #4: All existing features work identically to original main.tsx
AC #5: No console errors in browser devtools during normal operation

**Prerequisites:** None (first story in sequence)

**Technical Notes:** Use Vite 5.x with TypeScript 5.3.3. Extract code in phases: utilities first (lowest risk), then services, hooks, and finally components. Preserve all existing functionality.

**Estimated Effort:** 5 story points

---

### Story 1.2: Production Build Configuration

As a developer,
I want proper environment variable management and production build configuration,
So that API keys are secure and the application can be built for production deployment.

**Acceptance Criteria:**

AC #1: .env file configured with all Firebase and Gemini credentials (git-ignored)
AC #2: .env.example template created and documented
AC #3: `npm run build` completes successfully producing optimized dist/ folder
AC #4: `npm run preview` serves production build locally with all features functional
AC #5: No hardcoded API keys remain in source code

**Prerequisites:** Story 1.1 (requires modular structure and Vite configuration)

**Technical Notes:** Use Vite environment variables (VITE_* prefix). Configure .gitignore to exclude .env, node_modules, and dist/. Test production build thoroughly.

**Estimated Effort:** 2 story points

---

### Story 1.3: Git Repository Setup

As a developer,
I want the codebase tracked in version control on GitHub,
So that code is backed up, versioned, and ready for collaboration.

**Acceptance Criteria:**

AC #1: Git repository initialized with proper .gitignore
AC #2: Initial commit includes all source code (excluding node_modules, .env, dist)
AC #3: Repository pushed to https://github.com/Brownbull/gmni_boletapp
AC #4: README.md updated with new project structure and setup instructions
AC #5: Repository is accessible and viewable on GitHub web interface

**Prerequisites:** Stories 1.1 and 1.2 (requires completed refactoring and build configuration)

**Technical Notes:** Use conventional commit message format. Ensure .gitignore properly excludes sensitive files before initial commit. Update README with Vite-specific instructions.

**Estimated Effort:** 2 story points

---

### Story 1.4: Firebase Deployment Infrastructure

As a developer,
I want Firebase Hosting configured and ready for deployment,
So that the application can be deployed to production with automated deployment scripts.

**Acceptance Criteria:**

AC #1: Firebase CLI installed and authenticated
AC #2: `firebase init hosting` completed with correct settings (public: dist, SPA config)
AC #3: firebase.json includes caching headers for optimized asset delivery
AC #4: Staging deployment tested successfully
AC #5: Deployment process documented in README.md

**Prerequisites:** Stories 1.1 and 1.2 (requires production build working)

**Technical Notes:** Configure Firebase Hosting to serve dist/ folder. Set up SPA rewrites for client-side routing. Add cache headers for static assets (31536000 seconds for JS/CSS).

**Estimated Effort:** 3 story points

---

### Story 1.5: Production Deployment & Verification

As a product owner,
I want the application deployed to production and verified working,
So that end users can access the live application via HTTPS.

**Acceptance Criteria:**

AC #1: Production build created and tested locally
AC #2: `firebase deploy --only hosting` succeeds without errors
AC #3: Application accessible via Firebase Hosting URL with HTTPS enabled
AC #4: All features (auth, scanning, CRUD, analytics) work in production environment
AC #5: No errors in Firebase Console logs after deployment
AC #6: Production URL documented and shared

**Prerequisites:** All previous stories (1.1, 1.2, 1.3, 1.4)

**Technical Notes:** Run full regression test suite in production. Document Firebase Hosting URL. Verify Firebase Console shows hosting activity. Test rollback procedure.

**Estimated Effort:** 2 story points

---

## Implementation Timeline - Epic 1

**Total Story Points:** 14 points

**Estimated Timeline:** 7-10 days (assuming 1.5-2 points per day)

**Implementation Sequence:**
1. Story 1.1 (Refactor) - Foundation work, highest risk, must be done first
2. Story 1.2 (Build Config) - Depends on refactored structure
3. Story 1.3 (Git) and Story 1.4 (Firebase) - Can be done in parallel after 1.2
4. Story 1.5 (Deploy) - Final integration, depends on all previous stories

**Recommended Approach:** Sequential execution (1→2→3→4→5) for single developer. Stories 1.3 and 1.4 could be parallelized if multiple developers available.

---

*Generated by BMAD Tech-Spec Workflow*
*Epic Slug: production-deployment*
*Total Stories: 5*

---

## Epic 2: Testing Infrastructure & Documentation

**Slug:** testing-infrastructure

### Goal

Establish comprehensive testing infrastructure and complete application documentation to ensure quality, maintainability, and knowledge transfer. Enable sustainable development practices through automated testing, test data management, and architectural documentation.

### Scope

**In Scope:**
- Automated testing framework setup (Vitest + React Testing Library + Playwright)
- Test environment with Firebase emulators and test users
- Test data fixtures and reset scripts
- Unit tests for HIGH risk areas (authentication, data isolation, security rules)
- Integration tests for core workflows (transaction CRUD, receipt scanning)
- E2E tests for critical user paths
- Test coverage baseline establishment (target: 70%+ for critical paths)
- Complete architecture documentation with Mermaid diagrams
- Epic evolution tracking system
- Test Strategy & Risk Register
- CI/CD pipeline configuration for automated test execution

**Out of Scope:**
- LOW risk tests (responsive design, chart rendering, navigation) - deferred to Epic 3
- Performance/load testing - deferred to Epic 3
- Accessibility testing (WCAG compliance) - deferred to Epic 3
- Visual regression testing - deferred to Epic 3
- Production monitoring/alerting beyond Firebase Console basics
- Advanced CI/CD features (multi-environment deployments, automated rollbacks)
- Code coverage enforcement (will establish baseline, not enforce gates yet)

### Success Criteria

1. ✅ Test environment operational with 3 Firebase Auth test users and fixture data
2. ✅ Database reset script (`npm run test:reset-data`) working reliably
3. ✅ All HIGH risk tests implemented and passing (authentication, data isolation, security rules, data persistence, receipt scanning)
4. ✅ Test coverage at 70%+ for critical paths (auth, CRUD, AI integration)
5. ✅ CI/CD pipeline running tests on every commit
6. ✅ Architecture documentation complete with Mermaid diagrams
7. ✅ Epic evolution template created and Epic 2 evolution document maintained
8. ✅ Zero test flakiness in CI pipeline (tests pass consistently)

### Dependencies

**External:**
- Firebase project with Firestore emulator support
- GitHub Actions for CI/CD (free tier)
- Node.js 18+ for test execution
- Playwright browsers installed

**Internal:**
- Epic 1 completed (modular architecture, Firebase Hosting deployed)
- Production application accessible for E2E testing reference
- Architecture documentation from Epic 1 (6 ADRs established)

---

## Story Map - Epic 2

```
Epic 2: Testing Infrastructure & Documentation (22 points total)
│
├── Story 2.1: Documentation & Epic Evolution (3 points)
│   Dependencies: None
│   Deliverable: Epic Evolution template, updated architecture.md with Mermaid diagrams
│
├── Story 2.2: Test Environment Setup (4 points)
│   Dependencies: Story 2.1
│   Deliverable: 3 test users, fixture data, reset script operational
│
├── Story 2.3: Testing Framework Configuration (3 points)
│   Dependencies: Story 2.2
│   Deliverable: Vitest, RTL, Playwright configured and operational
│
├── Story 2.4: Authentication & Security Tests (5 points)
│   Dependencies: Story 2.3
│   Deliverable: Tests for auth flow, data isolation, Firestore security rules
│
├── Story 2.5: Core Workflow Tests (5 points)
│   Dependencies: Story 2.3
│   Deliverable: Tests for CRUD operations, receipt scanning, data persistence
│
└── Story 2.6: CI/CD Pipeline & Coverage Baseline (2 points)
    Dependencies: Stories 2.4, 2.5
    Deliverable: GitHub Actions workflow, coverage reports, test documentation
```

---

## Stories - Epic 2

### Story 2.1: Documentation & Epic Evolution

As an architect,
I want comprehensive architecture documentation with visual diagrams and an epic evolution tracking system,
So that developers understand the system design and can track state changes across epics.

**Acceptance Criteria:**

AC #1: Epic Evolution template created at `docs/templates/epic-evolution-template.md` with Before/After state tracking structure
AC #2: Epic 2 evolution document created at `docs/sprint-artifacts/epic-2-evolution.md` with initial "Before State" filled
AC #3: architecture.md updated with 3+ Mermaid diagrams (system overview, data flow, deployment architecture)
AC #4: Test Strategy & Risk Register created at `docs/test-strategy.md` with 17+ test categories prioritized
AC #5: All documentation cross-linked and referenced in index.md

**Prerequisites:** Epic 1 completed (architecture.md exists with 6 ADRs)

**Technical Notes:** Focus on visual clarity - diagrams should help new developers understand the system quickly. Use Mermaid for maintainability. Epic evolution doc will be updated after each story in Epic 2.

**Estimated Effort:** 3 story points

---

### Story 2.2: Test Environment Setup

As a test engineer,
I want a dedicated test environment with stable test users and repeatable fixture data,
So that I can run automated tests reliably without affecting production data.

**Acceptance Criteria:**

AC #1: 3 Firebase Auth test users created (admin@boletapp.test, test-user-1@boletapp.test, test-user-2@boletapp.test)
AC #2: Firebase emulator suite configured (Auth + Firestore) for local testing
AC #3: Transaction fixtures defined (10 for user-1, 8 for user-2) in `scripts/test-data-fixtures.ts`
AC #4: Database reset script created at `scripts/reset-test-data.ts` with `npm run test:reset-data` command
AC #5: Reset script validated - restores test users to fixture state without touching production data
AC #6: Documentation created at `docs/test-environment.md` explaining test user management

**Prerequisites:** Story 2.1 (documentation foundation)

**Technical Notes:** Use Firebase emulator for local development. Create separate Firebase project for test users if needed. Ensure reset script is idempotent (can run multiple times safely). Validate tenant isolation between test users.

**Estimated Effort:** 4 story points

---

### Story 2.3: Testing Framework Configuration

As a developer,
I want automated testing frameworks configured and operational,
So that I can write and run unit, integration, and E2E tests efficiently.

**Acceptance Criteria:**

AC #1: Vitest installed and configured with TypeScript support
AC #2: React Testing Library installed with custom render utilities
AC #3: Playwright installed and configured for E2E testing (Chromium browser)
AC #4: Firebase emulator integration working in tests (`@firebase/rules-unit-testing`)
AC #5: Test scripts added to package.json (`test:unit`, `test:e2e`, `test:all`)
AC #6: Sample smoke test passing for each framework (1 unit test, 1 integration test, 1 E2E test)
AC #7: Code coverage reporting configured (Istanbul/c8)

**Prerequisites:** Story 2.2 (test environment ready)

**Technical Notes:** Use Vitest for speed and native ESM support. Configure Playwright to use Firebase emulator for E2E tests. Set up parallel test execution where possible. Document test patterns in `docs/testing-guide.md`.

**Estimated Effort:** 3 story points

---

### Story 2.4: Authentication & Security Tests

As a security engineer,
I want comprehensive tests for authentication flows and data isolation,
So that user data is protected and security vulnerabilities are prevented.

**Acceptance Criteria:**

AC #1: Authentication flow tests implemented (Google OAuth login, logout, session persistence) - 5+ test cases
AC #2: Data isolation tests implemented (user-1 cannot access user-2 data) - 3+ test cases
AC #3: Firestore security rules tests implemented using `@firebase/rules-unit-testing` - 5+ test cases
AC #4: Data persistence tests implemented (transactions persist across sessions) - 3+ test cases
AC #5: All HIGH risk auth/security tests passing (16+ tests total)
AC #6: Test coverage for auth/security modules at 80%+

**Prerequisites:** Story 2.3 (testing frameworks configured)

**Technical Notes:** Focus on security-critical paths first. Use Firebase emulator for security rules testing. Test both authenticated and unauthenticated scenarios. Document test patterns for future security tests.

**Estimated Effort:** 5 story points

---

### Story 2.5: Core Workflow Tests

As a QA engineer,
I want automated tests for core user workflows,
So that critical features are protected from regressions and bugs are caught early.

**Acceptance Criteria:**

AC #1: Transaction CRUD tests implemented (create, read, update, delete) - 8+ test cases
AC #2: Receipt scanning tests implemented (image upload, Gemini API, data extraction) - 6+ test cases
AC #3: Trend analytics tests implemented (monthly totals, category breakdown) - 5+ test cases
AC #4: Form validation tests implemented (required fields, numeric validation) - 4+ test cases
AC #5: All MEDIUM/HIGH risk workflow tests passing (23+ tests total)
AC #6: Test coverage for services and hooks at 70%+

**Prerequisites:** Story 2.3 (testing frameworks configured)

**Technical Notes:** Mock Gemini API calls for receipt scanning tests (use fixtures). Test both happy paths and error scenarios. Use React Testing Library for component-level tests. Playwright for E2E workflows.

**Estimated Effort:** 5 story points

---

### Story 2.6: CI/CD Pipeline & Coverage Baseline

As a DevOps engineer,
I want automated test execution in CI/CD pipeline with coverage reporting,
So that code quality is maintained and tests run on every commit.

**Acceptance Criteria:**

AC #1: GitHub Actions workflow created (`.github/workflows/test.yml`)
AC #2: Workflow runs on every push to main and all pull requests
AC #3: Workflow executes unit tests, integration tests, and E2E tests sequentially
AC #4: Code coverage report generated and uploaded to GitHub Actions artifacts
AC #5: Test coverage baseline documented (target: 70%+ for critical paths)
AC #6: Failed tests block PR merges (require passing tests)
AC #7: Workflow execution time < 10 minutes

**Prerequisites:** Stories 2.4 and 2.5 (tests implemented)

**Technical Notes:** Use GitHub Actions free tier (2000 minutes/month). Cache node_modules for faster builds. Run unit/integration tests in parallel, E2E tests sequentially. Consider adding coverage badges to README.md.

**Estimated Effort:** 2 story points

---

## Implementation Timeline - Epic 2

**Total Story Points:** 22 points

**Estimated Timeline:** 11-15 days (assuming 1.5-2 points per day)

**Implementation Sequence:**
1. Story 2.1 (Documentation) - Foundation work, enables epic tracking
2. Story 2.2 (Test Environment) - Required for all testing stories
3. Story 2.3 (Testing Frameworks) - Required for test implementation
4. Story 2.4 (Auth/Security Tests) and Story 2.5 (Workflow Tests) - Can be done in parallel
5. Story 2.6 (CI/CD Pipeline) - Final integration, depends on all tests

**Recommended Approach:** Sequential execution (2.1→2.2→2.3) then parallel (2.4 + 2.5) then final (2.6) for single developer. Stories 2.4 and 2.5 could be parallelized if multiple developers available.

---

*Updated with Epic 2: Testing Infrastructure & Documentation*
*Total Epics: 2*
*Total Stories: 11*

## Epic 3: Production-Grade Quality & Testing Completion

**Slug:** production-grade-quality

### Goal

Complete the testing and quality infrastructure to production-grade standards by implementing real E2E workflows, accessibility testing, performance monitoring, and process improvements identified in Epic 2 retrospective. Close all testing gaps from Epic 2 and establish sustainable quality practices for future development.

### Scope

**In Scope:**
- Replace skeletal E2E tests with real user workflow tests (17 tests → 19 meaningful tests)
- Implement accessibility testing framework (@axe-core/playwright)
- Establish performance baselines (Lighthouse CI, bundle size tracking)
- Configure branch protection rules (require PR + passing CI)
- Enforce epic evolution document updates in story workflow
- Document CI/CD debugging workflow (using `act` framework)
- Configure test coverage enforcement gates (70%+ required for PR merge)
- Create accessibility tests for critical user paths (keyboard navigation, screen readers, color contrast)
- Implement performance monitoring and regression detection

**Out of Scope:**
- Visual regression testing (Chromatic, Percy) - deferred to future epics
- Load/stress testing (Artillery, k6) - low user count expected
- Cross-browser testing (Firefox, Safari, Edge) - Chrome coverage sufficient for MVP
- Advanced monitoring (Sentry, Datadog, New Relic) - Firebase Console sufficient
- Security penetration testing - external audit deferred
- New feature development - focus is quality infrastructure only

### Success Criteria

1. ✅ All 19 E2E tests validate real user workflows (no skeletal tests remain)
2. ✅ Accessibility testing covers all critical user paths (10+ tests)
3. ✅ Performance baselines established (Lighthouse CI operational)
4. ✅ Branch protection prevents broken code from reaching main
5. ✅ Epic evolution document maintained throughout epic (updated after each story)
6. ✅ Test coverage maintained at 70%+ (enforced by CI)
7. ✅ Zero test coverage regressions (CI blocks drops >2%)
8. ✅ Application reaches "production-grade" quality standards

### Dependencies

**External:**
- GitHub Actions (free tier - 2000 min/month)
- Playwright browsers (Chromium)
- @axe-core/playwright (npm package)
- @lhci/cli (npm package for Lighthouse CI)
- Firebase emulator (already installed from Epic 2)

**Internal:**
- Epic 2 completed ✅ (testing infrastructure exists)
- Firebase emulator configured ✅ (Story 2.2)
- Test users and fixtures available ✅ (Story 2.2)
- CI/CD pipeline operational ✅ (Story 2.6)

---

## Story Map - Epic 3

```
Epic 3: Production-Grade Quality & Testing Completion (24 points total)
│
├── Story 3.1: Process & Governance Setup (2 points)
│   Dependencies: None
│   Deliverable: Branch protection, epic evolution enforcement, CI/CD debugging guide
│
├── Story 3.2: E2E Authentication & Navigation Workflow (3 points)
│   Dependencies: Story 3.1
│   Deliverable: 5 real auth/navigation workflow tests (replace 3 skeletal)
│
├── Story 3.3: E2E Transaction Management Workflow (5 points)
│   Dependencies: Story 3.1
│   Deliverable: 7 real transaction CRUD workflow tests (replace 7 skeletal)
│
├── Story 3.4: E2E Analytics & Data Export Workflow (5 points)
│   Dependencies: Story 3.1
│   Deliverable: 7 real analytics/export workflow tests (replace 7 skeletal)
│
├── Story 3.5: Accessibility Testing Framework & Critical Path Tests (4 points)
│   Dependencies: Story 3.1
│   Deliverable: 10+ accessibility tests with @axe-core/playwright
│
├── Story 3.6: Performance Baselines & Lighthouse CI (3 points)
│   Dependencies: Stories 3.2, 3.3, 3.4 (E2E workflows needed for full page scans)
│   Deliverable: Lighthouse CI integration, bundle size tracking
│
└── Story 3.7: Test Coverage Enforcement & CI Quality Gates (2 points)
    Dependencies: All previous stories
    Deliverable: CI blocks PRs below 70% coverage, coverage regression detection
```

---

## Stories - Epic 3

### Story 3.1: Process & Governance Setup

As a DevOps engineer,
I want branch protection and process enforcement mechanisms in place,
So that code quality is maintained through automated guardrails.

**Acceptance Criteria:**

AC #1: GitHub branch protection enabled on `main` (require PR, require passing CI, prevent direct pushes)
AC #2: Story creation workflow updated to include mandatory AC: "Update Epic Evolution document"
AC #3: CI/CD debugging guide created at `docs/ci-cd/debugging-guide.md` documenting `act` usage
AC #4: Verified: Direct push to main blocked, PR without passing tests cannot merge
AC #5: Epic 3 evolution document updated with Story 3.1 completion

**Prerequisites:** Epic 2 completed

**Technical Notes:** Configure GitHub Settings → Branches → Branch protection rules for `main`. Update `.bmad/bmm/workflows/create-story/template.md` to include epic evolution AC. Document common CI failures and `act` framework usage for local testing.

**Estimated Effort:** 2 story points

---

### Story 3.2: E2E Authentication & Navigation Workflow

As a QA engineer,
I want E2E tests that validate real authentication and navigation workflows,
So that regressions in core user journeys are caught before deployment.

**Acceptance Criteria:**

AC #1: 5 authentication/navigation workflow tests implemented (replace 3 skeletal smoke tests)
AC #2: Test: Complete auth flow (login → dashboard → logout)
AC #3: Test: Navigation between all views (dashboard → scan → trends → history → settings → dashboard)
AC #4: Test: Unauthenticated user redirect to login
AC #5: Test: Authenticated user persists across page refresh
AC #6: Test: Sign out clears auth state and redirects to login
AC #7: All 5 tests use real user interactions (not just page load assertions)
AC #8: Epic 3 evolution document updated with Story 3.2 completion

**Prerequisites:** Story 3.1 (branch protection enables clean PR workflow)

**Technical Notes:** Use Playwright's `page.waitForSelector()` for robust waiting. Reset Firebase emulator data before each test. Use test-user-1 credentials. Focus on user workflows, not component implementation details.

**Estimated Effort:** 3 story points

---

### Story 3.3: E2E Transaction Management Workflow

As a QA engineer,
I want E2E tests that validate real transaction CRUD workflows,
So that core application features are protected from regressions.

**Acceptance Criteria:**

AC #1: 7 transaction workflow tests implemented (replace 7 skeletal transaction-management tests)
AC #2: Test: Create manual transaction → verify in list → edit → save → verify changes → delete → verify removed
AC #3: Test: Receipt scan → review extracted data → save → verify in list
AC #4: Test: Filter transactions by date range → verify filtered results
AC #5: Test: Sort transactions (newest first, oldest first) → verify sort order
AC #6: Test: Transaction data persists across page refresh
AC #7: Test: Multiple transactions displayed correctly with pagination/scrolling
AC #8: Test: Empty state displayed when no transactions exist
AC #9: Epic 3 evolution document updated with Story 3.3 completion

**Prerequisites:** Story 3.1 (branch protection)

**Technical Notes:** Use Firebase emulator reset script before each test. Test with test-user-1 fixtures (10 transactions). Validate both happy paths and edge cases (empty state, single transaction).

**Estimated Effort:** 5 story points

---

### Story 3.4: E2E Analytics & Data Export Workflow

As a QA engineer,
I want E2E tests that validate real analytics and export workflows,
So that data visualization and export features work correctly.

**Acceptance Criteria:**

AC #1: 7 analytics/export workflow tests implemented (replace 7 skeletal analytics tests)
AC #2: Test: View monthly trends → verify chart renders with correct data
AC #3: Test: View category breakdown → verify percentages calculated correctly
AC #4: Test: Filter analytics by date range → verify recalculation and chart update
AC #5: Test: Export transactions to CSV → verify file downloads with correct data
AC #6: Test: Export transactions to JSON → verify file downloads with correct structure
AC #7: Test: Analytics with empty data displays "No data" message
AC #8: Test: Analytics with single transaction displays correctly
AC #9: Epic 3 evolution document updated with Story 3.4 completion

**Prerequisites:** Story 3.1 (branch protection)

**Technical Notes:** Use Playwright's download event handling for export tests. Validate chart rendering (canvas/SVG elements present). Test with varying data sets (empty, single transaction, multiple transactions).

**Estimated Effort:** 5 story points

---

### Story 3.5: Accessibility Testing Framework & Critical Path Tests

As a UX engineer,
I want automated accessibility testing for critical user paths,
So that the application is usable by people with disabilities.

**Acceptance Criteria:**

AC #1: @axe-core/playwright installed and configured
AC #2: 10+ accessibility tests implemented for critical paths (login, dashboard, scan, trends, history, settings)
AC #3: Test: Keyboard navigation works (Tab, Enter, Escape, Space keys)
AC #4: Test: Screen reader labels present (ARIA labels, alt text, roles)
AC #5: Test: Color contrast meets WCAG AA standards (4.5:1 for text)
AC #6: Test: Focus management works correctly (modals, dropdowns, navigation)
AC #7: Zero critical or serious axe violations on any page
AC #8: Accessibility test documentation created at `docs/testing/accessibility-testing.md`
AC #9: Epic 3 evolution document updated with Story 3.5 completion

**Prerequisites:** Story 3.1 (branch protection)

**Technical Notes:** Focus on WCAG 2.1 Level AA automated checks only. Use @axe-core/playwright for automated scans. Manual testing (screen readers) deferred to future epics. Document findings and fixes for future reference.

**Estimated Effort:** 4 story points

---

### Story 3.6: Performance Baselines & Lighthouse CI

As a DevOps engineer,
I want performance monitoring integrated into CI/CD pipeline,
So that performance regressions are caught before deployment.

**Acceptance Criteria:**

AC #1: Lighthouse CI (@lhci/cli) installed and configured
AC #2: `.github/workflows/test.yml` updated to run Lighthouse scans
AC #3: Performance baselines documented (Performance, Accessibility, Best Practices, SEO scores)
AC #4: Bundle size tracking configured (warn on 10%+ increase)
AC #5: Lighthouse reports uploaded to GitHub Actions artifacts
AC #6: Performance documentation created at `docs/performance/performance-baselines.md`
AC #7: Baseline metrics: Performance 90+, Accessibility 90+, Best Practices 90+, SEO 90+
AC #8: Epic 3 evolution document updated with Story 3.6 completion

**Prerequisites:** Stories 3.2, 3.3, 3.4 (E2E workflows needed for full page scans)

**Technical Notes:** Establish baselines from CI environment (not local). Use "warn" mode initially, not "fail". Allow 5-point score variance for flaky metrics. Focus on regression detection, not absolute scores.

**Estimated Effort:** 3 story points

---

### Story 3.7: Test Coverage Enforcement & CI Quality Gates

As a DevOps engineer,
I want test coverage enforcement in CI/CD pipeline,
So that code quality doesn't regress over time.

**Acceptance Criteria:**

AC #1: `.github/workflows/test.yml` updated to require 70%+ coverage
AC #2: CI fails if coverage drops below 70%
AC #3: CI fails if coverage drops >2% from main branch
AC #4: Coverage reports automatically posted to PR comments
AC #5: Coverage requirements documented in CONTRIBUTING.md
AC #6: Verified: PR with 65% coverage blocked from merge
AC #7: Verified: PR with 71% coverage allowed to merge
AC #8: Epic 3 evolution document updated with Story 3.7 completion

**Prerequisites:** All previous stories (final quality gate)

**Technical Notes:** Use vitest `--coverage.thresholds.lines=70` flag. Consider coveralls.io or codecov.io for PR comment integration. Apply enforcement to main branch only (not feature branches).

**Estimated Effort:** 2 story points

---

## Implementation Timeline - Epic 3

**Total Story Points:** 24 points

**Estimated Timeline:** 16-22 days (assuming 1.5-2 points per day)

**Implementation Sequence:**
1. Story 3.1 (Process Setup) - Foundation work, enables clean workflow
2. Stories 3.2, 3.3, 3.4 (E2E Workflows) - Can be done in parallel or sequentially
3. Story 3.5 (Accessibility) - Can be done in parallel with E2E stories
4. Story 3.6 (Performance) - Requires E2E workflows complete
5. Story 3.7 (Coverage Enforcement) - Final quality gate

**Recommended Approach:** Sequential execution (3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7) for single developer. Stories 3.2, 3.3, 3.4 could be parallelized if multiple developers available. Story 3.5 can run in parallel with E2E stories if resourced.

---

*Updated with Epic 3: Production-Grade Quality & Testing Completion*

---

## Epic 4: Security Hardening & Penetration Testing

**Slug:** security-hardening

### Goal

Harden the application security posture through comprehensive security scanning, penetration testing, and vulnerability remediation. Ensure the application is secure before adding feature-driven epics that handle sensitive data (subscriptions, payments, user preferences).

### Scope

**In Scope:**
- Dependency security audit (npm audit, vulnerable package updates)
- Firebase Security Rules penetration testing (Firestore rules, tenant isolation verification)
- OWASP Top 10 validation (XSS, CSRF, injection, auth/session review)
- API security testing (API key exposure, rate limiting)
- Static code analysis (eslint-plugin-security, secrets detection)
- CI/CD security integration (automated security scanning in pipeline)

**Out of Scope:**
- External professional penetration testing (may be considered later)
- SOC 2 / ISO 27001 compliance (enterprise-grade, not MVP)
- Advanced threat modeling (deferred to enterprise scale)
- Bug bounty program (requires user base first)

### Success Criteria

1. ✅ Zero HIGH or CRITICAL vulnerabilities in npm audit
2. ✅ Firebase Security Rules pass all penetration tests
3. ✅ No secrets or API keys exposed in source code
4. ✅ OWASP Top 10 checklist validated
5. ✅ Security scanning integrated into CI/CD pipeline
6. ✅ Security documentation created (findings, remediations, ongoing practices)

### Dependencies

**External:**
- OWASP ZAP or similar security scanning tool
- eslint-plugin-security
- Firebase Security Rules testing framework

**Internal:**
- Epic 3 completed ✅ (production-grade quality baseline)
- CI/CD pipeline operational ✅

---

## Epic 5: Enhanced Data Export

**Slug:** enhanced-data-export

### Goal

Provide users with comprehensive data export capabilities including multi-level time aggregation and multiple export formats. Enable users to extract their financial data at various granularities for personal analysis, tax preparation, or external tool integration.

### Scope

**In Scope:**

**Aggregation Levels:**
- Yearly aggregation (annual summaries)
- Quarterly aggregation (Q1, Q2, Q3, Q4)
- Monthly aggregation (existing, enhanced)
- Weekly aggregation (week-by-week breakdown)
- Daily aggregation (day-by-day details)

**Export Formats:**
- Excel file (.xlsx) with tabs per aggregation level
- Individual CSV downloads per aggregation level
- UI options to select export granularity and date range

**Out of Scope:**
- Hourly aggregation (not useful for expense tracking)
- PDF report generation (deferred)
- Automated scheduled exports (deferred)
- Cloud storage integration (Google Drive, Dropbox)
- Email delivery of exports

### Success Criteria

1. ✅ Users can export data at 5 aggregation levels (yearly, quarterly, monthly, weekly, daily)
2. ✅ Excel export generates file with separate tabs per selected level
3. ✅ CSV export allows individual file downloads per level
4. ✅ UI provides clear selection for export format and date range
5. ✅ Export data matches displayed analytics data exactly
6. ✅ Large exports (1000+ transactions) complete without timeout

### Dependencies

**External:**
- Excel generation library (xlsx, exceljs, or similar)

**Internal:**
- Epic 4 completed (security hardened before data export features)

---

## Epic 6: Smart Category Learning

**Slug:** smart-category-learning

### Goal

Implement AI-assisted category learning that remembers user category corrections and automatically applies learned categories to future similar items. Reduce manual categorization effort while maintaining user control over classifications.

### Scope

**In Scope:**

**Core Functionality:**
- User category overrides are remembered per user
- Future receipts with similar items auto-apply learned categories
- AI-assisted but user-correctable classification system
- Fuzzy matching for item similarity detection

**Technical Components:**
- New Firestore collection for category mappings (`user_category_mappings`)
- Fuzzy matching logic for item similarity (item name, vendor patterns)
- Integration into receipt scanning flow (apply learned categories)
- UI for managing learned categories (view, edit, delete mappings)

**Out of Scope:**
- Cross-user category learning (privacy concern)
- Category suggestions based on transaction amount
- Machine learning model training (use rule-based fuzzy matching)
- Category hierarchy or sub-categories

### Success Criteria

1. ✅ User category corrections persist in Firestore
2. ✅ Subsequent similar items receive learned category automatically
3. ✅ Users can view and manage their learned category mappings
4. ✅ Fuzzy matching detects similar items (e.g., "Uber" matches "UBER EATS", "Uber Trip")
5. ✅ Learning is per-user (no cross-user data sharing)
6. ✅ Users can override AI suggestions at any time

### Dependencies

**External:**
- Fuzzy matching library (fuse.js, string-similarity, or similar)

**Internal:**
- Epic 4 completed (security hardened)
- Epic 5 completed (export features ensure data portability)

---

## Epic 7: Analytics UX Redesign (COMPLETED)

**Slug:** analytics-ux-redesign
**Status:** ✅ COMPLETED (2025-12-09)

### Goal

Comprehensive analytics UX redesign with dual-axis breadcrumb navigation, Quarter/Week temporal views, Chart dual mode, and visual consistency improvements.

### Delivered

- **19 stories completed** (7.1-7.18 + 7.99)
- **977 tests passing** (677 unit + 300 integration)
- **84.25% test coverage**
- **Production URL:** https://boletapp-d609f.web.app

### Key Features Delivered

- Dual-axis breadcrumb navigation (Temporal + Category)
- Quarter and Week temporal views
- Chart dual mode (Aggregation vs Comparison)
- Stacked bar charts with tooltips
- Drill-down cards with progress bars
- App-wide theme system (Light/Dark/System, Normal/Professional colors)
- Floating download FAB
- Navigation label updates (History → Receipts, Trends → Analytics)

### Architecture Decisions

- **ADR-010:** React Context for Analytics State
- **ADR-011:** Chart Registry Pattern
- **ADR-012:** Month-Aligned Weeks

### References

- [PRD: docs/prd-epic7.md](docs/prd-epic7.md)
- [Architecture: docs/architecture-epic7.md](docs/architecture-epic7.md)
- [Tech Spec: docs/sprint-artifacts/epic7/tech-spec-epic-7.md](docs/sprint-artifacts/epic7/tech-spec-epic-7.md)
- [Retrospective: docs/sprint-artifacts/epic7/epic-7-retro-2025-12-10.md](docs/sprint-artifacts/epic7/epic-7-retro-2025-12-10.md)

---

## Epic 8: Architecture & Data Collection

**Slug:** architecture-data-collection

### Goal

Redesign application architecture to capture user corrections (category changes, item edits) for building a training dataset. Enable future custom model training once reaching ~10,000 transactions threshold.

### Scope

**In Scope:**

**Data Capture Requirements:**
- Track user corrections to AI-extracted data
- Store original Gemini output vs user-corrected values
- Capture item name corrections, category changes, price edits
- Design schema for training data extraction

**Technical Components:**
- New Firestore collection for correction data (`user_corrections`)
- Event tracking for category changes and item edits
- Data export format for model training
- Privacy-preserving data aggregation patterns

**Out of Scope:**
- Actual model training (future epic)
- Cross-user data aggregation (privacy concern)
- Real-time model updates
- External ML service integration

### Success Criteria

1. User corrections captured with original vs corrected values
2. Data schema supports future model training extraction
3. Privacy preserved (per-user data isolation maintained)
4. ~10,000 transactions threshold documented as training trigger
5. Correction patterns analyzed and documented

### Dependencies

**Internal:**
- Epic 7 completed ✅ (analytics foundation)
- Existing category learning from Epic 6

---

## Epic 9: UX Redesign

**Slug:** ux-redesign

### Goal

Comprehensive UX redesign using mockups-first approach. Focus on receipt scanning and editing flows to improve user experience and reduce friction.

### Scope

**In Scope:**

**Design Process:**
- Mockups workflow before any implementation
- Receipt scanning flow redesign
- EditView.tsx UX improvements
- Onboarding flow for new users

**Technical Components:**
- Design artifacts (wireframes, mockups)
- User flow documentation
- UX testing plan
- Component library updates

**Out of Scope:**
- Code refactoring (deferred to Epic 10)
- Performance optimizations
- New features beyond UX improvements

### Success Criteria

1. Mockups approved before implementation begins
2. Receipt scanning flow simplified
3. Edit flow UX improved
4. User testing validates improvements
5. Design system documented

### Dependencies

**Internal:**
- Epic 8 completed (architecture in place)
- Epic 7 analytics UX as reference

---

## Epic 10: Application Refactoring

**Slug:** application-refactoring

### Goal

Apply single responsibility principle and decompose complex components for maintainability. Address technical debt accumulated in previous epics.

### Scope

**In Scope:**

**Refactoring Targets:**
- EditView.tsx decomposition (high complexity)
- Component single responsibility cleanup
- Code quality improvements
- Test coverage for refactored code

**Technical Components:**
- Extract sub-components from large files
- Improve separation of concerns
- Update tests for refactored components
- Document architectural improvements

**Out of Scope:**
- New features
- UX changes (completed in Epic 9)
- Performance optimizations beyond code cleanup

### Success Criteria

1. EditView.tsx decomposed into smaller components
2. All refactored code has test coverage
3. No regressions in existing functionality
4. Code complexity metrics improved
5. Documentation updated

### Dependencies

**Internal:**
- Epic 9 completed (UX redesign informs refactoring)
- Epic 7 retro action item: EditView.tsx refactoring

---

## Epic 11: Subscription & Monetization

**Slug:** subscription-monetization

### Goal

Implement subscription tiers and payment integration to monetize the application. Enable sustainable business model with free tier for basic usage and paid tiers for power users.

### Scope

**In Scope:**

**Subscription Tiers:**

| Tier | Scans/Month | Items/Receipt | Insights Access | Price (CLP) |
|------|-------------|---------------|-----------------|-------------|
| **Free** | 20 scans (1/day limit) | 200 items max | Basic | $0 |
| **Pro** | 100 scans | 200 items max | Pro insights | TBD |
| **Max** | 1,000 scans | 200 items max | Full insights | TBD |

**Technical Components:**
- User subscription tier tracking (Firestore `user_subscriptions` collection)
- Usage metering (scans per day/month, items per receipt)
- Rate limiting enforcement based on tier
- Mercado Pago integration for Chile market
- Tier-gated features (enforce limits, show upgrade prompts)
- Billing management UI (view plan, change plan, payment history)

**Out of Scope:**
- Multiple currencies (CLP only for MVP)
- Annual subscription discounts (monthly only initially)
- Team/organization subscriptions
- Refund automation (manual process initially)
- Invoice generation

### Success Criteria

1. Three subscription tiers operational (Free, Pro, Max)
2. Usage tracking accurately counts scans and items
3. Rate limiting enforces tier limits correctly
4. Mercado Pago payment flow completes successfully
5. Users can upgrade/downgrade subscription tiers
6. Free tier users see upgrade prompts when approaching limits
7. Payment webhook handles subscription changes reliably

### Dependencies

**External:**
- Mercado Pago developer account and API keys
- Mercado Pago SDK for Chile

**Internal:**
- Epic 10 completed (clean codebase for payment integration)

---

## Epic 12: Mobile App

**Slug:** mobile-app

### Goal

Deliver native mobile applications for iOS (App Store) and Android (Play Store) to expand reach and improve user experience for mobile-first users. Enable receipt scanning with device camera integration.

### Scope

**In Scope:**

**Platforms:**
- Android app → Google Play Store deployment
- iOS app → Apple App Store deployment

**Core Features:**
- All existing web app features in mobile format
- Native camera integration for receipt scanning
- Push notifications for usage limits and reminders
- Offline capability for viewing transaction history

**Technical Approach (TBD during planning):**
- Option A: React Native (code sharing with web)
- Option B: PWA enhancement (minimal native code)
- Option C: Capacitor/Ionic (hybrid approach)
- Option D: Native development (maximum platform integration)

**Out of Scope:**
- Tablet-optimized layouts (phone-first)
- Watch apps (Apple Watch, Wear OS)
- Widget support (iOS/Android home screen widgets)
- Background sync (manual sync only)

### Success Criteria

1. Android app published on Google Play Store
2. iOS app published on Apple App Store
3. Native camera integration works for receipt scanning
4. All core features functional on mobile
5. App store billing integrated (if required by store policies)
6. Mobile-specific UI optimizations implemented
7. Push notifications operational

### Dependencies

**External:**
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)
- App Store/Play Store billing integration (if required)

**Internal:**
- Epic 11 completed (subscription system operational)
- May need dual payment integration (Mercado Pago web + Store billing mobile)

### Considerations

- App Store / Play Store may require in-app purchase for subscriptions purchased within mobile app
- Privacy policy and terms of service required for store submissions
- COPPA compliance review if app could be used by children
- App signing keys management and secure storage

---

## Epic Dependency Graph

```
Epic 1: Production Deployment ─────────────────┐
                                               │
Epic 2: Testing Infrastructure ────────────────┤
                                               │
Epic 3: Production-Grade Quality ──────────────┤
                                               ▼
Epic 4: Security Hardening ◄───────────────────┘
        │
        ├──────────────────┬─────────────────┐
        ▼                  ▼                 ▼
Epic 5: Data Export    Epic 6: Category   Epic 7: Analytics UX ✅
        │              Learning               │
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
              Epic 8: Architecture & Data Collection
                           │
                           ▼
                   Epic 9: UX Redesign
                           │
                           ▼
               Epic 10: Application Refactoring
                           │
                           ▼
              Epic 11: Subscription & Monetization
                           │
                           ▼
                   Epic 12: Mobile App
```

---

*Updated with Epic 7 completion and revised roadmap from Epic 7 Retrospective (2025-12-10)*
*Total Epics: 12*
*Completed Epics: 7 (Epic 1-7)*
*Remaining Epics: 5 (Epic 8-12)*
