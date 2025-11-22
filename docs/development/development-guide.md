# Development Guide - Boletapp

## Overview

Boletapp is a modular Progressive Web Application (PWA) built with React, TypeScript, and Vite. The codebase is organized into components, views, hooks, and services for maintainability.

## Prerequisites

### Required

- **Node.js 18+** and **npm 9+**
- **Git** - For version control
- **Firebase Account** - Free tier is sufficient for development
- **Google Gemini API Key** - Required for AI receipt scanning functionality

### Recommended

- **VS Code** - Recommended IDE with TypeScript support
- **Firebase CLI** - For deployment (`npm install -g firebase-tools`)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Brownbull/gmni_boletapp.git
cd gmni_boletapp
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Enable Firebase Services

#### Firestore Database

1. Navigate to **Build > Firestore Database** in Firebase Console
2. Click **Create Database**
3. Choose your region
4. Start in **Test Mode** for development, or use these production security rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Firebase Authentication

1. Navigate to **Build > Authentication**
2. Click **Get Started**
3. Enable **Google** sign-in method
4. Configure OAuth consent screen and authorized domains

## Running the Application

### Development Server

```bash
npm run dev
```

Opens at http://localhost:5173 with Hot Module Replacement (HMR).

### Production Build

```bash
npm run build
npm run preview    # Preview at http://localhost:4175
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
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

## Development Workflow

### Making Changes

1. Edit source files in `src/`
2. Save changes - HMR updates browser automatically
3. Check browser console for errors
4. Run `npm run type-check` to verify types

### Adding a New Component

Create a new file in `src/components/`:

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
    prop1: string;
    prop2: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
    return <div>{prop1}: {prop2}</div>;
};
```

### Adding a New View

1. Create file in `src/views/`
2. Add routing in `App.tsx`
3. Update navigation component

## Git Workflow

### Daily Development

```bash
# Check status
git status

# Stage and commit changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin main
```

### Commit Message Format

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Pull Changes

```bash
git pull origin main
```

## Testing Approach

### Manual Browser Testing

Since there is no automated test suite, follow this testing checklist:

#### Authentication Flow
- [ ] Google sign-in works correctly
- [ ] User state persists on refresh
- [ ] Sign-out works and clears user data

#### Receipt Scanning
- [ ] Camera/file upload triggers correctly
- [ ] Multiple images can be added
- [ ] Gemini API returns structured data
- [ ] Error handling displays user-friendly messages

#### Data Entry
- [ ] Transactions can be created manually
- [ ] All fields save correctly
- [ ] Items can be added/edited/deleted
- [ ] Data validates properly (numbers, dates)

#### Analytics
- [ ] Charts render correctly
- [ ] Drill-down navigation works
- [ ] Filters apply correctly
- [ ] CSV export generates valid files

#### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (iOS and macOS)

### Testing with Mock Data

To test without scanning receipts:

1. Click the "+" button on the dashboard
2. Manually enter transaction details
3. Create multiple transactions with varying dates and categories
4. Test analytics and filtering features

### Error Boundary Testing

The app includes an ErrorBoundary component (lines 52-69) that catches React errors:

1. Intentionally cause an error (e.g., invalid data)
2. Verify the error screen displays
3. Confirm "Reload App" button works

## Debugging

### Common Issues

#### "Config Missing" Error
- Verify Firebase config is properly set in lines 30-37
- Check that all fields have valid values (not placeholder strings)

#### "API Error" on Scan
- Verify GEMINI_API_KEY is set (line 40)
- Check API quota in Google Cloud Console
- Verify network connectivity

#### Data Not Persisting
- Check Firebase Console for Firestore writes
- Verify security rules allow writes for authenticated users
- Check browser console for Firebase errors

### Browser Console

Monitor the browser console for:
- Firebase initialization status
- API call responses
- React component errors
- Network request failures

### Firebase Console Debugging

- **Authentication tab** - View signed-in users
- **Firestore tab** - Inspect database documents
- **Usage tab** - Monitor API quotas and costs

## Environment Variables

Configuration is managed via `.env` files:

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

Access in code via `import.meta.env.VITE_*`.

**Important:** Never commit `.env` - it's git-ignored. Use `.env.example` as template.

## Security Considerations

### API Key Security

The `.env` file keeps API keys out of source control. For additional production security:

1. Use Firebase App Check to restrict API usage
2. Set Firebase Security Rules to validate requests
3. Monitor usage in Google Cloud Console
4. Consider implementing a backend proxy for Gemini API calls

### User Data Privacy

- All user data is scoped by Firebase UID
- Firestore security rules prevent cross-user access
- No data is shared with third parties (except Firebase/Google infrastructure)

## Deployment

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Static Hosting

Upload `main.tsx` to any static hosting provider:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

Ensure HTTPS is enabled for PWA features to work correctly.

## Performance Optimization

### Current Optimizations

- Single-file architecture minimizes HTTP requests
- Firebase Firestore real-time sync reduces polling
- Pagination limits DOM rendering (20 items per page)
- Chart rendering uses native SVG (no heavy libraries)

### Future Optimization Opportunities

- Implement lazy loading for transaction history
- Add service worker for offline support
- Cache Firestore queries with persistence
- Optimize image compression before Gemini API calls

---

**Generated by BMAD Document Project Workflow**
*Date: 2025-11-20*
