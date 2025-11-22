# Testing Framework Quick Start

**Last Updated:** 2025-11-22
**Status:** Operational (Story 2.3 Complete)

Quick reference for running tests in Boletapp using the three-tier testing framework.

---

## Quick Start (3 Steps)

### 1. Run Unit Tests (Fastest - ~400ms)

```bash
npm run test:unit
```

**What it does:** Runs all unit tests using Vitest with happy-dom environment.

**Example output:**
```
✓ tests/unit/smoke.test.ts (4 tests) 4ms
  Test Files: 1 passed (1)
  Tests: 4 passed (4)
  Duration: 413ms
```

### 2. Run Integration Tests (~500ms)

```bash
npm run test:integration
```

**What it does:** Runs React component tests using React Testing Library.

**Example output:**
```
✓ tests/integration/smoke.test.tsx (3 tests) 26ms
  Test Files: 1 passed (1)
  Tests: 3 passed (3)
  Duration: 499ms
```

### 3. Run E2E Tests (Slowest - ~60s)

```bash
npm run test:e2e
```

**What it does:** Launches Playwright, starts dev server, runs browser tests.

**Note:** First run takes longer as it starts the Vite dev server.

---

## Common Test Commands

| Command | Description | Speed | Use When |
|---------|-------------|-------|----------|
| `npm run test` | Run Vitest in watch mode | Interactive | Developing/debugging |
| `npm run test:unit` | Unit tests only | Fast (~400ms) | Testing utilities/services |
| `npm run test:integration` | Integration tests only | Medium (~500ms) | Testing components |
| `npm run test:e2e` | E2E tests only | Slow (~60s) | Testing user workflows |
| `npm run test:all` | All tests sequentially | Slow (~90s) | Pre-commit validation |
| `npm run test:coverage` | Tests + coverage report | Medium (~2s) | Checking code coverage |

---

## Running Specific Tests

### Run a Single Test File

```bash
# Unit test
npx vitest run tests/unit/utils/currency.test.ts

# Integration test
npx vitest run tests/integration/auth-flow.test.tsx

# E2E test
npx playwright test tests/e2e/login.spec.ts
```

### Run Tests in Watch Mode

```bash
# All tests
npm run test

# Specific directory
npx vitest tests/unit
```

### Run Tests with UI

```bash
npx vitest --ui
```

Opens interactive test UI at http://localhost:51204

---

## Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

**Output locations:**
- Terminal: Summary table
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`

### View Coverage Report

```bash
npm run test:coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### Coverage Thresholds

Current baseline (no enforcement):
- Critical paths (auth, CRUD): 80%+ target
- Business logic (utils, services): 70%+ target
- UI components: 60%+ target
- Overall project: 70%+ target

---

## Firebase Emulator Integration

### Start Emulators

```bash
npm run emulators
```

**Opens:**
- Emulator UI: http://localhost:4000
- Firestore: localhost:8080
- Auth: localhost:9099

### Reset Test Data

```bash
npm run test:reset-data
```

Resets Firestore emulator to fixture data for 3 test users.

### View Test Data

```bash
npm run test:view-data
```

Displays current test data in emulator.

---

## Test Environment

### Test Users (Emulator)

1. **admin@boletapp.test**
   - UID: `test-admin-uid`
   - Transactions: 0

2. **test-user-1@boletapp.test**
   - UID: `test-user-1-uid`
   - Transactions: 10 (fixtures)

3. **test-user-2@boletapp.test**
   - UID: `test-user-2-uid`
   - Transactions: 8 (fixtures)

### Environment Variables (Automatic)

Tests automatically connect to emulators via `vitest.setup.ts`:
```typescript
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

---

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/utils/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../../src/utils/currency';

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });
});
```

### Integration Test Example

```typescript
// tests/integration/auth-flow.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../setup/test-utils';
import { LoginScreen } from '../../src/views/LoginScreen';

describe('Login Flow', () => {
  it('should render login button', () => {
    render(<LoginScreen onLogin={() => {}} />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('should display login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText('Sign in');
});
```

---

## Debugging Tests

### Debug in VS Code

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

**Playwright Screenshots (on failure):**
- Location: `test-results/`

**Playwright HTML Report:**
```bash
npx playwright show-report
```

---

## Troubleshooting

### Tests Fail with "ECONNREFUSED"

**Problem:** Emulators not running

**Solution:**
```bash
npm run emulators
# In separate terminal:
npm run test:integration
```

### Playwright Times Out

**Problem:** Dev server not starting

**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
webServer: {
  timeout: 120000, // 2 minutes
}
```

### Coverage Report Empty

**Problem:** Wrong coverage provider

**Solution:** Verify `vite.config.ts` uses `v8` provider:
```typescript
coverage: {
  provider: 'v8',
}
```

### Tests Pass Locally, Fail in CI

**Problem:** Environment differences

**Solution:** Check that emulators start in CI workflow.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:all
```

---

## Next Steps

1. **For detailed patterns:** See [Testing Guide](./testing-guide.md)
2. **For test environment setup:** See [Test Environment Guide](./test-environment.md)
3. **For test strategy:** See [Test Strategy & Risk Register](./test-strategy.md)

---

## Testing Framework Stack

| Layer | Technology | Version | Config File |
|-------|-----------|---------|-------------|
| **Unit Tests** | Vitest | 4.0.13 | [vite.config.ts](../../vite.config.ts) |
| **Integration Tests** | React Testing Library | 16.3.0 | [test-utils.tsx](../../tests/setup/test-utils.tsx) |
| **E2E Tests** | Playwright | 1.56.1 | [playwright.config.ts](../../playwright.config.ts) |
| **Coverage** | @vitest/coverage-v8 | 4.0.13 | [vite.config.ts](../../vite.config.ts) |
| **Emulators** | Firebase | 10.14.1 | [firebase.json](../../firebase.json) |

---

**Quick Start Tip:** Run `npm run test:all` before every commit to catch regressions early!
