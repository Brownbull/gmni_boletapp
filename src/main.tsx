import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { ErrorBoundary } from './components/ErrorBoundary';
// Story 14d.4c: ScanProvider moved from App.tsx to enable useScan() in App component
import { ScanProvider } from './contexts/ScanContext';
// Story 14.35: Preload localized country data
import { preloadCountries } from './services/locationService';
// Story 14.35b: Flag icons CSS for foreign location display
import 'flag-icons/css/flag-icons.min.css';
import App from './App';

// Story 14.35: Warm location cache on app startup (fire-and-forget)
preloadCountries();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            {/* Story 14d.4c: ScanProvider wraps App to enable useScan() hook in App.tsx */}
            <ScanProvider>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </ScanProvider>
            {/* Story 14.29: React Query DevTools - only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </React.StrictMode>
);
