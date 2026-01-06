/**
 * ReportDetailOverlay Component
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * Story-style detail overlay for viewing full report content.
 * Opens when clicking a report row, showing hero card, insights,
 * highlights, and category breakdown.
 *
 * @example
 * ```tsx
 * <ReportDetailOverlay
 *   isOpen={showOverlay}
 *   onClose={() => setShowOverlay(false)}
 *   reportData={selectedReport}
 * />
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, X, ChevronUp, ChevronDown, Receipt } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { TrendDirection, ReportPeriodType, CategoryBreakdown } from '../../types/report';
import { formatCurrency } from '../../types/report';

// ============================================================================
// Types
// ============================================================================

export interface ReportHighlight {
  label: string;
  value: string;
}

export interface ReportDetailData {
  /** Report ID */
  id: string;
  /** Full title with temporal context (e.g., "Semana 23 · Diciembre · Q4 2025") */
  fullTitle: string;
  /** Short title for header */
  title: string;
  /** Period type */
  periodType: ReportPeriodType;
  /** Total amount */
  amount: number;
  /** Trend direction */
  trend?: TrendDirection;
  /** Trend percentage */
  trendPercent?: number;
  /** Comparison label (e.g., "vs S1", "vs Dic", "vs Q3", "vs 2025") */
  comparisonLabel?: string;
  /** Whether this is the first report of this type */
  isFirst?: boolean;
  /** Persona insight text */
  personaInsight?: string;
  /** Highlights for quarterly/yearly reports */
  highlights?: ReportHighlight[];
  /** Category breakdown */
  categories: CategoryBreakdown[];
  /** Total number of transactions in this period */
  transactionCount: number;
  /** Date range for the period (used for filtering navigation) */
  dateRange: { start: Date; end: Date };
}

export interface ReportDetailOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Callback when overlay is closed */
  onClose: () => void;
  /** Report data to display */
  reportData: ReportDetailData | null;
  /** Optional additional CSS classes */
  className?: string;
  /** Callback when user clicks transaction count pill to view transactions */
  onViewTransactions?: (dateRange: { start: Date; end: Date }) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Hero card showing total amount and trend
 */
interface HeroCardProps {
  amount: number;
  trend?: TrendDirection;
  trendPercent?: number;
  isFirst?: boolean;
  periodType: ReportPeriodType;
  /** Specific comparison label (e.g., "vs S1", "vs Dic", "vs Q3", "vs 2025") */
  comparisonLabel?: string;
}

const HeroCard: React.FC<HeroCardProps> = ({
  amount,
  trend,
  trendPercent,
  isFirst,
  periodType,
  comparisonLabel,
}) => {
  const hasTrend = trend && trend !== 'neutral' && trendPercent !== undefined && !isFirst;
  const periodLabel = {
    weekly: 'de la semana',
    monthly: 'del mes',
    quarterly: 'del trimestre',
    yearly: 'del año',
  }[periodType];

  const firstLabel = {
    weekly: 'Tu primera semana',
    monthly: 'Tu primer mes',
    quarterly: 'Tu primer trimestre',
    yearly: 'Tu primer año completo',
  }[periodType];

  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover, var(--primary)) 100%)',
      }}
      data-testid="hero-card"
    >
      <div className="text-xs text-white/80 mb-1">Total {periodLabel}</div>
      <div className="text-4xl font-bold text-white mb-2">
        {formatCurrency(amount)}
      </div>
      {hasTrend && (
        <div
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white/90"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {trend === 'up' ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )}
          {trend === 'up' ? '+' : ''}{trendPercent}% {comparisonLabel || 'vs período anterior'}
        </div>
      )}
      {isFirst && (
        <div className="text-sm text-white/80 mt-2">{firstLabel}</div>
      )}
    </div>
  );
};

/**
 * Insight card with persona text
 */
interface InsightCardProps {
  insight: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => (
  <div
    className="rounded-xl p-5 border"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-light)',
    }}
    data-testid="insight-card"
  >
    <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
      💡 Insight personalizado
    </div>
    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
      {insight}
    </div>
  </div>
);

/**
 * Highlights card for quarterly/yearly reports
 */
interface HighlightsCardProps {
  highlights: ReportHighlight[];
  periodType: ReportPeriodType;
}

const HighlightsCard: React.FC<HighlightsCardProps> = ({ highlights, periodType }) => {
  const highlightLabel = {
    weekly: 'Highlights de la semana',
    monthly: 'Highlights del mes',
    quarterly: 'Highlights del trimestre',
    yearly: 'Highlights del año',
  }[periodType];

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-light)',
      }}
      data-testid="highlights-card"
    >
      <div className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        🏆 {highlightLabel}
      </div>
      <div className="flex flex-col gap-3">
        {highlights.map((h, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {h.label}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {h.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Category breakdown card
 */
interface CategoryBreakdownCardProps {
  categories: CategoryBreakdown[];
}

const CategoryBreakdownCard: React.FC<CategoryBreakdownCardProps> = ({ categories }) => (
  <div
    className="rounded-xl p-5 border"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-light)',
    }}
    data-testid="category-breakdown-card"
  >
    <div className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
      📊 Desglose por categoría
    </div>
    <div className="flex flex-col gap-2.5">
      {categories.map((cat) => (
        <div key={cat.category} className="flex items-center gap-2.5">
          {/* Category icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: 'var(--primary-light, rgba(59, 130, 246, 0.1))' }}
          >
            {cat.icon}
          </div>

          {/* Category info */}
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {cat.category}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {cat.transactionCount} {cat.transactionCount === 1 ? 'compra' : 'compras'}
            </div>
          </div>

          {/* Amount */}
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(cat.amount)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReportDetailOverlay - Modal popup for report details
 *
 * Displays as a popup within the content area, keeping the main
 * "Resumen" header and bottom navigation visible.
 */
export const ReportDetailOverlay: React.FC<ReportDetailOverlayProps> = ({
  isOpen,
  onClose,
  reportData,
  className = '',
  onViewTransactions,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Restore focus when closing
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      (previousActiveElement.current as HTMLElement)?.focus?.();
    }, 0);
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Don't render if not open or no data
  if (!isOpen || !reportData) {
    return null;
  }

  return (
    <>
      {/* Semi-transparent backdrop - positioned within content area */}
      <div
        className="fixed z-[100]"
        style={{
          top: '72px', // Below main header
          left: 0,
          right: 0,
          bottom: '80px', // Above bottom nav
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal popup - centered in content area */}
      <div
        ref={overlayRef}
        className={`
          fixed z-[101]
          flex flex-col
          ${prefersReducedMotion ? '' : 'transition-all duration-200'}
          ${className}
        `}
        style={{
          top: '80px', // Below main header with some margin
          left: '12px',
          right: '12px',
          bottom: '88px', // Above bottom nav with some margin
          backgroundColor: 'var(--bg-primary, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
        data-testid="report-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-overlay-title"
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-primary, #ffffff)',
            borderColor: 'var(--border-light)',
          }}
        >
          {/* Back button and title */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
            onClick={handleClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClose();
              }
            }}
          >
            <ChevronLeft size={20} className="shrink-0" style={{ color: 'var(--text-primary)' }} />
            <span
              id="report-overlay-title"
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {reportData.fullTitle}
            </span>
          </div>

          {/* Transaction count pill - clickable to view transactions */}
          <button
            type="button"
            onClick={() => {
              if (onViewTransactions && reportData.dateRange) {
                onViewTransactions(reportData.dateRange);
              }
            }}
            disabled={!onViewTransactions}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0
              ${onViewTransactions ? 'cursor-pointer hover:bg-[var(--bg-tertiary)]' : 'cursor-default'}
              ${prefersReducedMotion ? '' : 'transition-colors duration-150'}
            `}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
            }}
            aria-label={`${reportData.transactionCount} transacciones, ver en historial`}
            data-testid="transaction-count-pill"
          >
            <Receipt size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {reportData.transactionCount}
            </span>
          </button>

          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            aria-label="Cerrar"
            data-testid="close-button"
          >
            <X size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{
            backgroundColor: 'var(--bg-primary, #ffffff)',
          }}
          data-testid="report-content"
        >
          <div className="flex flex-col gap-4">
            {/* Hero card */}
            <HeroCard
              amount={reportData.amount}
              trend={reportData.trend}
              trendPercent={reportData.trendPercent}
              isFirst={reportData.isFirst}
              periodType={reportData.periodType}
              comparisonLabel={reportData.comparisonLabel}
            />

            {/* Persona insight */}
            {reportData.personaInsight && (
              <InsightCard insight={reportData.personaInsight} />
            )}

            {/* Highlights */}
            {reportData.highlights && reportData.highlights.length > 0 && (
              <HighlightsCard
                highlights={reportData.highlights}
                periodType={reportData.periodType}
              />
            )}

            {/* Category breakdown */}
            {reportData.categories && reportData.categories.length > 0 && (
              <CategoryBreakdownCard categories={reportData.categories} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportDetailOverlay;
