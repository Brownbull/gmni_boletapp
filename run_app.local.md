# Running Boletapp Locally - Quick Start Guide

**Last Updated:** 2025-11-26 (Post-Epic 3)
**Purpose:** Complete guide to run the app locally with test data for development and testing

---

## Prerequisites

Before you start, ensure you have:

- **Node.js 18+** installed (`node --version`)
- **npm 9+** installed (`npm --version`)
- **Firebase CLI** installed (`firebase --version`)
- **Git** (for version control)

If missing, install them:
```bash
# Install Node.js from https://nodejs.org/
# Then install Firebase CLI globally:
npm install -g firebase-tools
```

---

## Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

**What this does:** Installs all required packages (React, Firebase, Vite, testing frameworks, etc.)

**Expected time:** ~2 minutes

---

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root with your Firebase and Gemini API keys:

```bash
# Copy the example file (if it exists) or create manually
cp .env.example .env  # If example exists
# OR create manually:
touch .env
```

Add the following to `.env`:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=boletapp-d609f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=boletapp-d609f
VITE_FIREBASE_STORAGE_BUCKET=boletapp-d609f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

**Where to get these values:**
- **Firebase Config:** Firebase Console → Project Settings → Your apps → SDK setup and configuration
- **Gemini API Key:** Google AI Studio → https://makersuite.google.com/app/apikey

**⚠️ Important:** The `.env` file is git-ignored for security. Never commit API keys to the repository.

---

### Step 3: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v5.4.0  ready in 500 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**What this does:**
- Starts Vite development server on port **5174** (not 5173, to avoid conflicts)
- Enables Hot Module Replacement (HMR) - instant code updates
- Serves the app at http://localhost:5174

**Note:** Port 5174 is intentionally chosen to avoid conflicts with other local apps running on port 5173.

---

## Using the App Locally

### Option A: Sign In with Google (Production Data)

1. Open http://localhost:5174 in your browser
2. Click "Sign in with Google"
3. Authenticate with your Google account
4. Start creating transactions (data saves to production Firestore)

**Use case:** Quick testing with real authentication and data persistence

**⚠️ Warning:** This writes to the **production database**. For safe testing, use the Firebase emulator instead (Option B).

---

### Option B: Use Firebase Emulator (Recommended for Testing)

The Firebase emulator provides a **local-only** environment with isolated test data.

#### Start the Emulator

In a **separate terminal window**:

```bash
npm run emulators
```

**Expected output:**
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators started, it is now safe to connect.       │
├───────────┬────────────────┬─────────────────────────────────┤
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
└───────────┴────────────────┴─────────────────────────────────┘
  Emulator Hub running at localhost:4400
  Other reserved ports: 4500, 9150

Issues? Report them at https://github.com/firebase/firebase-tools/issues
```

**What this does:**
- **Auth Emulator** on port 9099 - Test authentication without real accounts
- **Firestore Emulator** on port 8080 - Local database with test data
- **Emulator UI** on port 4000 - Visual debugger for auth and data

**Emulator UI:** Open http://localhost:4000 to view:
- Authentication: See all test users and sessions
- Firestore: Browse collections, documents, and query data
- Logs: Debug Firebase operations

#### Configure App to Use Emulator

The app automatically connects to the emulator when it's running. The test setup files configure the emulator endpoints:

```typescript
// tests/setup/vitest.setup.ts (already configured)
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
```

For the **development app** to use the emulator, update your Firebase initialization to detect the emulator (optional - see [src/config/firebase.ts](src/config/firebase.ts) for emulator connection logic).

---

## Populating Test Data Locally

### Method 1: Use Test Data Reset Script (Fastest)

Reset the emulator database to predefined test data:

```bash
npm run test:reset-data
```

**What this does:**
- Clears all existing data in the Firestore emulator
- Creates 3 test users:
  - `admin@boletapp.test` (0 transactions)
  - `test-user-1@boletapp.test` (10 transactions)
  - `test-user-2@boletapp.test` (8 transactions)
- Populates with 18 sample transactions spanning multiple categories

**Use case:** Quick setup for testing workflows with realistic data

**⚠️ Prerequisite:** Firebase emulator must be running (`npm run emulators`)

---

### Method 2: View Current Test Data

Check what data is currently in the emulator:

```bash
npm run test:view-data
```

**What this does:**
- Displays all users and their transaction counts
- Shows sample transactions for each user
- Useful for debugging and verification

---

### Method 3: Manual Data Entry

1. Start the app (`npm run dev`) and emulator (`npm run emulators`)
2. Sign in with Google (or create test account in emulator)
3. Use the app's **Scan** or **Edit** views to create transactions manually
4. Data persists in the emulator (survives app restarts)

**Use case:** Testing specific transaction scenarios or edge cases

---

### Method 4: Import/Export Emulator Data

The emulator can persist data between sessions:

**Export current emulator data:**
```bash
firebase emulators:export ./emulator-data
```

**Import previously exported data:**
```bash
firebase emulators:start --import=./emulator-data
```

**Auto-export on exit:**
```bash
npm run emulators  # Already configured with --export-on-exit
```

**Use case:** Save a specific dataset and restore it later

---

## Testing the App Locally

### Run All Tests

```bash
npm run test:all
```

**What this runs:**
1. **Unit tests** (Vitest) - Pure functions and services (~400ms)
2. **Integration tests** (React Testing Library) - Component rendering (~500ms)
3. **E2E tests** (Playwright) - Full user workflows (~60s)

**Total time:** ~1-2 minutes

---

### Run Individual Test Suites

**Unit tests only (fastest):**
```bash
npm run test:unit
```

**Integration tests only:**
```bash
npm run test:integration
```

**E2E tests only:**
```bash
npm run test:e2e
```

**Interactive test mode (watches for changes):**
```bash
npm run test  # Vitest watch mode
```

---

### Generate Code Coverage Report

```bash
npm run test:coverage
```

**What this does:**
- Runs unit and integration tests with coverage tracking
- Generates HTML report at `coverage/index.html`
- Shows coverage % for statements, branches, functions, and lines

**View the report:**
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

**Coverage Thresholds (Epic 3):**
- Lines: 45%
- Branches: 30%
- Functions: 25%
- Statements: 40%

Tests will fail if coverage drops below these thresholds.

---

### Run Accessibility Tests (Epic 3)

```bash
npm run test:accessibility
```

**What this does:**
- Runs 16 E2E accessibility tests using @axe-core/playwright
- Tests WCAG 2.1 Level AA compliance on all 6 major views
- Validates keyboard navigation and ARIA labels
- Requires Firebase emulator running for authenticated tests

**Prerequisite:** Create test user for authenticated views:
```bash
npm run emulators  # In terminal 1
npm run test:create-user  # In terminal 2 (one-time setup)
```

---

### Run Lighthouse Performance Audits (Epic 3)

```bash
npm run test:lighthouse
```

**What this does:**
- Runs Lighthouse CI audits on Login + 5 authenticated views
- Measures Performance, Accessibility, Best Practices, SEO scores
- Generates HTML reports in `lighthouse-reports/`

**Note:** Lighthouse tests run in "warn" mode - they report but don't fail CI.

---

### Check Bundle Size (Epic 3)

```bash
npm run build && npm run check:bundle
```

**What this does:**
- Builds production bundle
- Checks if bundle size exceeds 700KB threshold
- Current baseline: ~637KB
- Warns (but doesn't fail) if threshold exceeded

---

## Common Development Tasks

### Build for Production

```bash
npm run build
```

**What this does:**
- TypeScript type checking (`tsc`)
- Vite production build (optimized, minified)
- Outputs to `dist/` folder (~624KB)

**Expected output:**
```
✓ built in 3.5s
dist/index.html                   0.50 kB
dist/assets/index-[hash].css     15.23 kB
dist/assets/index-[hash].js     608.54 kB
```

---

### Preview Production Build Locally

```bash
npm run preview
```

**What this does:**
- Serves the production build at http://localhost:4175
- Tests the built version before deploying

---

### Type Checking Only

```bash
npm run type-check
```

**What this does:**
- Runs TypeScript compiler without emitting files
- Validates all type definitions
- Useful for CI/CD pipelines

---

### Deploy to Production

```bash
npm run deploy
```

**What this does:**
1. Builds the production version
2. Deploys to Firebase Hosting
3. Updates https://boletapp-d609f.web.app

**⚠️ Warning:** This deploys to **production**. Test thoroughly in local/preview first.

---

## Troubleshooting

### Issue: "Port 5174 already in use"

**Solution 1:** Kill the process using port 5174:
```bash
# Find the process
lsof -i :5174  # macOS/Linux
netstat -ano | findstr :5174  # Windows

# Kill it
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Solution 2:** Change the port in [vite.config.ts](vite.config.ts):
```typescript
server: {
  port: 5175,  // Use a different port
}
```

---

### Issue: "Firebase emulator fails to start"

**Common causes:**
1. **Ports already in use** (4000, 4400, 8080, 9099)
2. **Java not installed** (required for Firestore emulator)

**Solution for ports in use:**
```bash
# Check port 8080
lsof -i :8080

# Kill the process or change emulator ports in firebase.json
```

**Solution for Java missing:**
```bash
# Install Java JDK 11+
# macOS: brew install openjdk@11
# Ubuntu: sudo apt install openjdk-11-jdk
# Windows: Download from https://www.oracle.com/java/technologies/downloads/
```

---

### Issue: "Coverage command fails"

**Solution:** This has been fixed in Story 2.3. Ensure you have the latest [vite.config.ts](vite.config.ts) with E2E test exclusion:

```typescript
test: {
  exclude: [
    '**/tests/e2e/**', // Exclude Playwright E2E tests
    // ... other exclusions
  ],
}
```

If the issue persists, pull the latest changes:
```bash
git pull origin main
npm install
```

---

### Issue: "API keys not working"

**Symptoms:**
- Firebase authentication fails
- Gemini receipt scanning returns errors
- Console shows "API key not valid" errors

**Solution:**
1. Verify `.env` file exists in project root
2. Check that all `VITE_*` variables are set correctly
3. Restart the dev server (`npm run dev`) after changing `.env`
4. Verify API keys are active in Firebase Console / Google AI Studio

**Debugging:**
```javascript
// Add to src/config/firebase.ts temporarily
console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY);
```

---

### Issue: "E2E tests fail to start"

**Symptoms:**
- `npm run test:e2e` hangs or errors
- Playwright can't connect to localhost:5174

**Solution:**
1. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

2. **Ensure dev server is running:**
   - Playwright auto-starts the dev server, but if it fails, start manually:
     ```bash
     npm run dev  # Terminal 1
     npm run test:e2e  # Terminal 2
     ```

3. **Check playwright.config.ts webServer settings:**
   ```typescript
   webServer: {
     command: 'npm run dev',
     url: 'http://localhost:5174',
     reuseExistingServer: !process.env.CI,
   }
   ```

---

## File Structure for Local Development

```
boletapp/
├── src/                  # Application source code
│   ├── config/          # Firebase, Gemini config
│   ├── types/           # TypeScript interfaces
│   ├── services/        # API integrations
│   ├── hooks/           # React hooks
│   ├── utils/           # Pure utility functions
│   ├── components/      # Reusable UI components
│   └── views/           # Page-level components
├── tests/               # Test files
│   ├── unit/           # Vitest unit tests
│   ├── integration/    # React Testing Library tests
│   ├── e2e/            # Playwright E2E tests
│   └── setup/          # Test configuration
├── scripts/             # Utility scripts
│   ├── reset-test-data.ts    # Reset emulator data
│   ├── view-emulator-data.ts # View emulator data
│   ├── create-test-user.ts   # Create test user for E2E auth (Epic 3)
│   ├── check-bundle-size.sh  # Bundle size threshold checker (Epic 3)
│   └── lighthouse-auth.js    # Lighthouse auth helper (Epic 3)
├── docs/                # Documentation
├── public/              # Static assets
├── dist/                # Production build output (generated)
├── coverage/            # Test coverage reports (generated)
├── .env                 # Environment variables (DO NOT COMMIT)
├── vite.config.ts       # Vite + Vitest configuration
├── playwright.config.ts # Playwright E2E configuration
├── firebase.json        # Firebase Hosting + Emulator config
├── firestore.rules      # Firestore security rules
├── lighthouserc.json    # Lighthouse CI configuration (Epic 3)
├── CONTRIBUTING.md      # Contribution guidelines with coverage requirements (Epic 3)
└── package.json         # Dependencies and scripts
```

---

## Useful NPM Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| **Development** |||
| `npm run dev` | `vite` | Start dev server (port 5174) |
| `npm run preview` | `vite preview` | Preview production build (port 4175) |
| `npm run type-check` | `tsc --noEmit` | TypeScript validation |
| **Testing** |||
| `npm run test` | `vitest` | Interactive test mode (watch) |
| `npm run test:unit` | `vitest run tests/unit` | Run unit tests |
| `npm run test:integration` | `vitest run tests/integration` | Run integration tests |
| `npm run test:e2e` | `playwright test` | Run E2E tests (28 tests) |
| `npm run test:all` | Sequential all tests | Run all test suites |
| `npm run test:coverage` | `vitest run --coverage` | Generate coverage report with thresholds |
| **Quality Gates (Epic 3)** |||
| `npm run test:lighthouse` | `playwright test tests/e2e/lighthouse.spec.ts` | Run Lighthouse performance audits |
| `npm run test:accessibility` | `playwright test tests/e2e/accessibility.spec.ts` | Run accessibility tests (16 tests) |
| `npm run test:create-user` | `tsx scripts/create-test-user.ts` | Create test user for E2E auth |
| `npm run check:bundle` | `scripts/check-bundle-size.sh` | Check bundle size (<700KB threshold) |
| **Emulator** |||
| `npm run emulators` | `firebase emulators:start` | Start Firebase emulator |
| `npm run test:reset-data` | `tsx scripts/reset-test-data.ts` | Reset test data |
| `npm run test:view-data` | `tsx scripts/view-emulator-data.ts` | View emulator data |
| **Production** |||
| `npm run build` | `tsc && vite build` | Build for production |
| `npm run deploy` | `npm run build && firebase deploy` | Deploy to Firebase Hosting |

---

## Next Steps

After getting the app running locally:

1. **Explore the codebase:** Read [docs/architecture/architecture.md](docs/architecture/architecture.md) for system overview
2. **Run tests:** Verify everything works with `npm run test:all`
3. **Read test strategy:** See [docs/testing/testing-guide.md](docs/testing/testing-guide.md) for writing tests
4. **Check documentation:** Browse [docs/index.md](docs/index.md) for complete doc index
5. **Read contribution guidelines:** See [CONTRIBUTING.md](CONTRIBUTING.md) for coverage requirements
6. **Start developing:** Pick a story from [docs/planning/epics.md](docs/planning/epics.md)

---

## Additional Resources

- **Architecture Documentation:** [docs/architecture/architecture.md](docs/architecture/architecture.md)
- **Development Guide:** [docs/development/development-guide.md](docs/development/development-guide.md)
- **Testing Guide:** [docs/testing/testing-guide.md](docs/testing/testing-guide.md)
- **Test Environment Setup:** [docs/testing/test-environment.md](docs/testing/test-environment.md)
- **Deployment Guide:** [docs/development/deployment-guide.md](docs/development/deployment-guide.md)
- **Component Inventory:** [docs/development/component-inventory.md](docs/development/component-inventory.md)
- **CI/CD Pipeline:** [docs/ci-cd/README.md](docs/ci-cd/README.md)
- **Performance Baselines:** [docs/performance/performance-baselines.md](docs/performance/performance-baselines.md) (Epic 3)
- **Contribution Guidelines:** [CONTRIBUTING.md](CONTRIBUTING.md) (Epic 3)

**Live Production App:** https://boletapp-d609f.web.app

---

**Questions or Issues?**
- Check [docs/index.md](docs/index.md) for comprehensive documentation
- Review troubleshooting section above
- Check GitHub issues: https://github.com/Brownbull/gmni_boletapp/issues

**Happy coding! 🚀**
