# Plan B: Fixture-Based Staging Testing

**Status:** VERIFIED
**Date:** 2026-04-01
**Amended:** 2026-04-01 — 9 gaps addressed from `/gabe-roast adversarial-reviewer`
**Verified:** 2026-04-02 — Full pipeline tested on staging (DOBLE R fixture, 4 items, $23.660, coercion chain confirmed)
**Motivation:** Local Firebase emulators are unreliable on WSL2. Staging environment exists but burns Gemini credits and returns non-deterministic results. Need a way to test the full async pipeline (13 handoff points) with deterministic, free, fast responses.

## Problem Statement

The scan pipeline has 13 handoff points from image upload to UI render. Unit tests mock each side independently (the "mocking trap"). To test the actual chain, we need either:
- Firebase emulators (broken on WSL2 — Java issues, flaky Firestore, port conflicts)
- Real staging (works, but Gemini is non-deterministic, slow 30-40s per call, costs credits)

**Solution:** Keep the real staging environment for everything EXCEPT Gemini. Replace Gemini with a fixture lookup: same image always returns the same response, instantly, for free.

## Architecture

```
Normal flow:
  Client → queueReceiptScan CF → creates pending_scans doc →
  processReceiptScan CF → fetch images → CALL GEMINI → parse → write result

Fixture flow:
  Client → queueReceiptScan CF → creates pending_scans doc →
  processReceiptScan CF → fetch images → LOAD FIXTURE → parse → write result
                                         ^^^^^^^^^^^
                                    Only this step changes
```

Everything else stays real: real Firestore, real Storage, real listeners, real auth, real state management. This exercises all 13 handoff points.

## Changes Overview

| # | File | Change | Purpose |
|---|------|--------|---------|
| 1 | `functions/src/fixtureHelper.ts` | NEW — fixture loader | Load JSON fixtures by image hash or filename |
| 2 | `functions/src/processReceiptScan.ts` | Add fixture bypass before Gemini call | Skip Gemini when `SCAN_FIXTURE_MODE=true` |
| 3 | `functions/src/__tests__/fixtures/` | NEW — fixture JSON files | Deterministic Gemini responses from real scans |
| 4 | `functions/src/__tests__/fixtures/README.md` | NEW — fixture management docs | How to create, update, and use fixtures |
| 5 | `tests/e2e/staging/scan-async-pipeline.spec.ts` | NEW — E2E integration test | Full pipeline test using fixture mode |
| 6 | `functions/.env.staging` or deploy config | Set `SCAN_FIXTURE_MODE=true` on staging | Enable fixture mode in staging CFs |
| 7 | `prompt-testing/scripts/export-fixtures.ts` | NEW — fixture converter script | Convert existing `.expected.json` to CF fixture format |
| 8 | `firestore.staging.rules` | Add `scan_fixtures` deny rule | Explicit security rules for fixture collection |
| 9 | CI deploy pipeline | Add `SCAN_FIXTURE_MODE` production gate | Fail deploy if fixture mode set on production project |

## Detailed Changes

### Change 1: fixtureHelper.ts — Fixture Loader

**File:** `functions/src/fixtureHelper.ts` (NEW, ~60 lines)

```typescript
/**
 * Fixture Helper for deterministic scan testing.
 * When SCAN_FIXTURE_MODE=true, processReceiptScan returns raw fixture text
 * instead of calling Gemini. The full parse→coerce→validate chain still runs.
 *
 * Fixture resolution: Firestore scan_fixtures/{imageHash} only.
 * No fallback — unknown images fail loudly to catch missing/broken seeds.
 *
 * SECURITY: Hard-blocked on production project (M1).
 */

import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

/** Bump when coercion/validation logic changes. loadFixture rejects stale fixtures. */
export const FIXTURE_SCHEMA_VERSION = 1

const PRODUCTION_PROJECT = 'boletapp-d609f'

export function isFixtureMode(): boolean {
  // M1: Hard guard — never allow fixture mode on production, regardless of env var
  if (process.env.GCLOUD_PROJECT === PRODUCTION_PROJECT) {
    if (process.env.SCAN_FIXTURE_MODE === 'true') {
      console.error('FATAL: SCAN_FIXTURE_MODE enabled on production project — ignoring')
    }
    return false
  }
  return process.env.SCAN_FIXTURE_MODE === 'true'
}

// E1: Hash ALL image buffers concatenated, not just the first
export function computeImageHash(imageBuffers: Buffer[]): string {
  const combined = Buffer.concat(imageBuffers)
  return crypto.createHash('sha256').update(combined).digest('hex').slice(0, 16)
}

/**
 * Load raw Gemini response text from Firestore fixture.
 * Returns the raw string (may include markdown fences) — caller runs
 * the same clean→parse→coerce→validate chain as the real Gemini path.
 *
 * Throws on: missing fixture (M3), infra errors (E4), stale schema (E2).
 */
export async function loadFixture(imageBuffers: Buffer[]): Promise<string> {
  const hash = computeImageHash(imageBuffers)

  let fixtureDoc: admin.firestore.DocumentSnapshot
  try {
    // E4: Isolate Firestore infra errors from pipeline errors
    const db = admin.firestore()
    fixtureDoc = await db.doc(`scan_fixtures/${hash}`).get()
  } catch (err) {
    throw new Error(
      `Fixture infrastructure error for hash ${hash} — is scan_fixtures collection seeded? ` +
      `Original: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // M3: No fallback — unknown images fail loudly
  if (!fixtureDoc.exists) {
    throw new Error(
      `No fixture found for image hash ${hash}. ` +
      `Seed fixtures first: npx ts-node prompt-testing/scripts/export-fixtures.ts --seed-staging`
    )
  }

  const data = fixtureDoc.data()!

  // E2: Reject stale fixtures when schema changes
  const fixtureVersion = data.fixtureSchemaVersion ?? 0
  if (fixtureVersion < FIXTURE_SCHEMA_VERSION) {
    throw new Error(
      `Stale fixture for hash ${hash}: version ${fixtureVersion} < current ${FIXTURE_SCHEMA_VERSION}. ` +
      `Regenerate with: /scan-test generate`
    )
  }

  console.log(`fixtureHelper: loaded fixture for hash ${hash} (v${fixtureVersion})`)
  return data.rawGeminiResponse as string
}
```

**Key design decisions:**
- **Firestore-based lookup** (not filesystem) — CFs don't have reliable filesystem access to bundled JSON in deployed environments. Firestore `scan_fixtures` collection is accessible from deployed staging CFs.
- **All-image hash as key** — sha256 of ALL image buffers concatenated, truncated to 16 chars. Multi-image scans (especially credit card statements) produce unique hashes even when sharing a first page. (E1)
- **No fallback — fail loudly** — if no fixture exists for an image hash, `loadFixture` throws with a clear error and seeding instructions. This prevents "green test that tests nothing" when fixtures are missing or seeds are broken. (M3)
- **Raw Gemini text, not typed objects** — fixtures store the raw Gemini response string (including markdown fences). The full `clean→JSON.parse→coerceGeminiNumericFields→validateGeminiResult` chain runs on fixture data, exercising the exact coercion code that has had 4+ bugs. (M4)
- **Production hard guard** — `isFixtureMode()` checks `GCLOUD_PROJECT` and refuses to activate on production, even if the env var is set. Defense-in-depth against fat-finger deploys. (M1)
- **Schema versioning** — fixtures carry `fixtureSchemaVersion`. When coercion/validation logic changes, bump `FIXTURE_SCHEMA_VERSION` in code. Stale fixtures fail with regeneration instructions. (E2)
- **Infra error isolation** — Firestore read is wrapped in try-catch with a fixture-specific error message, so "fixture infrastructure broken" is never confused with "pipeline broken". (E4)
- **No bundled fixtures in deployed CFs** — Firestore is the source of truth for staging. Bundled fixtures are for unit tests only.

### Change 2: processReceiptScan.ts — Fixture Bypass

**File:** `functions/src/processReceiptScan.ts`
**Where:** Lines 239-296 (between "3. Fetch + resize/compress images" and "5. Generate thumbnail")
**What:** Insert fixture check before Gemini call

Insert after line 237 (`fullSizeBuffers.push(processed.buffer)`), before line 239 (`// 4. Call Gemini with retry`):

```typescript
      // 3b. Get raw Gemini response — from fixture or real API
      let text: string
      if (isFixtureMode()) {
        // Fixture path: raw Gemini text from Firestore (same format as real response)
        text = await loadFixture(fullSizeBuffers)
        console.log(`processReceiptScan: FIXTURE MODE — loaded fixture for scan ${scanId}`)
      } else {
        // 4. Call Gemini with retry (production path)
        const genAI = getGenAI()
        // ... existing Gemini call code ...
        const result = await withRetry(...)
        text = result.response.text()
      }

      // 5. Parse + coerce + validate (BOTH paths run this — M4)
      const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^```\s*/i, '')
        .trim()
      const rawParsed: unknown = JSON.parse(cleanedText)
      const coerced = coerceGeminiNumericFields(rawParsed as Record<string, unknown>)
      const diagnostic = validateGeminiResult(coerced)
      if (!diagnostic.valid) throw new Error('Receipt analysis returned unexpected format')
```

**Key change (M4):** The fixture replaces ONLY the Gemini HTTP call. The `text` variable is the raw response string. Everything after — markdown fence removal, JSON.parse, `coerceGeminiNumericFields`, `validateGeminiResult` — runs identically for both paths. This exercises the exact coercion code that has had 4+ bugs (null fields, price→totalPrice remap, empty items, Chilean number format).

**Import to add at top:**
```typescript
import { isFixtureMode, loadFixture } from './fixtureHelper'
```

**Security:** `isFixtureMode()` has a hard guard — returns `false` on production project regardless of env var (M1). The env var is also NEVER set in production deploy config.

### Change 3: Fixture JSON Files

**Directory:** `functions/src/__tests__/fixtures/` (NEW)

Convert existing `prompt-testing/test-cases/*.expected.json` files to fixture format. The fixture format stores the **raw Gemini response text** (M4) — including markdown fences, string-typed numbers, and Chilean formatting — so the full coercion chain is exercised:

```json
{
  "fixtureSchemaVersion": 1,
  "rawGeminiResponse": "```json\n{\n  \"merchant\": \"VETERINARIA ARAUCANIA LIMITADA\",\n  \"date\": \"2026-03-16\",\n  \"time\": \"18:25\",\n  \"total\": \"12.400\",\n  \"currency\": \"CLP\",\n  \"category\": \"Veterinary\",\n  \"items\": [\n    {\n      \"name\": \"CLINDABONE 165 MG X COMP\",\n      \"unitPrice\": \"1.550\",\n      \"price\": \"12.400\",\n      \"quantity\": 8,\n      \"category\": \"Medications\"\n    }\n  ],\n  \"metadata\": {\n    \"receiptType\": \"receipt\",\n    \"confidence\": 0.9\n  }\n}\n```",
  "sourceImage": "veterinaria-receipt.jpg",
  "createdFrom": "prompt-testing/test-cases/veterinaria-receipt.expected.json"
}
```

**Key format decisions (M4):**
- `rawGeminiResponse` is the literal Gemini output string — markdown fences included, numbers as Chilean-format strings (`"12.400"` not `12400`), `price` not `totalPrice`. This forces the coercion chain to run.
- `fixtureSchemaVersion` enables staleness detection (E2) — `loadFixture` rejects fixtures below current version.
- `sourceImage` and `createdFrom` are metadata for humans — not used by code.

**Source:** We have 15 existing `.expected.json` files in `prompt-testing/test-cases/`. The converter script (Change 7) wraps the raw Gemini text (not the post-coerced `aiExtraction`) into this format. For existing `.expected.json` that only have coerced data, the converter reconstructs raw format (strings for numbers, `price` for `totalPrice`).

### Change 4: Fixture Management README

**File:** `functions/src/__tests__/fixtures/README.md` (NEW)

Documents:
- How to create a fixture from a real Gemini response (store RAW text, not coerced)
- How to upload a fixture to staging Firestore (`scan_fixtures` collection)
- How to compute the image hash for a fixture (all images concatenated, not just first)
- Why there is no fallback — missing fixtures fail loudly with seeding instructions
- How `fixtureSchemaVersion` works and when to bump it
- How to run E2E tests with fixtures

### Change 5: E2E Integration Test

**File:** `tests/e2e/staging/scan-async-pipeline.spec.ts` (NEW, ~120 lines)

This is THE test that would have prevented the Epic 18 post-mortem. It exercises the full 13-point chain:

```typescript
import { test, expect } from '@playwright/test'
import { loginAsUser } from '../helpers/staging-helpers'

test.describe('Scan Async Pipeline (fixture mode)', () => {
  test('full chain: upload → queue → process → listener → UI shows result', async ({ page }) => {
    // 1. Login as test user
    await loginAsUser(page, 'alice')

    // 2. Navigate to scan (from dashboard or FAB)
    // 3. Select an image (use a known test image uploaded to staging Storage)
    // 4. Press "Escanear" button
    // 5. Wait for scan overlay to show "Processing..."
    // 6. Wait for overlay to transition to "Completed" (fixture responds instantly)
    // 7. Verify transaction editor appears with fixture data
    // 8. Verify merchant, total, items match fixture
    // 9. Verify thumbnail is visible (not broken)
    // 10. Save transaction
    // 11. Verify transaction appears in history
    // 12. Clean up: delete test transaction
  })

  test('scan failure: fixture returns error → credit refunded → retry works', async ({ page }) => {
    // Uses a special fixture that simulates Gemini failure
    // Verifies: error overlay → credit refund → retry button → success on retry
  })

  test('scan result delivery after navigation away', async ({ page }) => {
    // 1. Start scan
    // 2. Navigate away (to dashboard)
    // 3. Wait for scan to complete (fixture)
    // 4. Verify pending scan detection on return
    // 5. Verify result is delivered
  })
})
```

**Key details:**
- Uses `staging` Playwright project (TestUserMenu login, no global setup)
- Runs against `dev:staging` (local dev server pointing at staging Firebase)
- Fixture mode is enabled on staging CFs, so Gemini is never called
- Deterministic: same image → same fixture → same assertions every time
- Fast: no 30-40s Gemini wait, fixture responds in <100ms
- Free: no Gemini credits burned

### Change 6: Staging CF Configuration

Set the environment variable on staging Cloud Functions:

```bash
firebase -P staging functions:config:set scan.fixture_mode="true"
# OR for Gen 2 functions / .env-based config:
# Add SCAN_FIXTURE_MODE=true to functions/.env.staging
```

**AND seed the scan_fixtures collection in staging Firestore:**

```bash
# Script uploads fixture JSONs to staging Firestore
node prompt-testing/scripts/seed-fixtures.js --project staging
```

**CRITICAL:** This variable is NEVER set in production. The `isFixtureMode()` check returns `false` by default.

### Change 7: Fixture Converter Script

**File:** `prompt-testing/scripts/export-fixtures.ts` (NEW, ~60 lines)

Converts existing `.expected.json` files to raw fixture format and seeds them to staging Firestore:

```typescript
// For each test case:
// 1. Read ALL image files for that test case
// 2. Compute sha256 hash of concatenated buffers (first 16 chars) — E1
// 3. Reconstruct raw Gemini response text from .expected.json:
//    - Wrap in markdown fences (```json ... ```)
//    - Convert numbers back to Chilean string format ("12.400")
//    - Use "price" instead of "totalPrice" where applicable
// 4. Write to Firestore: scan_fixtures/{hash} = {
//      fixtureSchemaVersion: FIXTURE_SCHEMA_VERSION,
//      rawGeminiResponse: <raw text>,
//      sourceImage: <filename>,
//      createdFrom: <path>
//    }
//
// Usage: npx ts-node prompt-testing/scripts/export-fixtures.ts --seed-staging
```

**Leverages existing infrastructure:**
- 15 existing `.expected.json` files with real Gemini responses
- Same test images already in `prompt-testing/test-cases/`
- Staging Firebase credentials from `.env.staging`

**Note:** Existing `.expected.json` files contain post-coerced data. The converter must "un-coerce" to raw format (numbers→strings, totalPrice→price) so fixtures exercise the coercion chain. For future fixtures, capture the raw Gemini response directly via `/scan-test generate --raw`.

### Change 8: Firestore Security Rules (M2)

**File:** `firestore.staging.rules` (edit existing)

Add explicit deny rule for `scan_fixtures` collection. Default deny already blocks client access, but making it explicit documents intent and prevents accidental rule additions:

```
// Fixture collection — Admin SDK only, no client access ever
match /scan_fixtures/{fixtureId} {
  allow read, write: if false;
}
```

Add to both `firestore.rules` (production) and `firestore.staging.rules` (staging) for consistency. The collection won't exist in production, but the rule prevents accidental creation.

### Change 9: CI Production Gate (M1, S1)

Add to the Cloud Functions deploy pipeline (e.g., `deploy-functions.yml` or deploy script):

```bash
# M1: Block fixture mode on production
if [ "$FIREBASE_PROJECT" = "boletapp-d609f" ]; then
  if firebase functions:config:get scan.fixture_mode 2>/dev/null | grep -q "true"; then
    echo "FATAL: SCAN_FIXTURE_MODE is enabled on production. Aborting deploy."
    exit 1
  fi
fi

# S1: Ensure new test cases have corresponding fixtures
NEW_EXPECTED=$(git diff --name-only HEAD~1 -- 'prompt-testing/test-cases/*.expected.json')
if [ -n "$NEW_EXPECTED" ]; then
  echo "New .expected.json files detected. Verify fixtures are seeded:"
  echo "$NEW_EXPECTED"
  # Optional: run export-fixtures.ts --dry-run to validate
fi
```

## What This Exercises vs What It Doesn't

### Full chain exercised (with fixtures):
1. Image selection in UI
2. Image upload to Firebase Storage
3. `queueReceiptScan` callable (credit deduction, doc creation)
4. `processReceiptScan` trigger fires
5. Image fetch from Storage
6. **Fixture lookup** (replaces Gemini HTTP call only)
7. Markdown cleanup + JSON.parse + coerceGeminiNumericFields + validateGeminiResult (SAME code path — M4)
8. Thumbnail generation + upload
9. Firestore doc update (status=completed, result data)
10. `usePendingScan` onSnapshot listener fires
11. `handlePendingScanCompleted` callback
12. `processScan` with asyncResult
13. Transaction editor renders with data

### NOT exercised (need separate tests):
- Gemini prompt quality / parsing accuracy → keep existing `/scan-test` harness
- Gemini error modes (rate limits, malformed JSON) → unit tests with mocked Gemini
- New receipt formats → manual testing with real Gemini

## Migration Path (Emulators → Staging)

| What | Before (emulator) | After (staging + fixtures) |
|------|-------|------|
| Firestore | Local emulator (flaky WSL2) | Real staging Firestore |
| Auth | Local emulator | TestUserMenu (alice/bob/charlie/diana) |
| Cloud Functions | Local emulator | Deployed staging CFs |
| Gemini | Not testable | Fixture-based (deterministic, free, fast) |
| Storage | Local emulator | Real staging Storage |
| CI setup | Java + emulator JARs (~25s) | Just Playwright + staging URL |
| Determinism | Depends on emulator state | Fixtures = same input → same output |

## Fixture Library Growth Strategy

Every bug becomes a fixture:
- **Null fields bug (TD-18-4):** Fixture with `date: null, merchant: null` → tests coercion
- **price→totalPrice (1094c5b6):** Fixture with `price` field (no `totalPrice`) → tests remap
- **Empty items (efe50ef1):** Fixture with `items: []` → tests empty handling
- **Chilean thousands (parseGeminiNumber):** Fixture with `"total": "15.990"` → tests coercion

As the fixture library grows, it becomes a regression suite that prevents all known bugs from recurring.

## Estimated Effort

| Change | Files | Lines | Effort |
|--------|-------|-------|--------|
| fixtureHelper.ts | 1 new | ~80 | Small |
| processReceiptScan.ts | 1 edit | ~15 lines changed | Small |
| Fixture JSON files | 15 converted | ~40 each | Script |
| E2E test | 1 new | ~120 | Medium |
| Converter script | 1 new | ~60 | Small |
| Staging config | Deploy command | 1 line | Trivial |
| README | 1 new | ~40 | Small |

**Total:** ~2-3 hours for a developer familiar with the codebase. Can be split into:
- Session 1: fixtureHelper + processReceiptScan edit + unit tests (~1h)
- Session 2: E2E test + staging deploy + fixture seeding (~1.5h)

## Verification

1. Deploy fixture-mode CFs to staging
2. Seed fixtures to staging Firestore
3. Run `npm run dev:staging` locally
4. Open app, login as alice, scan an image
5. Verify: instant result (no 30s wait), correct fixture data in editor
6. Run E2E test: `npx playwright test tests/e2e/staging/scan-async-pipeline.spec.ts --project=staging`
7. Verify: all assertions pass, no Gemini credits consumed

## Risks and Mitigations (post adversarial review)

All 9 gaps from the `/gabe-roast adversarial-reviewer` have been addressed in-plan:

| Gap | Risk | Mitigation | Status |
|-----|------|------------|--------|
| M1 | Fixture mode leaks to production | `isFixtureMode()` hard guard on `GCLOUD_PROJECT` + CI deploy gate (Change 9) | Designed |
| M2 | `scan_fixtures` has no security rules | Explicit deny rules in both rule files (Change 8) | Designed |
| M3 | Fallback fixture hides broken seeds | No fallback — `loadFixture` throws with seeding instructions | Designed |
| M4 | Fixtures bypass coercion chain | Raw Gemini text stored, full parse→coerce→validate runs | Designed |
| E1 | First-image-only hash fails multi-image | `Buffer.concat(imageBuffers)` hash | Designed |
| E2 | Fixtures go stale silently | `fixtureSchemaVersion` field + version check in loader | Designed |
| E3 | Fallback had dynamic date | Moot — fallback removed (M3) | Resolved |
| E4 | Firestore error confused with pipeline error | Try-catch with infra-specific error message | Designed |
| S1 | No fixture lifecycle management | CI check for new `.expected.json` → fixture correspondence (Change 9) | Designed |

**Residual risks (accepted):**
- **Coercion "un-coercing" in converter:** Existing `.expected.json` files have post-coerced data. The converter must reconstruct raw format, which may not perfectly match real Gemini output. Mitigate by capturing raw responses directly for new fixtures via `/scan-test generate --raw`.
- **Gemini prompt changes:** Fixtures don't catch new Gemini output formats. Mitigate with periodic canary scans (one real Gemini call against a known image, compared to fixture).
