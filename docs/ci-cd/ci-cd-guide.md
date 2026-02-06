# CI/CD Guide

**Version:** 1.0
**Date:** 2026-02-05

---

## Table of Contents

- [What is CI/CD](#what-is-cicd)
- [Pipeline Overview](#pipeline-overview)
- [Workflow Architecture](#workflow-architecture)
- [Setting Up the Workflow](#setting-up-the-workflow)
- [Local Testing](#local-testing)
- [Reading Workflow Logs](#reading-workflow-logs)
- [Debugging Strategies](#debugging-strategies)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)

---

## What is CI/CD

**Continuous Integration (CI)** automatically runs tests when you push code. It catches bugs before they reach production. **Continuous Deployment (CD)** automatically deploys code when tests pass on the main branch.

### Why It Matters

Without CI/CD, bugs slip through because tests are skipped or environments differ between local and production. With CI/CD, every commit is validated automatically: tests run, TypeScript is checked, coverage is measured, and only working code can be merged.

### What Our Pipeline Tests

| Layer | Count | Framework | Purpose |
|-------|-------|-----------|---------|
| Unit | 610+ | Vitest | Individual functions, hooks, utilities |
| Integration | 300+ | React Testing Library + Firebase | Components working together, Firestore rules |
| E2E | 28 | Playwright | Full user workflows, accessibility |
| Accessibility | 16 | @axe-core/playwright | WCAG 2.1 Level AA |
| Lighthouse | 6 | playwright-lighthouse | Performance baselines |

---

## Pipeline Overview

### Triggers

- **Push to `main`/`develop`/`staging`**: Validates branch health
- **Pull requests targeting `main`**: Tests proposed changes, blocks merge on failure
- **`workflow_dispatch`**: Manual trigger from GitHub Actions UI

### Workflow Architecture

```
setup --> test-unit ------------> test (aggregator) --> deploy (main only)
      --> test-integration ----->
      --> test-e2e ------------->
      --> security ------------->
      --> lighthouse (main push only, parallel)
```

**Time budgets:**

| Job | Target | Max Allowed |
|-----|--------|-------------|
| setup | ~2 min | 3 min |
| test-unit | ~2 min | 4 min |
| test-integration | ~2 min | 4 min |
| test-e2e | ~2.5 min | 5 min |
| security | ~2 min | 3 min |
| **Total PR** | **~4-5 min** | **7 min** |

### Job Details

**Setup:** Checkout, secret scanning (gitleaks), Node.js 20, cache npm/Playwright/Firebase CLI, build Cloud Functions, save workspace cache.

**Test-Unit:** Restore workspace, start Firebase emulators, run unit tests with coverage, upload reports, post PR comments.

**Test-Integration:** Restore workspace, start Firebase emulators, run integration tests.

**Test-E2E:** Restore workspace + Playwright cache, start emulators, create test user, run Playwright tests.

**Security:** Bundle size check (<700KB), npm audit (HIGH/CRITICAL), security lint (eslint-plugin-security).

**Lighthouse:** Main branch only. Runs Lighthouse audits on 6 views, uploads reports.

**Deploy:** Main branch only, after test aggregator passes. Builds for production with secrets, deploys to Firebase Hosting. Required secrets: `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*`, `VITE_GEMINI_*`.

---

## Setting Up the Workflow

### Prerequisites

- GitHub repository with code
- Tests written and passing locally
- Test commands defined in `package.json`

### Workflow File Location

GitHub Actions requires `.github/workflows/`. The main file is `.github/workflows/test.yml`.

### Key Workflow Components

**1. Triggers:**

```yaml
name: Test Suite
on:
  push:
    branches: [ main, develop, staging ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
```

**2. Job with Node.js 20:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
```

Use Node.js 20 (current LTS). Node 18 is missing modules needed by modern tooling.

**3. Dependency Caching:**

```yaml
      - uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
```

Caching reduces install time from ~90s to ~10s. Cache invalidates when `package-lock.json` changes.

**4. Install with `npm ci`:**

```yaml
      - run: npm ci
```

Always use `npm ci` (clean install from lockfile), never `npm install` (which can modify the lockfile).

**5. Firebase Emulators:**

```yaml
      - name: Start Firebase emulators
        run: |
          firebase emulators:start --only auth,firestore --project boletapp-d609f &
          for i in {1..30}; do
            if curl -s http://localhost:4000 > /dev/null; then
              echo "Firebase emulators ready!"
              break
            fi
            sleep 1
          done
```

The `&` runs emulators in the background. The health-check loop waits up to 30 seconds.

**6. Test Steps:**

```yaml
      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          VITE_FIREBASE_API_KEY: test-key
          VITE_FIREBASE_AUTH_DOMAIN: test-project.firebaseapp.com
          VITE_FIREBASE_PROJECT_ID: boletapp-d609f
          # ... other env vars
```

Tests run sequentially (unit, integration, E2E) to avoid port conflicts and simplify debugging.

**7. Coverage Artifacts:**

```yaml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-html
          path: coverage/
          retention-days: 30
```

`if: always()` uploads even when tests fail. Artifacts persist for 30 days.

---

## Local Testing

**Golden rule:** Test locally before pushing. 30 seconds of local testing saves 30 minutes of CI debugging.

### Tiered Testing Strategy

```bash
npm run test:quick         # TypeScript + parallel unit tests (~35s)
npm run test:story         # Quick + integration tests (~2min)
npm run test:sprint        # Full suite: unit + integration + E2E (~5min)
```

### Individual Test Commands

```bash
npm run test:unit              # Unit tests only
npm run test:unit:parallel     # Unit tests parallelized (~22s)
npm run test:integration       # Integration tests (~1min)
npm run test:e2e               # E2E tests (~60s)
npm run test:all               # All tests sequentially (~5min)
npm run test:coverage          # Generate coverage report
npm run type-check             # TypeScript validation
```

### Centralized Test Script

```bash
./scripts/test-local.sh quick      # Fast tests before commit
./scripts/test-local.sh all        # Complete validation before push
./scripts/test-local.sh ci         # Full CI simulation with build
./scripts/test-local.sh help       # Show all options
```

### Environment Setup

Integration tests need Firebase emulators running:

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Run tests
npm run test:integration
```

E2E tests need Vite environment variables. Either set them inline or use a `.env.test` file.

### Watch Mode

```bash
npm run test        # Vitest watch mode - reruns on file changes
npx playwright test --ui   # Playwright visual test runner
```

### Pre-Push Checklist

```bash
npm run type-check          # No TypeScript errors
npm run test:unit           # All unit tests pass
npm run test:integration    # All integration tests pass
npm run test:e2e            # All E2E tests pass
npm run test:coverage       # Coverage above thresholds
npm run build               # Production build succeeds
```

---

## Reading Workflow Logs

### Accessing Logs

**GitHub Web UI:** Repository > Actions tab > Failed run > Failed job > Failed step (marked with red X).

**GitHub CLI:**

```bash
gh run list --limit 5              # List recent runs
gh run view <run-id>               # View specific run
gh run view <run-id> --log-failed  # View only failed logs
gh run watch <run-id>              # Watch a running workflow
```

### Log Structure

```
Workflow: Test Suite
  Job: test
    Step 1: Checkout repository
    Step 2: Setup Node.js
    ...
    Step 8: Run unit tests   <-- FAILED
    Step 9: (skipped)
```

Steps run in order. If one fails, remaining steps are skipped. Always look for the first failure -- it is usually the root cause.

### Common Failure Types

**Test failures** show the test file, description, expected vs. received values, and line number. Fix the code or the test, then verify locally.

**Build errors** (`Cannot find module`) indicate missing files, wrong import paths, or uncommitted files.

**Environment errors** (`Page body was "hidden"`) usually mean missing Vite environment variables. The app failed to load.

**Port conflicts** (`localhost:5174 is already used`) mean two processes tried the same port. Let Playwright manage its own dev server.

**Module not found** (`ERR_UNKNOWN_BUILTIN_MODULE`) means a Node.js version mismatch. Ensure the workflow uses Node 20.

**Timeouts** (`Exceeded 30000ms`) mean a service did not start in time or a page loaded too slowly. Use `waitFor` instead of fixed delays.

### Searching Logs

```bash
gh run view <run-id> --log-failed | grep -i "error"
gh run view <run-id> --log-failed | grep -A 10 "Error:"
gh run view <run-id> --log | grep "validation.test.ts"
```

In the web UI, use Ctrl+F to search within expanded log sections.

---

## Debugging Strategies

### 1. Find the First Failure

The first red-X step is usually the root cause. Later failures are often consequences.

### 2. Compare with Successful Runs

```bash
gh run list --status success --limit 1
git diff <last-good-commit> HEAD
```

Look for dependency changes, config changes, or environment changes.

### 3. Reproduce Locally

```bash
CI=true npm run test:e2e   # Simulate CI environment
nvm use 20                 # Match CI Node version
```

### 4. Check Artifacts

Failed runs may upload screenshots, coverage reports, or Playwright traces:

```bash
gh run download <run-id>
```

### 5. Enable Debug Logging

Add to a workflow step temporarily:

```yaml
env:
  DEBUG: '*'
```

---

## Best Practices

### Fast Feedback

- Target under 10 minutes total workflow execution
- Run fast tests first (unit before integration before E2E)
- Cache dependencies (saves ~80s per run)
- Use `concurrency` to cancel superseded runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Consistent Environments

- Use the same Node.js version everywhere (20 LTS)
- Lock dependency versions via `package-lock.json`
- Use `npm ci`, never `npm install`
- Test locally with `CI=true` to match CI behavior

### Security

- Never commit real secrets. Use `${{ secrets.NAME }}` for production values, placeholder strings for test runs.
- Pin GitHub Actions to major versions (`@v4`) or commit SHAs.
- Set least-privilege `permissions` in the workflow.
- Run `npm audit` to catch known vulnerabilities.

### Testing Patterns

- Follow the testing pyramid: many unit tests, some integration, few E2E.
- Avoid flaky tests: use `waitFor` instead of `setTimeout`.
- Name tests descriptively: `parsePrice should convert "$10.50" to 10.50`.
- Do not include E2E tests in coverage runs (different framework).
- Mock external services (Gemini API) in tests.

### When Adding New Tests to CI

- **Small additions (<10 tests):** Add to existing job, verify time budget.
- **Large additions (>50 tests):** Consider a new parallel job.
- **Slow tests (>30s each):** Justify if E2E is appropriate; consider unit/integration instead.

### Anti-Patterns to Avoid

- Running the same tests twice (e.g., unit tests + coverage separately)
- Sequential steps that could be parallel jobs
- Installing tools that are not cached
- Running expensive checks (Lighthouse) on every PR
- Ignoring flaky tests with `|| true`
- Skipping `type-check` in CI

---

## Quick Reference

### Daily Development

```bash
npm run test              # Watch mode
npm run type-check        # Quick validation
```

### Before Committing

```bash
npm run test:quick        # TypeScript + parallel unit tests (~35s)
```

### Before Pushing

```bash
npm run test:sprint       # Full suite (~5min)
npm run test:coverage     # Check coverage
```

### Before Merging to Main

```bash
npm run build             # Ensure build works
npm run test:all          # All tests pass
```

### Debugging CI Failures

```bash
gh run view <run-id> --log-failed   # View failed logs
CI=true npm run test:e2e            # Simulate CI environment
```

### Viewing Results

- **GitHub Actions:** https://github.com/Brownbull/gmni_boletapp/actions
- **Latest run:** `gh run list --limit 1`
- **Artifacts:** `gh run download <run-id>`

### Current Thresholds

- **Coverage:** 45% lines, 30% branches, 25% functions, 40% statements
- **Bundle size:** <700KB
- **npm audit:** No HIGH/CRITICAL vulnerabilities
- **Workflow timeout:** 15 minutes

---

## Tools

- **CI Platform:** GitHub Actions
- **Test Frameworks:** Vitest, React Testing Library, Playwright
- **Coverage:** @vitest/coverage-v8, vitest-coverage-report-action (PR comments)
- **Accessibility:** @axe-core/playwright (WCAG 2.1 Level AA)
- **Performance:** playwright-lighthouse, Lighthouse CI
- **Local CI Simulation:** `act` (runs GitHub Actions in Docker)
- **Firebase Emulators:** Isolated testing for Auth and Firestore

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [act - Run GitHub Actions Locally](https://github.com/nektos/act)
