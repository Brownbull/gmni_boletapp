/**
 * Story 14c-refactor.22d: AppOverlays Component
 *
 * Centralizes all overlay/modal rendering from App.tsx.
 * Extracted overlays: 15 overlay components (~300-400 lines)
 *
 * Z-Index Layers:
 * - z-60: NavigationBlocker, PWAUpdatePrompt (highest priority)
 * - z-50: ScanOverlay, CreditWarningDialog, Currency/TotalMismatchDialog
 * - z-40: QuickSaveCard, BatchCompleteModal, TrustMerchantPrompt, SessionComplete, BatchSummary
 * - z-30: InsightCard, BuildingProfileCard, PersonalRecordBanner
 *
 * Story 14e-5: TransactionConflictDialog moved to Modal Manager
 *
 * Architecture Reference: Epic 14c-refactor - App.tsx Decomposition
 */

import React from 'react';
import type { View } from './types';
import type { Insight, LocalInsightCache } from '../../types/insight';
import type { PersonalRecord } from '../../types/personalRecord';
import type { Transaction } from '../../types/transaction';
import type { TrustPromptEligibility } from '../../types/trust';
import type { CreditCheckResult } from '../../services/creditService';
import type { SessionContext, SessionAction } from '../session';
import type {
    ScanState,
    BatchCompleteDialogData,
    QuickSaveDialogData,
    CurrencyMismatchDialogData,
    TotalMismatchDialogData,
} from '../../types/scanStateMachine';
import { DIALOG_TYPES } from '../../types/scanStateMachine';
// Story 14e-5: TransactionConflictDialog types no longer needed here (moved to Modal Manager)
import type { SupportedCurrency } from '../../services/userPreferencesService';
import type { HistoryNavigationPayload } from '../../views/TrendsView';
import type { ScanOverlayStateHook } from '../../hooks/useScanOverlayState';

// Overlay Components
import { NavigationBlocker } from '../NavigationBlocker';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';
import {
    ScanOverlay,
    QuickSaveCard,
    BatchCompleteModal,
    CurrencyMismatchDialog,
    TotalMismatchDialog,
} from '../scan';
import { InsightCard } from '../insights/InsightCard';
import { BuildingProfileCard } from '../insights/BuildingProfileCard';
import { BatchSummary } from '../insights/BatchSummary';
import { PersonalRecordBanner } from '../celebrations';
import { SessionComplete } from '../session';
import { TrustMerchantPrompt } from '../TrustMerchantPrompt';
import { CreditWarningDialog } from '../batch';
// Story 14e-5: TransactionConflictDialog import removed (now uses Modal Manager)

// =============================================================================
// Types
// =============================================================================

/**
 * Batch session interface for batch summary
 * Matches the return type from useBatchSession hook
 */
interface BatchSession {
    receipts: Transaction[];
    insights: Insight[];
    totalAmount: number;
}

/**
 * Active group info for overlays
 */
interface ActiveGroupInfo {
    id: string;
    name: string;
    color: string;
    icon?: string;
}

// Story 14e-5: ConflictDialogData moved to useDialogHandlers (Modal Manager integration)

/**
 * Props for AppOverlays component
 *
 * All overlay visibility flags, data, and handlers are passed as props.
 * This allows App.tsx to maintain state ownership while AppOverlays
 * handles rendering.
 */
export interface AppOverlaysProps {
    // =========================================================================
    // Core Dependencies
    // =========================================================================

    /** Current view for NavigationBlocker */
    currentView: View;
    /** Language for PWAUpdatePrompt */
    lang: 'en' | 'es';
    /** Current theme */
    theme: 'light' | 'dark';
    /** Translation function */
    t: (key: string) => string;

    // =========================================================================
    // ScanContext State (for scan-related dialogs)
    // =========================================================================

    /** Current scan state from ScanContext */
    scanState: ScanState;
    /** Scan overlay state machine (from useScanOverlayState hook) */
    scanOverlay: ScanOverlayStateHook;
    /** Whether scan is analyzing */
    isAnalyzing: boolean;
    /** Current captured images */
    scanImages: string[];

    // =========================================================================
    // Scan Overlay Props
    // =========================================================================

    /** Handler for scan overlay cancel */
    onScanOverlayCancel: () => void;
    /** Handler for scan overlay retry */
    onScanOverlayRetry: () => void;
    /** Handler for scan overlay dismiss */
    onScanOverlayDismiss: () => void;

    // =========================================================================
    // QuickSaveCard Props
    // =========================================================================

    /** Handler for quick save */
    onQuickSave: (dialogData?: QuickSaveDialogData) => Promise<void>;
    /** Handler for quick save edit */
    onQuickSaveEdit: (dialogData?: QuickSaveDialogData) => void;
    /** Handler for quick save cancel */
    onQuickSaveCancel: (dialogData?: QuickSaveDialogData) => void;
    /** Handler for quick save complete */
    onQuickSaveComplete: () => void;
    /** Whether quick save is in progress */
    isQuickSaving: boolean;
    /** Currency for formatting */
    currency: string;
    /** Format currency function */
    formatCurrency: (amount: number, currency: string) => string;
    /** User's default country for foreign location detection */
    userDefaultCountry: string;
    /** Active group info for quick save tagging */
    activeGroupForQuickSave: ActiveGroupInfo | null;

    // =========================================================================
    // Insight Card Props
    // =========================================================================

    /** Whether to show insight card */
    showInsightCard: boolean;
    /** Current insight to display */
    currentInsight: Insight | null;
    /** Handler for insight card dismiss */
    onInsightDismiss: () => void;

    // =========================================================================
    // Session Complete Props
    // =========================================================================

    /** Whether to show session complete */
    showSessionComplete: boolean;
    /** Session context data */
    sessionContext: SessionContext | null;
    /** Handler for session complete dismiss */
    onSessionCompleteDismiss: () => void;
    /** Handler for session complete action */
    onSessionCompleteAction: (action: SessionAction) => void;

    // =========================================================================
    // Personal Record Banner Props
    // =========================================================================

    /** Whether to show record banner */
    showRecordBanner: boolean;
    /** Record to celebrate */
    recordToCelebrate: PersonalRecord | null;
    /** Handler for record banner dismiss */
    onRecordDismiss: () => void;

    // =========================================================================
    // Credit Warning Dialog Props
    // =========================================================================

    /** Whether to show credit warning */
    showCreditWarning: boolean;
    /** Credit check result */
    creditCheckResult: CreditCheckResult | null;
    /** Number of images in batch */
    batchImageCount: number;
    /** Handler for credit warning confirm */
    onCreditWarningConfirm: () => void;
    /** Handler for credit warning cancel */
    onCreditWarningCancel: () => void;
    /** Handler for reduce batch */
    onReduceBatch?: () => void;

    // =========================================================================
    // Batch Summary Props
    // =========================================================================

    /** Whether to show batch summary */
    showBatchSummary: boolean;
    /** Batch session data */
    batchSession: BatchSession | null;
    /** Transactions for lastWeekTotal calculation */
    transactions: Transaction[];
    /** Insight cache for silence state */
    insightCache: LocalInsightCache | null;
    /** Handler for batch summary silence toggle */
    onBatchSummarySilence: () => void;
    /** Handler for batch summary dismiss */
    onBatchSummaryDismiss: () => void;

    // =========================================================================
    // Trust Merchant Prompt Props
    // =========================================================================

    /** Whether to show trust prompt */
    showTrustPrompt: boolean;
    /** Trust prompt data */
    trustPromptData: TrustPromptEligibility | null;
    /** Handler for accepting trust */
    onAcceptTrust: () => Promise<void>;
    /** Handler for declining trust */
    onDeclineTrust: () => Promise<void>;

    // =========================================================================
    // Currency/Total Mismatch Dialog Props
    // =========================================================================

    /** User's default currency */
    userCurrency: SupportedCurrency;
    /** Handler for using detected currency */
    onCurrencyUseDetected: (dialogData?: CurrencyMismatchDialogData) => Promise<void>;
    /** Handler for using default currency */
    onCurrencyUseDefault: (dialogData?: CurrencyMismatchDialogData) => Promise<void>;
    /** Handler for currency mismatch cancel */
    onCurrencyMismatchCancel: (dialogData?: CurrencyMismatchDialogData) => void;
    /** Handler for using items sum */
    onTotalUseItemsSum: (dialogData?: TotalMismatchDialogData) => void;
    /** Handler for keeping original total */
    onTotalKeepOriginal: (dialogData?: TotalMismatchDialogData) => void;
    /** Handler for total mismatch cancel */
    onTotalMismatchCancel: (dialogData?: TotalMismatchDialogData) => void;

    // =========================================================================
    // Transaction Conflict Dialog (Story 14e-5: Moved to Modal Manager)
    // Conflict dialog is now rendered by ModalManager component, not AppOverlays
    // =========================================================================

    // =========================================================================
    // Batch Complete Modal Props
    // =========================================================================

    /** User credits remaining (for batch complete modal) */
    userCreditsRemaining: number;
    /** Handler for batch complete dismiss */
    onBatchCompleteDismiss: () => void;
    /** Handler for navigating to history from batch complete */
    onBatchCompleteNavigateToHistory: (payload: HistoryNavigationPayload) => void;
    /** Handler for going home from batch complete */
    onBatchCompleteGoHome: () => void;

    // =========================================================================
    // Utility Functions for Calculations
    // =========================================================================

    /** Get last week's total from transactions */
    getLastWeekTotal: (transactions: Transaction[]) => number;
    /** Check if insights are silenced */
    isInsightsSilenced: (cache: LocalInsightCache) => boolean;
}

// =============================================================================
// Component Implementation
// =============================================================================

/**
 * AppOverlays Component
 *
 * Renders all overlay/modal components for the application.
 * Memoized to prevent unnecessary re-renders when unrelated state changes.
 */
export const AppOverlays = React.memo(function AppOverlays(props: AppOverlaysProps) {
    const {
        // Core dependencies
        currentView,
        lang,
        theme,
        t,

        // ScanContext state
        scanState,
        scanOverlay,
        isAnalyzing,
        scanImages,

        // Scan overlay handlers
        onScanOverlayCancel,
        onScanOverlayRetry,
        onScanOverlayDismiss,

        // QuickSaveCard props
        onQuickSave,
        onQuickSaveEdit,
        onQuickSaveCancel,
        onQuickSaveComplete,
        isQuickSaving,
        currency,
        formatCurrency,
        userDefaultCountry,
        activeGroupForQuickSave,

        // Insight card props
        showInsightCard,
        currentInsight,
        onInsightDismiss,

        // Session complete props
        showSessionComplete,
        sessionContext,
        onSessionCompleteDismiss,
        onSessionCompleteAction,

        // Personal record banner props
        showRecordBanner,
        recordToCelebrate,
        onRecordDismiss,

        // Credit warning dialog props
        showCreditWarning,
        creditCheckResult,
        batchImageCount,
        onCreditWarningConfirm,
        onCreditWarningCancel,
        onReduceBatch,

        // Batch summary props
        showBatchSummary,
        batchSession,
        transactions,
        insightCache,
        onBatchSummarySilence,
        onBatchSummaryDismiss,

        // Trust merchant prompt props
        showTrustPrompt,
        trustPromptData,
        onAcceptTrust,
        onDeclineTrust,

        // Currency/Total mismatch dialog props
        userCurrency,
        onCurrencyUseDetected,
        onCurrencyUseDefault,
        onCurrencyMismatchCancel,
        onTotalUseItemsSum,
        onTotalKeepOriginal,
        onTotalMismatchCancel,

        // Story 14e-5: Transaction conflict dialog now uses Modal Manager (rendered by ModalManager component)

        // Batch complete modal props
        userCreditsRemaining,
        onBatchCompleteDismiss,
        onBatchCompleteNavigateToHistory,
        onBatchCompleteGoHome,

        // Utility functions
        getLastWeekTotal,
        isInsightsSilenced,
    } = props;

    // Determine visibility for scan overlay
    const isScanOverlayVisible =
        (isAnalyzing || scanOverlay.state === 'error') &&
        (currentView === 'scan' || currentView === 'scan-result' || currentView === 'edit' || currentView === 'transaction-editor');

    // Check for batch complete dialog
    const batchCompleteData = scanState.activeDialog?.type === DIALOG_TYPES.BATCH_COMPLETE
        ? (scanState.activeDialog.data as BatchCompleteDialogData)
        : null;
    const showBatchCompleteModal = batchCompleteData && (batchCompleteData.transactions?.length ?? 0) > 0;

    return (
        <>
            {/* ============================================================== */}
            {/* Z-60: Highest Priority - Navigation & Updates */}
            {/* ============================================================== */}

            {/* Story 14d.3: Browser back button blocker for scan dialogs (AC #5-7) */}
            <NavigationBlocker currentView={currentView} />

            {/* Story 9.14 / 14.42: PWA update notification */}
            <PWAUpdatePrompt language={lang} />

            {/* ============================================================== */}
            {/* Z-50: Dialogs */}
            {/* ============================================================== */}

            {/* Story 14.15: Scan Overlay for non-blocking scan flow (AC #1, #4) */}
            <ScanOverlay
                state={scanOverlay.state}
                progress={scanOverlay.progress}
                eta={scanOverlay.eta}
                error={scanOverlay.error}
                onCancel={onScanOverlayCancel}
                onRetry={onScanOverlayRetry}
                onDismiss={onScanOverlayDismiss}
                theme={theme}
                t={t}
                visible={isScanOverlayVisible}
                capturedImageUrl={scanImages[0]}
            />

            {/* Story 12.4: Credit Warning Dialog (AC #1, #2, #5, #7) */}
            {showCreditWarning && creditCheckResult && (
                <CreditWarningDialog
                    creditCheck={creditCheckResult}
                    receiptCount={batchImageCount}
                    theme={theme}
                    t={t}
                    onConfirm={onCreditWarningConfirm}
                    onCancel={onCreditWarningCancel}
                    onReduceBatch={creditCheckResult.maxProcessable > 0 ? onReduceBatch : undefined}
                />
            )}

            {/* Story 14.15b: Currency Mismatch Dialog (AC #2) */}
            {/* Story 14d.6: Rendered unconditionally - component reads from ScanContext */}
            <CurrencyMismatchDialog
                userCurrency={userCurrency}
                onUseDetected={onCurrencyUseDetected}
                onUseDefault={onCurrencyUseDefault}
                onCancel={onCurrencyMismatchCancel}
                theme={theme}
                t={t}
            />

            {/* Total Mismatch Dialog (OCR error detection) */}
            {/* Story 14d.6: Rendered unconditionally - component reads from ScanContext */}
            <TotalMismatchDialog
                onUseItemsSum={onTotalUseItemsSum}
                onKeepOriginal={onTotalKeepOriginal}
                onCancel={onTotalMismatchCancel}
                theme={theme}
                t={t}
            />

            {/* Story 14e-5: Transaction Conflict Dialog moved to Modal Manager */}
            {/* Rendered by ModalManager component via openConflictDialog() */}

            {/* ============================================================== */}
            {/* Z-40: Cards & Modals */}
            {/* ============================================================== */}

            {/* Story 11.2: Quick Save Card for high-confidence scans (AC #1-9) */}
            {/* Story 14d.6: Rendered unconditionally - component reads from ScanContext */}
            <QuickSaveCard
                onSave={onQuickSave}
                onEdit={onQuickSaveEdit}
                onCancel={onQuickSaveCancel}
                onSaveComplete={onQuickSaveComplete}
                theme={theme}
                t={t}
                formatCurrency={formatCurrency}
                currency={currency}
                isSaving={isQuickSaving}
                lang={lang}
                userDefaultCountry={userDefaultCountry}
                activeGroup={activeGroupForQuickSave}
            />

            {/* Story 14.15: Batch Complete Success Modal (State 3.a from scan-overlay.html mockup) */}
            {/* Story 14d.5d AC10: Now uses ScanContext activeDialog with typed data */}
            {showBatchCompleteModal && batchCompleteData && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    style={{ paddingTop: 'calc(1rem + var(--safe-top, 0px))', paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}
                >
                    <BatchCompleteModal
                        transactions={batchCompleteData.transactions}
                        creditsUsed={batchCompleteData.creditsUsed}
                        creditsRemaining={userCreditsRemaining}
                        theme={theme}
                        t={t}
                        onDismiss={onBatchCompleteDismiss}
                        onNavigateToHistory={onBatchCompleteNavigateToHistory}
                        onGoHome={onBatchCompleteGoHome}
                        formatCurrency={formatCurrency}
                    />
                </div>
            )}

            {/* Story 11.4: Trust Merchant Prompt (AC #2, #3, #4) */}
            {showTrustPrompt && trustPromptData?.merchant && (
                <TrustMerchantPrompt
                    merchantName={trustPromptData.merchant.merchantName}
                    scanCount={trustPromptData.merchant.scanCount}
                    onAccept={onAcceptTrust}
                    onDecline={onDeclineTrust}
                    theme={theme}
                    t={t}
                />
            )}

            {/* Story 14.20: Session completion messaging (AC #1-6) */}
            {showSessionComplete && sessionContext && (
                <SessionComplete
                    context={sessionContext}
                    onDismiss={onSessionCompleteDismiss}
                    onAction={onSessionCompleteAction}
                    t={t}
                    theme={theme}
                />
            )}

            {/* Story 10.7: Batch summary for multi-receipt sessions (AC #1, #2, #3, #4, #6) */}
            {showBatchSummary && batchSession && insightCache && (
                <BatchSummary
                    receipts={batchSession.receipts}
                    insights={batchSession.insights}
                    totalAmount={batchSession.totalAmount}
                    lastWeekTotal={getLastWeekTotal(transactions)}
                    onSilence={onBatchSummarySilence}
                    onDismiss={onBatchSummaryDismiss}
                    isSilenced={isInsightsSilenced(insightCache)}
                    theme={theme}
                />
            )}

            {/* ============================================================== */}
            {/* Z-30: Banners & Cards */}
            {/* ============================================================== */}

            {/* Story 10.6: Insight card after transaction save (AC #1, #3, #4) */}
            {/* Story 14.20: onDismiss now triggers SessionComplete (AC #1) */}
            {showInsightCard && (
                currentInsight && currentInsight.id !== 'building_profile'
                    ? <InsightCard
                        insight={currentInsight}
                        onDismiss={onInsightDismiss}
                        theme={theme}
                      />
                    : <BuildingProfileCard
                        onDismiss={onInsightDismiss}
                        theme={theme}
                      />
            )}

            {/* Story 14.19: Personal record celebration banner */}
            {showRecordBanner && recordToCelebrate && (
                <PersonalRecordBanner
                    record={recordToCelebrate}
                    onDismiss={onRecordDismiss}
                    autoDismissMs={8000}
                    theme={theme}
                />
            )}
        </>
    );
});
