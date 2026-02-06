/**
 * InfoTooltip Component
 *
 * Reusable tooltip component for displaying informational text.
 *
 * Features:
 * - Click to toggle (mobile-friendly, not hover-only)
 * - Auto-dismiss after 5 seconds
 * - X button to close manually
 * - Click again on info icon to close
 * - Fixed positioning centered on screen (never gets cut off)
 * - Accessible (ARIA attributes, keyboard support)
 *
 * @example
 * ```tsx
 * <InfoTooltip
 *   content={t('doubleGateTooltip')}
 *   iconSize={16}
 *   testId="double-gate-tooltip"
 * />
 * ```
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// =============================================================================
// Types
// =============================================================================

export interface InfoTooltipProps {
  /** The tooltip content text */
  content: string;
  /** Size of the info icon (default: 16) */
  iconSize?: number;
  /** Auto-dismiss timeout in ms (default: 5000, set to 0 to disable) */
  autoDismissMs?: number;
  /** Test ID prefix for e2e testing */
  testId?: string;
  /** Additional class for the icon button */
  iconClassName?: string;
  /** Additional class for the tooltip container */
  tooltipClassName?: string;
}

// =============================================================================
// Component
// =============================================================================

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  iconSize = 16,
  autoDismissMs = 5000,
  testId = 'info-tooltip',
  iconClassName = '',
  tooltipClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate tooltip position (below the button, centered on screen)
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Position below the button with some margin
    setTooltipTop(rect.bottom + 8);
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setIsOpen(true);
    }
  }, [isOpen, calculatePosition]);

  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (isOpen && autoDismissMs > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, autoDismissMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isOpen, autoDismissMs]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleRepositon = () => calculatePosition();
    window.addEventListener('scroll', handleRepositon, true);
    window.addEventListener('resize', handleRepositon);

    return () => {
      window.removeEventListener('scroll', handleRepositon, true);
      window.removeEventListener('resize', handleRepositon);
    };
  }, [isOpen, calculatePosition]);

  // Tooltip content rendered via portal to escape parent overflow
  const tooltipContent = isOpen && createPortal(
    <div
      ref={tooltipRef}
      id={`${testId}-content`}
      role="tooltip"
      className={`fixed z-[10000] p-4 rounded-lg shadow-xl text-sm ${tooltipClassName}`}
      style={{
        top: tooltipTop,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100vw - 32px)',
        maxWidth: '320px',
        backgroundColor: 'var(--surface, white)',
        color: 'var(--text-secondary, #374151)',
        border: '1px solid var(--border-light, #e5e7eb)',
      }}
      data-testid={testId}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-2 right-2 p-1.5 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Close tooltip"
        data-testid={`${testId}-close`}
      >
        <X size={16} className="text-gray-400" aria-hidden="true" />
      </button>

      {/* Content */}
      <div className="pr-8 leading-relaxed">
        {content}
      </div>

      {/* Auto-dismiss indicator */}
      {autoDismissMs > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 rounded-b-lg"
          style={{
            backgroundColor: 'var(--primary, #3b82f6)',
            animation: `infotooltip-shrink ${autoDismissMs}ms linear forwards`,
            width: '100%',
          }}
          aria-hidden="true"
        />
      )}

      {/* CSS animation for auto-dismiss indicator */}
      <style>{`
        @keyframes infotooltip-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>,
    document.body
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${iconClassName}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? `${testId}-content` : undefined}
        data-testid={`${testId}-button`}
      >
        <Info
          size={iconSize}
          className="text-gray-500 dark:text-gray-400"
          aria-hidden="true"
        />
        <span className="sr-only">
          {isOpen ? 'Close information' : 'Show information'}
        </span>
      </button>

      {tooltipContent}
    </div>
  );
};

export default InfoTooltip;
