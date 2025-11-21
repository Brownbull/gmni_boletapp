# Story 1.2: Production Build Configuration

**Status:** Draft

---

## User Story

As a developer,
I want proper environment variable management and production build configuration,
So that API keys are secure and the application can be built for production deployment.

---

## Acceptance Criteria

**AC #1:** .env file configured with all Firebase and Gemini credentials (git-ignored)
- VITE_FIREBASE_API_KEY set
- VITE_FIREBASE_AUTH_DOMAIN set
- VITE_FIREBASE_PROJECT_ID set
- VITE_FIREBASE_STORAGE_BUCKET set
- VITE_FIREBASE_MESSAGING_SENDER_ID set
- VITE_FIREBASE_APP_ID set
- VITE_GEMINI_API_KEY set
- .env file listed in .gitignore

**AC #2:** .env.example template created and documented
- Contains all required variable names with placeholder values
- Includes comments explaining how to obtain each credential
- Documented in README.md setup instructions

**AC #3:** `npm run build` completes successfully producing optimized dist/ folder
- TypeScript compiles without errors
- Vite build completes successfully
- dist/ folder contains minified HTML, JS, CSS
- Assets are optimized and tree-shaken

**AC #4:** `npm run preview` serves production build locally with all features functional
- Preview server starts at localhost:4173
- All features work in production build mode
- Environment variables correctly embedded in build
- No console errors

**AC #5:** No hardcoded API keys remain in source code
- Firebase config uses import.meta.env.VITE_* variables
- Gemini API key uses import.meta.env.VITE_GEMINI_API_KEY
- Code review confirms no hardcoded secrets

---

## Implementation Details

### Tasks / Subtasks

- [ ] Create .gitignore file in project root (AC: #1)
  - [ ] Add .env to .gitignore
  - [ ] Add node_modules/ to .gitignore
  - [ ] Add dist/ to .gitignore
  - [ ] Add .DS_Store and other OS files
- [ ] Create .env.example template file (AC: #2)
  - [ ] Add all VITE_* variable names
  - [ ] Add placeholder values (e.g., "your_firebase_api_key_here")
  - [ ] Add comments explaining where to get each credential
- [ ] Create actual .env file with real credentials (AC: #1)
  - [ ] Copy Firebase config from existing main.tsx
  - [ ] Copy Gemini API key from existing main.tsx
  - [ ] Verify .env is git-ignored (test with git status)
- [ ] Update src/services/firebase.ts to use environment variables (AC: #5)
  ```typescript
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  ```
- [ ] Update src/services/gemini.ts to use environment variable (AC: #5)
  ```typescript
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  ```
- [ ] Add build script to package.json: `"build": "tsc && vite build"` (AC: #3)
- [ ] Add preview script to package.json: `"preview": "vite preview"` (AC: #4)
- [ ] Add deploy script to package.json: `"deploy": "npm run build && firebase deploy --only hosting"` (AC: #3)
- [ ] Test build process: `npm run build` (AC: #3)
  - [ ] Verify dist/ folder created
  - [ ] Check dist/index.html exists
  - [ ] Verify assets are minified
  - [ ] Check file sizes are reasonable
- [ ] Test production preview: `npm run preview` (AC: #4)
  - [ ] Server starts successfully
  - [ ] Application loads at localhost:4173
  - [ ] Test authentication flow
  - [ ] Test receipt scanning
  - [ ] Test transaction CRUD
  - [ ] Test analytics and charts
  - [ ] Verify no console errors
- [ ] Search codebase for any remaining hardcoded API keys (AC: #5)
  - [ ] Grep for "AIza" (Gemini API key pattern)
  - [ ] Grep for hardcoded Firebase config values
  - [ ] Verify all configs use import.meta.env
- [ ] Update README.md with environment setup instructions (AC: #2)
  - [ ] Add "Environment Configuration" section
  - [ ] Document how to create .env from .env.example
  - [ ] List where to obtain each credential

### Technical Summary

This story secures the application by externalizing all API keys and credentials to environment variables. Vite's built-in environment variable system (`import.meta.env.VITE_*`) is used to:

1. Keep secrets out of source code (security best practice)
2. Enable different configs for different environments (future-proofing)
3. Prevent accidental credential commits via .gitignore

**Build Process:**
- `tsc` compiles TypeScript to JavaScript with type checking
- `vite build` bundles, minifies, and optimizes for production
- Environment variables are embedded at build time (replaceduring compilation)
- Output in `dist/` folder ready for static hosting

**Key Security Note:**
Environment variables are embedded in the client-side JavaScript bundle, so they're still visible in browser devtools. This is acceptable for Firebase (API keys are meant to be public, protected by Firebase Security Rules) and Gemini (quota monitoring required). For enhanced security, future work could proxy Gemini API calls through Firebase Cloud Functions.

### Project Structure Notes

- **Files to modify:**
  - src/services/firebase.ts (use import.meta.env instead of hardcoded config)
  - src/services/gemini.ts (use import.meta.env.VITE_GEMINI_API_KEY)
  - package.json (add build, preview, deploy scripts)
  - README.md (add environment setup documentation)

- **Files to create:**
  - .gitignore (exclude sensitive files)
  - .env (actual credentials, git-ignored)
  - .env.example (template for other developers)

- **Expected test locations:**
  - Manual testing via `npm run preview` at localhost:4173
  - Verify production build matches dev behavior

- **Estimated effort:** 2 story points (1-2 days)

- **Prerequisites:** Story 1.1 (requires modular structure with src/services/ files)

### Key Code References

**Files containing hardcoded credentials (from original main.tsx):**
- Lines 30-37: Firebase configuration → Move to .env
- Line 40: Gemini API key → Move to .env

**Vite Environment Variable Documentation:**
- https://vitejs.dev/guide/env-and-mode.html
- Variables must be prefixed with VITE_ to be exposed to client
- Access via `import.meta.env.VITE_VARIABLE_NAME`

**Firebase Config Pattern:**
```typescript
// src/services/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... other fields
};
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Environment variable management strategy
- Build configuration details (Vite 5.x)
- Security considerations for API keys
- Complete dependency versions
- .gitignore requirements

**Environment Variables:** See tech-spec.md "Development Context → Configuration Changes" for complete list

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
