/**
 * TrendsView Module Exports
 *
 * Story 15-TD-5: Resolved file/directory naming collision
 * TrendsView.tsx moved into TrendsView/ directory
 *
 * Re-exports TrendsView component, types, and hooks.
 */

// Main component (now co-located in this directory)
export { TrendsView } from './TrendsView';
export type { TrendsViewProps } from './TrendsView';

// Re-export canonical types for backward compatibility (consumers import from @/views/TrendsView)
export type { DrillDownPath, HistoryNavigationPayload } from './TrendsView';

// Export the data hook and types
export { useTrendsViewData } from './useTrendsViewData';
export type { TrendsViewData, UseTrendsViewDataReturn } from './useTrendsViewData';
