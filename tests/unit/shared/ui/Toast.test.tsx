/**
 * Story 14e-23: Toast Unit Tests
 *
 * Tests for the Toast notification component extracted from App.tsx.
 *
 * Test Categories:
 * - Conditional rendering (null when no message)
 * - Message type styling (success vs info)
 * - Content display
 * - Accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '@/shared/ui/Toast';
import type { ToastMessage } from '@/shared/hooks/useToast';

describe('Toast', () => {
  describe('conditional rendering', () => {
    it('should return null when message is null', () => {
      const { container } = render(<Toast message={null} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should render when message is provided', () => {
      const message: ToastMessage = { text: 'Test message', type: 'success' };

      render(<Toast message={message} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should display the message text', () => {
      const message: ToastMessage = { text: 'Transaction saved!', type: 'success' };

      render(<Toast message={message} />);

      expect(screen.getByText('Transaction saved!')).toBeInTheDocument();
    });

    it('should display different messages correctly', () => {
      const message: ToastMessage = { text: 'Unable to process', type: 'info' };

      render(<Toast message={message} />);

      expect(screen.getByText('Unable to process')).toBeInTheDocument();
    });
  });

  describe('message type styling', () => {
    it('should render checkmark icon for success type', () => {
      const message: ToastMessage = { text: 'Success!', type: 'success' };

      render(<Toast message={message} />);

      // Success type shows checkmark SVG with polyline points="20 6 9 17 4 12"
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const polyline = svg?.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
      expect(polyline).toHaveAttribute('points', '20 6 9 17 4 12');
    });

    it('should render info icon for info type', () => {
      const message: ToastMessage = { text: 'Info message', type: 'info' };

      render(<Toast message={message} />);

      // Info type shows circle with lines (i icon)
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const circle = svg?.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('should apply success background color for success type', () => {
      const message: ToastMessage = { text: 'Success!', type: 'success' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      // Check inline style contains the CSS variable (jsdom doesn't resolve CSS vars)
      const style = toast.getAttribute('style') || '';
      expect(style).toContain('background-color: var(--primary)');
    });

    it('should apply accent background color for info type', () => {
      const message: ToastMessage = { text: 'Info!', type: 'info' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      // Check inline style contains the CSS variable (jsdom doesn't resolve CSS vars)
      const style = toast.getAttribute('style') || '';
      expect(style).toContain('background-color: var(--accent)');
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('styling', () => {
    it('should have fixed positioning class', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('fixed');
    });

    it('should be centered horizontally', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('left-1/2', '-translate-x-1/2');
    });

    it('should have animation class', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('animate-fade-in');
    });

    it('should have white text color', () => {
      const message: ToastMessage = { text: 'Test', type: 'success' };

      render(<Toast message={message} />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveStyle({ color: '#ffffff' });
    });
  });
});
