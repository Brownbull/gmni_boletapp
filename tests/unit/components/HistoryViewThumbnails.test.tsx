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
import { HistoryFiltersProvider, type HistoryFilterState } from '../../../src/contexts/HistoryFiltersContext'

// Group consolidation: Mock firebase/firestore for getFirestore calls
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

// Group consolidation: Mock firestore service for updateTransaction
vi.mock('../../../src/services/firestore', () => ({
  deleteTransactionsBatch: vi.fn(() => Promise.resolve()),
  updateTransaction: vi.fn(() => Promise.resolve()),
}));

// Group consolidation: Mock useAllUserGroups hook
vi.mock('../../../src/hooks/useAllUserGroups', () => ({
  useAllUserGroups: vi.fn(() => ({
    groups: [],
    isLoading: false,
    error: undefined,
    hasGroups: false,
    sharedGroupCount: 0,
    personalGroupCount: 0,
  })),
}));

/**
 * Story 14.30.5a: Fixed temporal filter issue.
 *
 * The default filter state uses the current month, but test transactions
 * have dates in January 2024. We need to set the temporal filter to 'all'
 * so transactions from any date are displayed.
 */
const testFilterState: HistoryFilterState = {
  temporal: { level: 'all' },
  category: { level: 'all' },
  location: {},
  group: {},
}

// Helper to render HistoryView with required provider
const renderHistoryView = (props: React.ComponentProps<typeof HistoryView>) => {
  return render(
    <HistoryFiltersProvider initialState={testFilterState}>
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
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail).toBeInTheDocument()
    })

    it('should display thumbnail image with correct alt text', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const img = screen.getByAltText(`Receipt from ${transactionWithThumbnail.alias}`)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', transactionWithThumbnail.thumbnailUrl)
    })

    it('should have proper thumbnail dimensions', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      // Story 14.14: TransactionCard uses 46px height for receipt aspect ratio
      expect(thumbnail).toHaveClass('w-10', 'h-[46px]')
    })

    it('should have accessible aria-label on thumbnail', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      // Story 14.14: Updated label format
      expect(thumbnail).toHaveAttribute('aria-label', `View receipt from ${transactionWithThumbnail.alias}`)
    })
  })

  describe('Backward Compatibility (AC#4)', () => {
    it('should NOT render thumbnail when transaction has no thumbnailUrl', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithoutImages],
      })

      expect(screen.queryByTestId('transaction-thumbnail')).not.toBeInTheDocument()
    })

    it('should render transaction data correctly without thumbnail', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithoutImages],
      })

      // Merchant appears at least once (as alias fallback or merchant display)
      const merchantElements = screen.getAllByText(transactionWithoutImages.merchant)
      expect(merchantElements.length).toBeGreaterThanOrEqual(1)
      // Story 14.14: TransactionCard shows formatted amount via formatCurrency
      // The formatCurrency returns "$10.00" which is displayed
      const amountMatches = screen.getAllByText(/10\.00/)
      expect(amountMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('should render mixed transactions (with and without thumbnails)', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail, transactionWithoutImages],
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
          transactions: [transactionWithoutImages],
        })
      }).not.toThrow()
    })
  })

  describe('Thumbnail Click Behavior', () => {
    it('should open ImageViewer when thumbnail is clicked', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // ImageViewer should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should NOT trigger onEditTransaction when thumbnail is clicked', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // Should not edit the transaction, just open the viewer
      expect(mockProps.onEditTransaction).not.toHaveBeenCalled()
    })

    it('should trigger onEditTransaction when clicking on transaction row (not thumbnail)', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      // Click on the merchant name (part of transaction row, not thumbnail)
      fireEvent.click(screen.getByText(transactionWithThumbnail.alias!))

      expect(mockProps.onEditTransaction).toHaveBeenCalledWith(transactionWithThumbnail)
    })

    it('should be keyboard accessible (Enter key)', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.keyDown(thumbnail, { key: 'Enter' })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should be keyboard accessible (Space key)', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
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
        transactions: [transactionWithMultipleImages],
      })

      const thumbnail = screen.getByTestId('transaction-thumbnail')
      fireEvent.click(thumbnail)

      // Should show counter since there are multiple images
      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should close ImageViewer when close button is clicked', () => {
      renderHistoryView({
        ...mockProps,
        transactions: [transactionWithThumbnail],
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
        transactions: [transactionWithThumbnail],
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
        transactions: [transactionWithThumbnail],
      })

      const img = screen.getByAltText(`Receipt from ${transactionWithThumbnail.alias}`)
      fireEvent.error(img)

      // Should show error placeholder (Image icon)
      const thumbnail = screen.getByTestId('transaction-thumbnail')
      expect(thumbnail.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Pagination (Story 14.14)', () => {
    // Generate transactions for pagination testing
    const generateTransactions = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `tx-${i + 1}`,
        merchant: `Merchant ${i + 1}`,
        date: `2024-01-${String(15 + (i % 10)).padStart(2, '0')}`,
        total: (i + 1) * 10,
        category: 'Other',
      }))
    }

    it('should show pagination controls when there are transactions', () => {
      renderHistoryView({
        ...mockProps,
        transactions: generateTransactions(10),
        allTransactions: generateTransactions(10),
      })

      // Should show page indicator
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
    })

    it('should default to 15 items per page', () => {
      const twentyTransactions = generateTransactions(20)
      renderHistoryView({
        ...mockProps,
        transactions: twentyTransactions,
        allTransactions: twentyTransactions,
        totalHistoryPages: 2,
      })

      // With 20 transactions and default PAGE_SIZE=15, should show 2 pages
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should show correct page count for exactly 15 transactions', () => {
      const fifteenTransactions = generateTransactions(15)
      renderHistoryView({
        ...mockProps,
        transactions: fifteenTransactions,
        allTransactions: fifteenTransactions,
        totalHistoryPages: 1,
      })

      // Exactly 15 transactions = 1 page (default page size)
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
    })

    it('should show correct page count for 16 transactions', () => {
      const sixteenTransactions = generateTransactions(16)
      renderHistoryView({
        ...mockProps,
        transactions: sixteenTransactions,
        allTransactions: sixteenTransactions,
        totalHistoryPages: 2,
      })

      // 16 transactions with default PAGE_SIZE=15 = 2 pages
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should show page size selector with options 15, 30, 60', () => {
      renderHistoryView({
        ...mockProps,
        transactions: generateTransactions(10),
        allTransactions: generateTransactions(10),
      })

      expect(screen.getByTestId('page-size-selector')).toBeInTheDocument()
      expect(screen.getByTestId('page-size-15')).toBeInTheDocument()
      expect(screen.getByTestId('page-size-30')).toBeInTheDocument()
      expect(screen.getByTestId('page-size-60')).toBeInTheDocument()
    })

    it('should highlight default page size (15)', () => {
      renderHistoryView({
        ...mockProps,
        transactions: generateTransactions(10),
        allTransactions: generateTransactions(10),
      })

      const button15 = screen.getByTestId('page-size-15')
      expect(button15).toHaveAttribute('aria-pressed', 'true')
    })

    it('should change page size when clicking a different option', () => {
      const manyTransactions = generateTransactions(45)
      renderHistoryView({
        ...mockProps,
        transactions: manyTransactions,
        allTransactions: manyTransactions,
      })

      // Initially 45 transactions with PAGE_SIZE=15 = 3 pages
      expect(screen.getByText('1 / 3')).toBeInTheDocument()

      // Verify 15 is initially selected
      expect(screen.getByTestId('page-size-15')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('page-size-30')).toHaveAttribute('aria-pressed', 'false')

      // Click to change to 30 per page
      fireEvent.click(screen.getByTestId('page-size-30'))

      // 30 should now be selected and page count updated
      expect(screen.getByTestId('page-size-30')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('page-size-15')).toHaveAttribute('aria-pressed', 'false')
      // 45 transactions with PAGE_SIZE=30 = 2 pages
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should reset to page 1 when changing page size after navigating', () => {
      // With 45 transactions and page size 15, we have 3 pages
      const manyTransactions = generateTransactions(45)
      renderHistoryView({
        ...mockProps,
        transactions: manyTransactions,
        allTransactions: manyTransactions,
      })

      // Navigate to page 2
      fireEvent.click(screen.getByLabelText('nextPage'))
      expect(screen.getByText('2 / 3')).toBeInTheDocument()

      // Change page size to 60
      fireEvent.click(screen.getByTestId('page-size-60'))

      // Should reset to page 1 (45 transactions / 60 per page = 1 page)
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
    })

    it('should navigate to next page when clicking next page button', () => {
      // 20 transactions with page size 15 = 2 pages
      const manyTransactions = generateTransactions(20)
      renderHistoryView({
        ...mockProps,
        transactions: manyTransactions,
        allTransactions: manyTransactions,
      })

      // Should start at page 1
      expect(screen.getByText('1 / 2')).toBeInTheDocument()

      // Click next page button
      const nextButton = screen.getByLabelText('nextPage')
      fireEvent.click(nextButton)

      // Should now be on page 2
      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    })

    it('should disable previous button on first page', () => {
      const manyTransactions = generateTransactions(20)
      renderHistoryView({
        ...mockProps,
        transactions: manyTransactions,
        allTransactions: manyTransactions,
      })

      // Internal state starts at page 1
      const prevButton = screen.getByLabelText('previousPage')
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      // 10 transactions with PAGE_SIZE=15 = 1 page, so page 1 is last
      // (Internal state starts at page 1, so we use a small dataset)
      const fewTransactions = generateTransactions(10)
      renderHistoryView({
        ...mockProps,
        transactions: fewTransactions,
        allTransactions: fewTransactions,
      })

      // With only 10 transactions and page size 15, there's only 1 page
      // So next button should be disabled
      const nextButton = screen.getByLabelText('nextPage')
      expect(nextButton).toBeDisabled()
    })

    it('should show "Per page:" label in English', () => {
      renderHistoryView({
        ...mockProps,
        transactions: generateTransactions(10),
        allTransactions: generateTransactions(10),
        lang: 'en',
      })

      expect(screen.getByText('Per page:')).toBeInTheDocument()
    })

    it('should show "Por página:" label in Spanish', () => {
      renderHistoryView({
        ...mockProps,
        transactions: generateTransactions(10),
        allTransactions: generateTransactions(10),
        lang: 'es',
      })

      expect(screen.getByText('Por página:')).toBeInTheDocument()
    })
  })
})
