# Deployment Guide: Boletapp

## Table of Contents
- [Overview](#overview)
- [Deployment Architecture](#deployment-architecture)
- [Hosting Options](#hosting-options)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Rollback Strategy](#rollback-strategy)
- [Cost Estimation](#cost-estimation)

---

## Overview

Boletapp is a single-file Progressive Web Application (PWA) with a serverless backend architecture. This guide covers deployment strategies, infrastructure requirements, and operational procedures.

### Architecture Summary
- **Frontend:** React application (Vite build)
- **Backend:** Firebase Cloud Functions (serverless)
- **Database:** Firebase Firestore (managed NoSQL)
- **Authentication:** Firebase Auth (managed)
- **AI Service:** Google Gemini API (via Cloud Function)
- **Build Process:** Vite (production builds)

---

## Deployment Architecture

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN / Edge Network                        │
│              (CloudFlare, Vercel Edge, etc.)                │
│                                                              │
│  • SSL/TLS Termination                                      │
│  • Static Asset Caching                                     │
│  • DDoS Protection                                          │
│  • Geographic Distribution                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Static Hosting Provider                         │
│     (Firebase Hosting, Vercel, Netlify, GitHub Pages)      │
│                                                              │
│  Files:                                                      │
│  • index.html                                               │
│  • main.js (compiled from main.tsx)                         │
│  • manifest.json (PWA)                                      │
│  • service-worker.js (PWA)                                  │
│  • favicon.ico, icons/                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firebase   │ │   Firebase   │ │   Firebase   │ │  Google AI   │
│     Auth     │ │  Firestore   │ │  Functions   │ │   Platform   │
│              │ │              │ │              │ │              │
│ • Google     │ │ • Real-time  │ │ • Cloud      │ │ • Gemini API │
│   OAuth      │ │   Database   │ │   Functions  │ │ • Receipt    │
│ • Session    │ │ • Security   │ │ • Server-    │ │   Analysis   │
│   Mgmt       │ │   Rules      │ │   side Logic │ │   (Secure)   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
   (Managed)        (Managed)        (Managed)           ▲
                                           │              │
                                           └──────────────┘
                                         (API key protected)
```

### Traffic Flow

1. **User Request** → CDN (edge location nearest to user)
2. **CDN Cache Miss** → Static Hosting (origin server)
3. **JavaScript Load** → Browser downloads main.js
4. **App Initialization** → Firebase SDK connects to Auth/Firestore
5. **User Authentication** → Firebase Auth (Google Sign-In)
6. **Data Operations** → Firestore (CRUD operations)
7. **Receipt Scan** → Firebase Cloud Function → Gemini API (secure server-side processing)

---

## Hosting Options

### Option 1: Firebase Hosting (Recommended)

**Pros:**
- Native integration with Firebase Auth/Firestore
- Free SSL certificates
- Global CDN included
- Simple deployment (`firebase deploy`)
- Automatic preview channels
- Rollback support

**Cons:**
- Requires Firebase CLI
- Vendor lock-in

**Best For:** Production deployments, teams already using Firebase

**Cost:** Free tier: 10GB storage, 360MB/day transfer

---

### Option 2: Vercel

**Pros:**
- Zero-config deployments
- Git integration (auto-deploy on push)
- Preview deployments for PRs
- Excellent performance
- Free SSL
- Edge network

**Cons:**
- Not Firebase-native
- Need to configure Firebase separately

**Best For:** Teams using GitHub/GitLab, rapid iteration

**Cost:** Free tier: 100GB bandwidth/month

---

### Option 3: Netlify

**Pros:**
- Simple drag-and-drop deployment
- Git integration
- Split testing support
- Forms and serverless functions
- Free SSL

**Cons:**
- Similar to Vercel (not Firebase-native)

**Best For:** Simple deployments, small teams

**Cost:** Free tier: 100GB bandwidth/month

---

### Option 4: GitHub Pages

**Pros:**
- Completely free
- Git-based deployment
- Simple setup

**Cons:**
- No server-side logic (client-only)
- Slower than CDN options
- No preview deployments

**Best For:** Demo deployments, proof-of-concept

**Cost:** Free (unlimited)

---

### Option 5: AWS S3 + CloudFront

**Pros:**
- Enterprise-grade scalability
- Fine-grained control
- Custom caching rules
- Integration with AWS ecosystem

**Cons:**
- Complex setup
- More expensive
- Requires AWS knowledge

**Best For:** Enterprise deployments, compliance requirements

**Cost:** ~$1-5/month (depends on traffic)

---

## Pre-Deployment Checklist

### 1. Configuration Verification

- [ ] Firebase project created in Firebase Console
- [ ] Firebase Auth enabled (Google provider)
- [ ] Firestore database created
- [ ] Firestore security rules configured
- [ ] Firebase API keys obtained
- [ ] Gemini API key obtained
- [ ] API keys added to `main.tsx` or environment variables
- [ ] Allowed domains configured in Firebase Console

### 2. Code Preparation

- [ ] Remove placeholder API keys (`YOUR_API_KEY`, etc.)
- [ ] Set production Firebase config
- [ ] Verify Gemini API key is valid
- [ ] Test all features locally
- [ ] Check browser console for errors
- [ ] Verify responsive design on mobile

### 3. Build Process

**Option A: No Build (Direct Deployment)**
```bash
# Deploy main.tsx directly
# Requires browser with native ESM + JSX support
```

**Option B: Build with Vite (Recommended)**
```bash
# Create minimal Vite config
npm create vite@latest boletapp-build -- --template react-ts
# Copy main.tsx to src/App.tsx
# Build for production
npm run build
# Output: dist/ folder
```

**Option C: Build with Create React App**
```bash
npx create-react-app boletapp-build --template typescript
# Copy main.tsx content to src/App.tsx
# Build
npm run build
# Output: build/ folder
```

### 4. PWA Configuration

Create `manifest.json`:
```json
{
  "name": "Boletapp - Smart Expense Tracker",
  "short_name": "Boletapp",
  "description": "AI-powered expense tracking with receipt scanning",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Create basic Service Worker (`service-worker.js`):
```javascript
const CACHE_NAME = 'boletapp-v1';
const urlsToCache = [
  '/',
  '/main.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### 5. Security Hardening

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
      // Only authenticated users can access their own data
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;

      // Validate transaction structure
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.keys().hasAll(['merchant', 'date', 'total', 'currency'])
                    && request.resource.data.total is number
                    && request.resource.data.total >= 0;
    }
  }
}
```

**Firebase Auth Authorized Domains:**
- Add production domain (e.g., `boletapp.com`)
- Add localhost for development
- Remove any test domains

---

## Deployment Steps

### Deployment to Firebase Hosting

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Step 2: Initialize Firebase Project
```bash
cd /path/to/boletapp
firebase init hosting

# Select options:
# - Use existing project
# - Public directory: dist (or build)
# - Single-page app: Yes
# - GitHub Actions: Optional
```

#### Step 3: Build Application (if using build process)
```bash
# Using Vite
npm run build

# Or using Create React App
npm run build
```

#### Step 4: Deploy Hosting and Functions
```bash
# Deploy both hosting and functions
firebase deploy --only hosting,functions

# Or deploy separately:
firebase deploy --only hosting
firebase deploy --only functions
```

#### Step 5: Verify Deployment
```bash
# Firebase will output URL:
# Hosting URL: https://your-project.web.app
```

---

### Cloud Functions Deployment (Required for Receipt Scanning)

#### Prerequisites
- Firebase project upgraded to **Blaze Plan** (pay-as-you-go)
- Gemini API key obtained from Google AI Studio
- Firebase CLI installed and logged in

#### Step 1: Verify Blaze Plan
```bash
# Check current Firebase plan
firebase projects:list

# Upgrade to Blaze plan in Firebase Console:
# https://console.firebase.google.com/project/YOUR_PROJECT/usage/details
```

#### Step 2: Configure Gemini API Key
```bash
# Set API key in Firebase Functions config (legacy method - works until March 2026)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Verify configuration
firebase functions:config:get

# For local testing, create runtime config
cat > functions/.runtimeconfig.json << EOF
{
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY"
  }
}
EOF

# Add to .gitignore (should already be there)
echo "functions/.runtimeconfig.json" >> functions/.gitignore
```

**⚠️ Migration Note:** The `functions.config()` API is deprecated and will stop working in March 2026. Migrate to `.env` files in the future. See: https://firebase.google.com/docs/functions/config-env#migrate-to-dotenv

#### Step 3: Build Functions
```bash
cd functions
npm install
npm run build

# Verify TypeScript compilation
ls -la lib/
# Should see: analyzeReceipt.js, index.js
```

#### Step 4: Deploy Functions
```bash
cd ..  # Back to project root

# Deploy only functions
firebase deploy --only functions

# Expected output:
# ✔  functions[analyzeReceipt(us-central1)] Successful create operation
```

#### Step 5: Verify Function Deployment
```bash
# List deployed functions
firebase functions:list

# Expected output:
# ┌────────────────┬─────────┬──────────┬─────────────┬────────┬──────────┐
# │ Function       │ Version │ Trigger  │ Location    │ Memory │ Runtime  │
# ├────────────────┼─────────┼──────────┼─────────────┼────────┼──────────┤
# │ analyzeReceipt │ v1      │ callable │ us-central1 │ 256    │ nodejs20 │
# └────────────────┴─────────┴──────────┴─────────────┴────────┴──────────┘
```

#### Step 6: Test Function (Optional)
```bash
# View function logs
firebase functions:log --only analyzeReceipt

# Monitor function in Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

#### Common Issues and Solutions

**Issue: "Your project must be on the Blaze plan"**
```
Error: Your project must be on the Blaze (pay-as-you-go) plan
```
**Solution:** Upgrade to Blaze plan in Firebase Console

**Issue: "API key not configured"**
```
Error: GEMINI_API_KEY not configured
```
**Solution:** Run `firebase functions:config:set gemini.api_key="YOUR_KEY"`

**Issue: Build fails with TypeScript errors**
```bash
# Clean and rebuild
cd functions
rm -rf lib node_modules
npm install
npm run build
```

**Issue: Function times out**
- Default timeout: 60 seconds
- Gemini API can be slow for large images
- Timeout is sufficient for most receipts
- If needed, increase in `functions/src/analyzeReceipt.ts`:
```typescript
export const analyzeReceipt = functions
  .runWith({ timeoutSeconds: 120 })  // Increase to 120 seconds
  .https.onCall(...)
```

#### Security Best Practices

1. **Never commit API keys**
   - ✅ API keys in Firebase Functions config (server-side)
   - ✅ `.runtimeconfig.json` in `.gitignore`
   - ❌ Never in client code or `.env` files committed to git

2. **Verify Authentication**
   - Cloud Function checks `context.auth` before processing
   - Returns 401 if user not authenticated

3. **Input Validation**
   - Function validates images array and currency parameter
   - Rejects invalid requests with 400 error

4. **Monitor Usage**
   - Set up Firebase budget alerts
   - Monitor Gemini API quota in Google Cloud Console

---

### Deployment to Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd /path/to/boletapp
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set build command (if using build)
# - Set output directory
```

#### Step 3: Configure Environment Variables
```bash
# In Vercel dashboard:
# Settings > Environment Variables
# Add:
# - REACT_APP_FIREBASE_API_KEY
# - REACT_APP_FIREBASE_AUTH_DOMAIN
# - REACT_APP_FIREBASE_PROJECT_ID
# - REACT_APP_GEMINI_API_KEY
```

#### Step 4: Production Deployment
```bash
vercel --prod
```

---

### Deployment to Netlify

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Deploy
```bash
cd /path/to/boletapp
netlify deploy

# Specify publish directory:
# - dist/ (Vite)
# - build/ (CRA)
```

#### Step 3: Production Deployment
```bash
netlify deploy --prod
```

---

### Deployment to GitHub Pages

#### Step 1: Build Application
```bash
npm run build
```

#### Step 2: Install gh-pages
```bash
npm install --save-dev gh-pages
```

#### Step 3: Add Deploy Script to package.json
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

#### Step 4: Deploy
```bash
npm run deploy
```

---

## Post-Deployment Configuration

### 1. Configure Custom Domain (Optional)

**Firebase Hosting:**
```bash
firebase hosting:channel:deploy production --expires 30d
# Add custom domain in Firebase Console
```

**Vercel:**
```bash
# Add domain in Vercel dashboard
# Configure DNS:
# - A record: 76.76.21.21
# - CNAME: cname.vercel-dns.com
```

**Netlify:**
```bash
# Add custom domain in Netlify dashboard
# Configure DNS with Netlify nameservers
```

### 2. SSL Certificate

All recommended hosting providers (Firebase, Vercel, Netlify) provide automatic SSL certificates via Let's Encrypt. No manual configuration needed.

### 3. Firebase Configuration

**Enable Firebase App Check (Recommended):**
```javascript
// Add to main.tsx initialization
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

**Set Up Firebase Budget Alerts:**
- Go to Firebase Console > Usage
- Set budget alerts for Firestore reads/writes
- Set budget alerts for Auth operations

### 4. Monitoring Setup

**Google Analytics (Optional):**
```javascript
// Add to main.tsx
import { getAnalytics } from "firebase/analytics";

const analytics = getAnalytics(app);
```

**Error Tracking (Sentry):**
```bash
npm install @sentry/react
```

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

---

## Monitoring & Maintenance

### Health Checks

**Daily:**
- [ ] Check Firebase Console for errors
- [ ] Verify authentication is working
- [ ] Test receipt scanning functionality

**Weekly:**
- [ ] Review Firestore usage metrics
- [ ] Check Gemini API quota/usage
- [ ] Monitor hosting bandwidth
- [ ] Review error logs

**Monthly:**
- [ ] Update dependencies
- [ ] Review security rules
- [ ] Audit API keys
- [ ] Check for Firebase SDK updates

### Performance Monitoring

**Firebase Performance Monitoring:**
```javascript
import { getPerformance } from "firebase/performance";

const perf = getPerformance(app);
```

**Key Metrics to Track:**
- Page load time
- Time to interactive
- Firestore query latency
- Gemini API response time
- Authentication success rate

### Logging Strategy

**Client-Side Logging:**
```javascript
// Structured logging
const log = (level, message, context) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    userAgent: navigator.userAgent
  };

  // Send to logging service
  if (level === 'error') {
    Sentry.captureMessage(message, context);
  }
};
```

**Firebase Functions Logs (if using):**
```bash
firebase functions:log
```

---

## Rollback Strategy

### Scenario 1: Critical Bug in Production

**Firebase Hosting:**
```bash
# List deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

**Vercel:**
```bash
# Redeploy previous version from dashboard
# Or use CLI:
vercel rollback
```

**Netlify:**
```bash
# Use dashboard to restore previous deploy
# Settings > Deploys > [Select Previous Deploy] > Publish
```

### Scenario 2: Database Migration Issue

**Firestore:**
- Firestore doesn't support rollback
- Use backup/restore from scheduled backups
- Enable Firestore Time Travel (Enterprise only)

**Mitigation:**
```javascript
// Always include data repair logic
const repairData = (transaction) => {
  // Fix date formats
  if (transaction.date && typeof transaction.date === 'object') {
    transaction.date = getSafeDate(transaction.date);
  }

  // Fix numeric values
  if (typeof transaction.total !== 'number') {
    transaction.total = parseStrictNumber(transaction.total);
  }

  return transaction;
};
```

### Scenario 3: API Key Compromise

**Immediate Actions:**
1. Rotate Firebase API keys in Console
2. Regenerate Gemini API key
3. Update environment variables
4. Redeploy with new keys
5. Invalidate all user sessions

```bash
# Force re-authentication
# In Firebase Console: Authentication > Users > Select All > Delete Sessions
```

---

## Cost Estimation

### Monthly Cost Breakdown (Estimated)

#### Small Scale (100 users, 1000 receipts/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Firebase Hosting** | 1GB storage, 10GB transfer | Free |
| **Firestore** | 30K reads, 10K writes, 1GB storage | Free |
| **Firebase Auth** | 500 MAU (Google Sign-In) | Free |
| **Gemini API** | 1000 requests (Free tier) | Free |
| **Domain** | Custom domain (optional) | $12/year |
| **Total** | | **~$1/month** |

#### Medium Scale (1,000 users, 10,000 receipts/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Firebase Hosting** | 5GB storage, 50GB transfer | Free |
| **Firestore** | 300K reads, 100K writes, 5GB storage | $1-2 |
| **Firebase Auth** | 5,000 MAU | Free |
| **Gemini API** | 10,000 requests | $20-50 |
| **Vercel/Netlify Pro** | Enhanced CDN | $20 (optional) |
| **Monitoring** | Sentry/DataDog | $25 (optional) |
| **Total** | | **$21-72/month** |

#### Large Scale (10,000 users, 100,000 receipts/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Firebase Hosting** | 20GB storage, 200GB transfer | $5-10 |
| **Firestore** | 3M reads, 1M writes, 20GB storage | $15-30 |
| **Firebase Auth** | 50,000 MAU | Free |
| **Gemini API** | 100,000 requests | $200-500 |
| **CDN** | Vercel Pro or CloudFlare | $20-50 |
| **Monitoring** | Full observability stack | $100 |
| **Total** | | **$340-690/month** |

### Cost Optimization Tips

1. **Enable Firestore Caching:**
```javascript
const db = getFirestore(app);
enableIndexedDbPersistence(db); // Reduces reads
```

2. **Batch Gemini API Requests:**
```javascript
// Process multiple images in one request
analyzeWithGemini([image1, image2], currency);
```

3. **Implement Query Limits:**
```javascript
// Paginate transactions
const q = query(
  collection(db, 'transactions'),
  orderBy('date', 'desc'),
  limit(20) // Don't fetch all at once
);
```

4. **Use Firebase Hosting CDN:**
- Free global CDN included
- Edge caching reduces origin requests

5. **Monitor Free Tier Limits:**
- Firestore: 50K reads, 20K writes/day free
- Gemini: Check current free tier limits
- Set up billing alerts before hitting limits

---

## Disaster Recovery Plan

### Backup Strategy

**Firestore Backups:**
```bash
# Automated daily backups (requires Blaze plan)
gcloud firestore export gs://your-backup-bucket
```

**Code Backups:**
- Git repository (primary backup)
- GitHub/GitLab (remote backup)
- Local backup on deployment server

### Recovery Procedures

**Scenario: Complete Data Loss**
1. Restore Firestore from latest backup
2. Redeploy application from Git
3. Verify security rules
4. Test authentication flow
5. Notify users of service restoration

**Scenario: Hosting Provider Outage**
1. Deploy to backup hosting provider (e.g., Netlify as backup to Vercel)
2. Update DNS records
3. Wait for DNS propagation (1-24 hours)
4. Monitor traffic shift

**Recovery Time Objective (RTO):** 2-4 hours
**Recovery Point Objective (RPO):** 24 hours (daily backups)

---

## Deployment Checklist Summary

### Pre-Deploy
- [ ] All API keys configured
- [ ] Firebase project set up
- [ ] Firestore security rules deployed
- [ ] Application built and tested locally
- [ ] PWA manifest created
- [ ] Service worker configured

### Deploy
- [ ] Deploy to staging environment first
- [ ] Test all features on staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify production deployment

### Post-Deploy
- [ ] Configure custom domain (if needed)
- [ ] Verify SSL certificate
- [ ] Set up monitoring
- [ ] Configure error tracking
- [ ] Test from multiple devices/browsers
- [ ] Document deployment date and version
- [ ] Notify team of successful deployment

---

*Generated by BMAD Document Project Workflow*
*Date: 2025-11-20*
