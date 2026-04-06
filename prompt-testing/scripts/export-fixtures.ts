#!/usr/bin/env npx ts-node
/**
 * Export Fixtures — Convert test cases to Firestore fixture format and seed staging.
 *
 * Reads two types of test cases:
 * 1. Regular: .expected.json (un-coerces aiExtraction to raw Gemini format)
 * 2. Adversarial: .fixture.json (already in raw format, targets specific bug patterns)
 *
 * Usage:
 *   npx ts-node prompt-testing/scripts/export-fixtures.ts              # Dry run (show what would be seeded)
 *   npx ts-node prompt-testing/scripts/export-fixtures.ts --seed-staging  # Seed to staging Firestore
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS pointing to staging service account,
 * or run after: firebase login && firebase use boletapp-staging
 */

import { createHash } from 'crypto'
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

// Match fixtureHelper.ts FIXTURE_SCHEMA_VERSION
const FIXTURE_SCHEMA_VERSION = 1

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '../..')
const TEST_CASES_DIR = join(PROJECT_ROOT, 'prompt-testing/test-cases')
const OUTPUT_DIR = join(PROJECT_ROOT, 'prompt-testing/fixtures-output')

// ─── Hash computation (matches fixtureHelper.ts) ────────────────────────

function computeImageHash(imageBuffers: Buffer[]): string {
  const combined = Buffer.concat(imageBuffers)
  return createHash('sha256').update(combined).digest('hex').slice(0, 16)
}

// ─── Chilean number un-coercion ─────────────────────────────────────────

/**
 * Convert a number to Chilean thousands-separated string format.
 * 12400 → "12.400", 1500 → "1.500", 100 → "100"
 */
function toChileanString(n: number): string {
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Un-coerce an aiExtraction object back to raw Gemini response format.
 * Converts numbers to Chilean-format strings so the coercion chain is exercised.
 */
function unCoerceToRawGemini(aiExtraction: Record<string, unknown>): Record<string, unknown> {
  const raw: Record<string, unknown> = { ...aiExtraction }

  // Convert total to Chilean string
  if (typeof raw.total === 'number') {
    raw.total = toChileanString(raw.total)
  }

  // Convert items
  if (Array.isArray(raw.items)) {
    raw.items = raw.items.map((item: Record<string, unknown>) => {
      const rawItem: Record<string, unknown> = { ...item }

      if (typeof rawItem.totalPrice === 'number') {
        rawItem.totalPrice = toChileanString(rawItem.totalPrice)
      }
      if (typeof rawItem.unitPrice === 'number') {
        rawItem.unitPrice = toChileanString(rawItem.unitPrice)
      }

      // Remove null subcategory (Gemini doesn't always include it)
      if (rawItem.subcategory === null) {
        delete rawItem.subcategory
      }

      return rawItem
    })
  }

  // Remove fields that aren't in raw Gemini output
  delete raw.model
  delete raw.modelVersion
  delete raw.promptId
  delete raw.promptVersion
  delete raw.extractedAt
  // Rename aiMetadata → metadata if present
  if (raw.aiMetadata && !raw.metadata) {
    raw.metadata = raw.aiMetadata
    delete raw.aiMetadata
  }

  return raw
}

/**
 * Wrap a JSON object in markdown fences (simulating raw Gemini output).
 */
function wrapInMarkdownFences(obj: Record<string, unknown>): string {
  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```'
}

// ─── Test case discovery ────────────────────────────────────────────────

interface FixtureEntry {
  hash: string
  fixtureDoc: {
    fixtureSchemaVersion: number
    rawGeminiResponse: string
    sourceImage: string
    createdFrom: string
  }
  type: 'regular' | 'adversarial'
  imagePath: string
}

function findImageForExpected(expectedPath: string): string | null {
  const dir = dirname(expectedPath)
  const base = basename(expectedPath, '.expected.json')
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const imgPath = join(dir, base + ext)
    if (existsSync(imgPath)) return imgPath
  }
  return null
}

function findImageForFixture(fixturePath: string): string | null {
  const dir = dirname(fixturePath)
  const base = basename(fixturePath, '.fixture.json')
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const imgPath = join(dir, base + ext)
    if (existsSync(imgPath)) return imgPath
  }
  return null
}

function walkDir(dir: string, pattern: RegExp): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...walkDir(full, pattern))
    } else if (pattern.test(entry)) {
      results.push(full)
    }
  }
  return results
}

function discoverFixtures(): FixtureEntry[] {
  const entries: FixtureEntry[] = []

  // 1. Regular test cases: .expected.json → un-coerce to raw format
  const expectedFiles = walkDir(TEST_CASES_DIR, /\.expected\.json$/)
  for (const expectedPath of expectedFiles) {
    const imagePath = findImageForExpected(expectedPath)
    if (!imagePath) {
      console.warn(`SKIP: no image found for ${relative(PROJECT_ROOT, expectedPath)}`)
      continue
    }

    const expectedData = JSON.parse(readFileSync(expectedPath, 'utf-8'))
    const aiExtraction = expectedData.aiExtraction
    if (!aiExtraction) {
      console.warn(`SKIP: no aiExtraction in ${relative(PROJECT_ROOT, expectedPath)}`)
      continue
    }

    const imageBuffer = readFileSync(imagePath)
    const hash = computeImageHash([imageBuffer])
    const rawObj = unCoerceToRawGemini(aiExtraction)
    const rawGeminiResponse = wrapInMarkdownFences(rawObj)

    entries.push({
      hash,
      fixtureDoc: {
        fixtureSchemaVersion: FIXTURE_SCHEMA_VERSION,
        rawGeminiResponse,
        sourceImage: relative(TEST_CASES_DIR, imagePath),
        createdFrom: relative(PROJECT_ROOT, expectedPath),
      },
      type: 'regular',
      imagePath,
    })
  }

  // 2. Adversarial test cases: .fixture.json → already in correct format
  const fixtureFiles = walkDir(TEST_CASES_DIR, /\.fixture\.json$/)
  for (const fixturePath of fixtureFiles) {
    const imagePath = findImageForFixture(fixturePath)
    if (!imagePath) {
      console.warn(`SKIP: no image found for ${relative(PROJECT_ROOT, fixturePath)}`)
      continue
    }

    const fixtureData = JSON.parse(readFileSync(fixturePath, 'utf-8'))
    const imageBuffer = readFileSync(imagePath)
    const hash = computeImageHash([imageBuffer])

    entries.push({
      hash,
      fixtureDoc: {
        fixtureSchemaVersion: fixtureData.fixtureSchemaVersion ?? FIXTURE_SCHEMA_VERSION,
        rawGeminiResponse: fixtureData.rawGeminiResponse,
        sourceImage: fixtureData.sourceImage ?? relative(TEST_CASES_DIR, imagePath),
        createdFrom: fixtureData.createdFrom ?? relative(PROJECT_ROOT, fixturePath),
      },
      type: 'adversarial',
      imagePath,
    })
  }

  return entries
}

// ─── Seeder ─────────────────────────────────────────────────────────────

async function seedToStaging(entries: FixtureEntry[]): Promise<void> {
  // Dynamic import to avoid requiring firebase-admin for dry runs
  const admin = await import('firebase-admin')

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'boletapp-staging',
    })
  }

  const db = admin.firestore()
  const batch = db.batch()

  for (const entry of entries) {
    const ref = db.doc(`scan_fixtures/${entry.hash}`)
    batch.set(ref, entry.fixtureDoc)
  }

  await batch.commit()
  console.log(`\nSeeded ${entries.length} fixtures to staging Firestore (scan_fixtures collection)`)
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const shouldSeed = args.includes('--seed-staging')
  const shouldExport = args.includes('--export-json')

  console.log('=== Export Fixtures ===\n')
  console.log(`Test cases dir: ${relative(PROJECT_ROOT, TEST_CASES_DIR)}`)
  console.log(`Mode: ${shouldSeed ? 'SEED TO STAGING' : 'DRY RUN (add --seed-staging to seed)'}\n`)

  const entries = discoverFixtures()

  if (entries.length === 0) {
    console.log('No fixtures found. Check that test-cases/ has .expected.json or .fixture.json files with matching images.')
    process.exit(1)
  }

  // Check for hash collisions
  const hashMap = new Map<string, FixtureEntry>()
  for (const entry of entries) {
    const existing = hashMap.get(entry.hash)
    if (existing) {
      console.error(`COLLISION: hash ${entry.hash} maps to both:`)
      console.error(`  1. ${relative(PROJECT_ROOT, existing.imagePath)}`)
      console.error(`  2. ${relative(PROJECT_ROOT, entry.imagePath)}`)
      process.exit(1)
    }
    hashMap.set(entry.hash, entry)
  }

  // Display summary
  const regular = entries.filter(e => e.type === 'regular')
  const adversarial = entries.filter(e => e.type === 'adversarial')

  console.log(`Found ${entries.length} fixtures:`)
  console.log(`  Regular (from .expected.json): ${regular.length}`)
  console.log(`  Adversarial (from .fixture.json): ${adversarial.length}\n`)

  console.log('─'.repeat(80))
  console.log(`${'Hash'.padEnd(18)} ${'Type'.padEnd(14)} Source Image`)
  console.log('─'.repeat(80))
  for (const entry of entries) {
    console.log(
      `${entry.hash.padEnd(18)} ${entry.type.padEnd(14)} ${entry.fixtureDoc.sourceImage}`
    )
  }
  console.log('─'.repeat(80))

  // Export to local JSON files (for inspection)
  if (shouldExport) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
    for (const entry of entries) {
      const outPath = join(OUTPUT_DIR, `${entry.hash}.json`)
      writeFileSync(outPath, JSON.stringify(entry.fixtureDoc, null, 2) + '\n')
    }
    console.log(`\nExported ${entries.length} fixture JSON files to ${relative(PROJECT_ROOT, OUTPUT_DIR)}/`)
  }

  // Seed to staging
  if (shouldSeed) {
    await seedToStaging(entries)
  } else {
    console.log('\nDry run complete. Add --seed-staging to seed to Firestore.')
    console.log('Add --export-json to write fixture files locally for inspection.')
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
