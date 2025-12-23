/**
 * Story 11.1: One Image = One Transaction - Batch Upload Preview Component
 *
 * Shows preview when user selects multiple images, confirming that each image
 * will create a separate transaction. Displays thumbnails and allows user to
 * proceed with batch processing or cancel.
 *
 * @see docs/sprint-artifacts/epic11/story-11.1-one-image-one-transaction.md
 */
import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Image, AlertCircle } from 'lucide-react';

/** Maximum images allowed per batch (AC #7) */
export const MAX_BATCH_IMAGES = 10;

export interface BatchUploadPreviewProps {
  /** Array of base64 encoded images */
  images: string[];
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Called when user confirms to process all images */
  onConfirm: () => void;
  /** Called when user cancels the batch upload */
  onCancel: () => void;
  /** Optional: Remove a specific image from the batch */
  onRemoveImage?: (index: number) => void;
}

/**
 * BatchUploadPreview Component
 *
 * Displays when user selects 2+ images, showing:
 * - "X boletas detectadas" header
 * - Explanation that each image = 1 transaction
 * - Collapsible thumbnail preview
 * - Cancel and Process buttons
 */
export const BatchUploadPreview: React.FC<BatchUploadPreviewProps> = ({
  images,
  theme,
  t,
  onConfirm,
  onCancel,
  onRemoveImage,
}) => {
  const [showThumbnails, setShowThumbnails] = useState(false);

  const isDark = theme === 'dark';
  const count = images.length;

  // Check if over limit (AC #7)
  const isOverLimit = count > MAX_BATCH_IMAGES;

  // Dynamic styling based on theme
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const thumbnailBg = isDark ? 'bg-slate-700' : 'bg-slate-100';

  return (
    <div
      className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 shadow-lg`}
      role="dialog"
      aria-labelledby="batch-preview-title"
      aria-describedby="batch-preview-description"
    >
      {/* Header with receipt count */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
          <Image className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
        </div>
        <h2
          id="batch-preview-title"
          className={`text-lg font-semibold ${textPrimary}`}
        >
          {/* AC #2: Show "X boletas detectadas" */}
          {count} {t('batchReceiptsDetected')}
        </h2>
      </div>

      {/* Explanation text */}
      <p
        id="batch-preview-description"
        className={`text-sm ${textSecondary} mb-4`}
      >
        {t('batchExplanation')}
      </p>

      {/* Over limit warning (AC #7) */}
      {isOverLimit && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
          }`}
          role="alert"
        >
          <AlertCircle size={18} />
          <span className="text-sm font-medium">
            {t('batchMaxLimitError')}
          </span>
        </div>
      )}

      {/* Collapsible thumbnail section */}
      <button
        onClick={() => setShowThumbnails(!showThumbnails)}
        className={`w-full flex items-center justify-between p-3 rounded-lg ${thumbnailBg} mb-4 transition-colors`}
        aria-expanded={showThumbnails}
        aria-controls="thumbnail-grid"
      >
        <span className={`text-sm font-medium ${textPrimary}`}>
          {showThumbnails ? t('hideImages') : t('viewImages')}
        </span>
        {showThumbnails ? (
          <ChevronUp className={textSecondary} size={20} />
        ) : (
          <ChevronDown className={textSecondary} size={20} />
        )}
      </button>

      {/* Thumbnail grid */}
      {showThumbnails && (
        <div
          id="thumbnail-grid"
          className="grid grid-cols-4 gap-2 mb-4"
          role="list"
          aria-label={t('batchImageList')}
        >
          {images.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden group"
              role="listitem"
            >
              <img
                src={img}
                alt={`${t('receipt')} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Image number badge */}
              <div
                className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  isDark ? 'bg-slate-900/80 text-white' : 'bg-white/90 text-slate-900'
                }`}
              >
                {index + 1}
              </div>
              {/* Remove button on hover (if handler provided) */}
              {onRemoveImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(index);
                  }}
                  className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'bg-slate-900/80 text-white' : 'bg-white/90 text-slate-900'
                  }`}
                  aria-label={`${t('removeImage')} ${index + 1}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${
            isDark
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isOverLimit}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
            isOverLimit
              ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {t('processAll')}
        </button>
      </div>
    </div>
  );
};

export default BatchUploadPreview;
