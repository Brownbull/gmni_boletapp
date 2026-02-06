# Testing Guide - BoletApp

**Version:** 4.0
**Last Updated:** 2026-02-05
**Status:** Active
**Total Tests:** ~3,200+

---

## Overview

BoletApp employs a multi-layered testing strategy with ~3,200+ tests across 200+ test files. The testing pyramid follows industry best practices:

```
                    +----------+
                    |   E2E    |  7 specs - User journeys (~50 tests)
                   -+----------+-
                  / |          | \
                 /  |Integrat. |  \  25 files - Service integration (~200 tests)
                /   |  Tests   |   \
              -/----+----------+----\-
             /      |          |      \
            /       |   Unit   |       \  170 files - Isolated logic (~3,000 tests)
           /        |  Tests   |        \
          ----------+----------+----------
```

### Testing Framework Stack

| Layer | Technology | Version | Config File |
|-------|-----------|---------|-------------|
| **Unit Tests** | Vitest | 4.0.13 | `vite.config.ts` / `vitest.config.unit.ts` |
| **Integration Tests** | React Testing Library | 16.3.0 | `tests/setup/test-utils.tsx` |
| **E2E Tests** | Playwright | 1.56.1 | `playwright.config.ts` |
| **Coverage** | @vitest/coverage-v8 | 4.0.13 | `vite.config.ts` |
| **Security Rules** | @firebase/rules-unit-testing | -- | `tests/integration/` |
| **Accessibility** | @axe-core/playwright | -- | `tests/e2e/accessibility.spec.ts` |
| **Performance** | playwright-lighthouse | -- | `tests/e2e/lighthouse.spec.ts` |
| **Emulators** | Firebase | 10.14.1 | `firebase.json` |
| **Security Lint** | ESLint Security | -- | `eslint.config.security.mjs` |

---

## Quick Start

### Prerequisites

```bash
npm install             # Install dependencies
npm run emulators       # Start Firebase Emulators (required for integration tests)
```

The emulators start on: Firestore `localhost:8080`, Auth `localhost:9099`, UI `localhost:4000`.

### Tiered Test Commands

| Command | Duration | Use When |
|---------|----------|----------|
| `npm run test:quick` | ~35s | During development, after each task |
| `npm run test:story` | ~2min | Before marking story as "review" |
| `npm run test:sprint` | ~5min | End of epic, before deployment |

```bash
# Tiered testing (fastest to most comprehensive)
npm run test:quick      # TypeScript + parallel unit tests (~35s)
npm run test:story      # Quick + integration tests (~2min)
npm run test:sprint     # Full suite: unit + integration + E2E (~5min)

# Individual test types
npm run test:unit              # Unit tests only (sequential)
npm run test:unit:parallel     # Unit tests with parallelization
npm run test:integration       # Integration tests only
npm run test:e2e               # E2E tests only
npm run test:all               # All tests sequentially

# Development utilities
npm test                       # Watch mode (useful during development)
npm run test:coverage          # Tests + coverage report

# Specialized tests
npm run test:accessibility     # Accessibility tests
npm run test:lighthouse        # Lighthouse performance tests
npm run security:lint          # Security static analysis
```

### Running Specific Tests

```bash
# Single file
npx vitest run tests/unit/utils/currency.test.ts
npx vitest run tests/integration/auth-flow.test.tsx
npx playwright test tests/e2e/login.spec.ts

# Watch mode on directory
npx vitest tests/unit

# Interactive UI
npx vitest --ui    # Opens at http://localhost:51204
```

---

## Writing Unit Tests

Unit tests verify individual functions, utilities, and isolated logic without rendering components or making network calls.

**Location:** `tests/unit/` (170 files, ~3,000 tests)

### Example: Testing Utility Functions

```typescript
// tests/unit/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../../src/utils/currency';

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should handle zero correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});
```

### Mocking Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { analyzeReceipt } from '../../../src/services/gemini';

vi.mock('../../../src/services/gemini', () => ({
  analyzeReceipt: vi.fn().mockResolvedValue({
    merchant: 'Test Store',
    total: 100.00,
    items: [],
  }),
}));

describe('Receipt Analysis', () => {
  it('should return structured data from Gemini', async () => {
    const result = await analyzeReceipt(['base64image'], 'USD');
    expect(result).toHaveProperty('merchant');
    expect(result).toHaveProperty('total');
  });
});
```

### Common Pitfalls

#### Pitfall 1: Default Array/Object Parameters Cause Infinite Loops

In JavaScript, `[] !== []` because each creates a new reference. When used as a default parameter, every render creates a new array, triggering useEffect dependencies infinitely.

```typescript
// BAD: Creates new array reference on every render
const MyComponent = ({ items = [] }) => { ... }

// GOOD: Use a stable constant for default arrays/objects
const EMPTY_ITEMS: Item[] = [];
const MyComponent = ({ items = EMPTY_ITEMS }) => { ... }
```

**In tests:** Provide stable references in test props:
```typescript
const STABLE_EMPTY_ARRAY: never[] = [];
const defaultProps = { items: STABLE_EMPTY_ARRAY };
```

#### Pitfall 2: setTimeout in Components Causes Test Hangs

```typescript
describe('DialogComponent', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('should render dialog', () => {
    render(<DialogComponent isOpen={true} />);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

**Important:** When using fake timers, use `fireEvent` instead of `userEvent` for clicks/interactions.

#### Pitfall 3: useMemo Dependencies in useEffect Cause Infinite Loops

Using a `useMemo` result as a `useEffect` dependency can cause infinite loops if the effect calls `setState`. Use a ref to track when source data actually changes:

```typescript
const prevProcessingResultsRef = useRef(processingResults);

useEffect(() => {
  if (processingResults !== prevProcessingResultsRef.current) {
    prevProcessingResultsRef.current = processingResults;
    setLocalReceipts(initialReceipts);
  }
}, [processingResults, initialReceipts]);
```

---

## Writing Integration Tests

Integration tests verify that React components render correctly and interact with each other properly.

**Location:** `tests/integration/` (25 files, ~200 tests)

### Example: Testing React Components

```typescript
import { render, screen } from '../setup/test-utils';
import userEvent from '@testing-library/user-event';

describe('EditView Component', () => {
  it('should update total when user types', async () => {
    const user = userEvent.setup();
    render(<EditView onSave={vi.fn()} />);

    const totalInput = screen.getByLabelText('Total');
    await user.clear(totalInput);
    await user.type(totalInput, '123.45');

    expect(totalInput).toHaveValue('123.45');
  });
});
```

### Best Practices

- **Use custom render from test-utils.tsx** - Wraps components with necessary providers
- **Query by role/label, not by implementation** - `getByRole('button')` not `querySelector('.btn')`
- **Wait for async updates** - Use `await waitFor()` for async state changes

---

## Writing E2E Tests

E2E tests verify complete user workflows in a real browser.

**Location:** `tests/e2e/` (7 spec files, ~50 tests)

### E2E Conventions

| Convention | Requirement |
|------------|-------------|
| Viewport | Always mobile: `{ width: 360, height: 780 }` |
| Timeout | 60-120s for journey tests |
| Screenshots | At each step: `fullPage: true` |
| Naming | `{story-id}-{step}-{description}.png` |
| Cleanup | Always delete test data at end |

### When to Write E2E vs Integration

| Scenario | Test Type | Reason |
|----------|-----------|--------|
| Form validation | Integration | Faster, no browser |
| API response handling | Integration | Mock responses |
| Multi-view workflow | E2E | Requires navigation |
| Data persistence check | E2E | Needs real/emulated DB |
| User authentication flow | E2E | Browser state required |

### E2E Anti-Patterns

```typescript
// BAD: Testing implementation details
await expect(page.locator('.internal-class')).toBeVisible();
// GOOD: Testing user-visible behavior via data-testid
await expect(page.locator('[data-testid="group-card-123"]')).toBeVisible();

// BAD: Arbitrary waits
await page.waitForTimeout(5000);
// GOOD: Wait for specific condition
await page.waitForSelector('[data-testid="grupos-view"]', { timeout: 10000 });

// BAD: No cleanup - test data left behind
// GOOD: Always cleanup at end of test
```

**Full E2E reference:** `tests/e2e/E2E-TEST-CONVENTIONS.md`

---

## Prompt Tests

**Total Tests:** 134
**Purpose:** AI prompt validation and versioning across 3 locations

| Location | Tests | Purpose |
|----------|-------|---------|
| `shared/prompts/__tests__/index.test.ts` | 62 | Core prompt library (active prompt, V1, V2, registry) |
| `prompt-testing/prompts/__tests__/index.test.ts` | 72 | V3 prompt with expanded categories (36 store, 39 item) |
| `functions/src/prompts/__tests__/index.test.ts` | SKIPPED | Module resolution issue; covered by above |

Key test areas: prompt retrieval, variable substitution, currency context, receipt type descriptions, complete prompt building, version compatibility (V1/V2/V3).

---

## Cloud Function Tests

**Location:** `functions/src/__tests__/` (2 files)

| File | Purpose | Key Tests |
|------|---------|-----------|
| `analyzeReceipt.test.ts` | Receipt analysis Cloud Function | Auth, input validation, Gemini API, response parsing, rate limiting |
| `imageProcessing.test.ts` | Image preprocessing | Compression, format validation, EXIF metadata, OCR preprocessing |

---

## Accessibility Tests

**Location:** `tests/e2e/accessibility.spec.ts`

Tests WCAG 2.1 Level AA compliance using axe-core scans across all major views. Focuses on critical/serious violations, keyboard navigation, ARIA labels, and both English/Spanish language support.

---

## Performance Tests

**Location:** `tests/e2e/lighthouse.spec.ts`

Uses Lighthouse CI for performance baselines: Performance > 50, Accessibility > 80, Best Practices > 80, SEO > 70.

---

## Testing with Firebase Emulators

Tests automatically connect to emulators via `vitest.setup.ts`:
```typescript
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

### Test Data Management

```bash
npm run test:reset-data    # Reset test data to fixtures
npm run test:view-data     # View current emulator data
npm run test:create-user   # One-time: create test user for E2E
```

### Security Rules Tests

Validates Firestore and Storage rules: user data isolation (`request.auth.uid == userId`), cross-user access blocked, unauthenticated access blocked, write validation, field-level security.

---

## Test Coverage

### Viewing Coverage Reports

```bash
npm run test:coverage
# Terminal output, HTML at coverage/index.html, JSON at coverage/coverage-final.json
```

### CI Enforcement Thresholds

| Metric | Threshold | Current |
|--------|-----------|---------|
| **Lines** | 45% | ~51% |
| **Branches** | 30% | ~38% |
| **Functions** | 25% | ~30% |
| **Statements** | 40% | ~46% |

### Coverage Targets by Code Type

| Code Type | Target Coverage | Notes |
|-----------|-----------------|-------|
| **Critical paths** (auth, data isolation) | 90%+ | Security-critical |
| **Utility functions** | 90%+ | Pure, easy to test |
| **Services** (Firestore, Gemini) | 80%+ | Business logic critical |
| **Hooks** | 70%+ | Integration tests preferred |
| **Components** (UI) | 60%+ | Focus on user interactions |
| **Types/constants** | 0% | Not testable code |

---

## What TO Test (High Value)

### Always Unit Test
- **Pure utility functions** (date/time, formatting, calculations, validation)
- **State machine logic** (Zustand store reducers, complex conditionals)
- **Data transformations** (normalization, type converters)

### Always Integration Test
- **Hooks with dependencies** (React Query, Firestore, Context)
- **Component + Store interactions**
- **Service layer with mocked Firebase**
- **Form validation flows**

### Always E2E Test
- **Critical user journeys** (login, scan transaction, view history)
- **Multi-step workflows** (create group, invite member, accept)
- **Data persistence verification**

---

## What NOT to Test (Low Value)

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| React component renders alone | React is tested by Meta | Integration test with user interaction |
| Firebase mock implementations | Testing the mock, not the code | Integration test with emulator |
| TypeScript types compile | TS compiler does this | Remove |
| Constants have correct values | Trivial | Remove |
| Implementation details (`mock.toHaveBeenCalled`) | Brittle, tests internals | Test behavior outcomes |
| 10+ assertions for one function | Over-testing | 2-3 assertions per test |

### Red Flags in Existing Tests

```typescript
// BAD: Testing mock was called (implementation detail)
expect(mockAddDoc).toHaveBeenCalledWith(
  expect.anything(),
  expect.objectContaining({ name: 'Test' })
);

// GOOD: Testing behavior outcome
const groups = await getUserGroups(userId);
expect(groups).toHaveLength(1);
expect(groups[0].name).toBe('Test');
```

---

## Test Writing Rules

### DRY in Tests

```typescript
// BAD: Repeated setup in every test
it('creates a group', async () => {
  const mockUser = { uid: 'user-1', email: 'test@test.com' };
  // ... test
});
it('validates name', async () => {
  const mockUser = { uid: 'user-1', email: 'test@test.com' };
  // ... test
});

// GOOD: Shared setup
const mockUser = createMockUser();
it('creates a group', async () => { /* uses mockUser */ });
it('validates name', async () => { /* uses mockUser */ });
```

### Test One Thing

```typescript
// BAD: Testing multiple behaviors in one test with 15 assertions
// GOOD: Focused tests
it('creates a group with owner as first member', async () => { /* 2 assertions */ });
it('rejects empty name', async () => { /* 1 assertion */ });
```

### Avoid Implementation Testing

```typescript
// BAD: Testing internal implementation
expect(mockAddDoc).toHaveBeenCalledWith(/* specific params */);

// GOOD: Testing observable behavior
await createGroup(userId, { name: 'Test' });
const groups = await getUserGroups(userId);
expect(groups).toContainEqual(expect.objectContaining({ name: 'Test' }));
```

---

## Test File Size Guidelines

| Test Type | Max Lines | Reasoning |
|-----------|-----------|-----------|
| Unit | 300 | Single module focus |
| Integration | 500 | Multiple modules |
| E2E | 400 | Journey-focused |

A test file needs review if: file exceeds 500 lines, test-to-source ratio > 2:1, > 50% mock setup code, or > 20 `toHaveBeenCalled` assertions.

---

## Review Checklist for New Tests

Before merging new tests, verify:

- [ ] Test file < 300 lines (unit) or < 500 lines (integration)
- [ ] No `toHaveBeenCalled` for simple pass-through functions
- [ ] Uses shared factories from `tests/helpers/`
- [ ] Tests behavior, not implementation
- [ ] < 5 assertions per test
- [ ] No duplicate mock setup (extracted to beforeEach)
- [ ] File named according to conventions

---

## CI/CD Pipeline

### Pipeline Structure

```
gitleaks (parallel) -------------------------------------------------+
setup --+---> test-unit-1 ----------+                                 |
        +---> test-unit-2 ----------+---> test-unit --+---> test -----+---> deploy
        +---> test-unit-3 ----------+                 |
        +---> test-coverage (PR only, non-blocking)   |
        +---> test-integration -----------------------+
        +---> test-e2e -------------------------------+
        +---> security --------------------------------
        +---> lighthouse (main push only)
```

### Job Timing Targets

| Job | Target | Max Allowed |
|-----|--------|-------------|
| gitleaks | ~10s | 5 min |
| setup | ~2 min | 10 min |
| test-unit (per shard) | ~3-5 min | 15 min |
| test-integration | ~1.5 min | 10 min |
| test-e2e | ~2.5 min | 15 min |
| security | ~2 min | 10 min |
| **Total Pipeline** | **~8 min** | **20 min** |

### Test Infrastructure Config Files

| File | Purpose |
|------|---------|
| `vitest.config.unit.ts` | Local unit test config (parallel, fast) |
| `vitest.config.ci.ts` | CI config (forks, memory-safe) |
| `playwright.config.ts` | E2E test config (baseURL `localhost:5174`) |
| `tests/setup/vitest.setup.ts` | Test initialization |
| `tests/setup/test-utils.tsx` | React Testing Library utilities |
| `tests/setup/firebase-emulator.ts` | Emulator setup |

---

## Debugging Tests

### Debug Vitest in VS Code

Add breakpoints and run:
```bash
npx vitest --inspect-brk
```
Then attach VS Code debugger (Node.js).

### Debug Playwright Tests

```bash
npx playwright test --debug
```
Opens Playwright Inspector for step-by-step debugging.

### View Test Artifacts

- **Playwright screenshots on failure:** `test-results/`
- **Playwright HTML report:** `npx playwright show-report`
- **Vitest UI:** `npx vitest --ui`

**Note:** BoletApp uses port 5174 for the dev server (not 5173) to avoid conflicts.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firestore emulator not running" | Run `npm run emulators` before tests |
| "Cannot find module" | Check TypeScript paths in `tsconfig.json` and `vite.config.ts` |
| E2E tests timeout | Increase timeout in `playwright.config.ts` |
| Coverage reports missing files | Check `coverage.exclude` in `vite.config.ts` |
| Playwright times out on startup | Increase `webServer.timeout` in `playwright.config.ts` |
| Coverage report empty | Verify `vite.config.ts` uses `provider: 'v8'` |
| Tests pass locally, fail in CI | Check emulators start in CI workflow |

---

## Known Issues & Technical Debt

| Issue | Impact | Status |
|-------|--------|--------|
| Shard 2 timeout | CI failures | Sub-story 14.30.2 created |
| Coverage job redundant | +14 min CI time | Sub-story 14.30.1 created |
| Memory accumulation | Flaky tests | Mitigated with forks pool |
| Firebase emulator restart per job | ~30s overhead per job | Sub-story 14.30.4 created |
| Prompt test in 3 locations | Maintenance burden | Sub-story 14.30.5 created |
| Functions module resolution | Skipped test file | Covered by shared tests |
| E2E coverage gaps | Analytics, insights not covered | Backlog |

---

## Next Steps

1. Run quick tests to verify setup: `npm run test:quick`
2. Read [Test Environment Guide](./test-environment.md) for test user management
3. Review [CONTRIBUTING.md](../../CONTRIBUTING.md) for coverage requirements
4. Start writing tests for your features!

---

**Related Documentation:**
- [Test Environment Guide](./test-environment.md) - Test users and data fixtures
- [E2E Test Conventions](../../tests/e2e/E2E-TEST-CONVENTIONS.md) - E2E patterns and standards
- [Architecture Document](../architecture/architecture.md) - System architecture
- [Development Guide](../development/development-guide.md) - Development setup
- [Performance Baselines](./performance-baselines.md) - Lighthouse baselines
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Coverage requirements
- [CI/CD Pipeline](../ci-cd/README.md) - Automated testing workflow

**Version History:**
- 4.0 (2026-02-05) - Consolidated testing-quickstart, testing-architecture, and TESTING-GUIDELINES into single guide
- 3.0 (2025-12-07) - Added tiered test strategy with parallel unit tests (Epic 7)
- 2.0 (2025-11-26) - Added accessibility testing, performance testing, coverage thresholds (Epic 3)
- 1.0 (2025-11-22) - Initial version (Epic 2, Story 2.3)
