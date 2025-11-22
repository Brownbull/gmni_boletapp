# Story 2.6: CI/CD Pipeline & Coverage Baseline

Status: todo

## Story

As a DevOps engineer,
I want automated test execution in CI/CD pipeline with coverage reporting,
So that code quality is maintained and tests run on every commit.

## Requirements Context

**Epic:** Testing Infrastructure & Documentation (Epic 2)

**Story Scope:**
This story creates the GitHub Actions CI/CD pipeline that runs all tests on every commit and pull request. It integrates unit tests, integration tests, and E2E tests with the Firebase emulator, generates code coverage reports, and blocks PR merges if tests fail. This is the final story in Epic 2, completing the testing infrastructure.

**Key Requirements:**
- Create GitHub Actions workflow (.github/workflows/test.yml)
- Run tests on every push to main and all pull requests
- Execute unit, integration, and E2E tests sequentially
- Generate and upload code coverage reports
- Document test coverage baseline (70%+ for critical paths)
- Block PR merges if tests fail
- Complete workflow execution in <10 minutes

[Source: docs/epic-2-tech-spec.md § CI/CD Pipeline Design]
[Source: docs/epics.md § Story 2.6]

## Acceptance Criteria

**AC #1:** GitHub Actions workflow created (`.github/workflows/test.yml`)
- Verification: Workflow file exists in correct location
- Source: Story 2.6 from epics.md

**AC #2:** Workflow runs on every push to main and all pull requests
- Verification: Push test commit, verify workflow triggers
- Source: Story 2.6 from epics.md

**AC #3:** Workflow executes unit tests, integration tests, and E2E tests sequentially
- Verification: Check workflow logs, verify all test types run
- Source: Story 2.6 from epics.md

**AC #4:** Code coverage report generated and uploaded to GitHub Actions artifacts
- Verification: Check workflow artifacts, verify coverage report exists
- Source: Story 2.6 from epics.md

**AC #5:** Test coverage baseline documented (target: 70%+ for critical paths)
- Verification: README.md or docs/ contains coverage baseline metrics
- Source: Story 2.6 from epics.md

**AC #6:** Failed tests block PR merges (require passing tests)
- Verification: Create failing test, verify PR shows failing checks
- Source: Story 2.6 from epics.md

**AC #7:** Workflow execution time < 10 minutes
- Verification: Check workflow duration in GitHub Actions
- Source: Story 2.6 from epics.md

## Tasks / Subtasks

### Task 1: Create GitHub Actions Workflow (AC: #1, #2)
- [ ] Create `.github/workflows/` directory if not exists
- [ ] Create `.github/workflows/test.yml`
- [ ] Configure workflow trigger:
  - [ ] `on: [push, pull_request]`
  - [ ] Target branches: main
- [ ] Set workflow name: "Test Suite"
- [ ] Define job: `test` running on `ubuntu-latest`

### Task 2: Configure Workflow Steps (AC: #3)
- [ ] Step 1: Checkout code (`actions/checkout@v4`)
- [ ] Step 2: Setup Node.js 18 (`actions/setup-node@v4`)
- [ ] Step 3: Cache node_modules for faster builds
- [ ] Step 4: Install dependencies (`npm ci`)
- [ ] Step 5: Start Firebase emulators (background)
  - [ ] Use `firebase emulators:start --only auth,firestore &`
  - [ ] Wait for emulators to be ready
- [ ] Step 6: Run unit tests (`npm run test:unit`)
- [ ] Step 7: Run integration tests (`npm run test:integration`)
- [ ] Step 8: Start Vite dev server (background for E2E)
- [ ] Step 9: Run E2E tests (`npm run test:e2e`)
- [ ] Step 10: Generate coverage report (`npm run test:coverage`)

### Task 3: Configure Coverage Reporting (AC: #4)
- [ ] Add coverage upload step
- [ ] Upload HTML coverage report as artifact
- [ ] Upload lcov coverage for potential badge integration
- [ ] Set artifact retention period (30 days)

### Task 4: Configure PR Protection (AC: #6)
- [ ] Set `continue-on-error: false` for all test steps
- [ ] Verify workflow fails if any test fails
- [ ] Test with intentionally failing test

### Task 5: Optimize Workflow Performance (AC: #7)
- [ ] Use `npm ci` instead of `npm install` (faster, deterministic)
- [ ] Cache node_modules between runs
- [ ] Run unit and integration tests in parallel (if possible)
- [ ] Configure Playwright to use single worker (faster in CI)
- [ ] Measure execution time, target <10 minutes
- [ ] Document optimization decisions

### Task 6: Document Coverage Baseline (AC: #5)
- [ ] Run full test suite locally: `npm run test:all`
- [ ] Run coverage: `npm run test:coverage`
- [ ] Record baseline metrics:
  - [ ] Overall project coverage
  - [ ] Auth/security modules coverage
  - [ ] Services coverage
  - [ ] Hooks coverage
  - [ ] Utils coverage
- [ ] Add coverage section to README.md
- [ ] Document coverage targets:
  - [ ] Critical paths: 80%+ (auth, CRUD, AI)
  - [ ] Business logic: 70%+ (services, hooks, utils)
  - [ ] UI components: 60%+
  - [ ] Overall: 70%+
- [ ] Add coverage badge (optional)

### Task 7: Test and Validate (AC: All)
- [ ] Push test commit to feature branch
- [ ] Verify workflow triggers
- [ ] Verify all tests run successfully
- [ ] Verify coverage report uploaded
- [ ] Verify execution time <10 minutes
- [ ] Create test PR, verify status checks appear
- [ ] Intentionally break a test, verify PR blocked
- [ ] Fix test, verify PR unblocked
- [ ] Merge PR to main
- [ ] Verify workflow runs on main branch
- [ ] Update Epic 2 evolution document with Story 2.6 completion

## Dev Notes

**GitHub Actions Free Tier:**
- 2000 minutes/month for private repos
- Unlimited for public repos
- Target: <10 min per run = ~200 runs/month for private repos

**Workflow Optimization:**
- Use `npm ci` (clean install, faster than `npm install`)
- Cache node_modules with `actions/cache`
- Run tests sequentially to avoid Firebase emulator port conflicts
- Single Playwright worker in CI (parallel locally)

**Coverage Reporting:**
- c8 generates HTML, lcov, text formats
- Upload HTML as artifact for human review
- lcov format for potential coverage badges

**Firebase Emulator in CI:**
- Start emulators in background before tests
- Wait for emulators to be ready (curl health check)
- Kill emulators after tests complete

**Sample Workflow Structure:**
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run emulators &
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
```

## Story Dependencies

**Prerequisites:**
- ✅ Story 2.4 completed (auth/security tests passing)
- ✅ Story 2.5 completed (workflow tests passing)
- GitHub repository with Actions enabled
- All tests passing locally

**Completes Epic 2:**
- This is the final story in Epic 2
- Enables continuous quality assurance
- Prevents regressions from reaching production

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Story created from Epic 2 planning | DevOps (Charlie) |

---

**Story Points:** 2
**Epic:** Testing Infrastructure & Documentation (Epic 2)
**Status:** todo
