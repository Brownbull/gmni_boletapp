/**
 * Story 12.1: Batch Capture UI - Confirmation Dialog
 *
 * Reusable themed confirmation dialog to replace native window.confirm.
 * Matches the app's design language with theme support.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmationDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Text for confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Optional: Make confirm button destructive (red) */
  isDestructive?: boolean;
}

/**
 * ConfirmationDialog Component
 *
 * A styled replacement for window.confirm() that respects theme settings.
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   isOpen={showConfirm}
 *   title="Cancel Batch?"
 *   message="Your captured images will be discarded."
 *   confirmText="Yes, cancel"
 *   cancelText="Continue"
 *   theme="dark"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   isDestructive
 * />
 * ```
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  theme,
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  // Theme-aware colors
  const overlayBg = 'bg-black/50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  // Warning styling
  const warningBg = isDark ? 'bg-amber-900/30' : 'bg-amber-50';
  const warningIcon = isDark ? 'text-amber-400' : 'text-amber-500';

  // Button colors
  const confirmBg = isDestructive
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';
  const cancelStyles = isDark
    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
    : 'border-slate-300 text-slate-700 hover:bg-slate-50';

  return (
    <div
      className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border ${cardBorder} ${cardBg} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${warningBg}`}>
              <AlertTriangle className={warningIcon} size={24} />
            </div>
            <h2
              id="confirmation-dialog-title"
              className={`text-lg font-semibold ${textPrimary}`}
            >
              {title}
            </h2>
          </div>

          {/* Message */}
          <p className={`text-sm ${textSecondary}`}>{message}</p>
        </div>

        {/* Action buttons */}
        <div className="p-4 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${cancelStyles}`}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors ${confirmBg}`}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
