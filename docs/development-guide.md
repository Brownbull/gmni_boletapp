# Development Guide - Boletapp

## Overview

Boletapp is a single-file Progressive Web Application (PWA) that requires minimal setup. The entire application is contained in `main.tsx` and runs directly in modern browsers without a build step.

## Prerequisites

### Required

- **Modern Web Browser** with ES6+ support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Firebase Account** - Free tier is sufficient for development
- **Google Gemini API Key** - Required for AI receipt scanning functionality

### Recommended

- **Local Development Server** - For testing PWA features and avoiding CORS issues
- **Firebase CLI** - For deployment and testing (optional)

## Local Setup

### 1. Configure Firebase

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Register a web app and copy the configuration object
3. Open `/home/khujta/projects/bmad/boletapp/main.tsx` and locate the configuration section (lines 30-37)
4. Replace the placeholder values with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Enable Firebase Services

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

### 3. Add Gemini API Key

1. Obtain a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open `main.tsx` and locate line 40
3. Replace the empty string with your API key:

```javascript
const GEMINI_API_KEY = "your_gemini_api_key_here";
```

**Note:** The app uses the `gemini-2.5-flash-preview-09-2025` model by default (line 41). Update if a different model is preferred.

## Running the Application

### Option 1: Direct Browser Open

1. Open `main.tsx` directly in your browser
2. Accept any file:// protocol warnings
3. Note: Some features (like camera access) may be limited

### Option 2: Local Development Server (Recommended)

#### Using Python

```bash
cd /home/khujta/projects/bmad/boletapp
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000/main.tsx`

#### Using Node.js (http-server)

```bash
npm install -g http-server
cd /home/khujta/projects/bmad/boletapp
http-server -p 8000
```

Then navigate to `http://localhost:8000/main.tsx`

#### Using Live Server (VS Code Extension)

1. Install the "Live Server" extension
2. Right-click on `main.tsx`
3. Select "Open with Live Server"

## Build Process

**No build process is required.** Boletapp is designed as a single-file application that runs directly in the browser with embedded dependencies loaded via CDN imports.

### Dependencies

All dependencies are loaded at runtime:
- **React 18** - UI framework (via CDN)
- **Firebase SDK** - Auth and Firestore (via CDN)
- **Lucide React** - Icon library (via CDN)

No package.json, webpack, or bundler configuration is needed.

## Development Workflow

### Making Changes

1. Edit `main.tsx` directly
2. Save the file
3. Refresh the browser to see changes
4. Check browser console for errors

### Common Development Tasks

#### Adding a New Component

Components are defined as functions within `main.tsx`. Add your component function anywhere between lines 159-620.

```javascript
const MyNewComponent = ({ prop1, prop2 }) => {
    return <div>Your JSX here</div>;
};
```

#### Adding a New View

1. Add a new view state to the `view` useState hook
2. Create a new section in the main render method (lines 502-615)
3. Add navigation logic in the `Nav` component or header buttons

#### Modifying Firestore Schema

Update the transaction structure in:
- `saveTransaction` function (lines 393-402)
- `onSnapshot` callback (lines 316-335)
- `currentTransaction` state management

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

This application does not use traditional environment variables. All configuration is hardcoded in `main.tsx`:

- `firebaseConfig` (lines 30-37) - Firebase project credentials
- `GEMINI_API_KEY` (line 40) - Google Gemini API key
- `GEMINI_MODEL` (line 41) - AI model identifier
- `STORE_CATEGORIES` (lines 44-48) - Available store categories
- `ITEMS_PER_PAGE` (line 50) - Pagination size

## Security Considerations

### API Key Exposure

**Warning:** API keys are visible in the source code. For production:

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
