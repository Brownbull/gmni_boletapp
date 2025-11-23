# Setup Guide: Creating GitHub Actions Workflows

This guide shows you how to set up automated testing with GitHub Actions from scratch.

## Prerequisites

Before you start, make sure you have:
- ✅ GitHub repository with code
- ✅ Tests written locally (unit, integration, E2E)
- ✅ Test commands in `package.json`
- ✅ Tests passing locally

## Step-by-Step Setup

### Step 1: Create Workflow Directory

Create the folder where GitHub Actions looks for workflows:

```bash
mkdir -p .github/workflows
```

**Why this location?**
- GitHub Actions only recognizes `.github/workflows/`
- Other locations will be ignored
- Must be at repo root, not in subdirectories

### Step 2: Create Workflow File

Create a new file: `.github/workflows/test.yml`

```bash
touch .github/workflows/test.yml
```

**File naming:**
- Can be any name ending in `.yml` or `.yaml`
- Common names: `test.yml`, `ci.yml`, `main.yml`
- Name shows up in GitHub Actions UI

### Step 3: Define Workflow Triggers

Add this to `test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

**What this does:**
- `name`: Shows in GitHub Actions UI
- `on.push`: Runs when code is pushed to `main`
- `on.pull_request`: Runs on all PRs targeting `main`

**Other trigger options:**
```yaml
# Run on all branches
on: [push, pull_request]

# Run on schedule (daily at 2am)
on:
  schedule:
    - cron: '0 2 * * *'

# Run manually from GitHub UI
on: workflow_dispatch

# Run on tags
on:
  push:
    tags:
      - 'v*'
```

### Step 4: Define the Job

Add the job configuration:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      # Steps go here
```

**Job configuration:**
- `test`: Job name (can be anything)
- `runs-on`: Operating system (ubuntu-latest, macos-latest, windows-latest)
- `timeout-minutes`: Max runtime before killing job

**Why ubuntu-latest?**
- Free tier has most minutes on Linux
- Faster than Windows/macOS
- Most Node.js projects run on Linux in production

### Step 5: Add Checkout Step

First step is always checking out the code:

```yaml
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
```

**What this does:**
- Downloads your repo code into the runner
- Without this, there's no code to test
- `@v4` is the action version (always use latest)

### Step 6: Setup Node.js

Add Node.js environment:

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
```

**Important:**
- Use Node.js 20 (current LTS)
- Don't use Node 18 (missing modules for modern tools)
- Match your local Node version if possible

**Version strategies:**
```yaml
# Specific version
node-version: '20.11.0'

# Latest LTS
node-version: 'lts/*'

# Multiple versions (matrix)
strategy:
  matrix:
    node-version: [18, 20, 22]
```

### Step 7: Cache Dependencies

Speed up builds by caching `node_modules`:

```yaml
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
```

**How caching works:**
1. First run: Downloads all dependencies (~1-2 min)
2. Subsequent runs: Restores from cache (~10 sec)
3. Cache invalidates when `package-lock.json` changes

**Time savings:**
- Without cache: ~90 seconds
- With cache: ~10 seconds
- Savings: 80 seconds per run

### Step 8: Install Dependencies

Install npm packages:

```yaml
      - name: Install dependencies
        run: npm ci
```

**Why `npm ci` instead of `npm install`?**
- `npm ci`: Clean install, respects lock file exactly
- `npm install`: Updates lock file, can cause version drift
- `npm ci`: Faster and more reliable in CI

**Never use:**
```yaml
run: npm install  # ❌ Bad: Can modify package-lock.json
run: yarn install # ❌ Different lock file format
```

### Step 9: Install Additional Tools

For Boletapp, we need Firebase and Playwright:

```yaml
      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
```

**Project-specific tools:**
- Firebase CLI: For emulators
- Playwright browsers: For E2E tests
- `--with-deps`: Installs system dependencies

### Step 10: Start Background Services

Start Firebase emulators before tests:

```yaml
      - name: Start Firebase emulators
        run: |
          firebase emulators:start --only auth,firestore --project boletapp-d609f &

          # Wait for emulators to be ready
          echo "Waiting for Firebase emulators to start..."
          for i in {1..30}; do
            if curl -s http://localhost:4000 > /dev/null; then
              echo "Firebase emulators ready!"
              break
            fi
            echo "Waiting... ($i/30)"
            sleep 1
          done
```

**Critical parts:**
- `&` at end: Runs in background
- Health check loop: Waits for service to be ready
- Timeout: Fails after 30 seconds

**Common background services:**
- Databases (PostgreSQL, MongoDB, Redis)
- Message queues (RabbitMQ, Kafka)
- API mocks
- Development servers

### Step 11: Run Tests

Run your test suite:

```yaml
      - name: Run unit tests
        run: npm run test:unit
        continue-on-error: false

      - name: Run integration tests
        run: npm run test:integration
        continue-on-error: false
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080

      - name: Run E2E tests
        run: npm run test:e2e
        continue-on-error: false
        env:
          CI: true
          VITE_FIREBASE_API_KEY: test-key
          # ... other env vars
```

**Key points:**
- `continue-on-error: false`: Fails workflow if tests fail (default, but explicit is better)
- `env`: Environment variables for this step only
- Run tests sequentially (unit → integration → E2E)

**Why sequential, not parallel?**
- Avoids port conflicts (Firebase emulator)
- Easier to debug which test type failed
- More predictable resource usage

### Step 12: Generate Coverage

Create coverage reports:

```yaml
      - name: Generate coverage report
        run: npm run test:coverage
        continue-on-error: false
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080
```

**Important:**
- Coverage should only run unit + integration tests
- Don't include E2E tests in coverage (different framework)
- Use same environment as integration tests

### Step 13: Upload Artifacts

Save test results for later:

```yaml
      - name: Upload coverage report (HTML)
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-html
          path: coverage/
          retention-days: 30

      - name: Upload coverage report (lcov)
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-lcov
          path: coverage/coverage-final.json
          retention-days: 30
```

**Artifact configuration:**
- `if: always()`: Upload even if tests fail
- `retention-days`: How long to keep artifacts (max 90 days)
- `path`: What to upload (file or directory)

**Why upload artifacts?**
- Download coverage reports
- View HTML coverage in browser
- Track coverage trends over time
- Debug test failures

## Complete Workflow Example

Here's the full `test.yml` for Boletapp:

```yaml
name: Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      # 1. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Setup Node.js 20
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # 3. Cache dependencies
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      # 4. Install dependencies
      - name: Install dependencies
        run: npm ci

      # 5. Install Firebase CLI
      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      # 6. Install Playwright browsers
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      # 7. Start Firebase emulators
      - name: Start Firebase emulators
        run: |
          firebase emulators:start --only auth,firestore --project boletapp-d609f &
          echo "Waiting for Firebase emulators to start..."
          for i in {1..30}; do
            if curl -s http://localhost:4000 > /dev/null; then
              echo "Firebase emulators ready!"
              break
            fi
            sleep 1
          done

      # 8. Run unit tests
      - name: Run unit tests
        run: npm run test:unit

      # 9. Run integration tests
      - name: Run integration tests
        run: npm run test:integration
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080

      # 10. Run E2E tests
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          VITE_FIREBASE_API_KEY: test-key
          VITE_FIREBASE_AUTH_DOMAIN: test-project.firebaseapp.com
          VITE_FIREBASE_PROJECT_ID: boletapp-d609f
          VITE_FIREBASE_STORAGE_BUCKET: test-project.firebasestorage.app
          VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789"
          VITE_FIREBASE_APP_ID: 1:123456789:web:test-app-id
          VITE_GEMINI_API_KEY: test-gemini-key
          VITE_GEMINI_MODEL: gemini-2.5-flash-preview-09-2025

      # 11. Generate coverage
      - name: Generate coverage report
        run: npm run test:coverage
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080

      # 12. Upload coverage (HTML)
      - name: Upload coverage report (HTML)
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-html
          path: coverage/
          retention-days: 30

      # 13. Upload coverage (lcov)
      - name: Upload coverage report (lcov)
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-lcov
          path: coverage/coverage-final.json
          retention-days: 30

      # 14. Display coverage summary
      - name: Display coverage summary
        if: always()
        run: |
          echo "Coverage report generated. Download artifacts to view detailed HTML report."
          if [ -f coverage/coverage-final.json ]; then
            echo "✅ Coverage data available"
          else
            echo "⚠️ Coverage data not found"
          fi
```

## Committing and Pushing

1. **Add workflow to git:**
```bash
git add .github/workflows/test.yml
```

2. **Commit with descriptive message:**
```bash
git commit -m "feat: add GitHub Actions CI/CD workflow"
```

3. **Push to GitHub:**
```bash
git push origin main
```

4. **Watch it run:**
- Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Or run: `gh run list --limit 1`

## Next Steps

- **[Local Testing](./03-local-testing.md)** - Test before pushing
- **[Reading Logs](./04-reading-logs.md)** - Debug when things fail
- **[Best Practices](./05-best-practices.md)** - Optimize your workflow

---

**Remember:** Always test locally before pushing! See the [Local Testing Guide](./03-local-testing.md) for how.
