/**
 * PWAUpdatePrompt Component Tests - Story 14.42
 *
 * Tests for the PWA update banner component.
 *
 * Coverage:
 * - AC#2: Top banner positioning (below TopHeader)
 * - AC#3: Spanish and English translations
 * - AC#4: Dismiss stores in sessionStorage, Update triggers reload
 * - AC#5: Unit tests for render and click handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the virtual PWA register module BEFORE any imports that use it
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}))

// Mock usePWAUpdate hook
const mockUpdate = vi.fn()
const mockClose = vi.fn()
const mockCheckForUpdates = vi.fn()

vi.mock('../../../src/hooks/usePWAUpdate', () => ({
  usePWAUpdate: vi.fn(() => ({
    needRefresh: false,
    offlineReady: false,
    checking: false,
    close: mockClose,
    update: mockUpdate,
    checkForUpdates: mockCheckForUpdates,
  })),
}))

// Now import everything else AFTER mocks are set up
import { render, screen, fireEvent } from '../../setup/test-utils'
import { PWAUpdatePrompt } from '../../../src/components/PWAUpdatePrompt'
import { usePWAUpdate } from '../../../src/hooks/usePWAUpdate'

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

describe('PWAUpdatePrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should not render when needRefresh and offlineReady are false', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: false,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      const { container } = render(<PWAUpdatePrompt language="en" />)
      expect(container.firstChild).toBeNull()
    })

    it('should render update banner when needRefresh is true', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      expect(screen.getByTestId('pwa-update-banner')).toBeInTheDocument()
      expect(screen.getByText('Update Available')).toBeInTheDocument()
    })

    it('should render offline ready notification when offlineReady is true', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: false,
        offlineReady: true,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      expect(screen.getByText('App ready for offline use')).toBeInTheDocument()
    })

    it('should have top-16 positioning (below TopHeader)', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      const banner = screen.getByTestId('pwa-update-banner')
      expect(banner).toHaveClass('top-16')
    })
  })

  describe('Translations', () => {
    it('should display English translations when language is "en"', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      expect(screen.getByText('Update Available')).toBeInTheDocument()
      expect(screen.getByText('There is an update available. Do you want to update?')).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText('Later')).toBeInTheDocument()
    })

    it('should display Spanish translations when language is "es"', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="es" />)
      expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
      expect(screen.getByText('Hay una actualización disponible. ¿Quieres actualizar?')).toBeInTheDocument()
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
      expect(screen.getByText('Después')).toBeInTheDocument()
    })

    it('should default to Spanish when no language prop provided', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt />)
      expect(screen.getByText('Actualización Disponible')).toBeInTheDocument()
    })
  })

  describe('Dismiss Behavior', () => {
    it('should call close and store dismiss in sessionStorage when Later is clicked', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)

      const laterButton = screen.getByText('Later')
      fireEvent.click(laterButton)

      expect(mockClose).toHaveBeenCalled()
      expect(sessionStorage.getItem('pwa-update-dismissed-session')).toBe('true')
    })

    it('should not render when dismissed in current session', () => {
      // Pre-set the dismiss state
      sessionStorage.setItem('pwa-update-dismissed-session', 'true')

      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      const { container } = render(<PWAUpdatePrompt language="en" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Update Behavior', () => {
    it('should call update and reload page when Update is clicked', async () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)

      const updateButton = screen.getByText('Update')
      fireEvent.click(updateButton)

      // Should call update immediately
      expect(mockUpdate).toHaveBeenCalled()

      // Should reload after SW_ACTIVATION_DELAY_MS (500ms) timeout
      vi.advanceTimersByTime(500)
      expect(mockReload).toHaveBeenCalled()
    })

    it('should disable buttons while updating', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)

      const updateButton = screen.getByText('Update')
      fireEvent.click(updateButton)

      // After clicking, buttons should be disabled
      expect(updateButton).toBeDisabled()
      expect(screen.getByText('Later')).toBeDisabled()
    })

    it('should show spinning icon while updating', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)

      const updateButton = screen.getByText('Update')
      fireEvent.click(updateButton)

      // The button should contain an SVG with animate-spin class
      const spinningIcon = updateButton.querySelector('.animate-spin')
      expect(spinningIcon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert" for screen readers', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="polite" for non-intrusive announcements', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      const banner = screen.getByRole('alert')
      expect(banner).toHaveAttribute('aria-live', 'polite')
    })

    it('should have appropriate aria-labels on buttons', () => {
      vi.mocked(usePWAUpdate).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        checking: false,
        close: mockClose,
        update: mockUpdate,
        checkForUpdates: mockCheckForUpdates,
      })

      render(<PWAUpdatePrompt language="en" />)
      expect(screen.getByLabelText('Update')).toBeInTheDocument()
      expect(screen.getByLabelText('Later')).toBeInTheDocument()
    })
  })
})
