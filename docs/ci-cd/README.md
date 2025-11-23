# CI/CD Documentation

This folder contains comprehensive documentation about the Continuous Integration and Continuous Deployment (CI/CD) pipeline for Boletapp.

## 📚 Documentation Index

### Core Guides
1. **[Overview & Why CI/CD](./01-overview-why-cicd.md)** - Understanding the value and purpose of automated testing
2. **[Setup Guide](./02-setup-guide.md)** - How to set up GitHub Actions workflows from scratch
3. **[Local Testing](./03-local-testing.md)** - Testing workflows locally before pushing to GitHub
4. **[Reading Workflow Logs](./04-reading-logs.md)** - How to debug failures in GitHub Actions
5. **[Best Practices](./05-best-practices.md)** - CI/CD best practices for React/TypeScript projects

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
- **Triggers:** Push to `main`, all pull requests
- **Execution Time:** ~3-4 minutes
- **Test Coverage:** 79.51% (target: 70%+)

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

## 📊 Current Test Statistics

- **Unit Tests:** 14 tests (Vitest)
- **Integration Tests:** 40 tests (React Testing Library + Firebase)
- **E2E Tests:** 17 tests (Playwright)
- **Total:** 71 automated tests

## 🛠️ Tools Used

- **CI Platform:** GitHub Actions
- **Test Frameworks:** Vitest, React Testing Library, Playwright
- **Coverage:** @vitest/coverage-v8
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

---

**Last Updated:** 2025-11-23
**Workflow Version:** 1.0 (14 steps, Node.js 20)
