# Contributing to Boletapp

Thank you for your interest in contributing to Boletapp! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Start Firebase emulators**: `npm run emulators`
4. **Run tests** to ensure everything works: `npm run test:all`

## Development Workflow

### Branch Strategy

We use a three-branch model:
- `main` - Production code (strictest protection)
- `staging` - QA/UAT testing
- `develop` - Active development

All work should be done in feature branches created from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Pull Request Process

1. Create your feature branch from `develop`
2. Write tests for any new functionality
3. Ensure all tests pass locally
4. Push your branch and create a PR against `develop`
5. Wait for CI checks to pass
6. Request review from maintainers

## Test Coverage Requirements

### Minimum Coverage Thresholds

CI enforces minimum test coverage thresholds. PRs that drop coverage below these thresholds will fail:

| Metric | Minimum Threshold |
|--------|-------------------|
| Lines | 45% |
| Branches | 30% |
| Functions | 25% |
| Statements | 40% |

**Note:** These thresholds are baseline values. Future improvements will raise them incrementally.

### Checking Coverage Locally

Run the coverage report to see current coverage:

```bash
npm run test:coverage
```

This generates:
- **Terminal output** - Summary of coverage percentages
- **HTML report** - Open `coverage/index.html` in your browser for detailed report
- **JSON report** - `coverage/coverage-summary.json` for CI tools

### What to Do If Coverage Fails

If your PR fails coverage checks:

1. **Identify uncovered code**: Check the HTML report (`coverage/index.html`) to see which lines aren't covered
2. **Add tests for new code**: Every new function, component, or feature should have tests
3. **Test edge cases**: Cover error handling paths, boundary conditions, and edge cases
4. **Don't reduce coverage**: If removing code, ensure remaining code is still tested

### Coverage Targets by Area

| Area | Target | Priority |
|------|--------|----------|
| Critical paths (auth, security) | 90%+ | HIGH |
| Services (Firestore, Gemini) | 80%+ | HIGH |
| Utils (pure functions) | 80%+ | MEDIUM |
| Components (UI) | 70%+ | MEDIUM |
| Views (pages) | 60%+ | LOW |

### PR Coverage Comments

When you open a PR, a bot will automatically post a coverage report comment showing:
- Current coverage percentages
- Comparison to the base branch
- Files with coverage changes

Use this information to identify areas that need more tests.

## Running Tests

```bash
# All tests
npm run test:all

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Types

- **Unit tests** (`tests/unit/`): Test pure functions and isolated logic
- **Integration tests** (`tests/integration/`): Test component interactions with Firebase emulator
- **E2E tests** (`tests/e2e/`): Test complete user workflows in real browser

### Firebase Emulators

Integration tests require Firebase emulators running:

```bash
npm run emulators
```

The emulators run on:
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Emulator UI: `localhost:4000`

## Security

### Pre-commit Hooks (Secrets Detection)

This project uses **husky** and **gitleaks** to prevent accidental commit of secrets (API keys, credentials, etc.).

**How it works:**
- A pre-commit hook automatically scans staged files before every commit
- If potential secrets are detected, the commit is blocked
- You'll see a clear error message explaining what was found

**Installing gitleaks (required for full protection):**

macOS:
```bash
brew install gitleaks
```

Linux:
```bash
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz
tar -xzf gitleaks_8.18.4_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

**If the hook blocks your commit:**
1. Review the error message to identify the secret
2. Remove or replace the secret with a placeholder
3. Use `.env` files for local secrets (gitignored)
4. Retry your commit

**Emergency bypass (NOT RECOMMENDED):**
```bash
git commit --no-verify -m "your message"
```
Only use this if you're certain it's a false positive. Contact maintainers if unsure.

### Manual Secrets Scanning

You can manually scan for secrets at any time:

```bash
# Scan current files
./scripts/scan-secrets.sh

# Scan full git history
./scripts/scan-secrets.sh --history
```

### Security Documentation

For more information, see:
- [Secrets Scan Report](docs/security/secrets-scan-report.md) - Initial scan findings and configuration details
- [Security Overview](docs/security/README.md) - Security practices and guidelines (coming in Story 4.4)

---

## Code Quality

### Linting and Formatting

- TypeScript is configured with strict mode
- ESLint rules are enforced via Vite
- Format code consistently (use your editor's format-on-save)

### Commit Messages

Use clear, descriptive commit messages:
- Start with a verb: "Add", "Fix", "Update", "Remove"
- Reference issue numbers when applicable: "Fix #123: ..."
- Keep the first line under 72 characters

## Additional Resources

- [Testing Guide](docs/testing/testing-guide.md) - Detailed testing patterns and best practices
- [Test Environment](docs/testing/test-environment.md) - Test user and fixture management
- [Architecture](docs/architecture/architecture.md) - System architecture documentation
- [Branching Strategy](docs/branching-strategy.md) - Branch workflow details

## Questions?

If you have questions or need help:
1. Check existing documentation
2. Search existing issues
3. Open a new issue with the "question" label

---

**Version:** 1.1
**Last Updated:** 2025-11-26 (Story 4.1 - Added Security section)
