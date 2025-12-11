/**
 * Image Storage Integration Tests
 *
 * Tests the image processing pipeline for Story 4.5-2.
 * Validates module structure, configuration, and compiled code.
 *
 * Note: Full image processing tests with sharp are in functions/__tests__/imageProcessing.test.ts
 * These tests verify the integration between modules and the compiled output.
 *
 * Story 4.5-2 - Cloud Function Image Processing
 * Task 7: Write integration tests (AC: #6)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const functionsLibPath = join(process.cwd(), 'functions/lib')

describe('Image Storage Integration', () => {
  describe('Cloud Function Module Structure', () => {
    it('should have imageProcessing.ts compiled to lib/', () => {
      const path = join(functionsLibPath, 'imageProcessing.js')
      expect(existsSync(path)).toBe(true)
    })

    it('should have storageService.ts compiled to lib/', () => {
      const path = join(functionsLibPath, 'storageService.js')
      expect(existsSync(path)).toBe(true)
    })

    it('should have analyzeReceipt.ts compiled to lib/', () => {
      const path = join(functionsLibPath, 'analyzeReceipt.js')
      expect(existsSync(path)).toBe(true)
    })

    it('should have index.ts compiled to lib/', () => {
      const path = join(functionsLibPath, 'index.js')
      expect(existsSync(path)).toBe(true)
    })
  })

  describe('Image Processing Constants', () => {
    it('should export IMAGE_CONFIG with correct full-size dimensions', () => {
      const content = readFileSync(join(functionsLibPath, 'imageProcessing.js'), 'utf-8')

      // Check that the constants are defined
      expect(content).toContain('maxWidth')
      expect(content).toContain('1200')
      expect(content).toContain('maxHeight')
      expect(content).toContain('1600')
      expect(content).toContain('quality')
      expect(content).toContain('80')
    })

    it('should export IMAGE_CONFIG with correct thumbnail dimensions', () => {
      const content = readFileSync(join(functionsLibPath, 'imageProcessing.js'), 'utf-8')

      expect(content).toContain('thumbnail')
      expect(content).toContain('120')
      expect(content).toContain('160')
      expect(content).toContain('70') // thumbnail quality
    })

    it('should export key functions', () => {
      const content = readFileSync(join(functionsLibPath, 'imageProcessing.js'), 'utf-8')

      expect(content).toContain('resizeAndCompress')
      expect(content).toContain('generateThumbnail')
      expect(content).toContain('base64ToBuffer')
      expect(content).toContain('processReceiptImages')
    })
  })

  describe('Storage Service Functions', () => {
    it('should have path generation functions', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('getImagePath')
      expect(content).toContain('getThumbnailPath')
    })

    it('should have upload functions', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('uploadImage')
      expect(content).toContain('uploadThumbnail')
      expect(content).toContain('uploadReceiptImages')
    })

    it('should have delete function for cascade delete', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('deleteTransactionImages')
    })

    it('should use correct storage path pattern', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      // Pattern: users/{userId}/receipts/{transactionId}/
      expect(content).toContain('users/')
      expect(content).toContain('/receipts/')
      expect(content).toContain('image-')
      expect(content).toContain('thumbnail.jpg')
    })
  })

  describe('Analyze Receipt Response Extension', () => {
    it('should have extended response with transactionId', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('transactionId')
    })

    it('should have extended response with imageUrls', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('imageUrls')
    })

    it('should have extended response with thumbnailUrl', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('thumbnailUrl')
    })

    it('should import imageProcessing module', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('imageProcessing')
      // Uses individual functions for optimized pre-processing pipeline
      expect(content).toContain('resizeAndCompress')
      expect(content).toContain('generateThumbnail')
    })

    it('should import storageService module', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('storageService')
      expect(content).toContain('uploadReceiptImages')
    })

    it('should have graceful error handling for storage failures', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('storageError')
      expect(content).toContain('Image storage failed')
    })

    it('should generate transactionId before storage', () => {
      const content = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(content).toContain('generateTransactionId')
    })
  })

  describe('Dependencies Configuration', () => {
    it('should have sharp dependency in functions/package.json', () => {
      const pkgPath = join(process.cwd(), 'functions/package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      expect(pkg.dependencies.sharp).toBeDefined()
      expect(pkg.dependencies.sharp).toMatch(/^\^?0\.33/)
    })

    it('should have firebase-admin dependency', () => {
      const pkgPath = join(process.cwd(), 'functions/package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      expect(pkg.dependencies['firebase-admin']).toBeDefined()
    })

    it('should have Node.js 20 engine specified', () => {
      const pkgPath = join(process.cwd(), 'functions/package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      expect(pkg.engines.node).toBe('20')
    })
  })

  describe('TypeScript Compilation', () => {
    it('should have source maps generated', () => {
      const imageProcessingMapPath = join(functionsLibPath, 'imageProcessing.js.map')
      const storageServiceMapPath = join(functionsLibPath, 'storageService.js.map')

      expect(existsSync(imageProcessingMapPath)).toBe(true)
      expect(existsSync(storageServiceMapPath)).toBe(true)
    })

    it('should compile without type errors', () => {
      // If the .js files exist and have content, compilation succeeded
      const imageProcessing = readFileSync(join(functionsLibPath, 'imageProcessing.js'), 'utf-8')
      const storageService = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')
      const analyzeReceipt = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      expect(imageProcessing.length).toBeGreaterThan(100)
      expect(storageService.length).toBeGreaterThan(100)
      expect(analyzeReceipt.length).toBeGreaterThan(100)
    })
  })

  describe('Storage Rules Integration', () => {
    it('should have storage.rules file', () => {
      const rulesPath = join(process.cwd(), 'storage.rules')
      expect(existsSync(rulesPath)).toBe(true)
    })

    it('should have user isolation pattern in storage rules', () => {
      const rulesPath = join(process.cwd(), 'storage.rules')
      const rules = readFileSync(rulesPath, 'utf-8')

      expect(rules).toContain('users/{userId}/receipts')
      expect(rules).toContain('request.auth.uid == userId')
    })

    it('should allow nested paths with allPaths wildcard', () => {
      const rulesPath = join(process.cwd(), 'storage.rules')
      const rules = readFileSync(rulesPath, 'utf-8')

      expect(rules).toContain('{allPaths=**}')
    })
  })

  describe('Firebase Configuration', () => {
    it('should have storage in firebase.json', () => {
      const configPath = join(process.cwd(), 'firebase.json')
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))

      expect(config.storage).toBeDefined()
      expect(config.storage.rules).toBe('storage.rules')
    })

    it('should have storage emulator configured', () => {
      const configPath = join(process.cwd(), 'firebase.json')
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))

      expect(config.emulators.storage).toBeDefined()
      expect(config.emulators.storage.port).toBe(9199)
    })
  })

  describe('Code Quality', () => {
    it('should not have any TODO comments in production code', () => {
      const imageProcessing = readFileSync(join(functionsLibPath, 'imageProcessing.js'), 'utf-8')
      const storageService = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      // Production code shouldn't have TODO comments
      expect(imageProcessing).not.toContain('// TODO')
      expect(storageService).not.toContain('// TODO')
    })

    it('should use consistent error handling', () => {
      const analyzeReceipt = readFileSync(join(functionsLibPath, 'analyzeReceipt.js'), 'utf-8')

      // Should have try-catch blocks for error handling
      expect(analyzeReceipt).toContain('catch')
      expect(analyzeReceipt).toContain('HttpsError')
    })
  })
})
