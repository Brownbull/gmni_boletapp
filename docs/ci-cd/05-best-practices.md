# Best Practices for CI/CD in React/TypeScript Projects

This guide covers industry best practices for CI/CD, specifically tailored for React/TypeScript applications like Boletapp.

## General Principles

### 1. Fast Feedback

**Goal:** Know if your code works within minutes, not hours.

**How to achieve:**
- ✅ Target <10 minute workflow execution
- ✅ Run fast tests first (unit → integration → E2E)
- ✅ Fail fast (stop on first error)
- ✅ Cache dependencies
- ✅ Run tests in parallel when possible

**Boletapp results:**
- Execution time: 3m 15s ✅
- Unit tests first: 500ms ✅
- Dependency caching: Saves ~80s ✅

### 2. Consistent Environments

**Goal:** "Works on my machine" should mean "works in CI."

**How to achieve:**
- ✅ Use same Node.js version everywhere
- ✅ Lock dependency versions (`package-lock.json`)
- ✅ Use `npm ci` not `npm install`
- ✅ Test with `CI=true` environment variable
- ✅ Document required environment variables

**Anti-patterns:**
- ❌ Different Node versions (local vs CI)
- ❌ `npm install` (can change versions)
- ❌ Missing `.nvmrc` file
- ❌ Undocumented env vars

### 3. Comprehensive Testing

**Goal:** Catch all types of bugs automatically.

**Testing pyramid:**
```
        /\
       /E2E\      ← Few (17 tests) - Slow, brittle, high value
      /------\
     /  INT  \    ← Some (40 tests) - Medium speed, medium value
    /--------\
   /   UNIT   \   ← Many (14 tests) - Fast, stable, foundational
  /------------\
```

**Coverage targets:**
- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: Happy paths + error cases

### 4. Immutable Build Artifacts

**Goal:** Build once, deploy everywhere.

**How to achieve:**
- ✅ Build creates deterministic output
- ✅ No environment-specific code in build
- ✅ Upload build artifacts
- ✅ Deploy artifacts, don't rebuild

**For Boletapp:**
```yaml
# Build step (runs once)
- name: Build
  run: npm run build

# Upload artifact
- uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/

# Deploy step (uses artifact)
- uses: actions/download-artifact@v4
  with:
    name: dist
- run: firebase deploy --only hosting
```

## React/TypeScript Specific

### TypeScript Configuration

**1. Strict Mode Enabled**

Always use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**2. Type Check in CI**

```yaml
- name: Type check
  run: npm run type-check
```

**Why:** Catches type errors before runtime.

### Linting and Formatting

**1. ESLint for Code Quality**

```yaml
- name: Lint
  run: npm run lint
```

**Recommended rules for React:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-script/recommended"
  ]
}
```

**2. Prettier for Formatting**

```yaml
- name: Check formatting
  run: npx prettier --check src/
```

**Auto-fix in pre-commit:**
```bash
npx prettier --write src/
```

### Build Optimization

**1. Tree Shaking**

Ensure unused code is removed:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth'],
        }
      }
    }
  }
});
```

**2. Bundle Analysis**

Check bundle size in CI:

```yaml
- name: Analyze bundle
  run: npm run build -- --mode=analyze

- name: Check bundle size
  run: |
    SIZE=$(du -sh dist/ | cut -f1)
    echo "Bundle size: $SIZE"
    # Fail if over 1MB
    [ $(du -sb dist/ | cut -f1) -lt 1000000 ]
```

### Testing Best Practices

**1. Test File Organization**

```
tests/
├── unit/               # Pure functions, utilities
│   ├── utils/
│   ├── services/
│   └── hooks/
├── integration/        # Components + Firebase
│   ├── auth-flow.test.tsx
│   ├── crud-operations.test.tsx
│   └── data-persistence.test.tsx
└── e2e/               # Full user workflows
    ├── smoke.spec.ts
    ├── analytics.spec.ts
    └── transaction-management.spec.ts
```

**2. Test Naming Convention**

```typescript
// Good
test('parsePrice should convert "$10.50" to 10.50', () => {
  expect(parsePrice('$10.50')).toBe(10.50);
});

// Bad
test('test1', () => {
  expect(parsePrice('$10.50')).toBe(10.50);
});
```

**3. Avoid Flaky Tests**

```typescript
// Bad (flaky - depends on timing)
test('should update after 100ms', async () => {
  doSomethingAsync();
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(result).toBe(expected);
});

// Good (waits for condition)
test('should update', async () => {
  doSomethingAsync();
  await waitFor(() => {
    expect(result).toBe(expected);
  }, { timeout: 1000 });
});
```

## CI/CD Workflow Patterns

### Pattern 1: Matrix Testing

Test on multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

**Use when:**
- Supporting multiple Node versions
- Library (not application)
- Want to catch compatibility issues

**Don't use when:**
- Single deployment target
- Limited CI minutes
- Slow test suite

### Pattern 2: Separate Lint Job

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      # ... test steps
```

**Pros:**
- Faster feedback (lint fails early)
- Parallel execution
- Clear separation of concerns

**Cons:**
- More CI minutes used
- Setup overhead duplicated

### Pattern 3: Conditional Steps

```yaml
- name: Deploy to staging
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npm run deploy:staging

- name: Deploy to production
  if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
  run: npm run deploy:prod
```

**Use for:**
- Different behavior for PRs vs pushes
- Branch-specific deployment
- Tagged releases

### Pattern 4: Dependency Caching

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**What gets cached:**
- npm cache: `~/.npm`
- node_modules: `node_modules/`
- Build output: `dist/`, `.next/`, `.nuxt/`

**Cache invalidation:**
- Automatic when `package-lock.json` changes
- Manual via GitHub UI
- Time-based (7 days default)

### Pattern 5: Test Result Publishing

```yaml
- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Test Results
    path: test-results/*.xml
    reporter: jest-junit
```

**Benefits:**
- See test results in PR comments
- Track test trends over time
- Identify flaky tests

## Security Best Practices

### 1. Never Commit Secrets

**Bad:**
```yaml
env:
  API_KEY: sk_live_abc123...  # ❌ NEVER!
```

**Good:**
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

**For test/placeholder values:**
```yaml
env:
  VITE_FIREBASE_API_KEY: test-api-key  # OK - not real
```

### 2. Use Least Privilege

```yaml
permissions:
  contents: read
  pull-requests: write  # Only what's needed
```

### 3. Pin Action Versions

**Bad:**
```yaml
uses: actions/checkout@main  # ❌ Mutable reference
```

**Good:**
```yaml
uses: actions/checkout@v4  # ✅ Pinned major version
```

**Best:**
```yaml
uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab  # ✅ Commit SHA
```

### 4. Audit Dependencies

```yaml
- name: Audit dependencies
  run: npm audit --production

- name: Check for known vulnerabilities
  run: npx audit-ci --moderate
```

## Performance Optimization

### 1. Parallel Jobs

```yaml
jobs:
  lint:
    # ...
  unit-tests:
    # ...
  integration-tests:
    needs: []  # Run in parallel
    # ...
```

**When to parallelize:**
- Independent jobs
- CI minutes not a concern
- Faster feedback needed

**When to serialize:**
- Later job depends on earlier (needs keyword)
- Resource constraints
- Shared infrastructure (Firebase emulator)

### 2. Workflow Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**What this does:**
- Cancels old runs when new commit pushed
- Saves CI minutes
- Faster feedback on latest code

### 3. Job Timeouts

```yaml
jobs:
  test:
    timeout-minutes: 15  # Default: 360 (6 hours)
```

**Prevents:**
- Stuck jobs consuming CI minutes
- Zombie processes
- Resource exhaustion

### 4. Caching Strategies

**Cache layers:**
1. **npm cache** - Fastest, always cache
2. **node_modules** - Fast, cache if deterministic
3. **build output** - Conditional, cache if slow

**Example multi-layer cache:**
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
    key: ${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
```

## Monitoring and Alerts

### 1. Workflow Status Badges

Add to README.md:

```markdown
[![Test Suite](https://github.com/Brownbull/gmni_boletapp/workflows/Test%20Suite/badge.svg)](https://github.com/Brownbull/gmni_boletapp/actions)
```

Shows latest workflow status.

### 2. Slack/Discord Notifications

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Coverage Tracking

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

**Benefits:**
- Coverage trends over time
- PR comments with coverage diff
- Enforce coverage requirements

## Common Mistakes to Avoid

### ❌ Mistake 1: Ignoring Flaky Tests

**Bad:**
```yaml
- run: npm run test:e2e || true  # Ignores failures
```

**Good:**
```typescript
// Fix the flaky test
test('should load', async () => {
  await waitFor(() => {
    expect(element).toBeVisible();
  }, { timeout: 5000 });
});
```

### ❌ Mistake 2: Not Testing Locally

**Bad:**
```bash
git commit -m "fix tests"
git push
# Wait 3 minutes...
# Failed!
```

**Good:**
```bash
npm run test:all
git commit -m "fix tests"
git push
# Passes first time!
```

### ❌ Mistake 3: Skipping Type Checks

**Bad:**
```yaml
# Only runs tests, skips TypeScript
- run: npm run test
```

**Good:**
```yaml
- run: npm run type-check
- run: npm run test
```

### ❌ Mistake 4: Slow Tests

**Bad:**
```typescript
// 60 second timeout
test('should load', async () => {
  await page.waitForTimeout(60000);
});
```

**Good:**
```typescript
// Wait for condition, max 5s
test('should load', async () => {
  await page.waitForSelector('.app', { timeout: 5000 });
});
```

### ❌ Mistake 5: Unreliable External Services

**Bad:**
```typescript
// Calls real Gemini API in tests
const result = await analyzeReceipt(image, REAL_API_KEY);
```

**Good:**
```typescript
// Uses mock/emulator
const result = await analyzeReceipt(image, 'test-key');
expect(mockGemini).toHaveBeenCalled();
```

## Checklist: Is Your CI/CD Production-Ready?

### Basic Requirements
- ✅ Workflow file committed (`.github/workflows/test.yml`)
- ✅ Triggers on push and pull requests
- ✅ Runs all test types (unit, integration, E2E)
- ✅ Fails on test failures (`continue-on-error: false`)
- ✅ Execution time <10 minutes

### Quality Gates
- ✅ TypeScript check passes
- ✅ Linting passes
- ✅ Code coverage >70%
- ✅ All tests pass
- ✅ Build succeeds

### Performance
- ✅ Dependencies cached
- ✅ Node version matches local
- ✅ Tests run in optimal order (fast → slow)
- ✅ Concurrency configured
- ✅ Timeouts set

### Security
- ✅ No secrets in code
- ✅ Actions pinned to versions
- ✅ Dependency auditing enabled
- ✅ Least privilege permissions
- ✅ Test data isolated from production

### Maintainability
- ✅ Documented in README
- ✅ Troubleshooting guide exists
- ✅ Logs are readable
- ✅ Alerts configured
- ✅ Team trained on debugging

## Resources

### Official Docs
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Best Practices](https://vitest.dev/guide/best-practices.html)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Tools
- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [Codecov](https://codecov.io/) - Coverage tracking
- [Renovate](https://renovatebot.com/) - Dependency updates

### Community
- [GitHub Actions Community](https://github.community/c/code-to-cloud/52)
- [Testing JavaScript](https://testingjavascript.com/)

---

**Remember:** Good CI/CD is invisible when it works and helpful when it breaks. Invest time in making it reliable!
