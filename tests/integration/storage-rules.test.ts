/**
 * Firebase Storage Infrastructure Tests
 *
 * Tests Firebase Storage infrastructure setup for Story 4.5-1.
 * Note: Full security rules testing with @firebase/rules-unit-testing has
 * limited support for Storage emulator. These tests verify:
 * 1. Storage rules file exists and is valid
 * 2. Storage SDK is properly initialized
 * 3. Emulator configuration is correct
 *
 * Security rules are validated at deploy time via Firebase CLI.
 * Run `firebase deploy --only storage` to validate and deploy rules.
 *
 * Story 4.5-1 - Firebase Storage Infrastructure
 * Task 6: Write infrastructure tests (AC: #5)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Firebase Storage Infrastructure', () => {
  describe('Storage Rules File', () => {
    const rulesPath = join(process.cwd(), 'storage.rules')

    it('should have storage.rules file in project root', () => {
      expect(existsSync(rulesPath)).toBe(true)
    })

    it('should have valid rules_version declaration', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      expect(rules).toContain("rules_version = '2'")
    })

    it('should have firebase.storage service definition', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      expect(rules).toContain('service firebase.storage')
    })

    it('should have user-scoped receipts path rule', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      // Check for the user isolation pattern
      expect(rules).toContain('users/{userId}/receipts')
      expect(rules).toContain('request.auth != null')
      expect(rules).toContain('request.auth.uid == userId')
    })

    it('should have default deny rule for other paths', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      // Should have a deny-all fallback rule
      expect(rules).toContain('allow read, write: if false')
    })

    it('should match the expected security pattern', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      // Verify the complete user isolation rule exists
      const hasUserIsolation = rules.includes('request.auth.uid == userId')
      const hasAuthCheck = rules.includes('request.auth != null')
      const hasReceiptsPath = rules.includes('/receipts/')

      expect(hasUserIsolation).toBe(true)
      expect(hasAuthCheck).toBe(true)
      expect(hasReceiptsPath).toBe(true)
    })
  })

  describe('Firebase Configuration', () => {
    const firebaseJsonPath = join(process.cwd(), 'firebase.json')

    it('should have firebase.json with storage configuration', () => {
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'))
      expect(config.storage).toBeDefined()
      expect(config.storage.rules).toBe('storage.rules')
    })

    it('should have storage emulator configured', () => {
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'))
      expect(config.emulators).toBeDefined()
      expect(config.emulators.storage).toBeDefined()
      expect(config.emulators.storage.port).toBe(9199)
    })

    it('should have storage emulator host set to 0.0.0.0 for accessibility', () => {
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'))
      expect(config.emulators.storage.host).toBe('0.0.0.0')
    })
  })

  describe('Package Configuration', () => {
    const packageJsonPath = join(process.cwd(), 'package.json')

    it('should have emulators script including storage', () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      expect(pkg.scripts.emulators).toBeDefined()
      expect(pkg.scripts.emulators).toContain('storage')
    })

    it('should have firebase dependency installed', () => {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      expect(pkg.dependencies.firebase).toBeDefined()
    })
  })

  describe('Client SDK Configuration', () => {
    it('should export storage from firebase config', async () => {
      // Read the firebase.ts file and check it exports storage
      const firebaseTsPath = join(process.cwd(), 'src/config/firebase.ts')
      const content = readFileSync(firebaseTsPath, 'utf-8')

      expect(content).toContain('getStorage')
      expect(content).toContain('export const storage')
    })

    it('should connect to emulator in development mode', async () => {
      const firebaseTsPath = join(process.cwd(), 'src/config/firebase.ts')
      const content = readFileSync(firebaseTsPath, 'utf-8')

      expect(content).toContain('connectStorageEmulator')
      expect(content).toContain('import.meta.env.DEV')
      expect(content).toContain('9199') // Storage emulator port
    })
  })

  describe('Security Rules Pattern Validation', () => {
    const rulesPath = join(process.cwd(), 'storage.rules')

    it('should follow same pattern as firestore.rules for user isolation', () => {
      const storageRules = readFileSync(rulesPath, 'utf-8')
      const firestoreRulesPath = join(process.cwd(), 'firestore.rules')
      const firestoreRules = readFileSync(firestoreRulesPath, 'utf-8')

      // Both should use the same user isolation pattern
      const storageHasPattern = storageRules.includes('request.auth.uid == userId')
      const firestoreHasPattern = firestoreRules.includes('request.auth.uid == userId')

      expect(storageHasPattern).toBe(true)
      expect(firestoreHasPattern).toBe(true)
    })

    it('should use wildcard for nested receipt paths', () => {
      const rules = readFileSync(rulesPath, 'utf-8')
      // Check for allPaths wildcard to allow nested files
      expect(rules).toContain('{allPaths=**}')
    })
  })
})
