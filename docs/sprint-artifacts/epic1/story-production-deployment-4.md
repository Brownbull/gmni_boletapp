# Story 1.4: Firebase Deployment Infrastructure

**Status:** Draft

---

## User Story

As a developer,
I want Firebase Hosting configured and ready for deployment,
So that the application can be deployed to production with automated deployment scripts.

---

## Acceptance Criteria

**AC #1:** Firebase CLI installed and authenticated
- Firebase CLI installed globally (`npm install -g firebase-tools`)
- User logged in (`firebase login` successful)
- Can list Firebase projects (`firebase projects:list` shows projects)

**AC #2:** `firebase init hosting` completed with correct settings
- firebase.json created with hosting configuration
- .firebaserc created with project ID
- Public directory set to "dist"
- Single-page app rewrites configured
- Build directory properly referenced

**AC #3:** firebase.json includes caching headers for optimized asset delivery
- Static assets (JS, CSS) cached for 1 year (31536000 seconds)
- index.html not aggressively cached (allows quick updates)
- Proper cache-control headers configured

**AC #4:** Staging deployment tested successfully
- `firebase hosting:channel:deploy staging` succeeds
- Staging URL accessible
- Application works on staging URL
- All features functional on staging

**AC #5:** Deployment process documented in README.md
- Deployment section added to README
- Commands documented (build, deploy, staging)
- Firebase project setup steps included
- Rollback procedure documented

---

## Implementation Details

### Tasks / Subtasks

- [ ] Verify Firebase CLI installed globally (AC: #1)
  ```bash
  firebase --version
  ```
  - [ ] If not installed: `npm install -g firebase-tools`
- [ ] Login to Firebase (AC: #1)
  ```bash
  firebase login
  ```
  - [ ] Opens browser for Google authentication
  - [ ] Verify "Success! Logged in as [email]"
- [ ] List Firebase projects to confirm access (AC: #1)
  ```bash
  firebase projects:list
  ```
  - [ ] Verify boletapp Firebase project appears in list
- [ ] Initialize Firebase Hosting (AC: #2)
  ```bash
  firebase init hosting
  ```
  - [ ] Select existing Firebase project (boletapp)
  - [ ] Set public directory: **dist**
  - [ ] Configure as single-page app: **Yes**
  - [ ] Set up automatic builds with GitHub: **No** (manual for now)
  - [ ] Don't overwrite index.html: **No**
- [ ] Review generated firebase.json (AC: #2, #3)
  - [ ] Verify public directory is "dist"
  - [ ] Verify rewrites for SPA configured
- [ ] Update firebase.json with optimized cache headers (AC: #3)
  ```json
  {
    "hosting": {
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000"
            }
          ]
        },
        {
          "source": "index.html",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache"
            }
          ]
        }
      ]
    }
  }
  ```
- [ ] Verify .firebaserc contains correct project ID (AC: #2)
  ```json
  {
    "projects": {
      "default": "your-firebase-project-id"
    }
  }
  ```
- [ ] Build production version (AC: #4)
  ```bash
  npm run build
  ```
  - [ ] Verify dist/ folder created
  - [ ] Check files are minified
- [ ] Deploy to staging channel for testing (AC: #4)
  ```bash
  firebase hosting:channel:deploy staging
  ```
  - [ ] Note the staging URL returned
  - [ ] Verify deployment succeeded
- [ ] Test application on staging URL (AC: #4)
  - [ ] Open staging URL in browser
  - [ ] Test authentication (sign in, sign out)
  - [ ] Test receipt scanning
  - [ ] Test transaction CRUD
  - [ ] Test analytics charts
  - [ ] Test history pagination
  - [ ] Verify all features work
  - [ ] Check browser console for errors
- [ ] Document deployment process in README.md (AC: #5)
  - [ ] Add "Deployment" section
  - [ ] Document Firebase CLI installation
  - [ ] Document firebase login process
  - [ ] Document firebase init steps
  - [ ] Add deployment commands:
    - `npm run build` - Create production build
    - `firebase deploy --only hosting` - Deploy to production
    - `firebase hosting:channel:deploy staging` - Deploy to staging
    - `npm run deploy` - Build and deploy in one command
  - [ ] Add rollback procedure:
    - Via Firebase Console: Hosting > Previous releases > Rollback
    - Via Git: Checkout previous commit, rebuild, redeploy
  - [ ] Add monitoring section:
    - Firebase Console > Hosting for activity
    - Firebase Console > Performance for metrics

### Technical Summary

This story establishes Firebase Hosting as the production deployment platform for the boletapp. Firebase Hosting provides:

**Key Features:**
- **Global CDN:** Fast content delivery worldwide
- **Automatic HTTPS:** SSL certificates included
- **Easy Rollback:** One-click revert to previous versions
- **Zero Configuration:** No server management needed

**Hosting Configuration:**
- **Public Directory:** `dist/` (Vite build output)
- **SPA Rewrites:** All routes serve index.html for client-side routing
- **Cache Headers:**
  - JS/CSS: 1-year cache (immutable, content-hashed filenames)
  - index.html: No cache (allows quick updates)

**Deployment Workflow:**
1. Build: `npm run build` creates optimized dist/ folder
2. Deploy: `firebase deploy --only hosting` uploads to CDN
3. Verify: Test deployed URL
4. Monitor: Check Firebase Console for activity

**Staging Channel:**
Firebase Preview Channels enable testing deployments before production:
- Creates temporary URL (expires after 7 days)
- Isolated from production
- Perfect for validation before go-live

**Automation:**
The `npm run deploy` script combines build and deploy into one command:
```json
"deploy": "npm run build && firebase deploy --only hosting"
```

### Project Structure Notes

- **Files to create:**
  - firebase.json (Firebase Hosting configuration)
  - .firebaserc (Firebase project reference)

- **Files to modify:**
  - README.md (add deployment documentation)

- **Commands to run:**
  - `npm install -g firebase-tools` (if needed)
  - `firebase login`
  - `firebase init hosting`
  - `firebase hosting:channel:deploy staging`

- **Expected test locations:**
  - Test at staging URL (returned by deploy command)
  - Test all features in deployed environment

- **Estimated effort:** 3 story points (2-3 days)

- **Prerequisites:** Stories 1.1 and 1.2 (requires production build working)

### Key Code References

**Firebase Hosting Documentation:**
- https://firebase.google.com/docs/hosting
- https://firebase.google.com/docs/hosting/quickstart

**Firebase CLI Reference:**
- `firebase login` - Authenticate
- `firebase init hosting` - Configure hosting
- `firebase deploy --only hosting` - Deploy to production
- `firebase hosting:channel:deploy <channel>` - Deploy to preview channel
- `firebase hosting:channel:list` - List active preview channels
- `firebase hosting:channel:delete <channel>` - Remove preview channel

**Typical Firebase Hosting URL Patterns:**
- Production: `https://PROJECT_ID.web.app` or `https://PROJECT_ID.firebaseapp.com`
- Preview Channel: `https://PROJECT_ID--CHANNEL_ID-HASH.web.app`

**Cache-Control Headers:**
- `max-age=31536000` - Cache for 1 year (immutable content)
- `no-cache` - Don't cache (always revalidate)

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Complete Firebase deployment strategy
- Firebase Hosting configuration details
- Deployment steps and workflow
- Monitoring approach
- Rollback procedures

**Firebase Console:** https://console.firebase.google.com/

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
