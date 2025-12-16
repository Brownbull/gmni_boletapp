# CI/CD Documentation

This folder contains comprehensive documentation about the Continuous Integration and Continuous Deployment (CI/CD) pipeline for Boletapp.

## 📚 Documentation Index

### Core Guides
1. **[Overview & Why CI/CD](./01-overview-why-cicd.md)** - Understanding the value and purpose of automated testing
2. **[Setup Guide](./02-setup-guide.md)** - How to set up GitHub Actions workflows from scratch
3. **[Local Testing](./03-local-testing.md)** - Testing workflows locally before pushing to GitHub
4. **[Reading Workflow Logs](./04-reading-logs.md)** - How to debug failures in GitHub Actions
5. **[Best Practices](./05-best-practices.md)** - CI/CD best practices for React/TypeScript projects
6. **[Debugging Guide](./debugging-guide.md)** - Comprehensive troubleshooting with `act` framework and common issues

### Reference Materials
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions
- **[Workflow Reference](./workflow-reference.md)** - Complete breakdown of our workflow steps
- **[Testing Strategy](./testing-strategy.md)** - Three-tier testing approach explained

## 🚀 Quick Start

If you're new to CI/CD, start here:

1. Read [Overview & Why CI/CD](./01-overview-why-cicd.md) to understand the fundamentals
2. Review [Local Testing](./03-local-testing.md) to learn how to test before pushing
3. Keep [Reading Workflow Logs](./04-reading-logs.md) handy for when things fail

## 🔍 Quick Reference

### Current Workflow Status (Story 8.9 - Optimized)
- **Location:** `.github/workflows/test.yml`
- **Triggers:** Push to `main`/`develop`/`staging`, all pull requests, `workflow_dispatch`
- **Execution Time:** ~4-5 minutes (PR) / ~7 minutes (main with Lighthouse)
- **Test Coverage:** ~51% (thresholds: 45% lines, 30% branches, 25% functions, 40% statements)
- **Architecture:** Parallel jobs (setup → test-unit, test-integration, test-e2e, security → deploy)
- **Deploy Job:** Automatic on merge to `main` (Story 6.0)

### Workflow Structure (Story 8.9)
```
setup ─┬─► test-unit ─────────┬─► test ─► deploy (main only)
       ├─► test-integration ──┤
       ├─► test-e2e ──────────┤
       ├─► security ──────────┘
       └─► lighthouse (main push only, parallel)
```

### Test Commands (Epic 7 Tiered Strategy)

**Tiered testing for optimal development speed:**
```bash
npm run test:quick         # TypeScript + parallel unit tests (~35s) ⚡
npm run test:story         # Quick + integration tests (~2min) 📝
npm run test:sprint        # Full suite: unit + integration + E2E (~5min) 🏁
```

**Individual test types:**
```bash
npm run test:unit              # Unit tests only (sequential ~3min)
npm run test:unit:parallel     # Unit tests with parallelization (~22s)
npm run test:integration       # Integration tests (~1min)
npm run test:e2e               # E2E tests (~60s)
npm run test:all               # All tests sequentially (~5min)
npm run test:coverage          # Generate coverage report
```

**Using the centralized test script:**
```bash
./scripts/test-local.sh quick      # Fast tests before commit
./scripts/test-local.sh all        # Complete validation before push
./scripts/test-local.sh ci         # Full CI simulation with build
./scripts/test-local.sh help       # Show all options
```

### Viewing Workflow Results
- **GitHub Actions:** https://github.com/Brownbull/gmni_boletapp/actions
- **Latest Run:** `gh run list --limit 1`
- **View Logs:** `gh run view <run-id> --log`

## 📊 Current Test Statistics (Epic 7)

- **Unit Tests:** 610+ tests (Vitest) - parallelized for speed
- **Integration Tests:** 300+ tests (React Testing Library + Firebase)
- **E2E Tests:** 28 tests (Playwright) - includes auth, transactions, accessibility
- **Accessibility Tests:** 16 tests (@axe-core/playwright) - WCAG 2.1 Level AA
- **Lighthouse Tests:** 6 tests (playwright-lighthouse) - Performance baselines
- **Total:** 950+ automated tests

## 🛠️ Tools Used

- **CI Platform:** GitHub Actions
- **Test Frameworks:** Vitest, React Testing Library, Playwright
- **Coverage:** @vitest/coverage-v8, vitest-coverage-report-action (PR comments)
- **Accessibility:** @axe-core/playwright (WCAG 2.1 Level AA)
- **Performance:** playwright-lighthouse, Lighthouse CI
- **Local Testing:** `act` (GitHub Actions locally)
- **Firebase Emulators:** For isolated testing

## 🆘 Need Help?

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review [Reading Workflow Logs](./04-reading-logs.md)
3. Search recent workflow runs in GitHub Actions
4. Review the commit history for similar fixes

## 📝 Contributing

When adding new tests or modifying the workflow:

1. Test locally first (see [Local Testing](./03-local-testing.md))
2. Follow [Best Practices](./05-best-practices.md)
3. Update this documentation if you change the workflow
4. Document any new issues in the troubleshooting guide

## 🔧 Workflow Jobs (Story 8.9 - Parallel Architecture)

### Setup Job
Shared setup for all parallel test jobs:
- Checkout repository, scan for secrets (gitleaks)
- Setup Node.js 20, cache npm dependencies
- **Cache Playwright browsers** (~29s saved on cache hit)
- **Cache Firebase CLI** (~19s saved on cache hit)
- Build Cloud Functions
- Save workspace cache for parallel jobs

### Test-Unit Job (parallel)
- Restore workspace cache
- Start Firebase emulators (needed for categoryMappingService)
- Run unit tests with coverage (combined - Story 8.9 AC5)
- Upload coverage reports, post to PR comments

### Test-Integration Job (parallel)
- Restore workspace cache
- Start Firebase emulators
- Run integration tests

### Test-E2E Job (parallel)
- Restore workspace + Playwright cache
- Start Firebase emulators, create test user
- Run E2E tests (Playwright)

### Security Job (parallel)
- Bundle size check (<700KB threshold)
- npm audit (HIGH/CRITICAL vulnerabilities)
- Security lint (eslint-plugin-security)

### Lighthouse Job (main only, parallel)
- **Only runs on push to main branch** (~4.5 min saved on PRs)
- Run Lighthouse audits on 6 views
- Upload Lighthouse reports

### Test Job (aggregator)
- Aggregates results from test-unit, test-integration, test-e2e, security
- Provides single "test" status for branch protection compatibility

### Deploy Job
Runs **only on push to `main`** after `test` job passes:
- Build for production (with secrets)
- Deploy to Firebase Hosting
- Can be triggered manually via `workflow_dispatch`

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_GEMINI_*` - Gemini API configuration

## ⚡ CI/CD Performance Standards (Story 8.9)

When adding new tests or features to CI/CD, follow these guidelines to maintain fast pipeline execution:

### Time Budgets
| Job | Target | Max Allowed |
|-----|--------|-------------|
| setup | ~2 min | 3 min |
| test-unit | ~2 min | 4 min |
| test-integration | ~2 min | 4 min |
| test-e2e | ~2.5 min | 5 min |
| security | ~2 min | 3 min |
| **Total PR** | **~4-5 min** | **7 min** |

### Caching Strategy
- **Always cache** expensive installs (Playwright browsers, Firebase CLI)
- Use `actions/cache/save` in setup, `actions/cache/restore` in parallel jobs
- Cache keys should include version or lockfile hash for invalidation

### Parallelization Rules
1. **Independent tests run in parallel** - unit, integration, e2e, security all run concurrently
2. **Each parallel job is self-contained** - must start own emulators, restore own caches
3. **Aggregator job for branch protection** - `test` job collects results from all test jobs

### When Adding New Tests
- **Small addition (<10 tests):** Add to existing job, verify time budget
- **Large addition (>50 tests):** Consider new parallel job or optimize existing
- **Slow tests (>30s each):** Must justify; consider if E2E is appropriate or can be unit/integration

### When Adding New CI Steps
- **Per-commit checks:** Add to `setup` or `security` job
- **Test-related:** Add to appropriate test job (unit/integration/e2e)
- **Main-only (expensive):** Create separate job with `if: github.ref == 'refs/heads/main'`

### Anti-Patterns to Avoid
- ❌ Running same tests twice (e.g., unit tests + coverage separately)
- ❌ Sequential steps that could be parallel jobs
- ❌ Installing tools that aren't cached
- ❌ Running expensive checks (Lighthouse) on every PR
- ❌ Blocking deploys on informational checks (use `continue-on-error: true`)

---

**Last Updated:** 2025-12-12
**Workflow Version:** 4.0 (Parallel architecture - Story 8.9)
