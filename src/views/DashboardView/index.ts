/**
 * DashboardView Module Exports
 *
 * Story 14e-25b.2: DashboardView Data Migration
 *
 * Re-exports DashboardView component and hook from their locations.
 * This allows imports from '@/views/DashboardView' to work.
 */

// Re-export the main component from the parent file
export { DashboardView } from '../DashboardView';
export type { DashboardViewProps } from '../DashboardView';

// Export the data hook and types
export { useDashboardViewData } from './useDashboardViewData';
export type { DashboardViewData, UseDashboardViewDataReturn } from './useDashboardViewData';
