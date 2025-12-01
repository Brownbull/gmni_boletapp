# Testing Guide - Boletapp

**Version:** 2.0
**Last Updated:** 2025-11-26 (Epic 3 Complete)
**Status:** Active

## Overview

This guide covers testing patterns and best practices for Boletapp's three-tier testing framework:

1. **Unit Tests** (Vitest) - Test pure functions and isolated components
2. **Integration Tests** (React Testing Library) - Test component interactions
3. **E2E Tests** (Playwright) - Test complete user workflows
4. **Accessibility Tests** (axe-core/Playwright) - Test WCAG 2.1 Level AA compliance (Epic 3)
5. **Performance Tests** (Lighthouse CI) - Test performance baselines (Epic 3)

## Testing Framework Stack

| Framework | Purpose | Files Location |
|-----------|---------|----------------|
| **Vitest** | Unit tests | `tests/unit/` |
| **React Testing Library** | Integration tests | `tests/integration/` |
| **Playwright** | E2E tests | `tests/e2e/` |
| **@firebase/rules-unit-testing** | Security rules tests | `tests/integration/` |
| **@axe-core/playwright** | Accessibility tests | `tests/e2e/accessibility.spec.ts` |
| **playwright-lighthouse** | Performance tests | `tests/e2e/lighthouse.spec.ts` |

## Quick Start

### Prerequisites

1. **Install Dependencies** (already done if you followed the development guide)
```bash
npm install
```

2. **Start Firebase Emulators** (required for integration tests)
```bash
npm run emulators
```

The emulators will start on:
- Firestore Emulator: `localhost:8080`
- Auth Emulator: `localhost:9099`
- Emulator UI: `localhost:4000`

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all E2E tests
npm run test:e2e

# Run all tests (unit + integration + E2E)
npm run test:all

# Run tests in watch mode (useful during development)
npm test

# Run tests with coverage report
npm run test:coverage

# Run accessibility tests (Epic 3)
npm run test:accessibility

# Run Lighthouse performance tests (Epic 3)
npm run test:lighthouse
```

## Writing Unit Tests

Unit tests verify individual functions, utilities, and isolated logic without rendering components or making network calls.

### Location
`tests/unit/`

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

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(1.999, 'USD')).toBe('$2.00');
  });
});
```

### Best Practices

- **Test pure functions first** - They're easiest to test and provide the most value
- **One concept per test** - Each `it()` should verify one specific behavior
- **Use descriptive test names** - "should X when Y" format
- **Test edge cases** - Zero, negative numbers, empty strings, null, undefined
- **Mock external dependencies** - Use `vi.mock()` to mock services, APIs, etc.

### Mocking Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { analyzeReceipt } from '../../../src/services/gemini';

// Mock the Gemini API
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

## Writing Integration Tests

Integration tests verify that React components render correctly and interact with each other properly.

### Location
`tests/integration/`

### Example: Testing React Components

```typescript
// tests/integration/CategoryBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../setup/test-utils';
import { CategoryBadge } from '../../src/components/CategoryBadge';

describe('CategoryBadge Component', () => {
  it('should render the category name', () => {
    render(<CategoryBadge category="Groceries" />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should apply correct color class for category', () => {
    const { container } = render(<CategoryBadge category="Groceries" />);
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });
});
```

### Testing User Interactions

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

- **Use custom render from test-utils.tsx** - It wraps components with necessary providers
- **Query by role/label, not by implementation** - `getByRole('button')` not `querySelector('.btn')`
- **Test user interactions** - Click, type, submit forms
- **Wait for async updates** - Use `await waitFor()` for async state changes
- **Test accessibility** - Ensure proper ARIA labels and roles

## Writing E2E Tests

E2E tests verify complete user workflows in a real browser, simulating actual user behavior.

### Location
`tests/e2e/`

### Example: Testing Login Flow

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with Google OAuth', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Click "Sign in with Google"
    await page.click('text=Sign in with Google');

    // Wait for redirect (in emulator, this is simplified)
    await page.waitForURL('**/dashboard');

    // Verify user is logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
```

### Testing Receipt Scanning Flow

```typescript
test('should scan receipt and create transaction', async ({ page }) => {
  // Login first
  await page.goto('/');
  await page.click('text=Sign in with Google');

  // Navigate to scan view
  await page.click('text=Scan');

  // Upload receipt image
  await page.setInputFiles('input[type="file"]', './tests/fixtures/receipt-images/sample-receipt.jpg');

  // Wait for AI analysis
  await page.waitForSelector('text=Merchant:');

  // Verify extracted data is displayed
  expect(await page.textContent('input[name="merchant"]')).toContain('Walmart');

  // Save transaction
  await page.click('text=Save');

  // Verify transaction appears in history
  await expect(page.locator('text=Walmart')).toBeVisible();
});
```

### Best Practices

- **Start tests from a clean state** - Reset database before each test
- **Use page.goto() sparingly** - Navigate using UI clicks when possible
- **Wait for elements, don't use arbitrary timeouts** - `await page.waitForSelector()`
- **Take screenshots on failure** - Configured automatically in playwright.config.ts
- **Test critical paths only** - E2E tests are slow, focus on HIGH risk workflows

## Writing Accessibility Tests (Epic 3)

Accessibility tests verify WCAG 2.1 Level AA compliance using automated axe-core scans.

### Location
`tests/e2e/accessibility.spec.ts`

### Example: Testing View Accessibility

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Dashboard view should have no critical/serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Authenticate via test login button
  await page.getByTestId('test-login-button').click();
  await page.waitForSelector('text=/Dashboard|Inicio/i', { timeout: 10000 });

  // Run axe scan
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = accessibilityScanResults.violations.filter(v => v.impact === 'critical');
  const serious = accessibilityScanResults.violations.filter(v => v.impact === 'serious');

  expect(critical).toEqual([]);
  expect(serious).toEqual([]);
});
```

### Test User Setup for Authenticated Tests

Create a test user in the Firebase Auth emulator:

```bash
npm run emulators  # Terminal 1
npm run test:create-user  # Terminal 2 (one-time setup)
```

This creates a test user (`khujta@gmail.com` / `password.123`) that the test login button uses.

### Best Practices

- **Test all major views** - Login, Dashboard, Scan, History, Trends, Settings
- **Focus on critical/serious violations** - Minor violations can be informational
- **Include keyboard navigation tests** - Ensure all interactive elements are accessible
- **Check ARIA labels** - All buttons, inputs, and interactive elements need labels
- **Test both languages** - App supports English and Spanish

## Writing Performance Tests (Epic 3)

Performance tests use Lighthouse CI to establish and monitor performance baselines.

### Location
`tests/e2e/lighthouse.spec.ts`

### Example: Testing View Performance

```typescript
// tests/e2e/lighthouse.spec.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test('Dashboard view should meet performance thresholds', async ({ page }) => {
  await page.goto('/');

  // Authenticate first
  await page.getByTestId('test-login-button').click();
  await page.waitForSelector('text=/Dashboard|Inicio/i');

  // Run Lighthouse audit
  const report = await playAudit({
    page,
    thresholds: {
      performance: 50,
      accessibility: 80,
      'best-practices': 80,
      seo: 70,
    },
    port: 9222,
  });

  expect(report.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(50);
});
```

### Best Practices

- **Use warn mode in CI** - Performance can vary, don't fail CI on minor drops
- **Track baselines over time** - Document baseline scores in [docs/performance/performance-baselines.md](../performance/performance-baselines.md)
- **Test on consistent hardware** - CI provides consistent environment
- **Focus on critical views** - Login, Dashboard, Scan are most important

## Testing with Firebase Emulators

### Setup

The test environment automatically connects to Firebase emulators via environment variables set in `vitest.setup.ts`:

```typescript
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

### Writing Firestore Tests

```typescript
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import {
  setupFirebaseEmulator,
  clearFirestoreData,
  teardownFirebaseEmulator,
  getAuthedFirestore,
  TEST_USERS,
  assertSucceeds,
  assertFails,
} from '../setup/firebase-emulator';

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    await setupFirebaseEmulator();
  });

  afterEach(async () => {
    await clearFirestoreData();
  });

  afterAll(async () => {
    await teardownFirebaseEmulator();
  });

  it('should allow users to read their own data', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);
    const docRef = db.collection('artifacts/boletapp-d609f/users/test-user-1-uid/transactions').doc('tx1');

    await assertSucceeds(docRef.get());
  });

  it('should deny users from reading other users data', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);
    const docRef = db.collection('artifacts/boletapp-d609f/users/test-user-2-uid/transactions').doc('tx1');

    await assertFails(docRef.get());
  });
});
```

### Test Data Management

Use the reset script to populate test data:

```bash
# Reset test data to fixtures
npm run test:reset-data

# View current emulator data
npm run test:view-data
```

## Test Coverage

### Viewing Coverage Reports

```bash
npm run test:coverage
```

This generates:
- **Terminal output** - Summary of coverage percentages
- **HTML report** - Open `coverage/index.html` in a browser
- **JSON report** - `coverage/coverage-final.json` for CI tools

### Coverage Thresholds (Epic 3)

Coverage thresholds are enforced in CI via `vite.config.ts`:

| Metric | Threshold | Current |
|--------|-----------|---------|
| **Lines** | 45% | ~51% |
| **Branches** | 30% | ~38% |
| **Functions** | 25% | ~30% |
| **Statements** | 40% | ~46% |

**Note:** Coverage below thresholds will cause CI to fail.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full coverage requirements.

### Coverage Goals

| Category | Target | Priority |
|----------|--------|----------|
| **Critical paths** (auth, data isolation, security) | 90%+ | HIGH |
| **Services** (Firestore, Gemini) | 80%+ | HIGH |
| **Utils** (pure functions) | 80%+ | MEDIUM |
| **Components** (UI) | 70%+ | MEDIUM |
| **Views** (pages) | 60%+ | LOW |

## Troubleshooting

### Tests fail with "Firestore emulator not running"

**Solution:** Start the emulators before running tests:
```bash
npm run emulators
```

### Tests fail with "Cannot find module"

**Solution:** Check that TypeScript paths are configured correctly in `tsconfig.json` and `vite.config.ts`.

### E2E tests timeout

**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60000, // 60 seconds
```

### Coverage reports missing files

**Solution:** Check `coverage.exclude` in `vite.config.ts` and ensure you're not excluding source files.

## Best Practices Summary

### General

- **Write tests before fixing bugs** - Reproduce the bug in a test first
- **Keep tests fast** - Mock slow operations (network, file I/O)
- **Make tests independent** - Each test should work in isolation
- **Use descriptive names** - "should X when Y" pattern
- **Follow AAA pattern** - Arrange, Act, Assert

### What to Test

✅ **DO test:**
- Business logic and calculations
- User interactions and workflows
- Error handling and edge cases
- Security rules and data isolation
- Critical user paths

❌ **DON'T test:**
- Third-party libraries (Firebase, React)
- Implementation details (internal state)
- Trivial getters/setters
- Generated code

## Next Steps

After reading this guide:

1. ✅ Review existing smoke tests in `tests/unit/smoke.test.ts`, `tests/integration/smoke.test.tsx`, `tests/e2e/smoke.spec.ts`
2. ✅ Run all tests to verify setup: `npm run test:all`
3. ✅ Read [Test Environment Guide](./test-environment.md) for test user management
4. ✅ Read [Test Strategy & Risk Register](./test-strategy.md) for test prioritization
5. ✅ Review [CONTRIBUTING.md](../../CONTRIBUTING.md) for coverage requirements
6. ✅ Start writing tests for your features!

---

**Related Documentation:**
- [Test Environment Guide](./test-environment.md) - Test users and data fixtures
- [Test Strategy & Risk Register](./test-strategy.md) - Risk analysis and test prioritization
- [Architecture Document](../architecture/architecture.md) - System architecture
- [Development Guide](../development/development-guide.md) - Development setup
- [Performance Baselines](../performance/performance-baselines.md) - Lighthouse baselines (Epic 3)
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Coverage requirements (Epic 3)
- [CI/CD Pipeline](../ci-cd/README.md) - Automated testing workflow

**Version History:**
- 2.0 (2025-11-26) - Added accessibility testing, performance testing, coverage thresholds (Epic 3)
- 1.0 (2025-11-22) - Initial version (Epic 2, Story 2.3)
