/**
 * QuickSaveCard Component
 *
 * Story 11.2: Quick Save Card Component
 * Story 11.3: Animated Item Reveal
 * Story 14.4: Quick Save Path (Animations)
 * Story 14.15: Redesigned to match mockup design system
 * Epic 11: Quick Save & Scan Flow Optimization
 * Epic 14: Core Implementation
 *
 * Displays a summary card after successful scan with Accept/Edit options.
 * Reduces scan-to-save time to <15 seconds for high-confidence scans.
 *
 * Features:
 * - Shows merchant name, category badge, location, date/time
 * - Total amount highlight box with icon
 * - Items list with styled rows
 * - Primary "Guardar" button (flex-2) with save icon
 * - Secondary "Editar" button (flex-1) with pencil icon
 * - Cancel with credit warning confirmation
 * - Dark mode support via CSS variables
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Story 11.3: Animated item reveal with staggered timing
 * - Story 14.4: Spring animation on save, success checkmark, reduced motion support
 *
 * @see docs/sprint-artifacts/epic11/story-11.2-quick-save-card.md
 * @see docs/sprint-artifacts/epic11/story-11.3-animated-item-reveal.md
 * @see docs/sprint-artifacts/epic14/stories/story-14.4-quick-save-path.md
 * @see docs/uxui/mockups/00_components/design-system-final.html (Scan section)
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Check, X, AlertTriangle, ArrowLeft, Trash2, Pencil, Save, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import { Transaction, StoreCategory } from '../../types/transaction';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import { translateCategory } from '../../utils/categoryTranslations';
import { getCategoryPillColors } from '../../config/categoryColors';
import { useStaggeredReveal } from '../../hooks/useStaggeredReveal';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AnimatedItem } from '../AnimatedItem';
import { DURATION, EASING } from '../animation/constants';
import type { Language } from '../../utils/translations';

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
  /** Story 14.4: Callback when save animation completes (for chaining Trust Merchant prompt) */
  onSaveComplete?: () => void;
  /** Story 14.4: Whether card is entering (for slide-up animation) */
  isEntering?: boolean;
  /** Story 14.15: Language for category translation */
  lang?: Language;
}

/**
 * QuickSaveCard displays a summary of scanned receipt data with quick action buttons.
 * Redesigned to match the design-system-final.html mockup.
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
  maxVisibleItems = 3,
  onSaveComplete,
  isEntering = true,
  lang = 'es',
}) => {
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();

  // Story 14.4: Animation states (AC #2)
  const [saveAnimating, setSaveAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(!isEntering || prefersReducedMotion);
  // Story 14.15: Cancel confirmation state (credit already used warning)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Story 14.4: Card entry animation (AC #4) - slide up on mount
  useEffect(() => {
    if (isEntering && !prefersReducedMotion) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isEntering, prefersReducedMotion]);

  // Handle save with animation (Story 14.4 AC #2)
  const handleSave = useCallback(async () => {
    if (isSaving || saveAnimating) return;

    if (!prefersReducedMotion) {
      setSaveAnimating(true);
    }

    try {
      await onSave();
      setShowSuccess(true);

      const successDuration = prefersReducedMotion ? 0 : DURATION.SLOWER;
      setTimeout(() => {
        if (onSaveComplete) {
          onSaveComplete();
        }
      }, successDuration);
    } finally {
      setSaveAnimating(false);
    }
  }, [onSave, isSaving, saveAnimating, prefersReducedMotion, onSaveComplete]);

  // Get display values
  const merchantName = transaction.alias || transaction.merchant || t('unknown');
  const total = transaction.total || 0;
  const items = transaction.items || [];
  const itemCount = items.length;
  const category = transaction.category || 'Other';
  const emoji = getCategoryEmoji(category as StoreCategory);
  const categoryColors = getCategoryPillColors(category);

  // Location and date info - use 'as any' for location since it may not be in all Transaction types
  const txn = transaction as { location?: { city?: string; country?: string } };
  const location = txn.location;
  const locationText = location ? `${location.city || ''}, ${location.country || ''}`.replace(/^, |, $/g, '') : '';
  const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
  const dateStr = transactionDate.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = transactionDate.toLocaleTimeString(lang === 'es' ? 'es-CL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Story 11.3: Staggered reveal for items
  const displayItems = items.slice(0, maxVisibleItems);
  const remainingCount = items.length - maxVisibleItems;
  const { visibleItems, isComplete } = useStaggeredReveal(displayItems, {
    staggerMs: 100,
    initialDelayMs: 300,
    maxDurationMs: 2500,
  });

  // Items detected text
  const itemsDetectedText = `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'} ${t('itemsDetected') || 'detectados'}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        transitionDuration: prefersReducedMotion ? '0ms' : `${DURATION.NORMAL}ms`,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-save-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid var(--border-light)`,
          maxHeight: 'calc(100vh - 120px)',
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          opacity: isVisible ? 1 : 0,
          transition: prefersReducedMotion
            ? 'none'
            : `transform ${DURATION.SLOW}ms ${EASING.OUT}, opacity ${DURATION.SLOW}ms ${EASING.OUT}`,
        }}
      >
        {/* Header: Metadata Left, Thumbnail Right */}
        <div className="flex justify-between items-start gap-3 mb-4">
          {/* Left: Metadata */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Merchant Name */}
            <h2
              id="quick-save-title"
              className="text-lg font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {merchantName}
            </h2>

            {/* Category Badge */}
            <div className="flex gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase"
                style={{
                  backgroundColor: categoryColors.bg,
                  color: categoryColors.fg,
                }}
              >
                {translateCategory(category, lang)}
              </span>
            </div>

            {/* Location */}
            {locationText && (
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <MapPin size={12} />
                <span>{locationText}</span>
              </div>
            )}

            {/* Date, Time, Currency */}
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Calendar size={12} />
                {dateStr}
              </span>
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Clock size={12} />
                {timeStr}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {currency === 'CLP' ? '$' : currency}
              </span>
            </div>
          </div>

          {/* Right: Emoji + Confidence */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{
                backgroundColor: categoryColors.bg,
                border: `2px solid var(--success)`,
              }}
              role="img"
              aria-label={category}
            >
              {emoji}
            </div>
            {confidence > 0 && (
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--success)' }}
              >
                {Math.round(confidence * 100)}% {t('confidence') || 'confianza'}
              </span>
            )}
          </div>
        </div>

        {/* Total Highlight Box */}
        <div
          className="flex justify-between items-center px-4 py-3 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--primary-light)' }}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={20} style={{ color: 'var(--primary)' }} />
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('total') || 'Total'}
            </span>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
            {formatCurrency(total, currency)}
          </span>
        </div>

        {/* Items Section */}
        {showItems && items.length > 0 && (
          <div className="flex-1 min-h-0 mb-4">
            <div
              className="text-[11px] uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {itemsDetectedText}
            </div>

            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {visibleItems.map((item, index) => (
                <AnimatedItem
                  key={`${item.name}-${index}`}
                  delay={index * 100}
                  index={index}
                  testId={`quick-save-item-${index}`}
                >
                  <div
                    className="flex justify-between items-center px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: 'var(--text-primary)' }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    {/* Story 14.15b: Show quantity if > 1 */}
                    <div className="flex items-center gap-1 ml-2">
                      {(item.qty ?? 1) > 1 && (
                        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          x{item.qty}
                        </span>
                      )}
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatCurrency(item.price, currency)}
                      </span>
                    </div>
                  </div>
                </AnimatedItem>
              ))}

              {/* Show "+X items mas..." */}
              {isComplete && remainingCount > 0 && (
                <AnimatedItem
                  delay={displayItems.length * 100}
                  testId="quick-save-more-items"
                >
                  <div
                    className="text-[13px] font-medium px-3 py-2 cursor-pointer"
                    style={{ color: 'var(--primary)' }}
                  >
                    +{remainingCount} items mas...
                  </div>
                </AnimatedItem>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons or Success State */}
        {showSuccess ? (
          <div
            className="flex flex-col items-center justify-center py-6"
            data-testid="quick-save-success"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                prefersReducedMotion ? '' : 'animate-quick-save-success'
              }`}
              style={{ backgroundColor: 'var(--success-light, #dcfce7)' }}
            >
              <Check
                className="w-8 h-8"
                style={{ color: 'var(--success)' }}
                strokeWidth={3}
              />
            </div>
            <span
              className={`text-lg font-semibold ${
                prefersReducedMotion ? '' : 'animate-fade-in'
              }`}
              style={{ color: 'var(--success)' }}
            >
              {t('saved') || '¡Guardado!'}
            </span>
          </div>
        ) : (
          <>
            {/* Action Buttons - Editar (flex-1) | Guardar (flex-2) */}
            <div className="flex gap-3">
              {/* Edit Button (Secondary) - flex-1 */}
              <button
                onClick={onEdit}
                disabled={isSaving || saveAnimating}
                data-testid="quick-save-edit-button"
                className="flex-1 h-12 rounded-xl font-semibold flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: 'var(--secondary-light, #f1f5f9)',
                  color: 'var(--secondary, #64748b)',
                  opacity: isSaving || saveAnimating ? 0.5 : 1,
                  cursor: isSaving || saveAnimating ? 'not-allowed' : 'pointer',
                  transition: prefersReducedMotion
                    ? 'none'
                    : `all ${DURATION.FAST}ms ${EASING.OUT}`,
                }}
                aria-label={t('editTrans') || 'Editar'}
              >
                <Pencil size={16} />
                {t('editTrans') || 'Editar'}
              </button>

              {/* Save Button (Primary) - flex-2 */}
              <button
                onClick={handleSave}
                disabled={isSaving || saveAnimating}
                data-testid="quick-save-button"
                className="flex-[2] h-12 rounded-xl font-semibold flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: 'var(--primary-light, #dbeafe)',
                  color: 'var(--primary, #2563eb)',
                  opacity: isSaving || saveAnimating ? 0.7 : 1,
                  cursor: isSaving || saveAnimating ? 'not-allowed' : 'pointer',
                  transform: saveAnimating && !prefersReducedMotion ? 'scale(0.98)' : 'scale(1)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : `all ${DURATION.FAST}ms ${EASING.OUT}`,
                }}
                aria-label={t('quickSave') || 'Guardar'}
              >
                <Save size={16} />
                {isSaving || saveAnimating ? t('saving') || 'Guardando...' : t('quickSave') || 'Guardar'}
              </button>
            </div>

            {/* Cancel link - Hidden when showing cancel confirm */}
            {!showCancelConfirm && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isSaving || saveAnimating}
                data-testid="quick-save-cancel-button"
                className="w-full mt-3 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                style={{
                  color: 'var(--text-tertiary)',
                  opacity: isSaving || saveAnimating ? 0.5 : 1,
                  cursor: isSaving || saveAnimating ? 'not-allowed' : 'pointer',
                }}
                aria-label={t('cancel') || 'Cancelar'}
              >
                <X size={16} />
                {t('cancel') || 'Cancelar'}
              </button>
            )}

            {/* Cancel Confirmation with Credit Warning */}
            {showCancelConfirm && (
              <div
                className="mt-3 p-3 rounded-xl"
                style={{
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.15)',
                  border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.4)'}`,
                }}
              >
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle
                    size={18}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: '#f59e0b' }}
                  />
                  <div>
                    <div
                      className="text-sm font-medium mb-1"
                      style={{ color: isDark ? '#fbbf24' : '#d97706' }}
                    >
                      {t('cancelScanTitle') || '¿Cancelar escaneo?'}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                    >
                      {t('creditAlreadyUsed') || '1 credit was already used for this scan'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <ArrowLeft size={14} />
                    {t('goBack') || 'Volver'}
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                    }}
                  >
                    <Trash2 size={14} />
                    {t('cancelAnyway') || 'Cancelar de todos modos'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuickSaveCard;
