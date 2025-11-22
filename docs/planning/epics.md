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
