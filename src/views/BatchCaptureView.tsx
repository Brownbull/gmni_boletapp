/**
 * BatchCaptureView
 *
 * Story 12.1: Batch Capture UI
 * Dedicated view for batch mode image capture with mode toggle,
 * thumbnail strip, and batch processing controls.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import React, { useRef, useCallback, useState } from 'react';
import { Camera, Images, ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { useBatchCapture, MAX_BATCH_CAPTURE_IMAGES } from '../hooks/useBatchCapture';

export interface BatchCaptureViewProps {
  /** Whether batch mode is active (true) or individual mode (false) */
  isBatchMode: boolean;
  /** Callback to toggle between individual and batch mode */
  onToggleMode: (isBatch: boolean) => void;
  /** Callback when batch is ready to process - passes captured images */
  onProcessBatch: (images: string[]) => void;
  /** Callback to switch to individual scan mode */
  onSwitchToIndividual: () => void;
  /** Callback to go back to dashboard */
  onBack: () => void;
  /** Whether batch is currently being processed */
  isProcessing?: boolean;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
}

/**
 * BatchCaptureView Component
 *
 * Provides the batch mode capture interface with:
 * - Mode toggle (Individual / Modo Lote) at the top
 * - Camera capture area with captured image previews
 * - Horizontal thumbnail strip showing captured images
 * - Action buttons for capturing more or processing batch
 */
export const BatchCaptureView: React.FC<BatchCaptureViewProps> = ({
  isBatchMode,
  onToggleMode,
  onProcessBatch,
  onSwitchToIndividual,
  onBack,
  isProcessing = false,
  theme,
  t,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Use the batch capture hook for state management
  const {
    images,
    addImages,
    removeImage,
    clearBatch,
    canAddMore,
    count,
    maxImages,
    hasImages,
  } = useBatchCapture(MAX_BATCH_CAPTURE_IMAGES);

  // Theme-based styling
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const toggleBg = isDark ? 'bg-slate-700' : 'bg-slate-100';
  const toggleActive = 'bg-blue-600 text-white';
  const toggleInactive = isDark ? 'text-slate-300' : 'text-slate-600';
  const captureAreaBg = isDark ? 'bg-slate-800' : 'bg-slate-50';
  const captureAreaBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const thumbnailBorder = isDark ? 'border-slate-600' : 'border-slate-200';
  const addMoreBg = isDark ? 'bg-slate-700/50' : 'bg-slate-100';
  const addMoreBorder = isDark ? 'border-slate-600' : 'border-slate-300';
  const addMoreText = isDark ? 'text-slate-400' : 'text-slate-500';
  const removeBtnBg = isDark ? 'bg-slate-900/80' : 'bg-white/90';
  const removeBtnText = isDark ? 'text-white' : 'text-slate-900';

  // Count indicator color: amber when near limit
  const isNearLimit = count >= maxImages - 2;
  const countColor = isNearLimit ? 'text-amber-500' : textSecondary;

  /**
   * Handle file selection from input.
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const files = Array.from(e.target.files);
      try {
        await addImages(files);
      } catch (error) {
        console.error('Failed to add images:', error);
      }

      // Reset input to allow selecting same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addImages]
  );

  /**
   * Open file picker for adding photos.
   */
  const handleAddPhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle process batch action - convert CapturedImages to dataUrls.
   */
  const handleProcessBatch = useCallback(() => {
    if (images.length > 0) {
      // Extract dataUrl strings from captured images
      const dataUrls = images.map((img) => img.dataUrl);
      onProcessBatch(dataUrls);
    }
  }, [images, onProcessBatch]);

  /**
   * Handle cancel with confirmation if 2+ images exist (AC #7).
   */
  const handleCancel = useCallback(() => {
    if (count >= 2 && !confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    clearBatch();
    onBack();
  }, [count, confirmingCancel, clearBatch, onBack]);

  /**
   * Handle mode toggle.
   */
  const handleModeToggle = useCallback(
    (batchMode: boolean) => {
      if (!batchMode && hasImages) {
        // Switching to individual mode with images - need to handle
        // For now, switch to individual mode via callback
        clearBatch();
        onSwitchToIndividual();
      } else {
        onToggleMode(batchMode);
      }
    },
    [hasImages, clearBatch, onSwitchToIndividual, onToggleMode]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isProcessing}
      />

      {/* Header with back button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleCancel}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
          }`}
          aria-label={t('back')}
          type="button"
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>

        {/* Batch mode title */}
        <h1 className={`text-lg font-bold ${textPrimary}`}>
          {t('batchModeBatch')}
        </h1>

        {/* Spacer */}
        <div className="w-10" />
      </div>

      {/* Mode toggle (AC #1) */}
      <div className="mb-4">
        <div
          className={`flex rounded-lg p-1 ${toggleBg}`}
          role="tablist"
          aria-label={t('batchModeSelector')}
        >
          <button
            onClick={() => handleModeToggle(false)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isBatchMode ? toggleActive : toggleInactive
            }`}
            role="tab"
            aria-selected={!isBatchMode}
            type="button"
          >
            {t('batchModeIndividual')}
          </button>
          <button
            onClick={() => handleModeToggle(true)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isBatchMode ? toggleActive : toggleInactive
            }`}
            role="tab"
            aria-selected={isBatchMode}
            type="button"
          >
            {t('batchModeBatch')}
          </button>
        </div>
        {isBatchMode && (
          <p className={`text-sm ${textSecondary} text-center mt-2`}>
            {t('batchModeHint')}
          </p>
        )}
      </div>

      {/* Main capture area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Capture area placeholder - shows when no images */}
        {!hasImages && (
          <div
            onClick={handleAddPhoto}
            className={`flex-1 rounded-2xl border-2 border-dashed ${captureAreaBorder} ${captureAreaBg} flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors hover:border-blue-500`}
          >
            <div className={`p-6 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <Images size={48} className={textSecondary} />
            </div>
            <div className="text-center">
              <p className={`text-lg font-medium ${textPrimary}`}>
                {t('batchTapToCapture')}
              </p>
              <p className={`text-sm ${textSecondary} mt-1`}>
                {t('batchModeHint')}
              </p>
            </div>
          </div>
        )}

        {/* Thumbnail strip when images exist (AC #3) */}
        {hasImages && (
          <div className="mb-4">
            {/* Horizontal scrollable thumbnail strip */}
            <div
              className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin"
              role="list"
              aria-label={t('batchImageList')}
            >
              {/* Thumbnails */}
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${thumbnailBorder} group shadow-sm`}
                  role="listitem"
                >
                  <img
                    src={image.thumbnailUrl}
                    alt={`${t('receipt')} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Image number badge */}
                  <div
                    className={`absolute bottom-1 left-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                      isDark ? 'bg-slate-900/90 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {/* Remove button (AC #6) */}
                  <button
                    onClick={() => removeImage(image.id)}
                    className={`absolute top-1 right-1 p-1.5 rounded-full transition-all ${removeBtnBg} ${removeBtnText} opacity-0 group-hover:opacity-100 focus:opacity-100 active:opacity-100 shadow-sm`}
                    aria-label={`${t('removeImage')} ${index + 1}`}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* "Add more" placeholder button (AC #4) */}
              {canAddMore && (
                <button
                  onClick={handleAddPhoto}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed ${addMoreBorder} ${addMoreBg} flex flex-col items-center justify-center gap-1 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none`}
                  aria-label={t('batchAddMore')}
                  type="button"
                >
                  <Plus size={24} className={addMoreText} />
                  <span className={`text-xs font-medium ${addMoreText}`}>
                    {t('batchAddMore')}
                  </span>
                </button>
              )}
            </div>

            {/* Image count indicator (AC #7) */}
            <div className={`text-center text-sm font-medium ${countColor}`}>
              {count} {t('batchOfMax')} {maxImages} {t('batchImages')}
            </div>
          </div>
        )}

        {/* Spacer */}
        {hasImages && <div className="flex-1" />}

        {/* Action buttons */}
        <div className="space-y-3 mt-4">
          {/* Primary action: Add photo or Process batch */}
          {!hasImages ? (
            <button
              onClick={handleAddPhoto}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
              type="button"
            >
              <Camera size={24} />
              {t('batchCapturePhoto')}
            </button>
          ) : (
            <>
              {/* "Capturar otra" button (AC #4) */}
              {canAddMore && (
                <button
                  onClick={handleAddPhoto}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    isDark
                      ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  } disabled:opacity-50`}
                  type="button"
                >
                  <Camera size={24} />
                  {t('batchCaptureAnother')}
                </button>
              )}

              {/* "Procesar lote" button (AC #5) */}
              <button
                onClick={handleProcessBatch}
                disabled={isProcessing || count === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                type="button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    {t('batchProcessing')}
                  </>
                ) : (
                  <>
                    <Images size={24} />
                    {t('batchProcessBatch')} ({count})
                  </>
                )}
              </button>

              {/* Cancel button (AC #8) */}
              {!isProcessing && (
                <button
                  onClick={handleCancel}
                  className={`w-full py-4 rounded-xl font-bold transition-colors ${
                    isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  type="button"
                >
                  {t('batchCancel')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog (AC #7) */}
      {confirmingCancel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmingCancel(false)}
        >
          <div
            className={`rounded-2xl p-6 max-w-sm w-full shadow-xl ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="cancel-dialog-title"
          >
            <h3
              id="cancel-dialog-title"
              className={`text-lg font-bold mb-3 ${textPrimary}`}
            >
              {t('batchCancelConfirmTitle')}
            </h3>
            <p className={`text-sm mb-6 ${textSecondary}`}>
              {t('batchCancelConfirmMessage').replace('{count}', '0')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmingCancel(false);
                  clearBatch();
                  onBack();
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                {t('batchCancelConfirmYes')}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors ${
                  isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('batchCancelConfirmNo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchCaptureView;
