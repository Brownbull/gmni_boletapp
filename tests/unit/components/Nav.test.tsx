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
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../setup/test-utils'
import { Nav } from '../../../src/components/Nav'

describe('Nav Component', () => {
  const mockSetView = vi.fn()
  const mockOnScanClick = vi.fn()
  const mockOnTrendsClick = vi.fn()

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
        settings: 'Settings',
      }
      return translations[key] || key
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render all navigation buttons', () => {
      render(<Nav {...defaultProps} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Insights')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should render the scan button with aria-label', () => {
      render(<Nav {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument()
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
          settings: 'Ajustes',
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
      // The active tab uses CSS variable --accent color via inline style
      // Check that style attribute contains the expected color variable
      expect(insightsButton).toHaveAttribute('style', expect.stringContaining('--accent'))
    })

    it('should apply inactive styling when different view is active', () => {
      render(<Nav {...defaultProps} view="dashboard" />)

      const insightsButton = screen.getByText('Insights').closest('button')
      // Non-active tabs use CSS variable --secondary color via inline style
      expect(insightsButton).toHaveAttribute('style', expect.stringContaining('--secondary'))
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
      fireEvent.click(scanButton)

      expect(mockOnScanClick).toHaveBeenCalled()
    })

    it('should call setView with "settings" when clicking Settings', () => {
      render(<Nav {...defaultProps} />)

      const settingsButton = screen.getByText('Settings').closest('button')
      fireEvent.click(settingsButton!)

      expect(mockSetView).toHaveBeenCalledWith('settings')
    })
  })

  describe('Active State Styling', () => {
    it.each([
      ['dashboard', 'Home'],
      ['trends', 'Analytics'],
      ['insights', 'Insights'],
      ['settings', 'Settings'],
    ])('should apply active styling to %s button when view is %s', (view, label) => {
      render(<Nav {...defaultProps} view={view} />)

      const activeButton = screen.getByText(label).closest('button')
      // Active buttons have --accent color in their inline style
      expect(activeButton).toHaveAttribute('style', expect.stringContaining('--accent'))
    })
  })
})
