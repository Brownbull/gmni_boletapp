/**
 * TrendsView Module Exports
 *
 * Story 14e-25b.1: TrendsView Data Migration
 *
 * Re-exports TrendsView component and hook from their locations.
 * This allows imports from '@/views/TrendsView' to work.
 */

// Re-export the main component from the parent file
export { TrendsView } from '../TrendsView';
export type { TrendsViewProps } from '../TrendsView';

// Export the data hook and types
export { useTrendsViewData } from './useTrendsViewData';
export type { TrendsViewData, UseTrendsViewDataReturn } from './useTrendsViewData';
