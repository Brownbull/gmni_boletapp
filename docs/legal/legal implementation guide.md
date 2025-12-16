# Gastify Legal Implementation Guide

## Overview

This guide covers the practical implementation of privacy policy, terms of service, and consent flow for Gastify.

---

## 1. Required Pages/Routes

Add these routes to your app:

```typescript
// In your routing configuration
const routes = [
  // ... existing routes
  { path: '/privacy', component: PrivacyPolicyView },
  { path: '/terms', component: TermsOfServiceView },
];
```

---

## 2. Consent Flow Component

Add this consent modal that shows on first login:

```tsx
// src/components/ConsentModal.tsx
import React, { useState } from 'react';
import { CheckCircle, FileText, Shield } from 'lucide-react';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept, onDecline }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedStats, setAcceptedStats] = useState(true); // Optional, default true

  const canProceed = acceptedTerms && acceptedPrivacy;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Bienvenido a Gastify
          </h2>
          <p className="text-gray-600 mt-2">
            Antes de empezar, necesitamos tu consentimiento
          </p>
        </div>

        {/* Consent Items */}
        <div className="space-y-4 mb-6">
          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-gray-900">
                Acepto los{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  className="text-emerald-600 underline hover:text-emerald-700"
                >
                  Términos y Condiciones
                </a>
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Reglas de uso de la aplicación
              </p>
            </div>
          </label>

          {/* Privacy */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-gray-900">
                Acepto la{' '}
                <a 
                  href="/privacy" 
                  target="_blank" 
                  className="text-emerald-600 underline hover:text-emerald-700"
                >
                  Política de Privacidad
                </a>
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Cómo guardamos y protegemos tus datos
              </p>
            </div>
          </label>

          {/* Aggregated Stats (Optional) */}
          <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg">
            <input
              type="checkbox"
              checked={acceptedStats}
              onChange={(e) => setAcceptedStats(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-gray-900">
                Contribuir a estadísticas anónimas
              </span>
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                Opcional
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Ayuda a mejorar Gastify compartiendo datos agregados que no te identifican
              </p>
            </div>
          </label>
        </div>

        {/* Summary Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-emerald-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            En resumen:
          </h3>
          <ul className="text-sm text-emerald-800 space-y-1">
            <li>• Guardamos tus boletas de forma segura</li>
            <li>• No vendemos tus datos</li>
            <li>• Puedes borrar todo cuando quieras</li>
            <li>• Usamos IA de Google para escanear</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => onAccept()}
            disabled={!canProceed}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              canProceed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canProceed ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Comenzar a usar Gastify
              </span>
            ) : (
              'Acepta los términos para continuar'
            )}
          </button>
          
          <button
            onClick={onDecline}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            No acepto, cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 3. Storing Consent in Firestore

Add consent tracking to your user document:

```typescript
// src/types/user.ts
export interface UserConsent {
  termsAccepted: boolean;
  termsAcceptedAt: string; // ISO date
  termsVersion: string;
  privacyAccepted: boolean;
  privacyAcceptedAt: string;
  privacyVersion: string;
  statsOptIn: boolean; // For aggregated statistics
}

export interface UserSettings {
  // ... existing settings
  consent?: UserConsent;
}
```

```typescript
// src/services/consent.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

const CURRENT_TERMS_VERSION = '1.0';
const CURRENT_PRIVACY_VERSION = '1.0';

export async function checkUserConsent(
  user: User,
  db: Firestore,
  appId: string
): Promise<boolean> {
  const userDoc = await getDoc(
    doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'consent')
  );
  
  if (!userDoc.exists()) {
    return false;
  }
  
  const consent = userDoc.data() as UserConsent;
  
  // Check if consent is for current versions
  return (
    consent.termsAccepted &&
    consent.termsVersion === CURRENT_TERMS_VERSION &&
    consent.privacyAccepted &&
    consent.privacyVersion === CURRENT_PRIVACY_VERSION
  );
}

export async function saveUserConsent(
  user: User,
  db: Firestore,
  appId: string,
  statsOptIn: boolean
): Promise<void> {
  const consent: UserConsent = {
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: CURRENT_TERMS_VERSION,
    privacyAccepted: true,
    privacyAcceptedAt: new Date().toISOString(),
    privacyVersion: CURRENT_PRIVACY_VERSION,
    statsOptIn,
  };
  
  await setDoc(
    doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'consent'),
    consent
  );
}
```

---

## 4. Integration in App.tsx

```typescript
// In App.tsx
import { ConsentModal } from './components/ConsentModal';
import { checkUserConsent, saveUserConsent } from './services/consent';

function App() {
  const { user } = useAuth();
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Check consent after login
  useEffect(() => {
    if (user && !consentChecked) {
      checkUserConsent(user, db, APP_ID).then((hasConsent) => {
        setShowConsent(!hasConsent);
        setConsentChecked(true);
      });
    }
  }, [user, consentChecked]);

  const handleConsentAccept = async (statsOptIn: boolean) => {
    if (user) {
      await saveUserConsent(user, db, APP_ID, statsOptIn);
      setShowConsent(false);
    }
  };

  const handleConsentDecline = () => {
    // Sign out user
    signOut(auth);
    setShowConsent(false);
    setConsentChecked(false);
  };

  return (
    <>
      {/* ... your app content */}
      
      {showConsent && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}
    </>
  );
}
```

---

## 5. Footer Links

Add links in your navigation or settings:

```tsx
// In Nav.tsx or SettingsView.tsx
<div className="text-center text-sm text-gray-500 space-x-4">
  <a href="/privacy" className="hover:text-gray-700">
    Política de Privacidad
  </a>
  <span>•</span>
  <a href="/terms" className="hover:text-gray-700">
    Términos de Uso
  </a>
</div>
```

---

## 6. Aggregated Statistics Query Helper

When generating public statistics, use this helper to ensure privacy:

```typescript
// src/utils/aggregation.ts

interface AggregationResult {
  canPublish: boolean;
  reason?: string;
  data?: any;
}

const MIN_USERS_FOR_PUBLICATION = 30;
const MIN_DATAPOINTS_FOR_PUBLICATION = 100;

export function validateAggregation(
  uniqueUsers: number,
  dataPoints: number
): AggregationResult {
  if (uniqueUsers < MIN_USERS_FOR_PUBLICATION) {
    return {
      canPublish: false,
      reason: `Insufficient users: ${uniqueUsers} < ${MIN_USERS_FOR_PUBLICATION}`,
    };
  }
  
  if (dataPoints < MIN_DATAPOINTS_FOR_PUBLICATION) {
    return {
      canPublish: false,
      reason: `Insufficient data points: ${dataPoints} < ${MIN_DATAPOINTS_FOR_PUBLICATION}`,
    };
  }
  
  return { canPublish: true };
}

// Example usage for category spending report
export async function generateCategoryReport(
  db: Firestore,
  category: string,
  month: string
): Promise<AggregationResult> {
  // Query all transactions in category for month (across all users who opted in)
  const snapshot = await getDocs(
    query(
      collectionGroup(db, 'transactions'),
      where('category', '==', category),
      where('date', '>=', `${month}-01`),
      where('date', '<=', `${month}-31`)
    )
  );
  
  // Count unique users
  const uniqueUsers = new Set(
    snapshot.docs.map(doc => doc.ref.parent.parent?.id)
  ).size;
  
  const validation = validateAggregation(uniqueUsers, snapshot.size);
  
  if (!validation.canPublish) {
    return validation;
  }
  
  // Calculate aggregated stats
  const totals = snapshot.docs.map(doc => doc.data().total);
  const average = totals.reduce((a, b) => a + b, 0) / totals.length;
  
  return {
    canPublish: true,
    data: {
      category,
      month,
      averageTransaction: Math.round(average),
      transactionCount: snapshot.size,
      userCount: uniqueUsers, // Don't publish this externally
    },
  };
}
```

---

## 7. Checklist Before Launch

### Legal Documents
- [ ] Replace [FECHA] with actual date
- [ ] Replace [NOMBRE DE LA EMPRESA O PERSONA NATURAL] with your legal entity
- [ ] Replace [DIRECCIÓN EN CHILE] with your address
- [ ] Set up email addresses: privacidad@gastify.com, legal@gastify.com, soporte@gastify.com
- [ ] Have a Chilean lawyer review (recommended, ~$300-500 USD)

### Technical Implementation
- [ ] Add /privacy and /terms routes
- [ ] Implement ConsentModal component
- [ ] Add consent check on first login
- [ ] Store consent in Firestore
- [ ] Add footer links to legal pages
- [ ] Test consent flow end-to-end

### Google OAuth Requirements
- [ ] Add privacy policy URL to Google Cloud Console
- [ ] Add terms of service URL to Google Cloud Console
- [ ] Verify OAuth consent screen shows your policy links

### Data Handling
- [ ] Verify "Delete all data" functionality works completely
- [ ] Test data export (CSV) functionality
- [ ] Implement aggregation safeguards if publishing stats

---

## 8. Version Tracking

When you update legal documents, increment the version:

```typescript
// src/config/legal.ts
export const LEGAL_VERSIONS = {
  terms: '1.0',
  privacy: '1.0',
};

// When updating to 1.1, users will be prompted to re-accept
```

This ensures users re-consent when significant changes are made.