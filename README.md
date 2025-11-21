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
