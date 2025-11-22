# Story 2.3: Testing Framework Configuration

Status: review

## Story

As a developer,
I want automated testing frameworks configured and operational,
So that I can write and run unit, integration, and E2E tests efficiently.

## Requirements Context

**Epic:** Testing Infrastructure & Documentation (Epic 2)

**Story Scope:**
This story configures the three-tier testing framework (Vitest for unit tests, React Testing Library for integration tests, Playwright for E2E tests) with Firebase emulator integration and code coverage reporting. This establishes the foundation for all test implementation in Stories 2.4 and 2.5.

**Key Requirements:**
- Install and configure Vitest with TypeScript support
- Install and configure React Testing Library with custom utilities
- Install and configure Playwright for E2E testing
- Integrate Firebase emulator for test isolation
- Configure code coverage reporting (c8)
- Create smoke tests to validate each framework

[Source: docs/epic-2-tech-spec.md § Testing Framework Stack]
[Source: docs/epics.md § Story 2.3]

## Acceptance Criteria

**AC #1:** Vitest installed and configured with TypeScript support
- Verification: Run `npm run test:unit`, verify smoke test passes
- Source: Story 2.3 from epics.md

**AC #2:** React Testing Library installed with custom render utilities
- Verification: Verify test-utils.tsx exists with custom render function
- Source: Story 2.3 from epics.md

**AC #3:** Playwright installed and configured for E2E testing (Chromium browser)
- Verification: Run `npm run test:e2e`, verify smoke test passes
- Source: Story 2.3 from epics.md

**AC #4:** Firebase emulator integration working in tests (`@firebase/rules-unit-testing`)
- Verification: Smoke test connects to emulator, writes/reads data successfully
- Source: Story 2.3 from epics.md

**AC #5:** Test scripts added to package.json (`test:unit`, `test:e2e`, `test:all`)
- Verification: All scripts run without errors
- Source: Story 2.3 from epics.md

**AC #6:** Sample smoke test passing for each framework (1 unit test, 1 integration test, 1 E2E test)
- Verification: All 3 smoke tests pass
- Source: Story 2.3 from epics.md

**AC #7:** Code coverage reporting configured (Istanbul/c8)
- Verification: Run `npm run test:coverage`, verify HTML report generated
- Source: Story 2.3 from epics.md

## Tasks / Subtasks

### Task 1: Install Testing Dependencies (AC: #1, #2, #3, #4, #7)
- [x] Install Vitest: `npm install --save-dev vitest @vitest/ui happy-dom`
- [x] Install React Testing Library: `npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [x] Install Playwright: `npm install --save-dev @playwright/test`
- [x] Install Playwright browsers: `npx playwright install chromium`
- [x] Install Firebase testing: `npm install --save-dev @firebase/rules-unit-testing`
- [x] Install coverage tool: `npm install --save-dev c8`
- [x] Install tsx for TypeScript execution: `npm install --save-dev tsx`
- [x] Verify all dependencies in package.json

### Task 2: Configure Vitest (AC: #1, #7)
- [x] Update `vite.config.ts` to add Vitest configuration
- [x] Add test environment: `environment: 'happy-dom'`
- [x] Add setup file: `setupFiles: './tests/setup/vitest.setup.ts'`
- [x] Configure coverage with c8: exclude tests/ and scripts/
- [x] Create `tests/setup/vitest.setup.ts`
- [x] Import @testing-library/jest-dom for custom matchers
- [x] Test Vitest: Create simple smoke test in `tests/unit/smoke.test.ts`

### Task 3: Configure React Testing Library (AC: #2)
- [x] Create `tests/setup/test-utils.tsx`
- [x] Create custom render function with providers (if needed)
- [x] Export all RTL utilities
- [x] Create smoke test in `tests/integration/smoke.test.tsx`

### Task 4: Configure Playwright (AC: #3)
- [x] Create `playwright.config.ts`
- [x] Set base URL: `http://localhost:5173`
- [x] Configure Chromium only (for speed)
- [x] Set test directory: `testDir: './tests/e2e'`
- [x] Configure screenshots on failure
- [x] Create smoke test in `tests/e2e/smoke.spec.ts`

### Task 5: Configure Firebase Emulator Integration (AC: #4)
- [x] Create `tests/setup/firebase-emulator.ts`
- [x] Add helper to connect to emulator
- [x] Add helper to clear emulator data between tests
- [x] Update vitest.setup.ts to connect to emulator
- [x] Test integration: Write/read data in smoke test

### Task 6: Add Test Scripts to package.json (AC: #5)
- [x] Add `"test": "vitest"`
- [x] Add `"test:unit": "vitest run tests/unit"`
- [x] Add `"test:integration": "vitest run tests/integration"`
- [x] Add `"test:e2e": "playwright test"`
- [x] Add `"test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"`
- [x] Add `"test:coverage": "vitest run --coverage"`
- [x] Test all scripts

### Task 7: Create Smoke Tests (AC: #6)
- [x] Unit smoke test: Test simple utility function
- [x] Integration smoke test: Test component renders
- [x] E2E smoke test: Test app loads
- [x] Verify all 3 smoke tests pass

### Task 8: Documentation and Validation (AC: All)
- [x] Create `docs/testing-guide.md`
- [x] Document test patterns and best practices
- [x] Document how to write unit tests
- [x] Document how to write integration tests
- [x] Document how to write E2E tests
- [x] Update Epic 2 evolution document with Story 2.3 completion

## Story Dependencies

**Prerequisites:**
- ✅ Story 2.2 completed (test environment ready)
- Firebase emulators configured

**Enables:**
- Story 2.4 (Authentication & Security Tests)
- Story 2.5 (Core Workflow Tests)

## Dev Agent Record

### Debug Log
- Installed all testing dependencies successfully
- Configured Vitest with happy-dom environment and v8 coverage
- Created custom React Testing Library utilities with provider wrapper
- Configured Playwright for E2E testing (Chromium only)
- Created Firebase emulator integration helpers
- Added 6 test scripts to package.json
- Created 3 smoke tests (unit, integration, E2E)
- Created comprehensive testing guide documentation (400+ lines)
- Updated Epic 2 evolution document with completion details
- Fixed coverage provider: Updated from c8 to @vitest/coverage-v8 for Vitest 4.x compatibility

### Completion Notes
Successfully configured complete three-tier testing infrastructure:
- **Unit Tests:** Vitest with TypeScript support and happy-dom environment
- **Integration Tests:** React Testing Library with custom render utilities
- **E2E Tests:** Playwright configured for Chromium with automatic dev server startup
- **Firebase Integration:** Emulator utilities for isolated testing
- **Coverage:** @vitest/coverage-v8 provider configured with HTML/JSON/text reporting
- **Documentation:** Comprehensive testing guide covering all patterns and best practices

**Key Challenges Resolved:**
1. @firebase/rules-unit-testing version compatibility - v5.x requires Firebase 12.x but project uses Firebase 10.14.1. Resolved by installing compatible v3.0.2.
2. Coverage provider compatibility - Vitest 4.x requires @vitest/coverage-v8 instead of standalone c8 package. Installed @vitest/coverage-v8 and updated vite.config.ts to use 'v8' provider.

## File List
- vite.config.ts (modified)
- tests/setup/vitest.setup.ts (created)
- tests/setup/test-utils.tsx (created)
- tests/setup/firebase-emulator.ts (created)
- tests/unit/smoke.test.ts (created)
- tests/integration/smoke.test.tsx (created)
- tests/e2e/smoke.spec.ts (created)
- playwright.config.ts (created)
- package.json (modified)
- docs/testing/testing-guide.md (created)
- docs/sprint-artifacts/epic2/epic-2-evolution.md (modified)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Story created from Epic 2 planning | Senior Dev (Charlie) |
| 2025-11-22 | Configured three-tier testing framework with Vitest, React Testing Library, and Playwright | Dev Agent (AI) |
| 2025-11-22 | Created Firebase emulator integration utilities and smoke tests | Dev Agent (AI) |
| 2025-11-22 | Fixed coverage provider: Updated to @vitest/coverage-v8 for Vitest 4.x compatibility | Dev Agent (AI) |
| 2025-11-22 | Created comprehensive testing guide documentation (400+ lines) | Dev Agent (AI) |
| 2025-11-22 | Story marked ready for review - all ACs satisfied | Dev Agent (AI) |

---

**Story Points:** 3
**Epic:** Testing Infrastructure & Documentation (Epic 2)
**Status:** review
