/**
 * Unit Tests for BatchThumbnailStrip Component
 *
 * Story 12.1: Batch Capture UI
 * Tests for the horizontal thumbnail strip component.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchThumbnailStrip } from '@features/batch-review/components/BatchThumbnailStrip';
import type { CapturedImage } from '@features/batch-review/hooks/useBatchCapture';

// Mock translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    receipt: 'Receipt',
    removeImage: 'Remove image',
    batchAddMore: 'Add',
    batchOfMax: 'of',
    batchImages: 'images',
    batchImageList: 'Captured images',
  };
  return translations[key] || key;
};

// Helper to create mock CapturedImage
const createMockImage = (id: string, index: number): CapturedImage => ({
  id,
  file: new File([''], `test${index}.jpg`, { type: 'image/jpeg' }),
  dataUrl: `data:image/jpeg;base64,mockData${index}`,
  thumbnailUrl: `data:image/jpeg;base64,mockThumbnail${index}`,
  addedAt: new Date(),
});

describe('BatchThumbnailStrip Component', () => {
  const defaultProps = {
    images: [],
    onRemoveImage: vi.fn(),
    onAddMore: vi.fn(),
    canAddMore: true,
    maxImages: 10,
    theme: 'light' as const,
    t,
  };

  describe('Rendering', () => {
    it('should render empty strip with add button', () => {
      render(<BatchThumbnailStrip {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      expect(screen.getByText('0 of 10 images')).toBeInTheDocument();
    });

    it('should render thumbnails for each image (AC #3)', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
        createMockImage('img-3', 3),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      // Check that all images are rendered
      expect(screen.getByAltText('Receipt 1')).toBeInTheDocument();
      expect(screen.getByAltText('Receipt 2')).toBeInTheDocument();
      expect(screen.getByAltText('Receipt 3')).toBeInTheDocument();
    });

    it('should show image count indicator (AC #7)', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      expect(screen.getByText('2 of 10 images')).toBeInTheDocument();
    });

    it('should show numbered badges on thumbnails', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Add More Button', () => {
    it('should show add more button when under limit', () => {
      const images = [createMockImage('img-1', 1)];

      render(<BatchThumbnailStrip {...defaultProps} images={images} canAddMore={true} />);

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('should hide add more button when at limit', () => {
      const images = Array.from({ length: 10 }, (_, i) => createMockImage(`img-${i}`, i));

      render(<BatchThumbnailStrip {...defaultProps} images={images} canAddMore={false} />);

      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    });

    it('should call onAddMore when add button is clicked (AC #4)', () => {
      const onAddMore = vi.fn();
      const images = [createMockImage('img-1', 1)];

      render(<BatchThumbnailStrip {...defaultProps} images={images} onAddMore={onAddMore} />);

      fireEvent.click(screen.getByRole('button', { name: /add/i }));

      expect(onAddMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Remove Image', () => {
    it('should have remove button on each thumbnail (AC #6)', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove image/i });
      expect(removeButtons).toHaveLength(2);
    });

    it('should call onRemoveImage with correct ID when remove button clicked', () => {
      const onRemoveImage = vi.fn();
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} onRemoveImage={onRemoveImage} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove image/i });
      fireEvent.click(removeButtons[0]);

      expect(onRemoveImage).toHaveBeenCalledWith('img-1');
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme', () => {
      const images = [createMockImage('img-1', 1)];

      const { container } = render(
        <BatchThumbnailStrip {...defaultProps} images={images} theme="light" />
      );

      // Light theme should have specific border styling
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      const images = [createMockImage('img-1', 1)];

      const { container } = render(
        <BatchThumbnailStrip {...defaultProps} images={images} theme="dark" />
      );

      // Dark theme should have specific border styling
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Count Indicator Styling', () => {
    it('should show normal color when under limit', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} maxImages={10} />);

      const countText = screen.getByText('2 of 10 images');
      expect(countText).not.toHaveClass('text-amber-500');
    });

    it('should show amber color when near limit', () => {
      const images = Array.from({ length: 9 }, (_, i) => createMockImage(`img-${i}`, i));

      render(<BatchThumbnailStrip {...defaultProps} images={images} maxImages={10} />);

      const countText = screen.getByText('9 of 10 images');
      expect(countText).toHaveClass('text-amber-500');
    });
  });

  describe('Accessibility', () => {
    it('should have proper list role', () => {
      const images = [createMockImage('img-1', 1)];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have list item roles for images', () => {
      const images = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('should have accessible labels on remove buttons', () => {
      const images = [createMockImage('img-1', 1)];

      render(<BatchThumbnailStrip {...defaultProps} images={images} />);

      expect(screen.getByRole('button', { name: 'Remove image 1' })).toBeInTheDocument();
    });
  });
});
