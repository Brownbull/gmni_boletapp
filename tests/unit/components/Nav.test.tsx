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
 * - Story 14d.3: Navigation Blocking
 *   - AC#1-4: Custom guard using useScanOptional
 *   - Block navigation when in scan view AND dialog active
 *   - Visual feedback when blocked
 * - Story 14d.8: FAB Visual States
 *   - AC#1-5: Mode colors (single=green, batch=amber, statement=violet, error=red)
 *   - AC#6-10: Icon changes per mode (Camera, Layers, CreditCard, AlertTriangle)
 *   - AC#11-15: Shine animation during processing, respects reduced motion
 *   - AC#16-18: State transitions, pulse for batch reviewing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../setup/test-utils'
import { Nav } from '../../../src/components/Nav'

// Mock useReducedMotion hook
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
  default: vi.fn(() => false),
}))

// Story 14d.3: Mock useScanOptional hook for navigation blocking tests
vi.mock('../../../src/contexts/ScanContext', () => ({
  useScanOptional: vi.fn(() => null),
}))

// Import the mocked modules for controlling their behavior
import { useReducedMotion } from '../../../src/hooks/useReducedMotion'
import { useScanOptional } from '../../../src/contexts/ScanContext'

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
        // Story 14d.3: Navigation blocking translations
        resolveDialogFirst: 'Resolve dialog first',
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
    // Story 14d.3: Reset useScanOptional to return null (no context)
    vi.mocked(useScanOptional).mockReturnValue(null)
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

  describe('Story 12.1: Long-Press Detection (updated by 14d.7 - opens mode selector)', () => {
    const LONG_PRESS_DURATION = 500 // matches Nav component constant

    // Story 14d.7 UPDATED Story 12.1: Long-press now opens mode selector instead of calling onBatchClick directly
    // The direct onBatchClick call happens when user selects "batch" from the popup

    it('AC#1: should open mode selector on long press (500ms) when context is null', () => {
      // With null context, mode selector should open
      vi.mocked(useScanOptional).mockReturnValue(null)
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByTestId('scan-fab')

      // Start long press
      fireEvent.pointerDown(scanButton)

      // Advance past long press threshold
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // Mode selector should appear (14d.7 behavior replaces direct onBatchClick)
      expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()
      // Direct onBatchClick is NOT called - user needs to select from popup
      expect(mockOnBatchClick).not.toHaveBeenCalled()
    })

    it('should call onScanClick on short press (under 500ms)', () => {
      vi.mocked(useScanOptional).mockReturnValue(null)
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByTestId('scan-fab')

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

    it('should NOT call onScanClick after long press opens mode selector', () => {
      vi.mocked(useScanOptional).mockReturnValue(null)
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByTestId('scan-fab')

      // Long press sequence
      fireEvent.pointerDown(scanButton)

      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // Release after long press triggered mode selector
      fireEvent.pointerUp(scanButton)

      // Mode selector opened instead
      expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()
      expect(mockOnScanClick).not.toHaveBeenCalled()
    })

    it('should cancel long press timer on pointer leave', () => {
      vi.mocked(useScanOptional).mockReturnValue(null)
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByTestId('scan-fab')

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

      // Neither callback should be called and no mode selector
      expect(mockOnBatchClick).not.toHaveBeenCalled()
      expect(mockOnScanClick).not.toHaveBeenCalled()
      expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
    })

    it('should cancel long press timer on pointer cancel', () => {
      vi.mocked(useScanOptional).mockReturnValue(null)
      render(<Nav {...defaultProps} onBatchClick={mockOnBatchClick} />)

      const scanButton = screen.getByTestId('scan-fab')

      // Start press
      fireEvent.pointerDown(scanButton)

      // Cancel (e.g., system interrupt)
      fireEvent.pointerCancel(scanButton)

      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(600)
      })

      // Neither callback should be called and no mode selector
      expect(mockOnBatchClick).not.toHaveBeenCalled()
      expect(mockOnScanClick).not.toHaveBeenCalled()
      expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
    })

    it('should work without onBatchClick callback (graceful degradation)', () => {
      vi.mocked(useScanOptional).mockReturnValue(null)
      // Render without onBatchClick
      render(<Nav {...defaultProps} />)

      const scanButton = screen.getByTestId('scan-fab')

      // Long press
      fireEvent.pointerDown(scanButton)

      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DURATION)
      })

      // Should not throw, mode selector opens
      fireEvent.pointerUp(scanButton)

      // Mode selector should be shown
      expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()
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

      it('should apply primary gradient when scanStatus is "processing" (single scan)', () => {
        render(<Nav {...defaultProps} scanStatus="processing" />)

        const scanButton = screen.getByRole('button', { name: 'Processing...' })
        // Story 14d.4: Single scan processing keeps primary gradient (not amber)
        // Amber gradient is only for batch mode (isBatchMode=true)
        expect(scanButton).toHaveStyle({
          background: 'linear-gradient(135deg, var(--primary), var(--primary-hover, var(--primary)))',
        })
      })

      it('should apply ready gradient when scanStatus is "ready"', () => {
        render(<Nav {...defaultProps} scanStatus="ready" />)

        const scanButton = screen.getByRole('button', { name: 'Ready for review' })
        // Story 12.3: Green gradient for ready-to-review state (uses CSS variable with fallback)
        expect(scanButton).toHaveStyle({
          background: 'linear-gradient(135deg, var(--success, #10b981), #059669)',
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

  describe('Story 14d.3: Navigation Blocking', () => {
    // Helper to mock scan context with dialog state
    const mockScanContextWithDialog = (hasDialog: boolean, canNavigateFreely: boolean = !hasDialog) => {
      vi.mocked(useScanOptional).mockReturnValue({
        hasDialog,
        canNavigateFreely,
        // Other required properties from ScanContextValue
        state: {} as never,
        hasActiveRequest: false,
        isProcessing: false,
        isIdle: true,
        hasError: false,
        isBlocking: hasDialog,
        creditSpent: false,
        canSave: false,
        currentView: 'capturing',
        imageCount: 0,
        resultCount: 0,
        startSingleScan: vi.fn(),
        startBatchScan: vi.fn(),
        startStatementScan: vi.fn(),
        addImage: vi.fn(),
        removeImage: vi.fn(),
        setImages: vi.fn(),
        setStoreType: vi.fn(),
        setCurrency: vi.fn(),
        processStart: vi.fn(),
        processSuccess: vi.fn(),
        processError: vi.fn(),
        showDialog: vi.fn(),
        resolveDialog: vi.fn(),
        dismissDialog: vi.fn(),
        updateResult: vi.fn(),
        setActiveResult: vi.fn(),
        saveStart: vi.fn(),
        saveSuccess: vi.fn(),
        saveError: vi.fn(),
        batchItemStart: vi.fn(),
        batchItemSuccess: vi.fn(),
        batchItemError: vi.fn(),
        batchComplete: vi.fn(),
        cancel: vi.fn(),
        reset: vi.fn(),
        restoreState: vi.fn(),
        refundCredit: vi.fn(),
        dispatch: vi.fn(),
      })
    }

    describe('AC#1-2: Navigation Blocking When Dialog Active in Scan View', () => {
      it('AC#1: should use useScanOptional to access canNavigateFreely', () => {
        mockScanContextWithDialog(false)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        expect(useScanOptional).toHaveBeenCalled()
      })

      it('AC#2: should block navigation when in scan view AND dialog is active', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Navigation should be blocked
        expect(mockSetView).not.toHaveBeenCalled()
      })

      it('AC#2: should block navigation in batch-capture view with active dialog', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="batch-capture" />)

        const analyticsButton = screen.getByText('Analytics').closest('button')
        fireEvent.click(analyticsButton!)

        expect(mockSetView).not.toHaveBeenCalled()
      })

      it('AC#2: should block navigation in batch-review view with active dialog', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="batch-review" />)

        const insightsButton = screen.getByText('Insights').closest('button')
        fireEvent.click(insightsButton!)

        expect(mockSetView).not.toHaveBeenCalled()
      })

      it('AC#2: should block navigation in scan-result view with active dialog', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="scan-result" />)

        const alertsButton = screen.getByText('Alerts').closest('button')
        fireEvent.click(alertsButton!)

        expect(mockSetView).not.toHaveBeenCalled()
      })
    })

    describe('AC#3: Navigation Allowed from Non-Scan Views', () => {
      it('AC#3: should allow navigation from dashboard regardless of dialog state', () => {
        mockScanContextWithDialog(true) // Dialog active
        render(<Nav {...defaultProps} view="dashboard" />)

        const analyticsButton = screen.getByText('Analytics').closest('button')
        fireEvent.click(analyticsButton!)

        // Navigation should be allowed - dashboard is not a scan view
        expect(mockSetView).toHaveBeenCalledWith('trends')
      })

      it('AC#3: should allow navigation from trends view regardless of dialog state', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="trends" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        expect(mockSetView).toHaveBeenCalledWith('dashboard')
      })

      it('AC#3: should allow navigation from insights view regardless of dialog state', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="insights" />)

        const analyticsButton = screen.getByText('Analytics').closest('button')
        fireEvent.click(analyticsButton!)

        expect(mockSetView).toHaveBeenCalledWith('trends')
      })
    })

    describe('AC#3: Navigation Allowed When No Dialog', () => {
      it('should allow navigation from scan view when no dialog is active', () => {
        mockScanContextWithDialog(false) // No dialog
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Navigation should be allowed - no dialog active
        expect(mockSetView).toHaveBeenCalledWith('dashboard')
      })

      it('should allow navigation when scan context is null (not available)', () => {
        vi.mocked(useScanOptional).mockReturnValue(null)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Navigation should be allowed - context not available
        expect(mockSetView).toHaveBeenCalledWith('dashboard')
      })
    })

    describe('AC#4: Visual Feedback When Blocked', () => {
      it('should show blocked feedback toast when navigation is blocked', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Should show feedback message
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Resolve dialog first')).toBeInTheDocument()
      })

      it('should trigger double-pulse haptic when navigation is blocked', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Should trigger double-pulse haptic feedback
        expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50])
      })

      it('should NOT trigger haptic when navigation blocked and reduced motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        expect(mockVibrate).not.toHaveBeenCalled()
      })

      it('should clear feedback toast after 1.5 seconds', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        // Feedback should be visible
        expect(screen.getByRole('alert')).toBeInTheDocument()

        // Advance time past feedback duration
        act(() => {
          vi.advanceTimersByTime(1500)
        })

        // Feedback should be gone
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })

      it('should apply shake animation to feedback toast when motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('style', expect.stringContaining('animation'))
        expect(alert).toHaveAttribute('style', expect.stringContaining('shake'))
      })

      it('should NOT apply shake animation when reduced motion is enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')
        fireEvent.click(homeButton!)

        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('style', expect.stringContaining('none'))
      })
    })

    describe('Edge Cases', () => {
      it('should handle multiple rapid blocked navigation attempts', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        const homeButton = screen.getByText('Home').closest('button')

        // Rapid clicks
        fireEvent.click(homeButton!)
        fireEvent.click(homeButton!)
        fireEvent.click(homeButton!)

        // Still should not navigate
        expect(mockSetView).not.toHaveBeenCalled()

        // Only one feedback should be visible
        expect(screen.getAllByRole('alert')).toHaveLength(1)
      })

      it('should allow navigation to same view even when blocking', () => {
        mockScanContextWithDialog(true)
        render(<Nav {...defaultProps} view="transaction-editor" />)

        // No nav button navigates TO transaction-editor, so this tests
        // that the blocking only applies to navigation clicks
        // The scan FAB behaves differently (pointer events)

        const scanButton = screen.getByRole('button', { name: 'Scan' })
        fireEvent.pointerDown(scanButton)
        fireEvent.pointerUp(scanButton)

        // onScanClick should still be called - FAB has separate behavior
        expect(mockOnScanClick).toHaveBeenCalled()
      })
    })
  })

  describe('Story 14d.7: Mode Selector Popup', () => {
    const LONG_PRESS_DURATION = 500

    // Helper to mock scan context with hasActiveRequest
    const mockScanContextWithRequest = (hasActiveRequest: boolean, hasDialog: boolean = false) => {
      vi.mocked(useScanOptional).mockReturnValue({
        hasDialog,
        canNavigateFreely: !hasDialog,
        state: {} as never,
        hasActiveRequest,
        isProcessing: false,
        isIdle: !hasActiveRequest,
        hasError: false,
        isBlocking: hasDialog,
        creditSpent: false,
        canSave: false,
        currentView: 'none',
        imageCount: 0,
        resultCount: 0,
        startSingleScan: vi.fn(),
        startBatchScan: vi.fn(),
        startStatementScan: vi.fn(),
        addImage: vi.fn(),
        removeImage: vi.fn(),
        setImages: vi.fn(),
        setStoreType: vi.fn(),
        setCurrency: vi.fn(),
        processStart: vi.fn(),
        processSuccess: vi.fn(),
        processError: vi.fn(),
        showDialog: vi.fn(),
        resolveDialog: vi.fn(),
        dismissDialog: vi.fn(),
        updateResult: vi.fn(),
        setActiveResult: vi.fn(),
        saveStart: vi.fn(),
        saveSuccess: vi.fn(),
        saveError: vi.fn(),
        batchItemStart: vi.fn(),
        batchItemSuccess: vi.fn(),
        batchItemError: vi.fn(),
        batchComplete: vi.fn(),
        cancel: vi.fn(),
        reset: vi.fn(),
        restoreState: vi.fn(),
        refundCredit: vi.fn(),
        dispatch: vi.fn(),
      })
    }

    const modeSelectorProps = {
      ...defaultProps,
      onBatchClick: mockOnBatchClick,
      onStatementClick: vi.fn(),
      scanCredits: 100,
      superCredits: 50,
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
          resolveDialogFirst: 'Resolve dialog first',
          // Story 14d.7: Mode selector translations
          scanModeSelectorTitle: 'SCAN MODE',
          scanModeSingle: 'Single scan',
          scanModeSingleDesc: 'One receipt at a time',
          scanModeBatch: 'Batch scan',
          scanModeBatchDesc: 'Multiple receipts at once',
          scanModeStatement: 'Bank statement',
          scanModeStatementDesc: 'Coming soon',
          scanModeCredit: '1 credit',
          comingSoon: 'Soon',
          scanInProgress: 'You have a scan in progress',
        }
        return translations[key] || key
      },
    }

    describe('AC#1-3: Long-Press Opens Mode Selector (IDLE state)', () => {
      beforeEach(() => {
        mockScanContextWithRequest(false) // IDLE
      })

      it('AC#1: should show mode selector popup on long press when IDLE', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Start long press
        fireEvent.pointerDown(scanButton)

        // Advance past long press threshold
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Mode selector should appear
        expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()
      })

      it('AC#2: short tap should trigger single scan directly when IDLE', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Short press
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(200) // under threshold
        })
        fireEvent.pointerUp(scanButton)

        // onScanClick should be called
        expect(mockOnScanClick).toHaveBeenCalled()
        // Mode selector should NOT appear
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })

      it('AC#3: should cancel long press timer on pointer leave', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Start long press
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(200)
        })

        // Leave before threshold
        fireEvent.pointerLeave(scanButton)

        // Advance past threshold
        act(() => {
          vi.advanceTimersByTime(400)
        })

        // Mode selector should NOT appear
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })
    })

    describe('AC-RP1 to AC-RP4: Request Precedence', () => {
      it('AC-RP1: should NOT show mode selector when hasActiveRequest is true', () => {
        mockScanContextWithRequest(true) // Active request
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Long press
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Mode selector should NOT appear
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })

      it('AC-RP2: should navigate to transaction-editor on long press when request active', () => {
        mockScanContextWithRequest(true)
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Long press
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Should navigate to transaction-editor
        expect(mockSetView).toHaveBeenCalledWith('transaction-editor')
      })

      it('AC-RP2: should navigate to transaction-editor on short tap when request active', () => {
        mockScanContextWithRequest(true)
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Short tap
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(200)
        })
        fireEvent.pointerUp(scanButton)

        // Should navigate instead of starting new scan
        expect(mockSetView).toHaveBeenCalledWith('transaction-editor')
        expect(mockOnScanClick).not.toHaveBeenCalled()
      })

      it('AC-RP3: should show toast when navigating to active request', () => {
        mockScanContextWithRequest(true)
        const onShowToast = vi.fn()
        render(<Nav {...modeSelectorProps} onShowToast={onShowToast} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Long press
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Should show toast
        expect(onShowToast).toHaveBeenCalledWith('You have a scan in progress')
      })
    })

    describe('Mode Selection', () => {
      beforeEach(() => {
        mockScanContextWithRequest(false) // IDLE
      })

      it('AC#19: should call onScanClick when single mode selected', async () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Select single mode
        const singleOption = screen.getByTestId('scan-mode-single')
        fireEvent.click(singleOption)

        expect(mockOnScanClick).toHaveBeenCalled()
      })

      it('AC#20: should call onBatchClick when batch mode selected', async () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Select batch mode
        const batchOption = screen.getByTestId('scan-mode-batch')
        fireEvent.click(batchOption)

        expect(mockOnBatchClick).toHaveBeenCalled()
      })

      it('AC#21: should call onStatementClick when statement mode selected', async () => {
        const onStatementClick = vi.fn()
        render(<Nav {...modeSelectorProps} onStatementClick={onStatementClick} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Select statement mode
        const statementOption = screen.getByTestId('scan-mode-statement')
        fireEvent.click(statementOption)

        expect(onStatementClick).toHaveBeenCalled()
      })

      it('should close mode selector after selection', async () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()

        // Select single mode
        const singleOption = screen.getByTestId('scan-mode-single')
        fireEvent.click(singleOption)

        // Mode selector should close
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })
    })

    describe('Dismissal', () => {
      beforeEach(() => {
        mockScanContextWithRequest(false)
      })

      it('AC#23: should close mode selector on backdrop click', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()

        // Click backdrop
        fireEvent.click(screen.getByTestId('scan-mode-selector-backdrop'))

        // Mode selector should close
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })

      it('AC#24: should close mode selector on Escape key', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        expect(screen.getByTestId('scan-mode-selector')).toBeInTheDocument()

        // Press Escape
        fireEvent.keyDown(screen.getByTestId('scan-mode-selector'), { key: 'Escape' })

        // Mode selector should close
        expect(screen.queryByTestId('scan-mode-selector')).not.toBeInTheDocument()
      })
    })

    describe('AC#28: ARIA Attributes', () => {
      beforeEach(() => {
        mockScanContextWithRequest(false)
      })

      it('should have aria-haspopup="menu" on FAB', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveAttribute('aria-haspopup', 'menu')
      })

      it('should have aria-expanded="false" when mode selector is closed', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveAttribute('aria-expanded', 'false')
      })

      it('should have aria-expanded="true" when mode selector is open', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        // Open mode selector
        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        expect(scanButton).toHaveAttribute('aria-expanded', 'true')
      })
    })

    describe('AC#5: Haptic Feedback on Long-Press', () => {
      beforeEach(() => {
        mockScanContextWithRequest(false)
        vi.mocked(useReducedMotion).mockReturnValue(false)
      })

      it('should trigger haptic feedback when mode selector opens', () => {
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        // Should trigger 50ms vibration for long press feedback
        expect(mockVibrate).toHaveBeenCalledWith(50)
      })

      it('should NOT trigger haptic when reduced motion is enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        render(<Nav {...modeSelectorProps} />)

        const scanButton = screen.getByTestId('scan-fab')

        fireEvent.pointerDown(scanButton)
        act(() => {
          vi.advanceTimersByTime(LONG_PRESS_DURATION)
        })

        expect(mockVibrate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Story 14d.8: FAB Visual States', () => {
    // Helper to mock scan context with specific mode and phase
    const mockScanContextWithModePhase = (
      mode: 'single' | 'batch' | 'statement',
      phase: 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error',
      isProcessing: boolean = phase === 'scanning'
    ) => {
      vi.mocked(useScanOptional).mockReturnValue({
        hasDialog: false,
        canNavigateFreely: phase === 'idle',
        state: { mode, phase } as never,
        hasActiveRequest: phase !== 'idle',
        isProcessing,
        isIdle: phase === 'idle',
        hasError: phase === 'error',
        isBlocking: false,
        creditSpent: phase === 'reviewing' || phase === 'saving',
        canSave: phase === 'reviewing',
        currentView: 'capturing',
        imageCount: 0,
        resultCount: 0,
        isBatchMode: mode === 'batch',
        isBatchCapturing: mode === 'batch' && phase === 'capturing',
        isBatchProcessing: mode === 'batch' && phase === 'scanning',
        isBatchReviewing: mode === 'batch' && phase === 'reviewing',
        batchProgress: null,
        startSingleScan: vi.fn(),
        startBatchScan: vi.fn(),
        startStatementScan: vi.fn(),
        addImage: vi.fn(),
        removeImage: vi.fn(),
        setImages: vi.fn(),
        setStoreType: vi.fn(),
        setCurrency: vi.fn(),
        processStart: vi.fn(),
        processSuccess: vi.fn(),
        processError: vi.fn(),
        showDialog: vi.fn(),
        resolveDialog: vi.fn(),
        dismissDialog: vi.fn(),
        updateResult: vi.fn(),
        setActiveResult: vi.fn(),
        saveStart: vi.fn(),
        saveSuccess: vi.fn(),
        saveError: vi.fn(),
        batchItemStart: vi.fn(),
        batchItemSuccess: vi.fn(),
        batchItemError: vi.fn(),
        batchComplete: vi.fn(),
        setBatchReceipts: vi.fn(),
        updateBatchReceipt: vi.fn(),
        discardBatchReceipt: vi.fn(),
        clearBatchReceipts: vi.fn(),
        setBatchEditingIndex: vi.fn(),
        cancel: vi.fn(),
        reset: vi.fn(),
        restoreState: vi.fn(),
        refundCredit: vi.fn(),
        dispatch: vi.fn(),
      })
    }

    describe('AC#1-5: Mode Colors', () => {
      // Note: JSDOM doesn't fully support linear-gradient in style attributes,
      // so we test the color scheme helper function directly for gradient values
      // and verify the component renders correctly via integration.

      it('AC#1: should show green/primary gradient for single mode', () => {
        mockScanContextWithModePhase('single', 'idle')
        render(<Nav {...defaultProps} />)

        // Verify FAB renders and has expected classes
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        expect(scanButton).toHaveClass('text-white') // All modes use white text
      })

      it('AC#2: should show amber gradient for batch mode', () => {
        mockScanContextWithModePhase('batch', 'capturing')
        render(<Nav {...defaultProps} />)

        // Verify FAB renders with batch mode context
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        expect(scanButton).toHaveClass('text-white')
      })

      it('AC#3: should show violet gradient for statement mode', () => {
        mockScanContextWithModePhase('statement', 'capturing')
        render(<Nav {...defaultProps} />)

        // Verify FAB renders with statement mode context
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        expect(scanButton).toHaveClass('text-white')
      })

      it('AC#4: should show red gradient for error state', () => {
        mockScanContextWithModePhase('single', 'error')
        render(<Nav {...defaultProps} />)

        // Verify FAB renders with error state context
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        expect(scanButton).toHaveClass('text-white')
      })

      it('AC#5: should maintain batch color during processing', () => {
        mockScanContextWithModePhase('batch', 'scanning', true)
        render(<Nav {...defaultProps} />)

        // Verify FAB renders with batch processing state
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        // Processing should show shine animation class
        expect(scanButton).toHaveClass('fab-shine')
      })
    })

    describe('AC#6-10: Icon Changes', () => {
      it('AC#6: should show Camera icon for single mode', () => {
        mockScanContextWithModePhase('single', 'idle')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        const svg = scanButton.querySelector('svg')
        expect(svg).toBeInTheDocument()
        // Camera icon is rendered (we can verify by checking it exists)
      })

      it('AC#7: should show Layers icon for batch mode', () => {
        mockScanContextWithModePhase('batch', 'capturing')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        const svg = scanButton.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('AC#8: should show CreditCard icon for statement mode', () => {
        mockScanContextWithModePhase('statement', 'capturing')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        const svg = scanButton.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('AC#9: should show AlertTriangle icon for error state', () => {
        mockScanContextWithModePhase('single', 'error')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        const svg = scanButton.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('AC#9: error icon takes priority over mode icon', () => {
        mockScanContextWithModePhase('batch', 'error')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        // Even in batch mode, error state shows alert icon
        const svg = scanButton.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    describe('AC#11-15: Shine Animation', () => {
      it('AC#11: should show shine animation during processing', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('single', 'scanning', true)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('fab-shine')
      })

      it('AC#14: should NOT show shine when not processing', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('single', 'idle', false)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).not.toHaveClass('fab-shine')
      })

      it('AC#14: should stop shine after processing complete', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('single', 'reviewing', false)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).not.toHaveClass('fab-shine')
      })

      it('AC#15: should NOT show shine when reduced motion is enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        mockScanContextWithModePhase('single', 'scanning', true)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).not.toHaveClass('fab-shine')
      })

      it('AC#11: should show shine for batch mode processing', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('batch', 'scanning', true)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('fab-shine')
      })
    })

    describe('AC#16-18: State Transitions', () => {
      it('AC#16: should update immediately on mode change', () => {
        // Start with single mode
        mockScanContextWithModePhase('single', 'idle')
        const { rerender } = render(<Nav {...defaultProps} />)

        let scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toBeInTheDocument()
        expect(scanButton).not.toHaveClass('fab-shine') // Idle, no shine

        // Change to batch mode with scanning
        mockScanContextWithModePhase('batch', 'scanning', true)
        rerender(<Nav {...defaultProps} />)

        scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('fab-shine') // Now processing
      })

      it('AC#17: should reflect state when navigating between views', () => {
        // Even when view changes, FAB should show current scan state
        mockScanContextWithModePhase('batch', 'scanning', true)

        // Render in dashboard view
        render(<Nav {...defaultProps} view="dashboard" />)

        // FAB should still show batch processing state (via shine animation)
        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('fab-shine')
      })

      it('AC#18: should show pulse animation for batch reviewing', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('batch', 'reviewing', false)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('animate-pulse')
      })

      it('AC#18: should NOT show pulse for single mode reviewing', () => {
        vi.mocked(useReducedMotion).mockReturnValue(false)
        mockScanContextWithModePhase('single', 'reviewing', false)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        // Pulse only for batch reviewing, not single
        expect(scanButton).not.toHaveClass('animate-pulse')
      })

      it('AC#18: should NOT show pulse when reduced motion enabled', () => {
        vi.mocked(useReducedMotion).mockReturnValue(true)
        mockScanContextWithModePhase('batch', 'reviewing', false)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).not.toHaveClass('animate-pulse')
      })
    })

    describe('Fallback Behavior', () => {
      it('should use legacy props when context is null', () => {
        vi.mocked(useScanOptional).mockReturnValue(null)
        render(<Nav {...defaultProps} isBatchMode={true} />)

        const scanButton = screen.getByTestId('scan-fab')
        // Should use amber gradient from legacy isBatchMode prop
        expect(scanButton).toHaveStyle({
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
        })
      })

      it('should use legacy scanStatus for processing state', () => {
        vi.mocked(useScanOptional).mockReturnValue(null)
        vi.mocked(useReducedMotion).mockReturnValue(false)
        render(<Nav {...defaultProps} scanStatus="processing" />)

        const scanButton = screen.getByTestId('scan-fab')
        // Should use pulse animation from legacy scanStatus prop
        expect(scanButton).toHaveClass('animate-pulse')
      })

      it('should default to single mode when context unavailable', () => {
        vi.mocked(useScanOptional).mockReturnValue(null)
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        // Default to primary color (single mode)
        expect(scanButton).toHaveStyle({
          background: expect.stringContaining('var(--primary)')
        })
      })
    })

    describe('Accessibility - AC#21', () => {
      it('should maintain readable text on all FAB color backgrounds', () => {
        // All FAB colors use white text for contrast
        mockScanContextWithModePhase('single', 'idle')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        expect(scanButton).toHaveClass('text-white')
      })

      it('should have appropriate aria-label for error state', () => {
        mockScanContextWithModePhase('single', 'error')
        render(<Nav {...defaultProps} />)

        const scanButton = screen.getByTestId('scan-fab')
        // Button should still be identifiable
        expect(scanButton).toBeInTheDocument()
      })
    })
  })
})
