# Boletapp

A Progressive Web Application (PWA) for expense tracking with AI-powered receipt scanning.

## Features

- Google Authentication
- AI-powered receipt scanning using Google Gemini
- Real-time transaction sync with Firebase Firestore
- Expense analytics with charts
- Multi-language support (English/Spanish)
- Dark/Light theme

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build Tool:** Vite 5
- **Backend:** Firebase (Auth, Firestore)
- **AI:** Google Gemini 2.5 Flash

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase project with Auth and Firestore enabled
- Google Gemini API key

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:

   **Firebase credentials** (from [Firebase Console](https://console.firebase.google.com/)):
   - Go to Project Settings > Your apps > Web app
   - Copy the config values

   **Gemini API key** (from [Google AI Studio](https://makersuite.google.com/app/apikey)):
   - Create or copy an API key

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:5173

### Production Build

```bash
npm run build
```

Creates optimized bundle in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally at http://localhost:4175

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests in watch mode |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:all` | Run all tests sequentially |
| `npm run test:coverage` | Generate code coverage report |

## Testing & Code Coverage

### Test Framework

Boletapp uses a **three-tier testing strategy** to ensure code quality and prevent regressions:

1. **Unit Tests** (Vitest) - Test individual functions and utilities in isolation
2. **Integration Tests** (React Testing Library) - Test component interactions and Firebase integration
3. **End-to-End Tests** (Playwright) - Test complete user workflows in a real browser

### Running Tests

**Using the centralized test script (recommended):**
```bash
# Before committing - fast feedback
./scripts/test-local.sh quick      # ~2-5s (type-check + unit)

# Before pushing - complete validation
./scripts/test-local.sh all        # ~30-60s (all tests + coverage)

# Full CI simulation - exact GitHub Actions environment
./scripts/test-local.sh ci         # ~60-90s (includes build)

# Individual test suites
./scripts/test-local.sh unit       # Unit tests only
./scripts/test-local.sh integration # Integration tests (auto-starts emulators)
./scripts/test-local.sh e2e        # E2E tests (Playwright manages dev server)
./scripts/test-local.sh coverage   # Generate coverage report

# Development modes
./scripts/test-local.sh watch      # TDD mode - auto-rerun on file changes
./scripts/test-local.sh help       # Show all available commands
```

**Using npm scripts directly:**
```bash
npm run test:all            # All tests sequentially
npm run test:unit           # Unit tests only (~400ms)
npm run test:integration    # Integration tests only (~500ms)
npm run test:e2e            # E2E tests only (~60s)
npm run test:coverage       # Generate coverage report
```

### Code Coverage Baseline

**Overall Coverage:** 79.51% statements | 75% branches | 72.22% functions | 84.21% lines

| Module | Statements | Branches | Functions | Lines | Status |
|--------|------------|----------|-----------|-------|--------|
| **config/** | 80% | 50% | 100% | 80% | ✅ Target met |
| **hooks/** | 82.14% | 62.5% | 100% | 88.46% | ✅ Target met |
| **services/** | 65.38% | 66.66% | 50% | 69.56% | ⚠️ Below target |
| **utils/** | 94.73% | 93.75% | 100% | 100% | ✅ Excellent |

### Coverage Targets

- **Critical Paths (Auth, CRUD, AI):** 80%+ coverage ✅
- **Business Logic (Services, Hooks, Utils):** 70%+ coverage ✅
- **UI Components:** 60%+ coverage (planned)
- **Overall Project:** 70%+ coverage ✅

### Continuous Integration

Every commit and pull request automatically runs:

✅ Unit tests (54 tests)
✅ Integration tests with Firebase emulator
✅ E2E tests with Playwright (Chromium)
✅ Code coverage reporting
✅ TypeScript type checking

**GitHub Actions Workflow:** `.github/workflows/test.yml`

Pull requests require all tests to pass before merging. Coverage reports are uploaded as artifacts for each build.

### Test Environment

Integration and E2E tests use **Firebase Emulators** for isolated testing:

- **Firestore Emulator:** Port 8080 (NoSQL database)
- **Auth Emulator:** Port 9099 (Authentication)

Emulators provide a safe environment to test without affecting production data.

### Test Data

Test users and fixtures are defined in `tests/fixtures/`:

- **Admin User:** Full permissions for testing admin flows
- **Test Users (1-2):** Standard users for testing data isolation
- **Sample Transactions:** Realistic expense data for testing analytics

### CI/CD Pipeline

**Status:** ✅ Automated testing enabled

Every push to `main` and all pull requests trigger the GitHub Actions workflow:

1. Install dependencies
2. Start Firebase emulators
3. Run unit tests
4. Run integration tests
5. Start Vite dev server
6. Run E2E tests
7. Generate coverage report
8. Upload coverage artifacts

**Execution Time:** Target <10 minutes per run
**Failed Tests:** Block PR merges automatically

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── charts/     # Chart components (Pie, Bar)
├── config/         # Configuration (Firebase, Gemini)
├── hooks/          # Custom React hooks
├── services/       # API services (Firestore, Gemini)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── views/          # Page-level components
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |
| `VITE_GEMINI_MODEL` | Gemini model (default: gemini-2.5-flash-preview-09-2025) |

## Troubleshooting

### "Firebase Config Missing" error
- Ensure all `VITE_FIREBASE_*` variables are set in `.env`
- Restart the dev server after modifying `.env`

### "Missing required environment variable" error
- Check that `.env` file exists in project root
- Verify all required variables are present

### Auth errors
- Add `localhost` to Firebase Console > Authentication > Settings > Authorized domains
- Enable Google sign-in provider in Firebase Console

## Production Deployment

**Live Application:** 🚀 **https://boletapp-d609f.web.app**

**Deployment Date:** November 21, 2025

### Access Instructions

1. Visit the production URL: https://boletapp-d609f.web.app
2. Click "Sign in with Google"
3. Authorize with your Google account
4. Start tracking expenses!

### Features Available in Production

- ✅ **Google Authentication** - Secure OAuth sign-in
- ✅ **AI Receipt Scanning** - Powered by Google Gemini 2.5 Flash
- ✅ **Transaction Management** - Create, edit, delete transactions
- ✅ **Analytics & Charts** - Visualize spending patterns
- ✅ **History View** - Browse transaction history with pagination
- ✅ **Multi-language** - English and Spanish support
- ✅ **Theme Support** - Light and dark modes
- ✅ **Data Persistence** - Your data is securely stored in Firestore
- ✅ **HTTPS Enabled** - All traffic encrypted

### Security

- User data is isolated - each user can only access their own transactions
- Firestore security rules enforce authentication and authorization
- All traffic served over HTTPS
- API keys restricted by authorized domains

## Deployment

### Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with Firebase (`firebase login`)
- Production build completed (`npm run build`)

### Firebase Hosting

#### Staging Deployment

Test your changes in a staging environment before production:

```bash
npm run build
firebase hosting:channel:deploy staging
```

This creates a temporary preview URL that expires after 7 days.

#### Production Deployment

Deploy to production hosting:

```bash
npm run build
firebase deploy --only hosting
```

If this is your first deployment or you've updated Firestore rules:

```bash
firebase deploy --only hosting,firestore:rules
```

Or use the combined script:

```bash
npm run deploy
```

This runs both `build` and `deploy --only hosting` in sequence.

#### Deployment Verification

After deployment:

1. Check the deployment URL in terminal output
2. Open the Firebase Console: https://console.firebase.google.com/project/boletapp-d609f/hosting
3. Verify all features work (auth, scanning, CRUD, analytics)
4. Monitor for errors in Firebase Console

#### Rollback Procedure

If issues are detected after deployment:

**Method 1: Firebase Console (Recommended)**
1. Go to Firebase Console > Hosting
2. Find the previous working deployment
3. Click the three-dot menu > "Rollback"
4. Confirm the rollback

**Method 2: Git-based Rollback**
1. Checkout previous commit: `git checkout <previous-commit>`
2. Rebuild: `npm run build`
3. Redeploy: `firebase deploy --only hosting`

**Emergency Contact:** Check Firebase Console for deployment status and errors

### Troubleshooting

**"firebase command not found"**
- Install Firebase CLI: `npm install -g firebase-tools`

**"Permission denied" or not authenticated**
- Run `firebase login` and sign in with your Google account

**"Project not found"**
- Check `.firebaserc` contains the correct project ID (`boletapp-d609f`)
- Run `firebase projects:list` to see available projects

**"Build failed"**
- Run `npm run build` separately to debug
- Check for TypeScript errors with `npm run type-check`
- Ensure all environment variables are set in `.env`

## Repository

- **GitHub:** https://github.com/Brownbull/gmni_boletapp
- **Clone:** `git clone https://github.com/Brownbull/gmni_boletapp.git`

## License

Private project. All rights reserved.
