# Deployment Guide

**Version:** 1.0
**Date:** 2026-02-05

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Firebase Hosting Deployment](#firebase-hosting-deployment)
- [Cloud Functions Deployment](#cloud-functions-deployment)
- [Common Deployment Scenarios](#common-deployment-scenarios)
- [Post-Deployment](#post-deployment)
- [Rollback Strategy](#rollback-strategy)
- [Environment Variables](#environment-variables)
- [Security Checklist](#security-checklist)
- [Cost Estimation](#cost-estimation)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Stack Summary

| Component | Technology | Managed |
|-----------|-----------|---------|
| Frontend | React (Vite build) | Firebase Hosting |
| Backend | Firebase Cloud Functions (serverless) | Firebase |
| Database | Firestore (NoSQL) | Firebase |
| Auth | Firebase Auth (Google Sign-In) | Firebase |
| AI | Google Gemini API (via Cloud Function) | Google |

### Traffic Flow

1. User request hits CDN edge (Firebase Hosting global CDN)
2. Browser downloads static assets (index.html, JS bundle)
3. App initializes Firebase SDK, connects to Auth/Firestore
4. User authenticates via Google Sign-In
5. Data operations go directly to Firestore
6. Receipt scanning calls Cloud Function, which calls Gemini API server-side

### Deployment URLs

- **Production:** https://boletapp-d609f.web.app
- **Console:** https://console.firebase.google.com/project/boletapp-d609f
- **Functions region:** us-central1

---

## Prerequisites

- [ ] Firebase project on **Blaze Plan** (required for Cloud Functions)
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged in: `firebase login`
- [ ] Gemini API key configured (server-side only)
- [ ] All tests passing locally

---

## Firebase Hosting Deployment

### Auto-Deploy (Default)

On merge to `main`, GitHub Actions automatically builds and deploys to Firebase Hosting. Manual deployment is only needed if auto-deploy fails.

### Manual Deploy: Full Stack

```bash
# 1. Build the application
npm run build

# 2. Deploy hosting + functions
firebase deploy --only hosting,functions

# 3. Verify
firebase functions:list
curl -I https://boletapp-d609f.web.app
```

**Time:** ~3-5 minutes

### Manual Deploy: Hosting Only

```bash
npm run build
firebase deploy --only hosting
```

**Time:** ~1-2 minutes. Use when you have only changed client code (UI, styles, frontend bugs).

### Manual Deploy: Functions Only

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

**Time:** ~2-3 minutes. Use when you have only changed Cloud Function logic (API, Gemini prompts, server-side auth).

### Staging Channel

```bash
firebase hosting:channel:deploy staging --expires 7d
# Outputs: https://boletapp-d609f--staging-xyz123.web.app
```

---

## Cloud Functions Deployment

### First-Time Setup

**1. Verify Blaze Plan:**

```bash
firebase projects:list
# Upgrade at: https://console.firebase.google.com/project/YOUR_PROJECT/usage/details
```

**2. Configure Gemini API Key:**

```bash
# Set server-side config
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Verify
firebase functions:config:get

# Local testing: create runtime config (git-ignored)
cat > functions/.runtimeconfig.json << EOF
{
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY"
  }
}
EOF
```

> **Migration note:** `functions.config()` is deprecated and will stop working March 2026. Plan to migrate to `.env` files. See: https://firebase.google.com/docs/functions/config-env#migrate-to-dotenv

**3. Build and deploy:**

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

### Verify Function Deployment

```bash
firebase functions:list
# Expected: analyzeReceipt | v1 | callable | us-central1 | 256MB | nodejs20

firebase functions:log --only analyzeReceipt
```

---

## Common Deployment Scenarios

### Hotfix (Urgent Bug Fix)

```bash
# Fix the bug, test locally
npm run dev

# Build and deploy immediately
npm run build
firebase deploy --only hosting

# Verify
curl https://boletapp-d609f.web.app
```

**Time:** 2-3 minutes

### API Key Rotation

```bash
# 1. Get new key from Google AI Studio
# 2. Update Firebase config
firebase functions:config:set gemini.api_key="NEW_API_KEY"
# 3. Redeploy functions (no client changes needed)
firebase deploy --only functions
```

**Time:** 3-4 minutes

---

## Post-Deployment

### Verification Checklist

- [ ] Production URL loads: https://boletapp-d609f.web.app
- [ ] Authentication works (sign in / sign out)
- [ ] Core features functional
- [ ] No console errors
- [ ] Receipt scanning works (if functions deployed)

### Bundle Security Check

```bash
# Verify no API keys leaked into client bundle
curl -s "https://boletapp-d609f.web.app/assets/index-*.js" | grep -c "GEMINI_API_KEY"
# Should return: 0
```

### Custom Domain (Optional)

Firebase Hosting includes free SSL via Let's Encrypt. To add a custom domain, configure it in Firebase Console > Hosting.

### Monitoring Setup

- Firebase Console for error tracking and usage metrics
- Set up budget alerts: Firebase Console > Usage > Details & Settings
- Monitor Gemini API quota in Google Cloud Console

**Recommended budgets:**
- Small project: $10/month
- Medium project: $50/month
- Large project: $200/month

---

## Rollback Strategy

### Hosting Rollback

```bash
# Option 1: Firebase built-in rollback
firebase hosting:rollback

# Option 2: Redeploy previous commit
git checkout <previous-commit>
npm run build
firebase deploy --only hosting
git checkout main
```

### Function Rollback

Redeploy the previous working version of the function code:

```bash
git checkout <previous-commit> -- functions/
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
git checkout main -- functions/
```

### Database Issues

Firestore does not support built-in rollback. Mitigations:
- Scheduled backups: `gcloud firestore export gs://your-backup-bucket`
- Include data repair logic in the application for format changes

### API Key Compromise

1. Rotate Firebase API keys in Console
2. Regenerate Gemini API key
3. Update environment variables / functions config
4. Redeploy
5. Invalidate user sessions in Firebase Console

---

## Environment Variables

### Client-Side (`.env` -- git-ignored)

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123456:web:abc123
# NOTE: No VITE_GEMINI_API_KEY -- it is server-side only
```

### Server-Side (Firebase Functions Config)

```bash
# Set via CLI (never in committed files)
firebase functions:config:set gemini.api_key="AIza..."

# Check current config
firebase functions:config:get
```

### CI Environment

CI uses placeholder values for test builds. Real secrets are stored as GitHub repository secrets and injected only during the deploy job on the main branch.

---

## Security Checklist

Before deploying to production:

- [ ] No API keys in client bundle
- [ ] Firestore security rules tested and deployed
- [ ] Firebase Auth configured with correct allowed domains
- [ ] Cloud Function requires authentication (`context.auth` check)
- [ ] `.env` file is in `.gitignore`
- [ ] `functions/.runtimeconfig.json` is in `.gitignore`
- [ ] Budget alerts configured
- [ ] Gitleaks pre-commit hook passing

---

## Cost Estimation

### Small Scale (100 users, 1K receipts/month)

| Service | Cost |
|---------|------|
| Firebase Hosting (1GB storage, 10GB transfer) | Free |
| Firestore (30K reads, 10K writes) | Free |
| Firebase Auth (500 MAU) | Free |
| Gemini API (1K requests, free tier) | Free |
| **Total** | **~$0-1/month** |

### Medium Scale (1K users, 10K receipts/month)

| Service | Cost |
|---------|------|
| Firebase Hosting | Free |
| Firestore (300K reads, 100K writes) | $1-2 |
| Firebase Auth (5K MAU) | Free |
| Gemini API (10K requests) | $20-50 |
| **Total** | **~$21-52/month** |

### Cost Optimization Tips

- Enable Firestore offline persistence to reduce reads
- Paginate queries with `limit()` instead of fetching all documents
- Use Firebase Hosting CDN (included free) for edge caching
- Set billing alerts before hitting free-tier limits

---

## Troubleshooting

### Build Fails

```bash
rm -rf dist node_modules
npm install
npm run build
```

### Functions Deploy Fails

```bash
# Verify Blaze plan
firebase projects:list

# Clean rebuild
cd functions && rm -rf lib node_modules && npm install && npm run build && cd ..
firebase deploy --only functions
```

### "Your project must be on the Blaze plan"

Upgrade at: https://console.firebase.google.com/project/YOUR_PROJECT/usage/details

### "API key not configured"

```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase deploy --only functions
```

### Function Timeout

Default is 60 seconds. For large receipts, increase in `functions/src/analyzeReceipt.ts`:

```typescript
export const analyzeReceipt = functions
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(...)
```

### "Permission Denied" on Firestore

- Check Firestore security rules in Firebase Console
- Ensure user is authenticated
- Verify userId matches the document path

---

## File Structure

```
boletapp/
  dist/                       # Built frontend (deployed by hosting)
    index.html
    assets/index-*.js
  functions/                  # Cloud Functions
    src/
      analyzeReceipt.ts       # Receipt scanning logic
      index.ts                # Function exports
    lib/                      # Compiled JS (generated)
    .runtimeconfig.json       # Local config (git-ignored)
  firebase.json               # Firebase project config
  .firebaserc                 # Project aliases
```
