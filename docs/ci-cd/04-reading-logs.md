# Reading Workflow Logs: Debug When Things Fail

When a GitHub Actions workflow fails, you need to read the logs to understand what went wrong. This guide shows you how.

## Quick Access

### Via GitHub Web UI

1. Go to your repo: `https://github.com/Brownbull/gmni_boletapp`
2. Click **Actions** tab
3. Click on the failed workflow run
4. Click on the failed job (`test`)
5. Click on the failed step (marked with ❌)

### Via GitHub CLI

```bash
# List recent runs
gh run list --limit 5

# View specific run
gh run view <run-id>

# View only failed logs
gh run view <run-id> --log-failed

# Watch a running workflow
gh run watch <run-id>
```

## Understanding the Logs

### Log Structure

Logs are organized hierarchically:

```
Workflow: Test Suite
  └─ Job: test
      └─ Step 1: Checkout repository
      └─ Step 2: Setup Node.js
      └─ Step 3: Cache dependencies
      └─ Step 4: Install dependencies
      └─ Step 5: Install Firebase CLI
      └─ Step 6: Install Playwright browsers
      └─ Step 7: Start Firebase emulators
      └─ Step 8: Run unit tests ❌ FAILED
      └─ Step 9: Run integration tests (skipped)
      └─ ...
```

**Key points:**
- Steps run in order (1, 2, 3, ...)
- If a step fails, remaining steps are skipped
- Look for the first ❌ to find the root cause

### Log Timestamps

Each log line has a timestamp:

```
2025-11-23T15:19:01.8730351Z npm run test:e2e
```

**Time format:** UTC (Coordinated Universal Time)
- Convert to your timezone if needed
- Useful for debugging timing issues
- Shows how long each step takes

### Log Groups

Logs can be collapsed/expanded:

```
##[group]Run npm run test:e2e
npm run test:e2e
##[endgroup]
```

Click the `▶` arrow to expand collapsed sections.

## Reading Different Types of Failures

### 1. Test Failures

**What it looks like:**
```
test	Run unit tests	2025-11-23T15:19:01.8730351Z
test	Run unit tests	2025-11-23T15:19:01.8730638Z > boletapp@0.0.0 test:unit
test	Run unit tests	2025-11-23T15:19:01.8731080Z > vitest run tests/unit
test	Run unit tests	2025-11-23T15:19:02.8789639Z
test	Run unit tests	2025-11-23T15:19:02.8790851Z  FAIL  tests/unit/validation.test.ts
test	Run unit tests	2025-11-23T15:19:02.8791234Z   ● parsePrice › should handle negative numbers
test	Run unit tests	2025-11-23T15:19:02.8791567Z
test	Run unit tests	2025-11-23T15:19:02.8791890Z     expect(received).toBe(expected) // Object.is equality
test	Run unit tests	2025-11-23T15:19:02.8792123Z
test	Run unit tests	2025-11-23T15:19:02.8792345Z     Expected: -10.5
test	Run unit tests	2025-11-23T15:19:02.8792567Z     Received: 10.5
test	Run unit tests	2025-11-23T15:19:02.8792789Z
test	Run unit tests	2025-11-23T15:19:02.8793012Z       at tests/unit/validation.test.ts:42:25
```

**How to read it:**
1. **Test file:** `tests/unit/validation.test.ts`
2. **Test description:** `parsePrice › should handle negative numbers`
3. **Failure reason:** Expected `-10.5`, got `10.5`
4. **Line number:** Line 42 in the test file

**What to do:**
- Open the test file at the line number
- Check what the test is testing
- Fix the code or the test
- Run locally: `npm run test:unit`

### 2. Build Errors

**What it looks like:**
```
test	Run unit tests	2025-11-23T15:19:02.8789639Z
test	Run unit tests	2025-11-23T15:19:02.8790851Z Error: Cannot find module './nonexistent.ts'
test	Run unit tests	2025-11-23T15:19:02.8791234Z     at Module._resolveFilename (node:internal/modules/cjs/loader:1090:15)
test	Run unit tests	2025-11-23T15:19:02.8791567Z     at Module._load (node:internal/modules/cjs/loader:934:27)
test	Run unit tests	2025-11-23T15:19:02.8791890Z     at Module.require (node:internal/modules/cjs/loader:1157:19)
```

**How to read it:**
1. **Error type:** `Cannot find module`
2. **Missing file:** `'./nonexistent.ts'`
3. **Stack trace:** Shows where the import failed

**What to do:**
- Check if the file exists
- Verify the import path is correct
- Check for typos in filenames
- Ensure file is committed to git

### 3. Environment Errors

**What it looks like:**
```
test	Run E2E tests	2025-11-23T15:33:42.9683404Z Error: Page body was "hidden"
test	Run E2E tests	2025-11-23T15:33:42.9684078Z     Expected: visible
test	Run E2E tests	2025-11-23T15:33:42.9684456Z     Received: hidden
```

**Why this happens:**
- Missing environment variables
- App failed to load
- Build error not caught earlier

**How to debug:**
```bash
# Check what env vars the app needs
grep VITE_ src/config/*.ts

# Look earlier in logs for build errors
# Search for: "Error:", "Failed", "Cannot"
```

**What to do:**
- Add missing env vars to workflow
- Check if app builds locally
- Review Vite build output

### 4. Port Conflicts

**What it looks like:**
```
test	Run E2E tests	2025-11-23T15:19:02.8789639Z
test	Run E2E tests	2025-11-23T15:19:02.8790851Z Error: http://localhost:5174 is already used
test	Run E2E tests	2025-11-23T15:19:02.8791234Z make sure that nothing is running on the port
```

**Why this happens:**
- Two processes trying to use same port
- Workflow starts server twice
- Previous process didn't stop

**What to do:**
- Check which step starts the server
- Ensure only one server starts
- Let Playwright manage its own server
- Add cleanup between steps

### 5. Module Not Found Errors

**What it looks like:**
```
test	Generate coverage	2025-11-23T15:58:33.3322929Z Error: No such built-in module: node:inspector/promises
test	Generate coverage	2025-11-23T15:58:33.3337290Z Serialized Error: { code: 'ERR_UNKNOWN_BUILTIN_MODULE' }
```

**Why this happens:**
- Node.js version mismatch
- Missing system module
- Package incompatibility

**What to do:**
- Check Node.js version in workflow
- Compare with package requirements
- Upgrade Node.js version if needed

### 6. Timeout Errors

**What it looks like:**
```
test	Run E2E tests	2025-11-23T15:19:02.8789639Z
test	Run E2E tests	2025-11-23T15:19:02.8790851Z Timeout: Exceeded 30000ms
test	Run E2E tests	2025-11-23T15:19:02.8791234Z Expected element to be visible
```

**Why this happens:**
- Service didn't start in time
- Page load too slow
- Test expectations too strict

**What to do:**
- Increase timeout in config
- Add health checks for services
- Use `waitFor` instead of fixed delays

## Real-World Example: Story 2.6 Failures

### Failure #1: Port Conflict

**Error:**
```
Error: http://localhost:5174 is already used, make sure that nothing is running on the port
```

**Root cause:**
- Workflow Step 10 started dev server manually
- Playwright config also starts dev server
- Both tried to use port 5174

**How we found it:**
1. Searched logs for "Error:"
2. Found port conflict message
3. Checked workflow steps 9-11
4. Noticed redundant server start

**Fix:**
```yaml
# Before (broken):
- name: Start Vite dev server
  run: npm run dev &

- name: Run E2E tests
  run: npm run test:e2e

# After (fixed):
- name: Run E2E tests  # Playwright manages server
  run: npm run test:e2e
```

### Failure #2: Missing Environment Variables

**Error:**
```
Error: Page body was "hidden"
Expected: visible
Received: hidden
```

**Root cause:**
- Vite needs Firebase env vars to build
- Env vars not set in CI
- App failed to load

**How we found it:**
1. Error was vague ("body hidden")
2. Checked earlier build logs
3. No build errors (suspicious!)
4. Realized env vars missing

**Fix:**
```yaml
- name: Run E2E tests
  env:
    VITE_FIREBASE_API_KEY: test-key
    VITE_FIREBASE_AUTH_DOMAIN: test.firebaseapp.com
    # ... all required vars
```

### Failure #3: Node.js Version

**Error:**
```
Error: No such built-in module: node:inspector/promises
```

**Root cause:**
- Workflow used Node 18
- Vitest coverage needs Node 19+
- `node:inspector/promises` added in Node 19

**How we found it:**
1. Googled the error message
2. Found: "node:inspector/promises requires Node 19+"
3. Checked workflow: `node-version: '18'`

**Fix:**
```yaml
# Before:
node-version: '18'

# After:
node-version: '20'  # Current LTS
```

### Failure #4: Framework Conflict

**Error:**
```
Error: Playwright Test did not expect test.describe() to be called here
```

**Root cause:**
- Coverage command ran all tests
- Included E2E tests (Playwright)
- Vitest can't run Playwright tests

**How we found it:**
1. Error mentioned Playwright in Vitest context
2. Checked coverage command: `vitest run --coverage`
3. Realized it ran tests/e2e/**/*.spec.ts

**Fix:**
```json
{
  "scripts": {
    "test:coverage": "vitest run tests/unit tests/integration --coverage"
  }
}
```

## Debugging Strategies

### Strategy 1: Binary Search

When you don't know which step fails:

1. **Look at the first ❌**
   - This is usually the root cause
   - Later failures are often consequences

2. **Ignore unrelated errors**
   - Skip warnings
   - Focus on actual errors

3. **Work backwards if needed**
   - Start from the failure
   - Check what happened before it

### Strategy 2: Compare with Successful Runs

If tests passed before:

1. **Find the last successful run**
   ```bash
   gh run list --status success --limit 1
   ```

2. **Compare the changes**
   ```bash
   git diff <last-good-commit> HEAD
   ```

3. **Look for:**
   - Dependency changes (`package.json`)
   - Config changes (`.github/workflows/`)
   - Environment changes (env vars)

### Strategy 3: Reproduce Locally

Most CI failures can be reproduced locally:

1. **Use the same commands**
   ```bash
   # Copy from failed step
   npm run test:e2e
   ```

2. **Use the same environment**
   ```bash
   CI=true npm run test:e2e
   ```

3. **Use the same Node version**
   ```bash
   nvm use 20
   npm run test:e2e
   ```

### Strategy 4: Check Artifacts

Some workflows upload debugging artifacts:

1. **Go to failed run**
2. **Scroll to bottom**
3. **Download artifacts**
   - Screenshots
   - Coverage reports
   - Logs

**Via CLI:**
```bash
gh run download <run-id>
```

## Common Search Patterns

### Finding the Error

```bash
# Via GitHub CLI
gh run view <run-id> --log-failed | grep -i "error"
gh run view <run-id> --log-failed | grep -i "failed"
gh run view <run-id> --log-failed | grep -A 10 "Error:"

# In web UI
Ctrl+F (or Cmd+F) → search "Error"
```

### Finding Specific Test

```bash
# Search for test name
gh run view <run-id> --log | grep "should handle negative numbers"

# Search for file name
gh run view <run-id> --log | grep "validation.test.ts"
```

### Finding Timing Issues

```bash
# Find how long a step took
gh run view <run-id> --log | grep "Duration"

# Find timeout errors
gh run view <run-id> --log | grep -i "timeout"
```

## Log Reading Checklist

When a workflow fails:

### 1. Identify Which Step Failed
```
✅ Check workflow summary
✅ Find first ❌ step
✅ Note the step number and name
```

### 2. Read the Error Message
```
✅ Expand the failed step logs
✅ Find the actual error (search "Error:")
✅ Read the full error message
✅ Note any file names or line numbers
```

### 3. Understand the Context
```
✅ What was the step trying to do?
✅ What changed since last successful run?
✅ Is this a new test or existing test?
```

### 4. Reproduce Locally
```
✅ Run the same command locally
✅ Use same environment (CI=true)
✅ Check if it reproduces
```

### 5. Fix and Verify
```
✅ Make the fix
✅ Test locally
✅ Push and verify CI passes
```

## Pro Tips

### Tip 1: Enable Debug Logging

Add to workflow for more verbose logs:

```yaml
- name: Run tests
  run: npm run test:unit
  env:
    DEBUG: '*'
    VITEST_DEBUG: 'true'
```

### Tip 2: Add Echo Statements

Debug specific steps:

```yaml
- name: Check environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Current directory: $(pwd)"
    echo "Files: $(ls -la)"
```

### Tip 3: Use Step Summaries

Add summaries to failed steps:

```yaml
- name: Run tests
  run: npm run test:unit || echo "::error::Unit tests failed"
```

### Tip 4: Save Logs as Artifacts

Persist logs for later review:

```yaml
- name: Upload test logs
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: test-logs
    path: |
      test-results/
      playwright-report/
```

## Next Steps

- **[Best Practices](./05-best-practices.md)** - Prevent failures
- **[Troubleshooting](./troubleshooting.md)** - Common issues
- **[Local Testing](./03-local-testing.md)** - Catch errors early

---

**Remember:** The first error is usually the root cause. Fix that, and the rest often resolves itself!
