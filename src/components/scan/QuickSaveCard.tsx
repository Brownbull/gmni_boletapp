/**
 * QuickSaveCard Component
 *
 * Story 11.2: Quick Save Card Component
 * Story 11.3: Animated Item Reveal
 * Epic 11: Quick Save & Scan Flow Optimization
 *
 * Displays a summary card after successful scan with Accept/Edit options.
 * Reduces scan-to-save time to <15 seconds for high-confidence scans.
 *
 * Features:
 * - Shows merchant name, total amount, item count, category
 * - Primary "Guardar" button for immediate save
 * - Secondary "Editar" button to navigate to full EditView
 * - Cancel link to discard scan
 * - Category emoji display
 * - Dark mode support
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Story 11.3: Animated item reveal with staggered timing
 *
 * @see docs/sprint-artifacts/epic11/story-11.2-quick-save-card.md
 * @see docs/sprint-artifacts/epic11/story-11.3-animated-item-reveal.md
 */

import React, { useCallback } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';
import { Transaction, StoreCategory } from '../../types/transaction';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import { useStaggeredReveal } from '../../hooks/useStaggeredReveal';
import { AnimatedItem } from '../AnimatedItem';

export interface QuickSaveCardProps {
  /** Transaction data from scan result */
  transaction: Transaction;
  /** AI extraction confidence score (0-1) */
  confidence: number;
  /** Callback when user clicks "Guardar" */
  onSave: () => Promise<void>;
  /** Callback when user clicks "Editar" */
  onEdit: () => void;
  /** Callback when user clicks "Cancelar" */
  onCancel: () => void;
  /** Theme for styling ('light' | 'dark') */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Currency format function */
  formatCurrency: (amount: number, currency: string) => string;
  /** Currency code */
  currency: string;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Story 11.3: Whether to show item list with animation */
  showItems?: boolean;
  /** Story 11.3: Maximum items to show before "and X more" */
  maxVisibleItems?: number;
}

/**
 * QuickSaveCard displays a summary of scanned receipt data with quick action buttons.
 *
 * @example
 * ```tsx
 * <QuickSaveCard
 *   transaction={scanResult}
 *   confidence={0.92}
 *   onSave={handleSave}
 *   onEdit={handleEdit}
 *   onCancel={handleCancel}
 *   theme="light"
 *   t={t}
 *   formatCurrency={formatCurrency}
 *   currency="CLP"
 * />
 * ```
 */
export const QuickSaveCard: React.FC<QuickSaveCardProps> = ({
  transaction,
  confidence,
  onSave,
  onEdit,
  onCancel,
  theme,
  t,
  formatCurrency,
  currency,
  isSaving = false,
  showItems = true,
  maxVisibleItems = 5,
}) => {
  const isDark = theme === 'dark';

  // Handle save with loading state
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    await onSave();
  }, [onSave, isSaving]);

  // Get display values
  const merchantName = transaction.alias || transaction.merchant || t('unknown');
  const total = transaction.total || 0;
  const items = transaction.items || [];
  const itemCount = items.length;
  const category = transaction.category || 'Other';
  const emoji = getCategoryEmoji(category as StoreCategory);

  // Story 11.3: Staggered reveal for items (AC #1, #2, #5)
  // Limit displayed items and track "and X more"
  const displayItems = items.slice(0, maxVisibleItems);
  const remainingCount = items.length - maxVisibleItems;
  const { visibleItems, isComplete } = useStaggeredReveal(displayItems, {
    staggerMs: 100,      // AC #2: 100ms stagger between items
    initialDelayMs: 300, // AC #4: Total and merchant appear first
    maxDurationMs: 2500, // AC #5: Complete within ~2.5 seconds
  });

  // Format item count text
  const itemsText = itemCount === 1
    ? `1 ${t('items').slice(0, -1)}` // Remove 's' for singular
    : `${itemCount} ${t('items')}`;

  // Story 11.6: Modal with safe area padding (AC #3, #6)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{
        padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-save-title"
    >
      <div
        className={`
          w-full max-w-sm rounded-2xl p-6 shadow-xl
          animate-slide-up
          ${isDark
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-white text-slate-900 border border-slate-200'
          }
        `}
      >
        {/* Header with merchant and emoji */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl" role="img" aria-label={category}>
            {emoji}
          </span>
          <h2
            id="quick-save-title"
            className="text-xl font-semibold truncate flex-1"
          >
            {merchantName}
          </h2>
        </div>

        {/* Amount and details */}
        <div className="mb-6">
          {/* Total amount - prominent display */}
          <div className="text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
            {formatCurrency(total, currency)}
          </div>

          {/* Item count and category */}
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{itemsText}</span>
            <span>•</span>
            <span>{t(`category_${category}`) || category}</span>
          </div>

          {/* Confidence indicator (subtle) */}
          {confidence > 0 && (
            <div className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {Math.round(confidence * 100)}% {t('confidence') || 'confidence'}
            </div>
          )}
        </div>

        {/* Story 11.3: Animated items list (AC #1, #3, #7, #8) */}
        {showItems && items.length > 0 && (
          <div
            className={`
              mb-4 max-h-48 overflow-y-auto
              border rounded-lg p-2
              ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}
            `}
            role="list"
            aria-label={t('items') || 'Items'}
          >
            {visibleItems.map((item, index) => (
              <AnimatedItem
                key={`${item.name}-${index}`}
                delay={index * 100}
                index={index}
                testId={`quick-save-item-${index}`}
                className={`
                  flex justify-between items-center py-1.5 px-2
                  ${index < visibleItems.length - 1
                    ? `border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`
                    : ''
                  }
                `}
              >
                <span
                  className={`text-sm truncate flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                  title={item.name}
                >
                  {item.name}
                </span>
                <span
                  className={`text-sm font-mono ml-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  {formatCurrency(item.price, currency)}
                </span>
              </AnimatedItem>
            ))}
            {/* Show "and X more" after animation completes */}
            {isComplete && remainingCount > 0 && (
              <AnimatedItem
                delay={displayItems.length * 100}
                testId="quick-save-more-items"
                className={`text-xs text-center py-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {t('andXMore')?.replace('{count}', String(remainingCount)) || `...and ${remainingCount} more`}
              </AnimatedItem>
            )}
          </div>
        )}

        {/* Action buttons - Story 11.3: Buttons appear after items animation (AC #8) */}
        <div className="space-y-3">
          {/* Primary save button (AC #3) */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              w-full py-3.5 px-4 rounded-xl font-semibold text-white
              flex items-center justify-center gap-2
              transition-all duration-200
              ${isSaving
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-[0.98]'
              }
            `}
            aria-label={t('quickSave') || 'Guardar'}
          >
            <Check className="w-5 h-5" />
            {isSaving ? t('saving') || 'Guardando...' : t('quickSave') || 'Guardar'}
          </button>

          {/* Secondary edit button (AC #4) */}
          <button
            onClick={onEdit}
            disabled={isSaving}
            className={`
              w-full py-3 px-4 rounded-xl font-medium
              flex items-center justify-center gap-2
              border-2 transition-all duration-200
              ${isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
            `}
            aria-label={t('editTrans') || 'Editar'}
          >
            {t('editTrans') || 'Editar'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cancel link (AC #7) */}
        <button
          onClick={onCancel}
          disabled={isSaving}
          className={`
            w-full mt-4 py-2 text-sm font-medium
            flex items-center justify-center gap-1
            transition-colors
            ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}
            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={t('cancel') || 'Cancelar'}
        >
          <X className="w-4 h-4" />
          {t('cancel') || 'Cancelar'}
        </button>
      </div>
    </div>
  );
};

export default QuickSaveCard;
