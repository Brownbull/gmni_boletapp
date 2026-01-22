# PWA Standards: Offline-First, Service Workers & Performance

## Official Documentation

- **vite-plugin-pwa**: https://vite-pwa-org.netlify.app/
- **Workbox**: https://developer.chrome.com/docs/workbox/
- **Web Vitals**: https://web.dev/articles/vitals
- **PWA Checklist**: https://web.dev/articles/pwa-checklist
- **Service Worker API**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Web App Manifest**: https://developer.mozilla.org/en-US/docs/Web/Manifest

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### Measuring Web Vitals

```typescript
// src/shared/lib/webVitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

type MetricHandler = (metric: {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}) => void

export function reportWebVitals(onReport: MetricHandler) {
  onCLS(onReport)
  onINP(onReport)
  onLCP(onReport)
  onFCP(onReport)
  onTTFB(onReport)
}

// Usage in main.tsx
reportWebVitals((metric) => {
  // Send to analytics
  console.log(metric.name, metric.value, metric.rating)
  
  // Or send to your analytics service
  // analytics.track('web-vitals', metric)
})
```

## vite-plugin-pwa Setup

### Installation

```bash
npm install -D vite-plugin-pwa
```

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',  // Show update prompt to user
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Gastify - Control de Gastos',
        short_name: 'Gastify',
        description: 'Escanea tus boletas y controla tus gastos',
        theme_color: '#10B981',
        background_color: '#F9FAFB',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Cache strategies defined below
        ],
      },
    }),
  ],
})
```

### Manifest File (Alternative)

```json
// public/manifest.json
{
  "name": "Gastify - Control de Gastos",
  "short_name": "Gastify",
  "description": "Escanea tus boletas y controla tus gastos",
  "theme_color": "#10B981",
  "background_color": "#F9FAFB",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Dashboard de Gastify"
    }
  ],
  "shortcuts": [
    {
      "name": "Escanear Boleta",
      "short_name": "Escanear",
      "description": "Escanear una nueva boleta",
      "url": "/scan",
      "icons": [{ "src": "/icons/scan-shortcut.png", "sizes": "96x96" }]
    }
  ]
}
```

## Workbox Caching Strategies

### Strategy Selection Guide

| Content Type | Strategy | When to Use |
|--------------|----------|-------------|
| App Shell (HTML) | Network First | Always show latest |
| Static Assets (JS/CSS) | Cache First | Content-hashed, immutable |
| API Responses | Stale-While-Revalidate | Balance freshness & speed |
| Images | Cache First + Expiration | Large files, rarely change |
| Fonts | Cache First | Rarely change |

### Complete Runtime Caching Config

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    
    runtimeCaching: [
      // App Shell - Network First
      {
        urlPattern: /^https:\/\/boletapp-d609f\.web\.app\/$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'app-shell',
          networkTimeoutSeconds: 3,
          plugins: [
            {
              cacheWillUpdate: async ({ response }) => {
                if (response && response.status === 200) {
                  return response
                }
                return null
              },
            },
          ],
        },
      },
      
      // Static Assets - Cache First (with hash)
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      
      // Images - Cache First with Expiration
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      
      // Google Fonts Stylesheets
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      
      // Google Fonts Webfonts
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      
      // Firebase/Firestore API - Network Only (real-time data)
      {
        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
        handler: 'NetworkOnly',
      },
      
      // Firebase Auth
      {
        urlPattern: /^https:\/\/.*\.firebaseapp\.com\/__\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
      
      // Firebase Storage Images - Stale While Revalidate
      {
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'firebase-storage',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
        },
      },
    ],
  },
})
```

## Update Prompt Component

```typescript
// src/shared/ui/PWAUpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">
            Nueva versión disponible
          </p>
          <p className="text-sm text-gray-500">
            Actualiza para obtener las últimas mejoras
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setNeedRefresh(false)}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
          >
            Después
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}

// Add to App.tsx
function App() {
  return (
    <>
      <PWAUpdatePrompt />
      {/* Rest of app */}
    </>
  )
}
```

## Offline Support

### Offline Detection Hook

```typescript
// src/shared/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Offline Banner Component

```typescript
// src/shared/ui/OfflineBanner.tsx
import { useOnlineStatus } from '@shared/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-amber-500 text-white text-center py-2 px-4">
      <p className="text-sm">
        📡 Sin conexión - Los cambios se guardarán cuando vuelvas a conectarte
      </p>
    </div>
  )
}
```

### Offline-First Data Strategy

```typescript
// src/entities/transaction/model/useTransactionsOffline.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOnlineStatus } from '@shared/hooks/useOnlineStatus'

export function useTransactionsOffline(userId: string) {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  // Fetch with offline fallback
  const query = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      if (!isOnline) {
        // Return cached data if offline
        const cached = queryClient.getQueryData(['transactions', userId])
        if (cached) return cached
        throw new Error('Sin conexión')
      }
      return fetchTransactions(userId)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24h
  })

  // Mutation with offline queue
  const mutation = useMutation({
    mutationFn: async (newTransaction: Transaction) => {
      if (!isOnline) {
        // Queue for later sync
        queueOfflineTransaction(newTransaction)
        // Optimistically update cache
        queryClient.setQueryData(
          ['transactions', userId],
          (old: Transaction[] = []) => [newTransaction, ...old]
        )
        return newTransaction
      }
      return createTransaction(userId, newTransaction)
    },
  })

  return { ...query, mutation }
}

// Simple offline queue using localStorage
function queueOfflineTransaction(transaction: Transaction) {
  const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]')
  queue.push({
    type: 'create',
    data: transaction,
    timestamp: Date.now(),
  })
  localStorage.setItem('offlineQueue', JSON.stringify(queue))
}

// Sync queue when back online
export function useSyncOfflineQueue() {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOnline) return

    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]')
    if (queue.length === 0) return

    // Process queue
    Promise.all(
      queue.map(async (item: any) => {
        if (item.type === 'create') {
          await createTransaction(item.data.userId, item.data)
        }
      })
    ).then(() => {
      localStorage.removeItem('offlineQueue')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    })
  }, [isOnline])
}
```

## Performance Optimizations

### Code Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})
```

### Lazy Loading Routes

```typescript
// src/app/routes/index.tsx
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Dashboard = lazy(() => import('@pages/dashboard'))
const Scan = lazy(() => import('@pages/scan'))
const History = lazy(() => import('@pages/history'))
const Analytics = lazy(() => import('@pages/analytics'))
const Settings = lazy(() => import('@pages/settings'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}
```

### Image Optimization

```typescript
// src/shared/ui/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      // Prevent CLS by reserving space
      style={{ aspectRatio: `${width}/${height}` }}
    />
  )
}
```

### Preload Critical Resources

```html
<!-- index.html -->
<head>
  <!-- Preload critical fonts -->
  <link 
    rel="preload" 
    href="/fonts/inter-var.woff2" 
    as="font" 
    type="font/woff2" 
    crossorigin
  />
  
  <!-- Preconnect to external origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://firestore.googleapis.com" />
  
  <!-- DNS prefetch for less critical origins -->
  <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
</head>
```

## Install Prompt

```typescript
// src/shared/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    setInstallPrompt(null)
    setIsInstallable(false)

    return outcome === 'accepted'
  }

  return { isInstallable, promptInstall }
}

// src/shared/ui/InstallBanner.tsx
export function InstallBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-green-600 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Instala Gastify</p>
          <p className="text-sm text-green-100">
            Accede más rápido desde tu pantalla de inicio
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1 text-green-100 hover:text-white"
          >
            No
          </button>
          <button
            onClick={promptInstall}
            className="px-4 py-1 bg-white text-green-600 rounded-md font-medium"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
```

## PWA Checklist

### Core Requirements
- [ ] HTTPS enabled
- [ ] Web App Manifest with required fields
- [ ] Service Worker registered
- [ ] Icons: 192x192 and 512x512 PNG
- [ ] `<meta name="viewport">` tag present
- [ ] Works offline (at least shows cached shell)

### Enhanced Experience
- [ ] Splash screen configured
- [ ] Theme color matches brand
- [ ] Install prompt handled
- [ ] Update prompt shown when new version available
- [ ] Offline indicator shown to users
- [ ] App shortcuts defined

### Performance
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Code splitting implemented
- [ ] Images lazy loaded
- [ ] Fonts preloaded
- [ ] Critical CSS inlined or preloaded

### Testing
- [ ] Lighthouse PWA audit > 90
- [ ] Tested on slow 3G network
- [ ] Tested in airplane mode
- [ ] Install flow tested on Android
- [ ] Install flow tested on iOS (Add to Home Screen)

## Best Practices Summary

| Do | Don't |
|----|-------|
| Use Cache First for static assets | Cache everything with same strategy |
| Show offline indicator to users | Silently fail when offline |
| Prompt for updates, don't force | Auto-refresh without warning |
| Preload critical resources | Preload everything |
| Lazy load below-fold content | Load everything upfront |
| Reserve space for images (prevent CLS) | Let images shift layout |
| Test on real slow networks | Only test on fast WiFi |
| Provide fallback for offline | Show blank screen offline |
| Use maskable icons for Android | Only provide square icons |
| Handle install prompt UX gracefully | Spam users with install prompt |
