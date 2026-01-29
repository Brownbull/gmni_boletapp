/**
 * Story 14c-refactor.22d: AppOverlays Component
 * Story 14e-23a: Scan overlays migrated to ScanFeature
 * Story 14e-23b: NavigationBlocker and PWAUpdatePrompt moved to App.tsx
 *
 * Centralizes non-scan overlay/modal rendering from App.tsx.
 * Scan-related overlays (ScanOverlay, QuickSaveCard, BatchCompleteModal,
 * CurrencyMismatchDialog, TotalMismatchDialog) are now rendered by ScanFeature.
 *
 * Z-Index Layers:
 * - z-60: NavigationBlocker, PWAUpdatePrompt (moved to App.tsx - Story 14e-23b)
 * - z-40: TrustMerchantPrompt, SessionComplete, BatchSummary
 * - z-30: InsightCard, BuildingProfileCard, PersonalRecordBanner
 *
 * Story 14e-5: TransactionConflictDialog moved to Modal Manager
 * Story 14e-18c: CreditWarningDialog moved to CreditFeature
 * Story 14e-23a: Scan overlays moved to ScanFeature
 * Story 14e-23b: NavigationBlocker, PWAUpdatePrompt moved to App.tsx
 *
 * Architecture Reference: Epic 14c-refactor - App.tsx Decomposition
 */

import React from 'react';
// Story 14e-23b: View type no longer needed (currentView moved to App.tsx)
import type { Insight, LocalInsightCache } from '../../types/insight';
import type { PersonalRecord } from '../../types/personalRecord';
import type { Transaction } from '../../types/transaction';
import type { TrustPromptEligibility } from '../../types/trust';
import type { SessionContext, SessionAction } from '../session';
// Story 14e-23a: Scan-related types no longer needed here (moved to ScanFeature)

// Overlay Components
// Story 14e-23b: NavigationBlocker and PWAUpdatePrompt moved to App.tsx
// import { NavigationBlocker } from '../NavigationBlocker';
// import { PWAUpdatePrompt } from '../PWAUpdatePrompt';
// Story 14e-23a: Scan overlays moved to ScanFeature
// import { ScanOverlay, QuickSaveCard, BatchCompleteModal, CurrencyMismatchDialog, TotalMismatchDialog } from '../scan';
import { InsightCard } from '../insights/InsightCard';
import { BuildingProfileCard } from '../insights/BuildingProfileCard';
import { BatchSummary } from '../insights/BatchSummary';
import { PersonalRecordBanner } from '../celebrations';
import { SessionComplete } from '../session';
import { TrustMerchantPrompt } from '../TrustMerchantPrompt';

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

// Story 14e-23a: ActiveGroupInfo moved to ScanFeature

/**
 * Props for AppOverlays component
 * Story 14e-23a: Scan-related props migrated to ScanFeature
 * Story 14e-23b: currentView and lang props moved to App.tsx (for NavigationBlocker/PWAUpdatePrompt)
 *
 * All overlay visibility flags, data, and handlers are passed as props.
 * This allows App.tsx to maintain state ownership while AppOverlays
 * handles rendering.
 */
export interface AppOverlaysProps {
    // =========================================================================
    // Core Dependencies
    // =========================================================================

    // Story 14e-23b: currentView and lang moved to App.tsx
    // (NavigationBlocker and PWAUpdatePrompt now rendered directly in App.tsx)

    /** Current theme */
    theme: 'light' | 'dark';
    /** Translation function */
    t: (key: string) => string;

    // Story 14e-23a: ScanContext state props moved to ScanFeature
    // Story 14e-23a: Scan Overlay props moved to ScanFeature
    // Story 14e-23a: QuickSaveCard props moved to ScanFeature
    // Story 14e-23a: Currency/Total Mismatch Dialog props moved to ScanFeature
    // Story 14e-23a: Batch Complete Modal props moved to ScanFeature

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
 * Story 14e-23a: Scan overlays migrated to ScanFeature
 *
 * Renders non-scan overlay/modal components for the application.
 * Memoized to prevent unnecessary re-renders when unrelated state changes.
 */
export const AppOverlays = React.memo(function AppOverlays(props: AppOverlaysProps) {
    const {
        // Core dependencies
        // Story 14e-23b: currentView and lang moved to App.tsx
        theme,
        t,

        // Story 14e-23a: Scan-related props removed (now in ScanFeature)

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

        // Utility functions
        getLastWeekTotal,
        isInsightsSilenced,
    } = props;

    // Story 14e-23a: Scan overlay visibility logic moved to ScanFeature

    return (
        <>
            {/* Story 14e-23b: NavigationBlocker and PWAUpdatePrompt moved to App.tsx */}
            {/* Story 14e-23a: Scan overlays moved to ScanFeature */}

            {/* ============================================================== */}
            {/* Z-40: Cards & Modals */}
            {/* ============================================================== */}

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
