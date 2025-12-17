/**
 * HistoryView Thumbnail Tests
 *
 * Tests for thumbnail rendering in HistoryView component.
 *
 * Coverage:
 * - AC#2: Thumbnail Display in History - renders when URL present, proper sizing
 * - AC#4: Backward Compatibility - no errors when URL missing, data displays correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../setup/test-utils'
import { HistoryView } from '../../../src/views/HistoryView'
import { HistoryFiltersProvider } from '../../../src/contexts/HistoryFiltersContext'

// Helper to render HistoryView with required provider
const renderHistoryView = (props: React.ComponentProps<typeof HistoryView>) => {
  return render(
    <HistoryFiltersProvider>
      <HistoryView {...props} />
    </HistoryFiltersProvider>
  )
}

describe('HistoryView Thumbnail Display', () => {
  const mockProps = {
    historyPage: 1,
    totalHistoryPages: 1,
    theme: 'light' as const,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    t: (key: string) => key,
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    formatDate: (date: string) => date,
    onBack: vi.fn(),
    onSetHistoryPage: vi.fn(),
    onEditTransaction: vi.fn(),
  }

  const transactionWithThumbnail = {
    id: '1',
    merchant: 'Test Supermarket',
    alias: 'Grocery Store',
    date: '2024-01-15',
    total: 45.99,
    category: 'Supermarket',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    imageUrls: ['https://example.com/full1.jpg'],
  }

  const transactionWithMultipleImages = {
    id: '2',
    merchant: 'Restaurant ABC',
    date: '2024-01-16',
    total: 32.50,
    category: 'Restaurant',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    imageUrls: [
      'https://example.com/full2a.jpg',
      'https://example.com/full2b.jpg',
      'https://example.com/full2c.jpg',
    ],
  }

  const transactionWithoutImages = {
    id: '3',
    merchant: 'No Image Store',
    date: '2024-01-17',
    total: 10.00,
    category: 'Other',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Thumbnail Rendering (AC#2)', () => {
    it('should render thumbnail when transaction has thumbnailUrl', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail).toBeInTheDocument()
    })

    it('should display thumbnail image with correct alt text', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const img = screen.getByAltText(`Receipt from ${transactionWithThumbnail.alias}`)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', transactionWithThumbnail.thumbnailUrl)
    })

    it('should have proper thumbnail dimensions (40x50px)', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail).toHaveClass('w-10', 'h-[50px]')
    })

    it('should have accessible aria-label on thumbnail', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail).toHaveAttribute('aria-label', `View receipt image from ${transactionWithThumbnail.alias}`)
    })
  })

  describe('Backward Compatibility (AC#4)', () => {
    it('should NOT render thumbnail when transaction has no thumbnailUrl', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithoutImages],
      })

      expect(screen.queryByTestId('transaction-thumbnail')).not.toBeInTheDocument()
    })

    it('should render transaction data correctly without thumbnail', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithoutImages],
      })

      // Merchant appears at least once (as alias fallback or merchant display)
      const merchantElements = screen.getAllByText(transactionWithoutImages.merchant)
      expect(merchantElements.length).toBeGreaterThanOrEqual(1)
      // Story 9.11: Unified card now shows "Currency Amount" format (e.g., "USD 10.00")
      // The formatCurrency returns "$10.00" and we strip the $ prefix and show currency separately
      expect(screen.getByText(/10\.00/)).toBeInTheDocument()
    })

    it('should render mixed transactions (with and without thumbnails)', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail, transactionWithoutImages],
      })

      // One thumbnail for transaction with image
      const thumbnails = screen.getAllByTestId('transaction-thumbnail')
      expect(thumbnails).toHaveLength(1)

      // Both transactions' data visible
      expect(screen.getByText(transactionWithThumbnail.alias!)).toBeInTheDocument()
      // Merchant without alias appears twice (as alias fallback and merchant display)
      const noImageMerchantElements = screen.getAllByText(transactionWithoutImages.merchant)
      expect(noImageMerchantElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should not throw errors when rendering transactions without image fields', () => {
      expect(() => {
        renderHistoryView({
          ...mockProps,
          historyTrans: [transactionWithoutImages],
        })
      }).not.toThrow()
    })
  })

  describe('Thumbnail Click Behavior', () => {
    it('should open ImageViewer when thumbnail is clicked', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // ImageViewer should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should NOT trigger onEditTransaction when thumbnail is clicked', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // Should not edit the transaction, just open the viewer
      expect(mockProps.onEditTransaction).not.toHaveBeenCalled()
    })

    it('should trigger onEditTransaction when clicking on transaction row (not thumbnail)', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      // Click on the merchant name (part of transaction row, not thumbnail)
      fireEvent.click(screen.getByText(transactionWithThumbnail.alias!))

      expect(mockProps.onEditTransaction).toHaveBeenCalledWith(transactionWithThumbnail)
    })

    it('should be keyboard accessible (Enter key)', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.keyDown(thumbnail, { key: 'Enter' })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should be keyboard accessible (Space key)', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.keyDown(thumbnail, { key: ' ' })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('ImageViewer Integration', () => {
    it('should pass correct images to ImageViewer for multi-image transaction', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithMultipleImages],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // Should show counter since there are multiple images
      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should close ImageViewer when close button is clicked', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      // Open viewer
      fireEvent.click(screen.getByTestId('transaction-thumbnail'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close viewer
      fireEvent.click(screen.getByTestId('image-viewer-close'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should pass merchant name to ImageViewer', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      fireEvent.click(screen.getByTestId('transaction-thumbnail'))

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label', `Receipt image viewer for ${transactionWithThumbnail.alias}`)
    })
  })

  describe('Thumbnail Error Handling', () => {
    it('should show placeholder on thumbnail load error', () => {
      renderHistoryView({
        ...mockProps,
        historyTrans: [transactionWithThumbnail],
      })

      const img = screen.getByAltText(`Receipt from ${transactionWithThumbnail.alias}`)
      fireEvent.error(img)

      // Should show error placeholder (Image icon)
      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail.querySelector('svg')).toBeInTheDocument()
    })
  })
})
