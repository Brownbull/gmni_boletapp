# Story 8.1 Deployment Notes

**Date:** 2025-12-11
**Story:** Shared Prompts Library + Image Pre-Processing Optimization
**Deployment Duration:** ~45 minutes (expected: ~10 minutes)

## Summary

This deployment took significantly longer than expected due to multiple CI infrastructure issues that had to be resolved iteratively. The actual code changes were straightforward, but the CI pipeline revealed several environment mismatches.

## Timeline of Issues

### Issue 1: TypeScript Output Directory Structure
**Problem:** Adding `../shared` to `functions/tsconfig.json` include caused TypeScript to output files in a nested structure (`lib/functions/src/analyzeReceipt.js`) instead of the expected flat structure (`lib/analyzeReceipt.js`).

**Symptom:** Integration tests failed with:
```
Error: ENOENT: no such file or directory, open 'functions/lib/analyzeReceipt.js'
```

**Root Cause:** When TypeScript's `include` array spans multiple parent directories (`src` and `../shared`), it creates a common root and outputs files relative to that, resulting in nested output directories.

**Solution:** Used a `prebuild` script in `functions/package.json` to copy `shared/prompts/` into `functions/src/prompts/` before compilation:
```json
"prebuild": "rm -rf src/prompts && cp -r ../shared/prompts src/prompts"
```

Then updated the import path in `analyzeReceipt.ts`:
```typescript
// Before: import { ACTIVE_PROMPT } from '../../shared/prompts'
// After:  import { ACTIVE_PROMPT } from './prompts'
```

Added `src/prompts/` to `functions/.gitignore` since it's now a build artifact.

**CI Runs Wasted:** 2

---

### Issue 2: Integration Test Assertion Mismatch
**Problem:** Integration test expected `processReceiptImages` function in compiled output, but the refactored code uses `resizeAndCompress` and `generateThumbnail` directly.

**Symptom:**
```
AssertionError: expected '"use strict";\nvar __createBinding...' to contain 'processReceiptImages'
```

**Root Cause:** Test was checking for old function name that was replaced during the image pre-processing optimization refactor.

**Solution:** Updated test in `tests/integration/image-storage.test.tsx`:
```typescript
// Before: expect(content).toContain('processReceiptImages')
// After:  expect(content).toContain('resizeAndCompress')
//         expect(content).toContain('generateThumbnail')
```

**CI Runs Wasted:** 1

---

### Issue 3: Firebase Emulator Java Version
**Problem:** Firebase emulators failed to start because GitHub Actions runner had Java version < 21.

**Symptom:**
```
Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime.
```

**Root Cause:** `firebase-tools` CLI updated to require Java 21+, but CI workflow didn't specify Java version.

**Solution:** Added Java 21 setup step in `.github/workflows/test.yml`:
```yaml
- name: Setup Java 21
  uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '21'
```

**CI Runs Wasted:** 2

---

### Issue 4: Emulator Startup Race Condition
**Problem:** Integration tests started before Firebase emulators were fully ready.

**Symptom:**
```
FetchError: request to http://localhost:8080/emulator/v1/projects/boletapp-d609f:securityRules failed, reason:
```

**Root Cause:** CI only checked Emulator Hub (port 4000) but not Firestore emulator (port 8080). The Hub becomes ready before Firestore.

**Solution:** Extended emulator startup check to verify both ports:
```yaml
for i in {1..60}; do
  HUB_READY=$(curl -s http://localhost:4000 > /dev/null && echo "yes" || echo "no")
  FIRESTORE_READY=$(curl -s http://localhost:8080 > /dev/null && echo "yes" || echo "no")
  if [ "$HUB_READY" = "yes" ] && [ "$FIRESTORE_READY" = "yes" ]; then
    echo "Firebase emulators ready!"
    sleep 3  # Additional stability wait
    break
  fi
  sleep 1
done
```

**CI Runs Wasted:** 1 (combined with Java issue)

---

## Total CI Runs

| Run # | Result | Issues Found |
|-------|--------|--------------|
| 1 | Failed | TypeScript output structure |
| 2 | Failed | TypeScript output structure (different fix attempt) |
| 3 | Failed | Integration test assertion |
| 4 | Failed | Java version + emulator startup |
| 5 | Failed | Still emulator issues (Java added but not fully working) |
| 6 | **Passed** | All issues resolved |

**Total:** 6 CI runs for feature branch, plus 2 more for develop→staging→main PRs

---

## Lessons Learned

### 1. Test CI Changes Locally First
The TypeScript output structure issue could have been caught by running `npm run build && ls -la lib/` locally before pushing.

### 2. Keep Integration Tests Updated with Refactors
When refactoring function names/structure, search for tests that assert on compiled output content.

### 3. CI Environment Drift is Real
Dependencies like `firebase-tools` update their requirements (Java 21). CI workflows need periodic review.

### 4. Emulator Readiness is Multi-Port
Firebase emulators have multiple services on different ports. Check ALL required ports before running tests.

### 5. Include All Ports in Startup Checks
```
- Emulator Hub: 4000
- Firestore: 8080
- Auth: 9099
- Storage: 9199
```

---

## Recommendations for Future

1. **Add pre-push hook** that runs `npm run build` in functions/ directory
2. **Document Java requirement** in README or setup guide
3. **Add CI workflow test** - a simple PR that just runs CI to verify infrastructure
4. **Consider caching Java** in CI to speed up runs

---

## Files Changed in Deployment Fixes

1. `functions/package.json` - Added prebuild script
2. `functions/tsconfig.json` - Removed `../shared` from include, added es2021 target
3. `functions/src/analyzeReceipt.ts` - Updated import path
4. `functions/.gitignore` - Added `src/prompts/`
5. `tests/integration/image-storage.test.tsx` - Updated assertion
6. `.github/workflows/test.yml` - Added Java 21, improved emulator startup

---

## PRs Created

- **PR #40:** feature/epic8-story-8.1-shared-prompts-library → develop
- **PR #41:** develop → staging
- **PR #42:** staging → main (triggered production deploy)

**Production URL:** https://boletapp-d609f.web.app
