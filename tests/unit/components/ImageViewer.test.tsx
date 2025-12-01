/**
 * ImageViewer Component Tests
 *
 * Tests for the ImageViewer modal component that displays full-size receipt images.
 *
 * Coverage:
 * - AC#3: Image Viewer Modal - open/close, dark background, close button
 * - AC#5: Multi-Image Navigation - arrows, image counter, keyboard navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils'
import { ImageViewer } from '../../../src/components/ImageViewer'

describe('ImageViewer Component', () => {
  const mockOnClose = vi.fn()
  const singleImage = ['https://example.com/receipt1.jpg']
  const multipleImages = [
    'https://example.com/receipt1.jpg',
    'https://example.com/receipt2.jpg',
    'https://example.com/receipt3.jpg',
  ]
  const merchantName = 'Test Merchant'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the image viewer modal', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('image-viewer-image')).toBeInTheDocument()
    })

    it('should display the image with correct alt text', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      const image = screen.getByTestId('image-viewer-image')
      expect(image).toHaveAttribute('alt', `Receipt from ${merchantName} - Image 1 of 1`)
    })

    it('should have a close button', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('image-viewer-close')).toBeInTheDocument()
    })

    it('should have accessible aria attributes', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-label', `Receipt image viewer for ${merchantName}`)
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByTestId('image-viewer-close'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Escape key is pressed', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking outside the image (backdrop)', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      // Click on the backdrop (the dialog element itself)
      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should NOT close when clicking on the image', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      const image = screen.getByTestId('image-viewer-image')
      fireEvent.click(image)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Single Image Mode', () => {
    it('should NOT show navigation arrows for single image', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByTestId('image-viewer-prev')).not.toBeInTheDocument()
      expect(screen.queryByTestId('image-viewer-next')).not.toBeInTheDocument()
    })

    it('should NOT show image counter for single image', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByTestId('image-viewer-counter')).not.toBeInTheDocument()
    })
  })

  describe('Multi-Image Navigation', () => {
    it('should show navigation arrows for multiple images', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('image-viewer-prev')).toBeInTheDocument()
      expect(screen.getByTestId('image-viewer-next')).toBeInTheDocument()
    })

    it('should show image counter for multiple images', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should navigate to next image when clicking next arrow', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByTestId('image-viewer-next'))

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('2 of 3')
    })

    it('should navigate to previous image when clicking previous arrow', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
          initialIndex={1}
        />
      )

      fireEvent.click(screen.getByTestId('image-viewer-prev'))

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should wrap around when navigating past the last image', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
          initialIndex={2}
        />
      )

      fireEvent.click(screen.getByTestId('image-viewer-next'))

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should wrap around when navigating before the first image', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByTestId('image-viewer-prev'))

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('3 of 3')
    })

    it('should navigate with arrow keys', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.keyDown(document, { key: 'ArrowRight' })
      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('2 of 3')

      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })

    it('should NOT navigate with arrow keys for single image', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      fireEvent.keyDown(document, { key: 'ArrowRight' })
      fireEvent.keyDown(document, { key: 'ArrowLeft' })

      // Should still be image 1 of 1
      const image = screen.getByTestId('image-viewer-image')
      expect(image).toHaveAttribute('alt', `Receipt from ${merchantName} - Image 1 of 1`)
    })
  })

  describe('Initial Index', () => {
    it('should start at specified initial index', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
          initialIndex={1}
        />
      )

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('2 of 3')
    })

    it('should default to first image when initialIndex not provided', () => {
      render(
        <ImageViewer
          images={multipleImages}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('image-viewer-counter')).toHaveTextContent('1 of 3')
    })
  })

  describe('Loading and Error States', () => {
    it('should show error state when image fails to load', async () => {
      render(
        <ImageViewer
          images={['invalid-url']}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      const image = screen.getByTestId('image-viewer-image')
      fireEvent.error(image)

      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument()
      })
    })
  })

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when mounted', () => {
      render(
        <ImageViewer
          images={singleImage}
          merchantName={merchantName}
          onClose={mockOnClose}
        />
      )

      expect(document.body.style.overflow).toBe('hidden')
    })
  })
})
