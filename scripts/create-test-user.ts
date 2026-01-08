/**
 * Wrapper to run create-test-user from expected location in CI workflow.
 * Re-exports the script from scripts/testing/ for backwards compatibility.
 */
export * from './testing/create-test-user';

// Execute if run directly
import './testing/create-test-user';
