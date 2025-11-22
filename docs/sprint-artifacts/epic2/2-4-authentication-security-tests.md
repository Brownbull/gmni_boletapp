# Story 2.4: Authentication & Security Tests

Status: todo

## Story

As a security engineer,
I want comprehensive tests for authentication flows and data isolation,
So that user data is protected and security vulnerabilities are prevented.

## Requirements Context

**Epic:** Testing Infrastructure & Documentation (Epic 2)

**Story Scope:**
This story implements all HIGH risk security tests identified in the Test Risk Register: authentication flows, data isolation, Firestore security rules, and data persistence. These tests protect critical user data and prevent security vulnerabilities. This is the highest priority test implementation in Epic 2.

**Key Requirements:**
- Implement 5+ authentication flow tests (login, logout, session persistence)
- Implement 3+ data isolation tests (tenant isolation validation)
- Implement 5+ Firestore security rules tests (using @firebase/rules-unit-testing)
- Implement 3+ data persistence tests (transactions persist across sessions)
- Achieve 80%+ test coverage for auth/security modules
- All 16+ HIGH risk tests must pass

[Source: docs/test-strategy.md § HIGH Risk Tests]
[Source: docs/epic-2-tech-spec.md § Test Prioritization]
[Source: docs/epics.md § Story 2.4]

## Acceptance Criteria

**AC #1:** Authentication flow tests implemented (Google OAuth login, logout, session persistence) - 5+ test cases
- Verification: Run tests, verify 5+ auth tests pass
- Source: Story 2.4 from epics.md

**AC #2:** Data isolation tests implemented (user-1 cannot access user-2 data) - 3+ test cases
- Verification: Run tests, verify 3+ isolation tests pass
- Source: Story 2.4 from epics.md

**AC #3:** Firestore security rules tests implemented using `@firebase/rules-unit-testing` - 5+ test cases
- Verification: Run tests, verify 5+ rules tests pass
- Source: Story 2.4 from epics.md

**AC #4:** Data persistence tests implemented (transactions persist across sessions) - 3+ test cases
- Verification: Run tests, verify 3+ persistence tests pass
- Source: Story 2.4 from epics.md

**AC #5:** All HIGH risk auth/security tests passing (16+ tests total)
- Verification: Run `npm run test:integration`, verify all security tests pass
- Source: Story 2.4 from epics.md

**AC #6:** Test coverage for auth/security modules at 80%+
- Verification: Run `npm run test:coverage`, check coverage for src/hooks/useAuth.ts, src/services/firestore.ts
- Source: Story 2.4 from epics.md

## Tasks / Subtasks

### Task 1: Authentication Flow Tests (AC: #1)
- [ ] Create `tests/integration/auth-flow.test.tsx`
- [ ] Test 1: User can sign in with Google OAuth
- [ ] Test 2: User can sign out successfully
- [ ] Test 3: Auth state persists across page refresh
- [ ] Test 4: Unauthenticated users cannot access protected routes
- [ ] Test 5: Auth errors display user-friendly messages
- [ ] Mock Firebase Auth where needed
- [ ] Verify all 5 tests pass

### Task 2: Data Isolation Tests (AC: #2)
- [ ] Create `tests/integration/data-isolation.test.ts`
- [ ] Test 1: User 1 cannot read User 2's transactions
- [ ] Test 2: User 1 cannot write to User 2's transaction collection
- [ ] Test 3: Cross-user queries return empty results
- [ ] Use test-user-1-uid and test-user-2-uid from test environment
- [ ] Verify all 3 tests pass

### Task 3: Firestore Security Rules Tests (AC: #3)
- [ ] Create `tests/integration/firestore-rules.test.ts`
- [ ] Import @firebase/rules-unit-testing
- [ ] Test 1: Unauthenticated users cannot read transactions
- [ ] Test 2: Unauthenticated users cannot write transactions
- [ ] Test 3: Authenticated users can only read own transactions
- [ ] Test 4: Authenticated users can only write own transactions
- [ ] Test 5: Security rules handle edge cases (null userId, malformed requests)
- [ ] Verify all 5 tests pass against firestore.rules

### Task 4: Data Persistence Tests (AC: #4)
- [ ] Create `tests/integration/data-persistence.test.tsx`
- [ ] Test 1: Transactions persist after page refresh
- [ ] Test 2: Real-time listeners update when data changes
- [ ] Test 3: Offline changes sync when back online (if supported)
- [ ] Use Firebase emulator for isolation
- [ ] Verify all 3 tests pass

### Task 5: Coverage and Validation (AC: #5, #6)
- [ ] Run all tests: `npm run test:integration`
- [ ] Verify 16+ tests pass
- [ ] Run coverage: `npm run test:coverage`
- [ ] Check coverage for:
  - [ ] src/hooks/useAuth.ts (target: 80%+)
  - [ ] src/services/firestore.ts (target: 80%+)
  - [ ] firestore.rules (validated via rules tests)
- [ ] Fix any failing tests
- [ ] Update Epic 2 evolution document with Story 2.4 completion

## Dev Notes

**Test Patterns:**
- Use Firebase emulator for all tests (no production data)
- Mock Google OAuth (don't require real Google login in tests)
- Use test-user-1-uid and test-user-2-uid from test environment
- Clean up test data between tests

**Security Test Checklist:**
- [ ] Tests cover authenticated scenarios
- [ ] Tests cover unauthenticated scenarios
- [ ] Tests validate tenant isolation
- [ ] Tests validate security rules enforcement
- [ ] Tests handle error cases gracefully

**From Test Strategy:**
- Authentication Flow: Risk Level HIGH, Priority 1
- Data Isolation: Risk Level HIGH, Priority 1
- Firestore Security Rules: Risk Level HIGH, Priority 1
- Data Persistence: Risk Level HIGH, Priority 2

## Story Dependencies

**Prerequisites:**
- ✅ Story 2.3 completed (testing frameworks configured)
- Firebase emulator running
- Test users created

**Can Run in Parallel With:**
- Story 2.5 (Core Workflow Tests) - Independent work streams

**Enables:**
- Story 2.6 (CI/CD Pipeline) - Needs passing tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Story created from Epic 2 planning | Security Engineer (Dana) |

---

**Story Points:** 5
**Epic:** Testing Infrastructure & Documentation (Epic 2)
**Status:** todo
