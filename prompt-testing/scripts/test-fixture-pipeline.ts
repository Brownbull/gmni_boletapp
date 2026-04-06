#!/usr/bin/env tsx
/**
 * Quick test: trigger a scan on staging with a known test image
 * and verify the fixture system returns deterministic data.
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=~/.config/firebase/carcamo_gabriel_gmail.com_application_default_credentials.json tsx prompt-testing/scripts/test-fixture-pipeline.ts
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash, randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '../..')

async function main() {
  // Dynamic import to use credentials at runtime
  const admin = await import('firebase-admin')

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'boletapp-staging' })
  }

  const db = admin.firestore()
  const bucket = admin.storage().bucket('boletapp-staging.firebasestorage.app')

  // 1. Pick a test image and compute its expected hash
  const imagePath = join(PROJECT_ROOT, 'prompt-testing/test-cases/convenience/dobler.jpg')
  const imageBuffer = readFileSync(imagePath)
  const expectedHash = createHash('sha256').update(imageBuffer).digest('hex').slice(0, 16)
  console.log(`Test image: dobler.jpg (${imageBuffer.length} bytes)`)
  console.log(`Expected fixture hash: ${expectedHash}`)

  // 2. Upload to staging Storage (same path pattern the app uses)
  const testUserId = 'fixture-test-user'
  const scanId = `fixture-test-${randomUUID().slice(0, 8)}`
  const storagePath = `pending_scans/${testUserId}/${scanId}/image-0.jpg`

  console.log(`\nUploading to Storage: ${storagePath}`)
  const file = bucket.file(storagePath)
  await file.save(imageBuffer, {
    contentType: 'image/jpeg',
    metadata: { cacheControl: 'no-cache' },
    public: true,
  })
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`
  console.log(`Upload done: ${imageUrl}`)

  // 3. Create pending_scans doc (triggers processReceiptScan)
  const pendingRef = db.doc(`pending_scans/${scanId}`)
  console.log(`\nCreating pending_scans/${scanId} (this triggers processReceiptScan)...`)
  await pendingRef.set({
    scanId,
    userId: testUserId,
    status: 'processing',
    imageUrls: [imageUrl],
    createdAt: admin.firestore.Timestamp.now(),
    processingDeadline: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    creditDeducted: false, // false = don't mess with real credits
  })

  // 4. Poll for result (fixture should respond in <5s, timeout at 30s)
  console.log('Waiting for processReceiptScan to complete...')
  const startTime = Date.now()
  const TIMEOUT_MS = 30_000
  const POLL_MS = 2_000

  while (Date.now() - startTime < TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, POLL_MS))
    const snap = await pendingRef.get()
    const data = snap.data()

    if (!data) {
      console.log('  Doc not found (deleted?)')
      break
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`  [${elapsed}s] status=${data.status}`)

    if (data.status === 'completed') {
      console.log('\n=== SCAN COMPLETED ===')
      console.log('Result:')
      const result = data.result
      console.log(`  merchant: ${result?.merchant}`)
      console.log(`  date: ${result?.date}`)
      console.log(`  total: ${result?.total}`)
      console.log(`  category: ${result?.category}`)
      console.log(`  items: ${result?.items?.length ?? 0} items`)
      if (result?.items?.length > 0) {
        for (const item of result.items) {
          console.log(`    - ${item.name}: $${item.totalPrice}`)
        }
      }
      console.log(`  thumbnailUrl: ${result?.thumbnailUrl ? 'present' : 'MISSING'}`)
      console.log(`  promptVersion: ${result?.promptVersion}`)

      // Verify fixture data matches expected (dobler fixture)
      const isFixtureData = result?.merchant === 'DOBLE R' && result?.total === 23660
      console.log(`\n  Fixture match: ${isFixtureData ? 'YES — fixture system works!' : 'NO — unexpected data'}`)

      // Cleanup
      await pendingRef.delete()
      await file.delete().catch(() => {})
      console.log('\nCleaned up test doc + image.')
      process.exit(isFixtureData ? 0 : 1)
    }

    if (data.status === 'failed') {
      console.log('\n=== SCAN FAILED ===')
      console.log(`Error: ${data.error}`)

      // Check if it's a hash mismatch (expected if client processing changes bytes)
      if (data.error?.includes('No fixture found for image hash')) {
        const hashMatch = data.error.match(/hash ([0-9a-f]+)/)
        console.log(`\nThe CF computed hash: ${hashMatch?.[1]}`)
        console.log(`We expected hash:     ${expectedHash}`)
        console.log(`${hashMatch?.[1] === expectedHash ? 'Hashes MATCH — fixture missing?' : 'Hashes DIFFER — image was transformed'}`)
      }

      await pendingRef.delete()
      await file.delete().catch(() => {})
      console.log('\nCleaned up test doc + image.')
      process.exit(1)
    }
  }

  console.log('\nTIMEOUT: processReceiptScan did not complete in 30s')
  console.log('Check Cloud Functions logs: firebase functions:log --project boletapp-staging')
  await pendingRef.delete()
  await file.delete().catch(() => {})
  process.exit(1)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
