/**
 * Fixture Helper for deterministic scan testing (Plan B).
 *
 * When SCAN_FIXTURE_MODE=true, processReceiptScan returns raw fixture text
 * instead of calling Gemini. The full parse->coerce->validate chain still runs.
 *
 * Fixture resolution: Firestore scan_fixtures/{imageHash} only.
 * No fallback -- unknown images fail loudly to catch missing/broken seeds.
 *
 * SECURITY: Hard-blocked on production project (M1).
 */

import * as admin from 'firebase-admin'
import { createHash } from 'crypto'

/** Bump when coercion/validation logic changes. loadFixture rejects stale fixtures. */
export const FIXTURE_SCHEMA_VERSION = 1

const PRODUCTION_PROJECT = 'boletapp-d609f'

export function isFixtureMode(): boolean {
  // M1: Hard guard -- never allow fixture mode on production, regardless of env var
  if (process.env.GCLOUD_PROJECT === PRODUCTION_PROJECT) {
    if (process.env.SCAN_FIXTURE_MODE === 'true') {
      console.error('FATAL: SCAN_FIXTURE_MODE enabled on production project -- ignoring')
    }
    return false
  }
  return process.env.SCAN_FIXTURE_MODE === 'true'
}

// E1: Hash ALL image buffers concatenated, not just the first
export function computeImageHash(imageBuffers: Buffer[]): string {
  const combined = Buffer.concat(imageBuffers)
  return createHash('sha256').update(combined).digest('hex').slice(0, 16)
}

/**
 * Load raw Gemini response text from Firestore fixture.
 * Returns the raw string (may include markdown fences) -- caller runs
 * the same clean->parse->coerce->validate chain as the real Gemini path.
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
      `Fixture infrastructure error for hash ${hash} -- is scan_fixtures collection seeded? ` +
      `Original: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // M3: No fallback -- unknown images fail loudly
  if (!fixtureDoc.exists) {
    throw new Error(
      `No fixture found for image hash ${hash}. ` +
      `Seed fixtures first: npx ts-node prompt-testing/scripts/export-fixtures.ts --seed-staging`
    )
  }

  const data = fixtureDoc.data()!

  // E2: Reject stale fixtures when schema changes
  const fixtureVersion = (data.fixtureSchemaVersion as number | undefined) ?? 0
  if (fixtureVersion < FIXTURE_SCHEMA_VERSION) {
    throw new Error(
      `Stale fixture for hash ${hash}: version ${fixtureVersion} < current ${FIXTURE_SCHEMA_VERSION}. ` +
      `Regenerate with: /scan-test generate`
    )
  }

  console.log(`fixtureHelper: loaded fixture for hash ${hash} (v${fixtureVersion})`)
  return data.rawGeminiResponse as string
}
