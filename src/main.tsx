import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
// Story 14c-refactor.11: Use new theme-aware AppErrorBoundary
import { AppErrorBoundary } from './components/App';
// Story 14c-refactor.9: AuthProvider for app-wide authentication context
import { AuthProvider } from './contexts/AuthContext';
// Story 14e-11: ScanProvider removed - Zustand store is global, no provider needed
import { ViewModeProvider } from './contexts/ViewModeContext';
// Story 14.35: Preload localized country data
import { preloadCountries } from './services/locationService';
// Story 14c-refactor.4: Clear legacy shared group cache on startup
import { clearLegacySharedGroupCache } from './migrations/clearSharedGroupCache';
// Story 14.35b: Flag icons CSS for foreign location display
import 'flag-icons/css/flag-icons.min.css';
import App from './App';

// Story 14.35: Warm location cache on app startup (fire-and-forget)
preloadCountries();

// Story 14c-refactor.4: Clear legacy shared group IndexedDB cache (fire-and-forget)
clearLegacySharedGroupCache().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            {/* Story 14c-refactor.9: AuthProvider wraps ViewModeProvider for user.uid availability */}
            <AuthProvider>
                <ViewModeProvider>
                    {/* Story 14e-11: ScanProvider removed - scan state now managed by Zustand store */}
                    {/* Story 14c-refactor.11: Theme-aware error boundary */}
                    <AppErrorBoundary>
                        <App />
                    </AppErrorBoundary>
                </ViewModeProvider>
            </AuthProvider>
            {/* Story 14.29: React Query DevTools - only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </React.StrictMode>
);
