/**
 * Nav Component Tests
 *
 * Tests for the bottom navigation bar component.
 *
 * Coverage:
 * - Story 10a.3: Nav Tab Rename - Receipts to Insights
 *   - AC#1: Lightbulb icon displayed for Insights tab
 *   - AC#2: Correct label in EN ('Insights') and ES ('Ideas')
 *   - AC#3: Tab navigates to 'insights' view
 * - Story 12.1: Long-press detection for batch mode
 *   - AC#1: Long press (500ms) triggers batch mode
 *   - Short press triggers regular scan
 * - Story 14.11: Bottom Navigation Redesign
 *   - AC#1: Visual styling matches mockup
 *   - AC#2: Icon and label colors with CSS variables
 *   - AC#3: Center FAB elevation and gradient
 *   - AC#4: Safe area handling
 *   - AC#5: Animation with reduced motion support
 *   - AC#6: Haptic feedback on nav selection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../setup/test-utils'
import { Nav } from '../../../src/components/Nav'

// Mock useReducedMotion hook
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
  default: vi.fn(() => false),
}))

// Import the mocked module for controlling its behavior
import { useReducedMotion } from '../../../src/hooks/useReducedMotion'

describe('Nav Component', () => {
  const mockSetView = vi.fn()
  const mockOnScanClick = vi.fn()
  const mockOnTrendsClick = vi.fn()
  const mockOnBatchClick = vi.fn()
  const mockVibrate = vi.fn()

  const defaultProps = {
    view: 'dashboard',
    setView: mockSetView,
    onScanClick: mockOnScanClick,
    onTrendsClick: mockOnTrendsClick,
    theme: 'light',
    t: (key: string) => {
      const translations: Record<string, string> = {
        home: 'Home',
        analytics: 'Analytics',
        scan: 'Scan',
        insights: 'Insights',
        alerts: 'Alerts',
        mainNavigation: 'Main navigation',
        batchProcessing: 'Processing...',
        batchReviewReady: 'Ready for review',
      }
      return translations[key] || key
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Mock navigator.vibrate for haptic tests
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    })
    // Reset useReducedMotion mock to return false (motion enabled)
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should render all navigation buttons', () => {
      render(<Nav {...defaultProps} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Insights')).toBeInTheDocument()
      expect(screen.getByText('Alerts')).toBeInTheDocument()
    })

    it('should render the scan button with aria-label', () => {
      render(<Nav {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument()
    })

    it('should render nav with navigation role and aria-label', () => {
      render(<Nav {...defaultProps} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Main navigation')
    })
  })

  describe('Story 10a.3: Insights Tab', () => {
    it('AC#1: should render Lightbulb icon for Insights tab', () => {
      render(<Nav {...defaultProps} />)

      // Find the Insights button and check it contains an SVG (Lightbulb icon)
      const insightsButton = screen.getByText('Insights').closest('button')
      expect(insightsButton).toBeInTheDocument()

      // Check that an SVG (icon) is present in the button
      const svg = insightsButton?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('AC#2: should display "Insights" label in English', () => {
      render(<Nav {...defaultProps} />)

      expect(screen.getByText('Insights')).toBeInTheDocument()
    })

    it('AC#2: should display "Ideas" label in Spanish', () => {
      const spanishT = (key: string) => {
        const translations: Record<string, string> = {
          home: 'Inicio',
          analytics: 'Analíticas',
          scan: 'Escanear',
          insights: 'Ideas',
          alerts: 'Alertas',
        }
        return translations[key] || key
      }

      render(<Nav {...defaultProps} t={spanishT} />)

      expect(screen.getByText('Ideas')).toBeInTheDocument()
    })

    it('AC#3: should call setView with "insights" when clicking Insights tab', () => {
      render(<Nav {...defaultProps} />)

      const insightsButton = screen.getByText('Insights').closest('button')
      fireEvent.click(insightsButton!)

      expect(mockSetView).toHaveBeenCalledWith('insights')
      expect(mockSetView).toHaveBeenCalledTimes(1)
    })

    it('should apply active styling when view is "insights"', () => {
      render(<Nav {...defaultProps} view="insights" />)

      const insightsButton = screen.getByText('Insights').closest('button')
      // Story 14.11: Active tabs use --primary color via inline style
      expect(insightsButton).toHaveAttribute('style', expect.stringContaining('--primary'))
    })

    it('should apply inactive styling when different view is active', () => {
      render(<Nav {...defaultProps} view="dashboard" />)

      const insightsButton = screen.getByText('Insights').closest('button')
      // Story 14.11: Non-active tabs use --text-tertiary color via inline style
      expect(insightsButton).toHaveAttribute('style', expect.stringContaining('--text-tertiary'))
    })
  })

  describe('Navigation', () => {
    it('should call setView with "dashboard" when clicking Home', () => {
      render(<Nav {...defaultProps} />)

      const homeButton = screen.getByText('Home').closest('button')
      fireEvent.click(homeButton!)

      expect(mockSetView).toHaveBeenCalledWith('dashboard')
    })

    it('should call setView with "trends" when clicking Analytics', () => {
      render(<Nav {...defaultProps} />)

      const analyticsButton = screen.getByText('Analytics').closest('button')
      fireEvent.click(analyticsButton!)

      expect(mockSetView).toHaveBeenCalledWith('trends')
      expect(mockOnTrendsClick).toHaveBeenCalled()
    })

    it('should call onScanClick when clicking scan button', () => {
      render(<Nav {...defaultProps} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })
      // Story 12.1: Scan button uses pointer events for long-press detection
      fireEvent.pointerDown(scanButton)
      fireEvent.pointerUp(scanButton)

      expect(mockOnScanClick).toHaveBeenCalled()
    })

    it('should call setView with "alerts" when clicking Alerts', () => {
      render(<Nav {...defaultProps} />)

      const alertsButton = screen.getByText('Alerts').closest('button')
      fireEvent.click(alertsButton!)

      expect(mockSetView).toHaveBeenCalledWith('alerts')
    })
  })

  describe('Active State Styling', () => {
    it.each([
      ['dashboard', 'Home'],
      ['trends', 'Analytics'],
      ['insights', 'Insights'],
      ['alerts', 'Alerts'],
    ])('should apply active styling to %s button when view is %s', (view, label) => {
      render(<Nav {...defaultProps} view={view} />)

      const activeButton = screen.getByText(label).closest('button')
      // Story 14.11: Active buttons have --primary color in their inline style
      expect(activeButton).toHaveAttribute('style', expect.stringContaining('--primary'))
    })

    it.each([
      ['dashboard', 'Home'],
      ['trends', 'Analytics'],
      ['insights', 'Insights'],
      ['alerts', 'Alerts'],
    ])('should set aria-current="page" for active %s button', (view, label) => {
      render(<Nav {...defaultProps} view={view} />)

      const activeButton = screen.getByText(label).closest('button')
      expect(activeButton).toHaveAttribute('aria-current', 'page')
    })

    it('should not set aria-current for inactive buttons', () => {
      render(<Nav {...defaultProps} view="dashboard" />)

      const analyticsButton = screen.getByText('Analytics').closest('button')
      const insightsButton = screen.getByText('Insights').closest('button')
      const alertsButton = screen.getByText('Alerts').closest('button')

      expect(analyticsButton).not.toHaveAttribute('aria-current')
      expect(insightsButton).not.toHaveAttribute('aria-current')
      expect(alertsButton).not.toHaveAttribute('aria-current')
    })
  })

  describe('Story 12.1: Long-Press Detection for Batch Mode', () => {
    const LONG_PRESS_DURATION = 500 // matches Nav component constant

    it('AC#1: should trigger batch mode on long press (500ms)', () => {
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Start long press
      fireEvent.pointerDown(scanButton)

      // Advance past long press threshold
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // onBatchClick should be called
      expect(mockOnBatchClick).toHaveBeenCalledTimes(1)
      // onScanClick should NOT be called yet (pointer still down)
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })

    it('should call onScanClick on short press (under 500ms)', () => {
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Short press - pointer down then immediately up
      fireEvent.pointerDown(scanButton)

      // Release before threshold
      act(() => {
        vi.advanceTimersByTime(200) // 200ms < 500ms threshold
      })

      fireEvent.pointerUp(scanButton)

      // onScanClick should be called for short tap
      expect(mockOnScanClick).toHaveBeenCalledTimes(1)
      // onBatchClick should NOT be called
      expect(mockOnBatchClick).not.toHaveBeenCalled()
    })

    it('should NOT call onScanClick after long press completes', () => {
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Long press sequence
      fireEvent.pointerDown(scanButton)

      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // Release after long press triggered
      fireEvent.pointerUp(scanButton)

      // Only batch click should have been called
      expect(mockOnBatchClick).toHaveBeenCalledTimes(1)
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })

    it('should cancel long press timer on pointer leave', () => {
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Start press
      fireEvent.pointerDown(scanButton)

      // Move away before threshold
      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerLeave(scanButton)

      // Advance past where timer would have fired
      act(() => {
        vi.advanceTimersByTime(400)
      })

      // Neither callback should be called
      expect(mockOnBatchClick).not.toHaveBeenCalled()
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })

    it('should cancel long press timer on pointer cancel', () => {
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Start press
      fireEvent.pointerDown(scanButton)

      // Cancel (e.g., system interrupt)
      fireEvent.pointerCancel(scanButton)

      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(600)
      })

      // Neither callback should be called
      expect(mockOnBatchClick).not.toHaveBeenCalled()
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })

    it('should work without onBatchClick callback (graceful degradation)', () => {
      // Render without onBatchClick
      render(<Nav {...defaultProps} />)

      const scanButton = screen.getByRole('button', { name: 'Scan' })

      // Long press
      fireEvent.pointerDown(scanButton)

      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // Should not throw, just no batch mode triggered
      fireEvent.pointerUp(scanButton)

      // onScanClick should NOT be called (it was a long press)
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })
  })

  describe('Story 14.11: Bottom Navigation Redesign', () => {
    describe('AC #3: Center FAB Styling', () => {
      it('should render FAB with 52px dimensions', () => {
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByRole('button', { name: 'Scan' })
        expect(scanButton).toHaveClass('w-[52px]', 'h-[52px]')
      })

      it('should render FAB with elevated position', () => {
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByRole('button', { name: 'Scan' })
        // FAB is wrapped in a relative container with negative margin
        const fabContainer = scanButton.parentElement
        expect(fabContainer).toHaveStyle({ marginTop: '-40px' })
      })

      it('should apply processing gradient when scanStatus is "processing"', () => {
        render(<Nav {...defaultProps} scanStatus="processing" />)

        const scanButton = screen.getByRole('button', { name: 'Processing...' })
        expect(scanButton).toHaveStyle({
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        })
      })

      it('should apply ready gradient when scanStatus is "ready"', () => {
        render(<Nav {...defaultProps} scanStatus="ready" />)

        const scanButton = screen.getByRole('button', { name: 'Ready for review' })
        expect(scanButton).toHaveStyle({
          background: 'linear-gradient(135deg, #10b981, #059669)',
        })
      })

      it('should apply pulse animation when processing and motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} scanStatus="processing" />)

        const scanButton = screen.getByRole('button', { name: 'Processing...' })
        expect(scanButton).toHaveClass('animate-pulse')
      })

      it('should not apply pulse animation when processing and motion disabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        render(<Nav {...defaultProps} scanStatus="processing" />)

        const scanButton = screen.getByRole('button', { name: 'Processing...' })
        expect(scanButton).not.toHaveClass('animate-pulse')
      })
    })

    describe('AC #5: Animation with Reduced Motion', () => {
      it('should include transition classes when motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        expect(homeButton).toHaveClass('transition-all')
        expect(homeButton).toHaveClass('active:scale-95')
      })

      it('should exclude transition classes when motion disabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        expect(homeButton).not.toHaveClass('transition-all')
        expect(homeButton).not.toHaveClass('active:scale-95')
      })

      it('should have transition in style when motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        expect(homeButton).toHaveAttribute('style', expect.stringContaining('transition'))
      })

      it('should have transition: none when motion disabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        expect(homeButton).toHaveAttribute('style', expect.stringContaining('none'))
      })
    })

    describe('AC #6: Haptic Feedback', () => {
      it('should trigger haptic vibration on nav click when motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        expect(mockVibrate).toHaveBeenCalledWith(10)
      })

      it('should NOT trigger haptic vibration when motion disabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        render(<Nav {...defaultProps} />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        expect(mockVibrate).not.toHaveBeenCalled()
      })

      it('should trigger haptic on each nav button click', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} />)

        // Click multiple nav buttons
        fireEvent.click(screen.getByText('Home').closest('button')!)
        fireEvent.click(screen.getByText('Analytics').closest('button')!)
        fireEvent.click(screen.getByText('Insights').closest('button')!)
        fireEvent.click(screen.getByText('Alerts').closest('button')!)

        expect(mockVibrate).toHaveBeenCalledTimes(4)
        expect(mockVibrate).toHaveBeenCalledWith(10)
      })

      it('should gracefully handle missing navigator.vibrate', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        // Remove vibrate support
        Object.defineProperty(navigator, 'vibrate', {
          value: undefined,
          writable: true,
          configurable: true,
        })

        render(<Nav {...defaultProps} />)

        // Should not throw when clicking
        const homeButton = screen.getByText('Home').closest('button')
        expect(() => fireEvent.click(homeButton!)).not.toThrow()

        // Restore for other tests
        Object.defineProperty(navigator, 'vibrate', {
          value: mockVibrate,
          writable: true,
          configurable: true,
        })
      })
    })

    describe('AC #4: Safe Area Handling', () => {
      it('should include safe area padding styles in nav', () => {
        render(<Nav {...defaultProps} />)

        const nav = screen.getByRole('navigation')

        // JSDOM doesn't fully support calc() with env() so we verify the structure
        // In a real browser, paddingBottom would be set with safe area values
        // Here we verify the explicit padding values are set for other edges
        const style = nav.getAttribute('style')
        expect(style).toContain('padding-top: 8px')
        expect(style).toContain('padding-left: 16px')
        expect(style).toContain('padding-right: 16px')

        // The component does set paddingBottom with safe area - verify it in component code
        // This is a structural test; visual verification happens in browser testing
      })

      it('should have fixed positioning at bottom', () => {
        render(<Nav {...defaultProps} />)

        const nav = screen.getByRole('navigation')
        expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
      })
    })

    describe('Font Weight Styling', () => {
      it('should apply font-weight 600 to active tab label', () => {
        render(<Nav {...defaultProps} view="dashboard" />)

        const homeButton = screen.getByText('Home').closest('button')
        const homeLabel = homeButton?.querySelector('span')
        expect(homeLabel).toHaveStyle({ fontWeight: 600 })
      })

      it('should apply font-weight 500 to inactive tab labels', () => {
        render(<Nav {...defaultProps} view="dashboard" />)

        const analyticsButton = screen.getByText('Analytics').closest('button')
        const analyticsLabel = analyticsButton?.querySelector('span')
        expect(analyticsLabel).toHaveStyle({ fontWeight: 500 })
      })
    })
  })
})
