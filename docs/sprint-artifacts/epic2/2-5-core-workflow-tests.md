# Story 2.5: Core Workflow Tests

Status: todo

## Story

As a QA engineer,
I want automated tests for core user workflows,
So that critical features are protected from regressions and bugs are caught early.

## Requirements Context

**Epic:** Testing Infrastructure & Documentation (Epic 2)

**Story Scope:**
This story implements MEDIUM and HIGH risk workflow tests: transaction CRUD, receipt scanning, trend analytics, and form validation. These tests protect core application functionality and catch regressions before deployment. Complements Story 2.4's security focus with feature-level testing.

**Key Requirements:**
- Implement 8+ transaction CRUD tests (create, read, update, delete)
- Implement 6+ receipt scanning tests (with mocked Gemini API)
- Implement 5+ trend analytics tests (calculations accuracy)
- Implement 4+ form validation tests (input validation)
- Achieve 70%+ test coverage for services and hooks
- All 23+ MEDIUM/HIGH risk tests must pass

[Source: docs/test-strategy.md § MEDIUM Risk Tests]
[Source: docs/epic-2-tech-spec.md § Test Prioritization]
[Source: docs/epics.md § Story 2.5]

## Acceptance Criteria

**AC #1:** Transaction CRUD tests implemented (create, read, update, delete) - 8+ test cases
- Verification: Run tests, verify 8+ CRUD tests pass
- Source: Story 2.5 from epics.md

**AC #2:** Receipt scanning tests implemented (image upload, Gemini API, data extraction) - 6+ test cases
- Verification: Run tests, verify 6+ scanning tests pass with mocked Gemini API
- Source: Story 2.5 from epics.md

**AC #3:** Trend analytics tests implemented (monthly totals, category breakdown) - 5+ test cases
- Verification: Run tests, verify 5+ analytics tests pass
- Source: Story 2.5 from epics.md

**AC #4:** Form validation tests implemented (required fields, numeric validation) - 4+ test cases
- Verification: Run tests, verify 4+ validation tests pass
- Source: Story 2.5 from epics.md

**AC #5:** All MEDIUM/HIGH risk workflow tests passing (23+ tests total)
- Verification: Run `npm run test:all`, verify all workflow tests pass
- Source: Story 2.5 from epics.md

**AC #6:** Test coverage for services and hooks at 70%+
- Verification: Run `npm run test:coverage`, check coverage for src/services/ and src/hooks/
- Source: Story 2.5 from epics.md

## Tasks / Subtasks

### Task 1: Transaction CRUD Tests (AC: #1)
- [ ] Create `tests/integration/crud-operations.test.tsx`
- [ ] Test 1: Create transaction manually
- [ ] Test 2: Create transaction from scanned receipt
- [ ] Test 3: Read transaction list
- [ ] Test 4: Read single transaction by ID
- [ ] Test 5: Update transaction fields
- [ ] Test 6: Delete transaction
- [ ] Test 7: Transactions filtered by date range
- [ ] Test 8: Transactions sorted correctly
- [ ] Use Firebase emulator for all tests
- [ ] Verify all 8 tests pass

### Task 2: Receipt Scanning Tests (AC: #2)
- [ ] Create `tests/unit/services/gemini.test.ts`
- [ ] Mock Gemini API responses using fixtures
- [ ] Test 1: Image upload preprocesses correctly
- [ ] Test 2: Gemini API called with correct payload
- [ ] Test 3: OCR result parsed successfully
- [ ] Test 4: Transaction fields extracted (date, total, category)
- [ ] Test 5: Error handling for invalid images
- [ ] Test 6: Error handling for Gemini API failures
- [ ] Create E2E test in `tests/e2e/receipt-scanning.spec.ts`
- [ ] Verify all 6 tests pass

### Task 3: Trend Analytics Tests (AC: #3)
- [ ] Create `tests/integration/analytics.test.tsx`
- [ ] Test 1: Monthly total calculations accurate
- [ ] Test 2: Category breakdown percentages correct
- [ ] Test 3: Date range filtering works
- [ ] Test 4: Handling of empty data (no transactions)
- [ ] Test 5: Handling of single transaction edge case
- [ ] Use test fixtures for predictable data
- [ ] Verify all 5 tests pass

### Task 4: Form Validation Tests (AC: #4)
- [ ] Create `tests/integration/form-validation.test.tsx`
- [ ] Test 1: Required field validation (date, total, category)
- [ ] Test 2: Numeric validation for amounts
- [ ] Test 3: Date format validation
- [ ] Test 4: Category selection validation
- [ ] Use React Testing Library for form interactions
- [ ] Verify all 4 tests pass

### Task 5: E2E Workflow Tests (AC: #5)
- [ ] Create `tests/e2e/transaction-management.spec.ts`
- [ ] Test complete CRUD workflow end-to-end
- [ ] Create `tests/e2e/analytics.spec.ts`
- [ ] Test complete analytics workflow
- [ ] Verify E2E tests pass

### Task 6: Coverage and Validation (AC: #5, #6)
- [ ] Run all tests: `npm run test:all`
- [ ] Verify 23+ tests pass
- [ ] Run coverage: `npm run test:coverage`
- [ ] Check coverage for:
  - [ ] src/services/firestore.ts (target: 70%+)
  - [ ] src/services/gemini.ts (target: 70%+)
  - [ ] src/hooks/useTransactions.ts (target: 70%+)
  - [ ] src/utils/*.ts (target: 70%+)
- [ ] Fix any failing tests
- [ ] Update Epic 2 evolution document with Story 2.5 completion

## Dev Notes

**Mocking Gemini API:**
- Create fixture responses in `tests/fixtures/gemini-responses.json`
- Mock at service level, not network level
- Test both success and error scenarios

**Test Data Management:**
- Use reset script before E2E tests
- Use fresh data for each integration test
- Clean up after each test

**From Test Strategy:**
- Transaction CRUD: Risk Level MEDIUM, Priority 3
- Receipt Scanning: Risk Level HIGH, Priority 2
- Trend Analytics: Risk Level MEDIUM, Priority 3
- Form Validation: Risk Level MEDIUM, Priority 4

## Story Dependencies

**Prerequisites:**
- ✅ Story 2.3 completed (testing frameworks configured)
- Firebase emulator running
- Test data fixtures available

**Can Run in Parallel With:**
- Story 2.4 (Authentication & Security Tests) - Independent work streams

**Enables:**
- Story 2.6 (CI/CD Pipeline) - Needs passing tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Story created from Epic 2 planning | QA Engineer (Dana) |

---

**Story Points:** 5
**Epic:** Testing Infrastructure & Documentation (Epic 2)
**Status:** todo
