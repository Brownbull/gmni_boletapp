/**
 * NavigationBlocker Component Tests
 *
 * Story 14d.3: Hybrid Navigation Blocking (AC #5-7)
 *
 * Tests for the browser back button blocking functionality.
 *
 * Coverage:
 * - AC#5: Blocks browser back when dialog active in scan view
 * - AC#6: Silently blocks (no browser prompt)
 * - AC#7: Allows navigation from non-scan views
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '../../setup/test-utils'
import { NavigationBlocker } from '../../../src/components/NavigationBlocker'

// Story 14e-11: Mock Zustand store selector for navigation blocking
// (Replaced useScanOptional from ScanContext with useHasDialog from Zustand)
const mockHasDialog = vi.fn(() => false)

vi.mock('@features/scan/store', () => ({
  useHasDialog: () => mockHasDialog(),
}))

describe('NavigationBlocker Component', () => {
  let mockPushState: ReturnType<typeof vi.fn>
  let popStateListeners: Array<(event: PopStateEvent) => void>

  beforeEach(() => {
    vi.clearAllMocks()
    popStateListeners = []

    // Mock history.pushState
    mockPushState = vi.fn()
    vi.spyOn(window.history, 'pushState').mockImplementation(mockPushState)

    // Track popstate listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'popstate' && typeof handler === 'function') {
        popStateListeners.push(handler as (event: PopStateEvent) => void)
      }
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'popstate' && typeof handler === 'function') {
        const index = popStateListeners.indexOf(handler as (event: PopStateEvent) => void)
        if (index > -1) {
          popStateListeners.splice(index, 1)
        }
      }
    })

    // Story 14e-11: Reset useHasDialog mock to default (no dialog)
    mockHasDialog.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Story 14e-11: Helper to set Zustand store mock for dialog state
  const mockScanStoreWithDialog = (hasDialog: boolean) => {
    mockHasDialog.mockReturnValue(hasDialog)
  }

  // Helper to simulate popstate event
  const simulatePopState = () => {
    const event = new PopStateEvent('popstate', { state: null })
    vi.spyOn(event, 'preventDefault')
    popStateListeners.forEach((listener) => listener(event))
    return event
  }

  describe('Rendering', () => {
    it('should render nothing (return null)', () => {
      const { container } = render(<NavigationBlocker currentView="dashboard" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('AC#5: Browser Back Blocking in Scan Views', () => {
    it('should push blocking history entry when dialog active in scan view', () => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView="transaction-editor" />)

      expect(mockPushState).toHaveBeenCalledWith({ blockingEntry: true }, '')
    })

    it('should add popstate listener when blocking', () => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView="transaction-editor" />)

      expect(popStateListeners.length).toBeGreaterThan(0)
    })

    it('should re-push blocking entry on popstate when dialog active', () => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView="transaction-editor" />)

      // Clear initial push call
      mockPushState.mockClear()

      // Simulate back button
      simulatePopState()

      // Should re-push to prevent navigation
      expect(mockPushState).toHaveBeenCalledWith({ blockingEntry: true }, '')
    })

    it.each([
      'transaction-editor',
      'batch-capture',
      'batch-review',
      'scan-result',
    ])('should block in %s view when dialog active', (view) => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView={view} />)

      expect(mockPushState).toHaveBeenCalled()
      expect(popStateListeners.length).toBeGreaterThan(0)
    })
  })

  describe('AC#6: Silent Blocking (No Browser Prompt)', () => {
    it('should not trigger beforeunload prompt', () => {
      mockScanStoreWithDialog(true)

      // Verify we're using pushState pattern, not beforeunload
      const beforeunloadSpy = vi.spyOn(window, 'addEventListener')
      render(<NavigationBlocker currentView="transaction-editor" />)

      // NavigationBlocker should NOT add beforeunload listener
      const beforeunloadCalls = beforeunloadSpy.mock.calls.filter(
        ([event]) => event === 'beforeunload'
      )
      expect(beforeunloadCalls.length).toBe(0)
    })

    it('should log warning when blocking', () => {
      mockScanStoreWithDialog(true)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(<NavigationBlocker currentView="transaction-editor" />)
      simulatePopState()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Browser back blocked: dialog requires response'
      )
    })
  })

  describe('AC#7: No Blocking from Non-Scan Views', () => {
    it.each([
      'dashboard',
      'trends',
      'insights',
      'settings',
      'history',
      'reports',
      'alerts',
    ])('should NOT push blocking entry in %s view even with dialog', (view) => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView={view} />)

      expect(mockPushState).not.toHaveBeenCalled()
    })

    it('should NOT add popstate listener in non-scan views', () => {
      mockScanStoreWithDialog(true)
      render(<NavigationBlocker currentView="dashboard" />)

      // No listeners should be added for non-scan views
      // (The initial length check happens after our mock setup)
      const popstateListenerCount = popStateListeners.length
      expect(popstateListenerCount).toBe(0)
    })
  })

  describe('No Blocking When No Dialog', () => {
    it('should NOT push blocking entry when no dialog active', () => {
      mockScanStoreWithDialog(false)
      render(<NavigationBlocker currentView="transaction-editor" />)

      expect(mockPushState).not.toHaveBeenCalled()
    })

    it('should NOT add popstate listener when no dialog active', () => {
      mockScanStoreWithDialog(false)
      render(<NavigationBlocker currentView="transaction-editor" />)

      expect(popStateListeners.length).toBe(0)
    })
  })

  describe('Graceful Handling When No Dialog Active', () => {
    // Story 14e-11: Updated from null context handling to default state handling
    // Zustand always returns a value, so we test default (no dialog) state instead
    it('should handle default state (no dialog) gracefully', () => {
      mockHasDialog.mockReturnValue(false)

      // Should not throw
      expect(() => {
        render(<NavigationBlocker currentView="transaction-editor" />)
      }).not.toThrow()

      // Should not push blocking entry
      expect(mockPushState).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup on Unmount', () => {
    it('should remove popstate listener on unmount', () => {
      mockScanStoreWithDialog(true)
      const { unmount } = render(<NavigationBlocker currentView="transaction-editor" />)

      // Verify listener was added
      expect(popStateListeners.length).toBeGreaterThan(0)

      // Unmount
      unmount()

      // Listener should be removed
      expect(popStateListeners.length).toBe(0)
    })
  })
})
