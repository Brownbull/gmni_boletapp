# Story 18-6: Statement Scanning End-to-End Integration and E2E Test

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by running the first full delivery -- statement in, transactions saved, analytics updated"

## Story
As a user, I want the complete statement scanning flow to work end-to-end (select mode, capture, process, review, save), so that I can rely on it for my monthly credit card statements.

## Acceptance Criteria

### Functional
- **AC-1:** Given the full flow (FAB -> statement mode -> capture -> process -> review -> save), when completed, then all saved transactions appear in history and analytics
- **AC-2:** Given saved statement transactions, when viewed in analytics, then they contribute to spending totals and category breakdowns
- **AC-3:** Given a scan credit is consumed per statement scan, when statement is processed, then credit balance decreases by 1
- **AC-4:** Given E2E test covers the happy path, when run on staging, then the test passes

### Architectural
- **AC-ARCH-PATTERN-1:** E2E follows conventions in `tests/e2e/E2E-TEST-CONVENTIONS.md`
- **AC-ARCH-PATTERN-2:** Test data cleanup in afterAll
- **AC-ARCH-NO-1:** No `waitForTimeout` > 3000ms
- **AC-ARCH-NO-2:** No `networkidle` (Firebase WebSocket)

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| E2E test | `tests/e2e/statement-scanning.spec.ts` | Playwright | NEW |
| Test fixtures | `tests/e2e/fixtures/statement-sample.jpg` | Test data | NEW |

## Tasks

### Task 1: Integration Smoke Test (2 subtasks)
- [ ] 1.1: Manually test full flow on staging: FAB -> statement -> capture -> process -> review -> save
- [ ] 1.2: Verify saved transactions in history view and analytics drill-down

### Task 2: Write E2E Test (3 subtasks)
- [ ] 2.1: E2E happy path: select statement mode, upload test statement image, wait for extraction, review, save
- [ ] 2.2: Verify saved transactions appear in history
- [ ] 2.3: Clean up test data in afterAll

### Task 3: Edge Case Coverage (2 subtasks)
- [ ] 3.1: Test: statement with 0 extractable transactions -- verify helpful error message
- [ ] 3.2: Test: cancel during processing -- verify clean state reset

### Task 4: Verification (1 subtask)
- [ ] 4.1: Run `npm run test:e2e:staging` -- statement test passes

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 8
- **Files:** ~2

## Dependencies
- **18-2 through 18-5** (all statement components must be built)
- Requires staging deployment (Epic 16, story 16-9)

## Risk Flags
- E2E_TESTING (full flow test)

## Dev Notes
- E2E tests run serially, never parallel (shared staging data)
- Use a pre-prepared test statement image as fixture -- don't rely on real bank data
- The test statement should have 3-5 recognizable transactions for assertion
- Statement E2E will be slower than receipt E2E due to multi-transaction extraction. Budget 30s timeout for processing step.
- Selector priority: data-testid > getByRole > scoped text
