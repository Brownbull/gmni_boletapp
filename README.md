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
