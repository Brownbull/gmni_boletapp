const mockDocGet = jest.fn()

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    doc: jest.fn(() => ({ get: mockDocGet })),
  })),
}))

import { isFixtureMode, computeImageHash, loadFixture, FIXTURE_SCHEMA_VERSION } from '../fixtureHelper'

describe('fixtureHelper', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.SCAN_FIXTURE_MODE
    delete process.env.GCLOUD_PROJECT
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isFixtureMode', () => {
    it('returns false by default (no env var)', () => {
      expect(isFixtureMode()).toBe(false)
    })

    it('returns true when SCAN_FIXTURE_MODE=true on non-production project', () => {
      process.env.SCAN_FIXTURE_MODE = 'true'
      process.env.GCLOUD_PROJECT = 'boletapp-staging'
      expect(isFixtureMode()).toBe(true)
    })

    it('returns false on production project even with env var set (M1)', () => {
      process.env.SCAN_FIXTURE_MODE = 'true'
      process.env.GCLOUD_PROJECT = 'boletapp-d609f'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(isFixtureMode()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('FATAL: SCAN_FIXTURE_MODE enabled on production')
      )

      consoleSpy.mockRestore()
    })

    it('returns false on production project without env var (no warning)', () => {
      process.env.GCLOUD_PROJECT = 'boletapp-d609f'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(isFixtureMode()).toBe(false)
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns false when SCAN_FIXTURE_MODE is not "true"', () => {
      process.env.SCAN_FIXTURE_MODE = 'false'
      expect(isFixtureMode()).toBe(false)
    })
  })

  describe('computeImageHash', () => {
    it('produces a 16-char hex string', () => {
      const hash = computeImageHash([Buffer.from('image-data')])
      expect(hash).toHaveLength(16)
      expect(hash).toMatch(/^[0-9a-f]{16}$/)
    })

    it('is deterministic for the same input', () => {
      const buf = Buffer.from('same-data')
      expect(computeImageHash([buf])).toBe(computeImageHash([buf]))
    })

    it('hashes ALL buffers concatenated, not just first (E1)', () => {
      const a = Buffer.from('image-a')
      const b = Buffer.from('image-b')
      const c = Buffer.from('image-c')

      const hashAB = computeImageHash([a, b])
      const hashAC = computeImageHash([a, c])

      // Same first image, different second — must produce different hashes
      expect(hashAB).not.toBe(hashAC)
    })

    it('produces different hash for single vs multi-image with same first', () => {
      const a = Buffer.from('image-a')
      const b = Buffer.from('image-b')

      expect(computeImageHash([a])).not.toBe(computeImageHash([a, b]))
    })
  })

  describe('loadFixture', () => {
    const validFixtureData = {
      fixtureSchemaVersion: FIXTURE_SCHEMA_VERSION,
      rawGeminiResponse: '```json\n{"merchant": "Test"}\n```',
      sourceImage: 'test.jpg',
    }

    it('returns raw Gemini response text from Firestore', async () => {
      mockDocGet.mockResolvedValue({ exists: true, data: () => validFixtureData })

      const result = await loadFixture([Buffer.from('test-image')])
      expect(result).toBe('```json\n{"merchant": "Test"}\n```')
    })

    it('throws with seeding instructions when fixture not found (M3)', async () => {
      mockDocGet.mockResolvedValue({ exists: false })

      await expect(loadFixture([Buffer.from('unknown')])
      ).rejects.toThrow('No fixture found for image hash')
      await expect(loadFixture([Buffer.from('unknown')])
      ).rejects.toThrow('Seed fixtures first')
    })

    it('throws infra-specific error on Firestore failure (E4)', async () => {
      mockDocGet.mockRejectedValue(new Error('UNAVAILABLE: Firestore is down'))

      await expect(loadFixture([Buffer.from('test')])
      ).rejects.toThrow('Fixture infrastructure error')
      await expect(loadFixture([Buffer.from('test')])
      ).rejects.toThrow('scan_fixtures collection seeded')
    })

    it('rejects stale fixtures below current schema version (E2)', async () => {
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...validFixtureData, fixtureSchemaVersion: 0 }),
      })

      await expect(loadFixture([Buffer.from('test')])
      ).rejects.toThrow('Stale fixture')
      await expect(loadFixture([Buffer.from('test')])
      ).rejects.toThrow('Regenerate with')
    })

    it('treats missing fixtureSchemaVersion as version 0 (stale)', async () => {
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ rawGeminiResponse: '{}' }),
      })

      await expect(loadFixture([Buffer.from('test')])
      ).rejects.toThrow('Stale fixture')
    })
  })
})
