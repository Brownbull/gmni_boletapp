# Contributing to Boletapp

Thank you for your interest in contributing to Boletapp! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Start Firebase emulators** (for integration tests): `npm run emulators`
4. **Run tests** to ensure everything works: `npm run test:quick`

## Development Workflow

### Branch Strategy (2-Branch Model)

```
main (production - auto-deploys to Firebase)
  ^
develop (integration branch)
  ^
feature/* | bugfix/* | chore/* (working branches)
```

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Production-ready code, auto-deploys on merge | Permanent |
| `develop` | Integration branch for completed features | Permanent |
| `feature/*` | New features, bug fixes, epic work | Temporary (auto-deleted after merge) |

**Branch Naming Convention:**
```
feature/epic{N}-{short-description}
feature/fix-{description}
chore/{description}
```

**Branch Flow:**
1. Create feature branch from `develop`: `feature/story-X.Y-description`
2. Develop and test locally
3. PR to `develop` - requires CI pass
4. PR from `develop` to `main` - production deployment
5. Auto-deploy to Firebase on merge to main

**Hotfix Flow:**
1. Create `hotfix/*` branch from `main`
2. PR directly to `main` (deploys immediately)
3. Merge `main` back to `develop` to sync

All work starts from latest `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/epic10-my-feature
```

**Branch Protection:**
- Both branches (main, develop) are protected
- Require PR + passing CI before merge
- No direct pushes allowed
- Auto-delete head branches is enabled on GitHub

### Pull Request Process

1. Create your feature branch from `develop` (always pull latest first!)
2. Write tests for any new functionality
3. Ensure tests pass locally: `npm run test:story`
4. Push your branch and create a PR against `develop`
5. Wait for CI checks to pass
6. Request review from maintainers
7. Merge after approval
8. Feature branch auto-deleted on GitHub; clean up locally: `git fetch --prune && git branch -d feature/...`

### Merge Strategy

| Scenario | Strategy |
|----------|----------|
| Feature PR to develop | Squash merge (default) |
| develop to main | Merge commit (preserve history) |
| Hotfix | Cherry-pick to all branches |

## Testing

### Test Types

- **Unit tests** (`tests/unit/`): Pure functions and isolated logic
- **Integration tests** (`tests/integration/`): Component interactions with Firebase emulator
- **E2E tests** (`tests/e2e/staging/`): Complete user workflows against staging environment

**E2E tests run ONLY against the staging environment** - no local/emulator e2e testing.

### Running Tests

```bash
# Quick check (during development)
npm run test:quick         # type-check + parallel unit tests (~35s)

# Story validation (before marking story "review")
npm run test:story         # type-check + unit + integration (~2min)

# Full suite (before deployment)
npm run test:sprint        # unit + integration + e2e (~5min)

# Individual
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only (requires emulators)
npm run test:e2e:staging   # E2E tests (staging env)

# Coverage report
npm run test:coverage
```

Integration tests require Firebase emulators: `npm run emulators`

### Test Coverage

CI enforces minimum thresholds. For detailed coverage targets by area and tiered testing strategy, see [Team Standards - Testing](docs/team-standards.md#testing-standards).

```bash
# Generate coverage report
npm run test:coverage
# Open HTML report at coverage/index.html
```

## Security

### Pre-commit Hooks (Secrets Detection)

This project uses **husky** and **gitleaks** to prevent accidental commit of secrets.

- A pre-commit hook automatically scans staged files before every commit
- If potential secrets are detected, the commit is blocked

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

### Security Audit

```bash
# Run full security audit (npm audit + gitleaks + eslint security)
npm run security:audit

# Run only security linting
npm run security:lint
```

CI will fail PRs with HIGH/CRITICAL vulnerabilities or security lint errors.

For comprehensive security documentation, see [`docs/security/`](docs/security/).

## Git Staging Verification

Before every commit, verify staged files with `git status --porcelain`:

| Status | Meaning | Action |
|--------|---------|--------|
| `A ` | Staged (new file) | Ready to commit |
| `M ` | Staged (modified) | Ready to commit |
| ` M` | Unstaged modification | Need `git add` |
| `??` | Untracked | Need `git add` |
| `MM` | Split staged/unstaged | Re-stage with `git add` |
| `D ` | Staged deletion | Ready to commit |

### Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| New files untracked (`??`) | `git add path/file` for each new file |
| Security rules unstaged | Always verify `firestore.rules` staging |
| Split staging (`MM`) | Re-stage full file before commit |

## Code Quality

- TypeScript strict mode enforced
- Format code consistently (use your editor's format-on-save)
- Commit messages: start with a verb ("Add", "Fix", "Update"), keep first line under 72 characters

## Additional Resources

- [Team Standards](docs/team-standards.md) - Agreements, lessons learned, known gotchas
- [Testing Guide](docs/testing/testing-guide.md) - Detailed testing patterns
- [Test Environment](docs/testing/test-environment.md) - Test user and fixture management
- [Architecture](docs/architecture/architecture.md) - System architecture

## Questions?

If you have questions or need help:
1. Check existing documentation
2. Search existing issues
3. Open a new issue with the "question" label

---

**Version:** 2.0
**Last Updated:** 2026-02-05 (Updated to 2-branch model, staging-only e2e, deduplicated with team-standards)
