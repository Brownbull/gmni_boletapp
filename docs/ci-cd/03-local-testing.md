# Local Testing: Test Before You Push

**Golden Rule:** Always test locally before pushing to GitHub. It saves time and prevents broken builds.

## Why Test Locally?

### Time Comparison

**Without local testing:**
```
Write code → Push → Wait 3 minutes → Build fails → Fix → Push → Wait 3 minutes → Repeat
Total time: 15-30 minutes for 3-5 iterations
```

**With local testing:**
```
Write code → Test locally (30 seconds) → Fix → Test again → Push → Build succeeds
Total time: 5 minutes
```

**Time savings:** 10-25 minutes per feature

### Cost Comparison

**GitHub Actions limits (free tier):**
- Public repos: Unlimited (Boletapp is public)
- Private repos: 2,000 minutes/month

**Without local testing:**
- Failed run: 3 minutes wasted
- 5 failed runs: 15 minutes wasted
- Per month: Could hit limits on private repos

**With local testing:**
- Failed runs: 0 minutes wasted
- Clean CI history
- More minutes for real issues

## Method 1: Manual Testing (Recommended)

The simplest approach - run the same commands CI runs.

### Quick Test Suite

Run all tests locally:

```bash
# 1. Unit tests (~500ms)
npm run test:unit

# 2. Integration tests (~1s)
npm run test:integration

# 3. E2E tests (~18s)
npm run test:e2e

# 4. Coverage (~1s)
npm run test:coverage
```

**Total time:** ~21 seconds

### All-in-One Command

```bash
npm run test:all
```

This runs unit → integration → E2E sequentially, exactly like CI.

### Checking TypeScript

CI also checks TypeScript:

```bash
npm run type-check
```

**Common TypeScript errors:**
- Unused imports
- Type mismatches
- Missing type definitions
- Wrong function signatures

### Environment Setup

Some tests need environment variables:

```bash
# Integration tests need Firebase emulator
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:integration

# E2E tests need all env vars (for Vite build)
VITE_FIREBASE_API_KEY=test-key \
VITE_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com \
VITE_FIREBASE_PROJECT_ID=boletapp-d609f \
VITE_FIREBASE_STORAGE_BUCKET=test.firebasestorage.app \
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 \
VITE_FIREBASE_APP_ID=1:123:web:test \
VITE_GEMINI_API_KEY=test-gemini \
VITE_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025 \
CI=true npm run test:e2e
```

**Pro tip:** Create a script in `package.json`:

```json
{
  "scripts": {
    "test:e2e:ci": "CI=true npm run test:e2e"
  }
}
```

### Running Background Services

Before integration/E2E tests, start Firebase emulators:

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Run tests
npm run test:integration
```

**Or use background mode:**

```bash
# Start emulators in background
npm run emulators &

# Wait a moment for startup
sleep 5

# Run tests
npm run test:integration

# Kill emulators when done
pkill -f firebase
```

## Method 2: Using `act` (GitHub Actions Locally)

`act` runs GitHub Actions workflows on your machine using Docker.

### Installing `act`

Already installed on your system! Check with:

```bash
which act
# Output: /home/khujta/.local/bin/act
```

**If not installed:**
```bash
# On macOS
brew install act

# On Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# On Windows
choco install act-cli
```

### Basic Usage

List available workflows:

```bash
act --list
```

**Output:**
```
Stage  Job ID  Job name  Workflow name  Workflow file  Events
0      test    test      Test Suite     test.yml       push,pull_request
```

Run the workflow:

```bash
act push
```

This simulates a push event and runs `.github/workflows/test.yml`.

### Why We Don't Use `act` for Everything

**Pros:**
- ✅ Runs exact CI environment
- ✅ Catches environment-specific issues
- ✅ Tests Docker setup (if used)

**Cons:**
- ❌ Requires Docker (slow to start)
- ❌ Takes 5-10 minutes (vs 20 seconds manual)
- ❌ Downloads large Docker images (2-4 GB)
- ❌ Complex setup for Firebase emulators
- ❌ Overkill for most changes

**When to use `act`:**
- Testing workflow file changes
- Debugging environment issues
- Final validation before major releases
- When CI fails but local tests pass

**When NOT to use `act`:**
- Testing code changes (use manual testing)
- Quick validation (too slow)
- Regular development (unnecessary overhead)

### Running `act` Efficiently

Only run specific jobs:

```bash
# Run only the test job
act -j test

# Run only specific event
act pull_request

# Use specific platform
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

**Faster Docker image:**
```bash
# Use a smaller base image
act -P ubuntu-latest=catthehacker/ubuntu:act-20.04
```

**Skip steps:**
```bash
# Dry run (shows what would run)
act --dryrun

# List secrets needed
act --secret-file .secrets
```

### `act` Limitations

**What doesn't work:**
- GitHub-hosted runners (different resources)
- Some GitHub Actions features (artifacts, caching)
- Secrets (must provide manually)
- Perfect environment match (Docker != GitHub)

**What works:**
- Most basic workflows
- Running tests
- Building code
- Linting/formatting

## Method 3: Pre-Commit Hooks (Automated)

Run tests automatically before every commit.

### Setup with Husky

**1. Install Husky:**
```bash
npm install --save-dev husky
npx husky init
```

**2. Add pre-commit hook:**
```bash
echo "npm run test:unit" > .husky/pre-commit
chmod +x .husky/pre-commit
```

**3. Now every commit runs tests:**
```bash
git commit -m "feat: add feature"
# Runs: npm run test:unit
# Commit succeeds only if tests pass
```

### What to Run in Pre-Commit

**Good:**
- Unit tests (fast: ~500ms)
- Linting (fast: ~200ms)
- TypeScript check (fast: ~300ms)

**Bad:**
- Integration tests (slow: ~8s)
- E2E tests (very slow: ~18s)
- Coverage (redundant)

**Recommended pre-commit hook:**
```bash
#!/bin/sh
npm run test:unit && npm run type-check
```

### Skipping Hooks (Emergency)

Sometimes you need to commit without running hooks:

```bash
git commit --no-verify -m "WIP: will fix tests"
```

**⚠️ Use sparingly!** CI will still catch failures.

## Method 4: Watch Mode (During Development)

Run tests continuously as you code.

### Vitest Watch Mode

```bash
npm run test
```

**What happens:**
- Tests run automatically on file changes
- Only re-runs affected tests
- Shows coverage in real-time
- Press `a` to run all tests
- Press `q` to quit

**Great for:**
- TDD (Test-Driven Development)
- Refactoring
- Bug fixing
- Learning

### Playwright UI Mode

```bash
npx playwright test --ui
```

**What happens:**
- Opens visual test runner
- See tests run in browser
- Debug with time-travel
- Inspect DOM at any point

## Testing Checklist

Before pushing code, verify:

### Code Quality
```bash
✅ npm run type-check    # No TypeScript errors
✅ npm run test:unit     # All unit tests pass
✅ npm run test:integration  # All integration tests pass
✅ npm run test:e2e      # All E2E tests pass (optional)
✅ npm run test:coverage # Coverage stays above 70%
```

### Build Verification
```bash
✅ npm run build         # Production build succeeds
✅ npm run preview       # Preview build works
```

### Git Hygiene
```bash
✅ git status            # No unexpected changes
✅ git diff              # Review what's changing
✅ git add -p            # Stage changes selectively
```

## Common Issues

### Issue: Tests pass locally but fail in CI

**Possible causes:**
1. **Environment differences**
   - Node version mismatch (CI uses Node 20)
   - Missing environment variables
   - Different OS (CI uses Ubuntu)

2. **Timing issues**
   - Tests depend on fast machine (use `waitFor`)
   - Race conditions in async code
   - Flaky tests (fix or mark as flaky)

3. **File system differences**
   - Case sensitivity (Linux is case-sensitive, macOS/Windows aren't)
   - Line endings (CRLF vs LF)

**Solution:**
```bash
# Use same Node version as CI
nvm install 20
nvm use 20

# Run tests with CI environment variable
CI=true npm run test:e2e
```

### Issue: Firebase emulator not starting

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Solution:**
```bash
# Kill any existing emulators
pkill -f firebase

# Start emulators and wait
npm run emulators &
sleep 10

# Verify it's running
curl http://localhost:4000
```

### Issue: E2E tests fail with "page body hidden"

**Cause:** Missing environment variables for Vite build

**Solution:**
```bash
# Set all required env vars
export VITE_FIREBASE_API_KEY=test-key
export VITE_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
# ... etc

# Or use a .env.test file
cp .env.example .env.test
npm run test:e2e
```

### Issue: Coverage drops unexpectedly

**Cause:** New code not covered by tests

**Solution:**
```bash
# See which files are uncovered
npm run test:coverage

# Open HTML report
open coverage/index.html

# Add tests for uncovered code
```

## Best Practices

### DO:
✅ Test before every push
✅ Run full suite before merging to main
✅ Fix failing tests immediately
✅ Use watch mode during development
✅ Review coverage reports weekly

### DON'T:
❌ Skip tests because "it's a small change"
❌ Commit with `--no-verify` regularly
❌ Ignore flaky tests
❌ Let coverage drop below 70%
❌ Push without running `npm run type-check`

## Quick Reference

```bash
# Daily development
npm run test              # Watch mode
npm run type-check        # Quick validation

# Before committing
npm run test:unit         # Fast feedback
npm run type-check        # Catch errors

# Before pushing
npm run test:all          # Full validation
npm run test:coverage     # Check coverage

# Before merging to main
npm run build             # Ensure build works
npm run test:all          # All tests pass
npm run test:coverage     # Coverage maintained

# Debugging CI failures
act push                  # Run workflow locally
CI=true npm run test:e2e  # Simulate CI environment
```

## Next Steps

- **[Reading Workflow Logs](./04-reading-logs.md)** - Debug CI failures
- **[Best Practices](./05-best-practices.md)** - Optimize your workflow
- **[Troubleshooting](./troubleshooting.md)** - Common issues

---

**Remember:** 30 seconds of local testing saves 30 minutes of CI debugging!
