# CI/CD Debugging Guide

This guide provides comprehensive troubleshooting strategies for GitHub Actions CI/CD pipeline issues, including the `act` framework for local debugging.

## Quick Troubleshooting Flowchart

```
CI Failed
    │
    ├── Check GitHub Actions logs first
    │   └── Is the error message clear?
    │       ├── Yes → Fix the specific issue
    │       └── No → Continue below
    │
    ├── Reproduce locally
    │   ├── npm run test:all
    │   └── CI=true npm run test:e2e
    │
    ├── Environment issue?
    │   ├── Node version mismatch → Check workflow uses node 20
    │   ├── Missing env vars → Check .github/workflows/test.yml env section
    │   └── Firebase emulator → Check emulator startup logs
    │
    └── Still stuck?
        ├── Run with act locally
        └── Enable debug logging
```

## The `act` Framework

### What is `act`?

`act` is a tool that runs GitHub Actions workflows locally using Docker. It simulates the GitHub Actions environment on your machine, allowing you to test workflow changes before pushing.

**Repository:** https://github.com/nektos/act

### Installation

```bash
# macOS
brew install act

# Linux (via script)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Linux (via package manager)
# Debian/Ubuntu
sudo apt install act

# npm (cross-platform)
npm install -g @nektos/act

# Windows
choco install act-cli
# or
winget install nektos.act
```

### Verify Installation

```bash
act --version
# Output: act version 0.2.x
```

### Basic Usage

```bash
# List available workflows
act --list

# Run the default event (push)
act

# Run a specific event
act push
act pull_request

# Run a specific job
act -j test

# Dry run (show what would run)
act --dryrun

# Verbose output
act -v
```

### Running Boletapp Workflow

```bash
# Navigate to project root
cd /path/to/boletapp

# Run the test workflow (simulates push to main)
act push

# Run with verbose output for debugging
act push -v

# Run specific job only
act -j test
```

### `act` Limitations

**What Works:**
- Basic workflow syntax validation
- Running shell commands
- Installing dependencies
- Running tests
- Environment variables

**What Doesn't Work (or works differently):**
- GitHub-hosted runner resources (different CPU/RAM)
- Some GitHub Actions features:
  - `actions/cache` (partial support)
  - `actions/upload-artifact` (partial support)
  - Secrets (must provide manually)
- Network conditions (local != GitHub network)
- Firebase emulators may behave differently

**When to Use `act`:**
- Testing workflow file changes
- Debugging environment issues
- Final validation before major releases
- When CI fails but local tests pass

**When NOT to Use `act`:**
- Quick code change validation (too slow)
- Regular development (use `npm run test:all`)
- Simple test fixes (direct push faster)

### Providing Secrets to `act`

Create `.secrets` file (add to `.gitignore`!):

```bash
# .secrets
GITHUB_TOKEN=your_token_here
```

Run with secrets:

```bash
act push --secret-file .secrets
```

### Docker Image Selection

`act` uses Docker images to simulate GitHub runners:

```bash
# Use medium-sized image (recommended)
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Use full-sized image (closer to GitHub, but slower)
act -P ubuntu-latest=catthehacker/ubuntu:full-latest

# Use minimal image (faster, may miss some tools)
act -P ubuntu-latest=catthehacker/ubuntu:act-20.04
```

## Common CI Failures and Solutions

### 1. Node.js Version Mismatch

**Error:**
```
Error: No such built-in module: node:inspector/promises
```

**Cause:** CI using Node 18, but code requires Node 20 features.

**Solution:** Ensure workflow uses Node 20:

```yaml
# .github/workflows/test.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Must be 20, not 18
```

**Local Fix:**
```bash
nvm install 20
nvm use 20
```

---

### 2. Firebase Emulator Startup Failures

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Cause:** Firebase emulator didn't start in time or crashed.

**Solution 1:** Increase wait time in workflow:

```yaml
- name: Start Firebase emulators
  run: |
    firebase emulators:start --only auth,firestore --project boletapp-d609f &
    # Wait for emulators (max 30s)
    for i in {1..30}; do
      if curl -s http://localhost:4000 > /dev/null; then
        echo "Firebase emulators ready!"
        break
      fi
      echo "Waiting... ($i/30)"
      sleep 1
    done
```

**Solution 2:** Check emulator logs:

```bash
# Local debugging
firebase emulators:start --only auth,firestore --debug
```

**Solution 3:** Kill stale processes:

```bash
pkill -f firebase
```

---

### 3. Playwright Browser Installation Issues

**Error:**
```
Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium-xxx
```

**Cause:** Playwright browsers not installed in CI.

**Solution:** Ensure workflow installs browsers:

```yaml
- name: Install Playwright browsers
  run: npx playwright install chromium --with-deps
```

**Local Fix:**
```bash
npx playwright install chromium
```

---

### 4. Environment Variable Missing Errors

**Error:**
```
Error: VITE_FIREBASE_API_KEY is not defined
```

**Cause:** Vite requires environment variables at build time.

**Solution:** Add env vars to workflow:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    VITE_FIREBASE_API_KEY: test-api-key
    VITE_FIREBASE_AUTH_DOMAIN: test-project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID: boletapp-d609f
    VITE_FIREBASE_STORAGE_BUCKET: test-project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789"
    VITE_FIREBASE_APP_ID: 1:123456789:web:test-app-id
    VITE_GEMINI_API_KEY: test-gemini-key
    VITE_GEMINI_MODEL: gemini-2.5-flash-preview-09-2025
```

**Local Fix:**
```bash
# Create .env.test with test values
cp .env.example .env.test

# Or export individually
export VITE_FIREBASE_API_KEY=test-key
```

---

### 5. Port Conflicts

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Cause:** Another process using the port (common: other dev servers).

**Solution 1:** Boletapp uses port 5174 to avoid conflicts:

```typescript
// vite.config.ts
server: {
  port: 5174
}
```

**Solution 2:** Kill conflicting processes:

```bash
# Find what's using the port
lsof -i :5173

# Kill it
kill -9 <PID>
```

---

### 6. Coverage Provider Compatibility

**Error:**
```
Error: No such built-in module: node:inspector/promises
```

**Cause:** `@vitest/coverage-v8` 4.x requires Node 20+ for V8 coverage.

**Solution:** Use Node 20 in CI:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
```

---

### 7. Playwright Test Failures

**Error:**
```
page.body().hidden === true
```

**Cause:** Page didn't render correctly due to build failure or missing config.

**Debug Steps:**

1. **Check if build works:**
   ```bash
   npm run build
   ```

2. **Run E2E locally with same env:**
   ```bash
   CI=true npm run test:e2e
   ```

3. **Check Playwright screenshots:**
   - Failed tests save screenshots to `test-results/`
   - Open and inspect the captured state

4. **Run with headed browser:**
   ```bash
   npx playwright test --headed
   ```

---

### 8. Test Timeout Issues

**Error:**
```
Timeout of 30000ms exceeded
```

**Cause:** Test took longer than allowed (slow network, slow build, race condition).

**Solution 1:** Increase timeout in config:

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000,  // 60 seconds
});
```

**Solution 2:** Add specific waits:

```typescript
await page.waitForSelector('.loading', { state: 'hidden' });
await page.waitForLoadState('networkidle');
```

---

## Workflow Debugging Techniques

### 1. Reading GitHub Actions Logs

```bash
# View recent workflow runs
gh run list --limit 5

# View specific run details
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Watch running workflow
gh run watch <run-id>
```

### 2. Enable Debug Logging

Add these secrets to your repository:

```
ACTIONS_STEP_DEBUG: true
ACTIONS_RUNNER_DEBUG: true
```

Or trigger with workflow dispatch:

```yaml
on:
  workflow_dispatch:
    inputs:
      debug_enabled:
        description: 'Enable debug logging'
        required: false
        default: 'false'
```

### 3. SSH into Runner (Self-Hosted Only)

For self-hosted runners, you can add an SSH step:

```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: ${{ failure() }}
```

### 4. Artifact Inspection

Download and inspect artifacts:

```bash
# List artifacts
gh run view <run-id> --json artifacts

# Download artifact
gh run download <run-id> -n coverage-report-html

# Extract and view
unzip coverage-report-html.zip
open coverage/index.html
```

## Local Testing Before Push

### Full CI Simulation

```bash
# 1. Run all tests (exactly like CI)
npm run test:all

# 2. Check TypeScript
npm run type-check

# 3. Verify build
npm run build

# 4. Run E2E with CI env
CI=true npm run test:e2e

# 5. Generate coverage
npm run test:coverage
```

### Quick Validation

```bash
# Fast check (30 seconds)
npm run test:unit && npm run type-check

# Medium check (2 minutes)
npm run test:all

# Full check (5 minutes)
npm run test:all && npm run build && npm run test:coverage
```

### Pre-Push Hook

Create `.husky/pre-push`:

```bash
#!/bin/sh
npm run test:unit
npm run type-check
```

## Real-World Debugging Examples

### Example 1: Story 2.6 - Node Version Issue

**Symptom:** Coverage step failed with "No such built-in module: node:inspector/promises"

**Investigation:**
1. Checked workflow logs - error in coverage step
2. Googled error - Node version issue
3. Checked workflow - was using Node 18
4. @vitest/coverage-v8 4.x needs Node 19+

**Fix:** Changed `node-version: '18'` to `node-version: '20'` in workflow.

---

### Example 2: Story 2.6 - Port Conflict

**Symptom:** E2E tests connected to wrong app (Ayni instead of Boletapp)

**Investigation:**
1. E2E tests passed but tested wrong app
2. Port 5173 was used by another project
3. Playwright connected to existing server

**Fix:** Changed Boletapp to use port 5174 in vite.config.ts and playwright.config.ts.

---

### Example 3: Story 2.6 - Missing Env Vars

**Symptom:** E2E tests showed "page body hidden"

**Investigation:**
1. Local tests passed, CI failed
2. Checked Playwright screenshots - blank page
3. App didn't build without VITE_* env vars

**Fix:** Added all required environment variables to workflow E2E step.

## Debugging Checklist

### Before Investigating

- [ ] Is this a new issue or regression?
- [ ] Did local tests pass before push?
- [ ] What changed since last successful run?
- [ ] Are other PRs/branches affected?

### Quick Checks

- [ ] Node version matches (v20)
- [ ] All dependencies installed (`npm ci`)
- [ ] Environment variables set
- [ ] Firebase emulator running
- [ ] Ports available (5174, 8080, 4000)

### Deep Investigation

- [ ] Download workflow logs
- [ ] Check artifact screenshots
- [ ] Reproduce locally with CI=true
- [ ] Run `act` for environment simulation
- [ ] Enable debug logging

### After Fixing

- [ ] Document the fix
- [ ] Add to this guide if it's a new issue type
- [ ] Consider adding tests to prevent regression
- [ ] Update workflow comments if needed

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [act Documentation](https://nektosact.com/)
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Vitest Documentation](https://vitest.dev/)

## Related Documentation

- [CI/CD Overview](./01-overview-why-cicd.md)
- [Local Testing](./03-local-testing.md)
- [Reading Workflow Logs](./04-reading-logs.md)
- [Best Practices](./05-best-practices.md)

---

**Document Version:** 1.0
**Created:** 2025-11-25
**Story:** 3.1 (Process & Governance Setup)
**Epic:** Production-Grade Quality & Testing Completion (Epic 3)
