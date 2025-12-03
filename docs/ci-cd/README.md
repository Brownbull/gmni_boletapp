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

### Current Workflow Status
- **Location:** `.github/workflows/test.yml`
- **Triggers:** Push to `main`/`develop`/`staging`, all pull requests
- **Execution Time:** ~7-8 minutes (tests) + ~2 minutes (deploy on main)
- **Test Coverage:** ~51% (thresholds: 45% lines, 30% branches, 25% functions, 40% statements)
- **Test Job Steps:** 22 (updated in Epic 4)
- **Deploy Job:** Automatic on merge to `main` (Story 6.0)

### Test Commands

**Using the centralized test script (recommended):**
```bash
./scripts/test-local.sh quick      # Fast tests before commit (2-5s)
./scripts/test-local.sh all        # Complete validation before push (30-60s)
./scripts/test-local.sh ci         # Full CI simulation with build (60-90s)
./scripts/test-local.sh unit       # Unit tests only
./scripts/test-local.sh integration # Integration tests
./scripts/test-local.sh e2e        # E2E tests
./scripts/test-local.sh coverage   # Generate coverage report
./scripts/test-local.sh watch      # TDD mode with auto-rerun
./scripts/test-local.sh help       # Show all options
```

**Using npm scripts directly:**
```bash
npm run test:unit          # Unit tests only (~500ms)
npm run test:integration   # Integration tests (~1s)
npm run test:e2e          # E2E tests (~18s)
npm run test:all          # All tests sequentially
npm run test:coverage     # Generate coverage report
```

### Viewing Workflow Results
- **GitHub Actions:** https://github.com/Brownbull/gmni_boletapp/actions
- **Latest Run:** `gh run list --limit 1`
- **View Logs:** `gh run view <run-id> --log`

## 📊 Current Test Statistics (Post-Epic 3)

- **Unit Tests:** 14 tests (Vitest)
- **Integration Tests:** 47 tests (React Testing Library + Firebase)
- **E2E Tests:** 28 tests (Playwright) - includes auth, transactions, accessibility
- **Accessibility Tests:** 16 tests (@axe-core/playwright) - WCAG 2.1 Level AA
- **Lighthouse Tests:** 6 tests (playwright-lighthouse) - Performance baselines
- **Total:** 95+ automated tests

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

## 🔧 Workflow Jobs

### Test Job (22 steps)

The test job validates code quality before deployment:

1. Checkout repository (fetch-depth: 0 for gitleaks)
2. **Scan for secrets** (gitleaks)
3. Setup Node.js 20
4. Cache dependencies
5. Install dependencies
6. Install Firebase CLI
7. Install Playwright browsers
8. Install and build Cloud Functions
9. Start Firebase Emulators
10. Run unit tests
11. Run integration tests
12. Create test user (for E2E)
13. Run E2E tests
14. Generate coverage with thresholds
15. Upload coverage report (HTML)
16. Upload coverage report (lcov)
17. Display coverage summary
18. Post coverage report to PR
19. Run Lighthouse audits
20. Upload Lighthouse reports
21. Check bundle size (<700KB)
22. **Run npm audit** (dependency vulnerabilities)
23. **Run security lint** (eslint-plugin-security)

### Deploy Job (Story 6.0) - NEW

The deploy job runs **only on push to `main`** after tests pass:

1. Checkout repository
2. Setup Node.js 20
3. Cache dependencies
4. Install dependencies
5. Build for production (with secrets)
6. **Deploy to Firebase Hosting**
7. Deployment notification

**Trigger conditions:**
- Branch: `main` only
- Event: `push` only (not PRs)
- Dependency: `test` job must pass

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_GEMINI_*` - Gemini API configuration

---

**Last Updated:** 2025-12-03
**Workflow Version:** 3.0 (22 test steps + 7 deploy steps, auto-deploy on main)
