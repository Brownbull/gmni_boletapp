# API Contracts - Boletapp

## Overview

Boletapp integrates with three external APIs to provide authentication, data persistence, and AI-powered receipt analysis. This document details the contracts, request/response formats, and error handling for each integration.

---

## Firebase Authentication API

### Purpose
Handles user authentication and session management using Google Sign-In (OAuth 2.0).

### SDK Integration

**Provider:** Firebase Auth SDK (v10.x)
**Module:** `firebase/auth`
**Initialization:** Lines 11-16, 300

### Authentication Methods

#### Google Sign-In (OAuth Popup)

**Implementation:** Lines 337-345

```javascript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(services.auth, provider);
};
```

**Request Flow:**
1. User clicks "Sign in with Google" button
2. OAuth popup window opens
3. User selects Google account and grants permissions
4. Popup closes, Firebase auth token received
5. `onAuthStateChanged` listener fires with user object

**Response Object:**

```typescript
interface User {
    uid: string;              // Unique user identifier (e.g., "abc123...")
    email: string;            // User's email address
    displayName: string;      // User's full name
    photoURL: string;         // Profile picture URL
    emailVerified: boolean;   // Email verification status
    providerData: Array<{     // OAuth provider info
        providerId: string;   // "google.com"
        uid: string;          // Google user ID
    }>;
}
```

**Error Handling:**

| Error Code | Description | User Message |
|------------|-------------|--------------|
| `auth/popup-closed-by-user` | User closed OAuth popup | "Login cancelled" |
| `auth/network-request-failed` | Network error | "Network error, try again" |
| `auth/unauthorized-domain` | Domain not whitelisted in Firebase Console | "Login failed: unauthorized domain" |
| `auth/operation-not-allowed` | Google sign-in not enabled | "Google sign-in not configured" |

**Implementation:** Line 343

```javascript
catch (e) {
    alert("Login Failed: " + e.message);
}
```

#### Sign Out

**Implementation:** Lines 347-350

```javascript
import { signOut } from 'firebase/auth';

const handleLogout = async () => {
    await signOut(services.auth);
};
```

**Effect:**
- Clears Firebase auth token
- `onAuthStateChanged` listener fires with `null`
- User redirected to login screen

#### Session Persistence

**Implementation:** Lines 308

```javascript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, setUser);
```

**Behavior:**
- Automatically restores session on page refresh
- Token stored in browser's IndexedDB
- Token expires after 1 hour (auto-refreshed by SDK)

### Security Configuration

**Required Firebase Console Settings:**
1. Enable Google Sign-In provider
2. Add authorized domains (e.g., `localhost`, `yourdomain.com`)
3. Configure OAuth consent screen

---

## Firebase Firestore API

### Purpose
NoSQL document database for storing and syncing transaction data in real-time.

### SDK Integration

**Provider:** Firebase Firestore SDK (v10.x)
**Module:** `firebase/firestore`
**Initialization:** Lines 18-27, 301

### Operations

#### Create Transaction

**Method:** `addDoc()`
**Implementation:** Lines 398-399

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ref = collection(
    db,
    'artifacts', appId,
    'users', userId,
    'transactions'
);

await addDoc(ref, {
    merchant: "Walmart",
    date: "2025-11-20",
    total: 45000,
    category: "Supermarket",
    alias: "Walmart",
    items: [...],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
});
```

**Request:**
- **Path:** `/artifacts/{appId}/users/{userId}/transactions`
- **Body:** Transaction document (see Data Models)
- **Auth:** Requires valid Firebase ID token

**Response:**

```typescript
{
    id: string;  // Auto-generated document ID
}
```

**Errors:**

| Error Code | Description | Handling |
|------------|-------------|----------|
| `permission-denied` | Security rules reject write | Show "Permission denied" message |
| `unavailable` | Firestore service offline | Retry with exponential backoff |
| `invalid-argument` | Malformed document data | Validate data before write |

#### Read Transactions (Real-time)

**Method:** `onSnapshot()`
**Implementation:** Lines 316-335

```javascript
import { collection, onSnapshot } from 'firebase/firestore';

const q = collection(
    db,
    'artifacts', appId,
    'users', userId,
    'transactions'
);

const unsubscribe = onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    setTransactions(transactions);
});

// Cleanup on unmount
return unsubscribe;
```

**Request:**
- **Path:** `/artifacts/{appId}/users/{userId}/transactions`
- **Method:** WebSocket connection (real-time listener)
- **Auth:** Requires valid Firebase ID token

**Response:**

```typescript
interface QuerySnapshot {
    docs: Array<{
        id: string;
        data(): Transaction;
    }>;
    size: number;        // Total document count
    empty: boolean;      // True if no documents
}
```

**Behavior:**
- Initial snapshot contains all existing documents
- Subsequent snapshots fire on any data change (create, update, delete)
- Automatic reconnection on network failure

**Errors:**

| Error Code | Description | Handling |
|------------|-------------|----------|
| `permission-denied` | Security rules reject read | Redirect to login |
| `unavailable` | Firestore service offline | Show "Connecting..." indicator |

#### Update Transaction

**Method:** `updateDoc()`
**Implementation:** Line 399

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ref = doc(
    db,
    'artifacts', appId,
    'users', userId,
    'transactions', transactionId
);

await updateDoc(ref, {
    merchant: "Updated Name",
    total: 50000,
    updatedAt: serverTimestamp()
});
```

**Request:**
- **Path:** `/artifacts/{appId}/users/{userId}/transactions/{transactionId}`
- **Body:** Partial document (only fields to update)
- **Auth:** Requires valid Firebase ID token

**Response:** None (void promise)

**Errors:** Same as Create Transaction

#### Delete Transaction

**Method:** `deleteDoc()`
**Implementation:** Lines 404-409

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

if (!window.confirm("Delete?")) return;

const ref = doc(
    db,
    'artifacts', appId,
    'users', userId,
    'transactions', transactionId
);

await deleteDoc(ref);
```

**Request:**
- **Path:** `/artifacts/{appId}/users/{userId}/transactions/{transactionId}`
- **Auth:** Requires valid Firebase ID token

**Response:** None (void promise)

**Errors:** Same as Create Transaction

#### Bulk Delete (Wipe Database)

**Method:** `getDocs()` + `deleteDoc()`
**Implementation:** Lines 411-422

```javascript
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

const q = collection(
    db,
    'artifacts', appId,
    'users', userId,
    'transactions'
);

const snapshot = await getDocs(q);
await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
```

**Warning:** This operation is NOT atomic. If it fails mid-execution, some documents may remain.

### Firestore Timestamps

**Type:** `Timestamp` (Firestore native type)
**Conversion:**

```javascript
// Write: Use serverTimestamp()
createdAt: serverTimestamp()

// Read: Convert to Date
const date = firestoreTimestamp.toDate();

// Convert to ISO string
const isoDate = firestoreTimestamp.toDate().toISOString().split('T')[0];
```

**Implementation:** Lines 87, 324

---

## Google Gemini AI API

### Purpose
Analyzes receipt images using multimodal AI to extract structured transaction data.

### API Specification

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
**Model:** `gemini-2.5-flash-preview-09-2025` (configurable, line 41)
**Authentication:** API key in query parameter
**Method:** POST
**Content-Type:** `application/json`

### Request Format

**Implementation:** Lines 137-156

```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        contents: [
            {
                parts: [
                    { text: promptString },
                    ...imageParts
                ]
            }
        ]
    })
});
```

### Request Body Structure

```typescript
interface GeminiRequest {
    contents: Array<{
        parts: Array<{
            text?: string;           // Text prompt
            inlineData?: {           // Image data
                mimeType: string;    // e.g., "image/jpeg"
                data: string;        // Base64 encoded image
            };
        }>;
    }>;
}
```

**Image Encoding:** Lines 140-148

```javascript
const imageParts = images.map(base64String => {
    const match = base64String.match(/^data:(.+);base64,(.+)$/);
    return {
        inlineData: {
            mimeType: match ? match[1] : 'image/jpeg',
            data: match ? match[2] : base64String
        }
    };
});
```

**Supported Formats:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`) - first frame only

**Size Limits:**
- Max image size: 4MB per image
- Max images per request: 16
- Recommended: 1-3 images for best accuracy

### Prompt Engineering

**Implementation:** Lines 150-151

```javascript
const todayStr = new Date().toISOString().split('T')[0];
const prompt = `Analyze receipt. Context: ${currency}. Today: ${todayStr}. Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas). Extract: merchant (store name), date (YYYY-MM-DD), total, category (one of: Supermarket, Restaurant, Bakery, Butcher, Bazaar, Veterinary, PetShop, Medical, Pharmacy, Technology, StreetVendor, Transport, Services, Other). Items: name, price, category (Fresh Food, Pantry, Drinks, Household, Personal Care, Pets, Electronics, Apparel, Other), subcategory. If multiple dates, choose closest to today.`;
```

**Prompt Components:**
1. **Context:** Currency and current date for intelligent parsing
2. **Format Constraints:** Integers only, specific date format
3. **Schema Definition:** Expected JSON structure
4. **Fallback Logic:** Date selection rules for ambiguous receipts

### Response Format

**Success Response:**

```typescript
interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;  // JSON string with extracted data
            }>;
        };
        finishReason: string;  // "STOP" | "MAX_TOKENS" | "SAFETY"
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}
```

**Expected Data Schema (embedded in response text):**

```typescript
interface ExtractedReceipt {
    merchant: string;              // "Walmart Supercenter"
    date: string;                  // "2025-11-20"
    total: number;                 // 45600 (integer, no decimals)
    category: string;              // "Supermarket"
    items?: Array<{
        name: string;              // "Organic Milk 1L"
        price: number;             // 3500 (integer)
        category: string;          // "Fresh Food"
        subcategory?: string;      // "Dairy"
    }>;
}
```

**Parsing Implementation:** Lines 154-156

```javascript
const json = await res.json();
if (!json.candidates) throw new Error("API Error");
return JSON.parse(cleanJson(json.candidates[0].content.parts[0].text));
```

**JSON Extraction (cleanJson utility):** Lines 72-77

```javascript
const cleanJson = (text) => {
    if (!text) return "{}";
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return (start !== -1 && end !== -1)
        ? text.substring(start, end + 1)
        : "{}";
};
```

**Why JSON Cleaning is Needed:**
- Gemini sometimes adds markdown formatting (e.g., ` ```json ... ``` `)
- Extra explanatory text before/after JSON
- `cleanJson` extracts only the JSON object

### Error Handling

**HTTP Status Codes:**

| Status | Meaning | Handling |
|--------|---------|----------|
| 200 | Success | Parse response |
| 400 | Invalid request (bad image format, missing key) | Show "Invalid image" error |
| 401 | Invalid API key | Show "API key error" |
| 403 | Quota exceeded or API disabled | Show "Service unavailable" |
| 429 | Rate limit exceeded | Show "Too many requests, wait" |
| 500 | Gemini service error | Show "Service error, retry" |

**Implementation:** Lines 387-390

```javascript
catch (e) {
    alert("Scan failed: " + e.message);
    setScanError("Failed: " + e.message);
}
```

**Common Error Scenarios:**

1. **Empty API Key:**
   ```javascript
   const GEMINI_API_KEY = "";  // Line 40
   // Result: 400 Bad Request
   ```

2. **Invalid Image Format:**
   ```javascript
   // User uploads .pdf or .txt file
   // Result: 400 Bad Request
   ```

3. **Quota Exceeded:**
   ```javascript
   // Free tier: 60 requests/minute
   // Result: 429 Rate Limit
   ```

4. **Malformed JSON Response:**
   ```javascript
   // Gemini returns non-JSON text
   // Result: JSON.parse() throws SyntaxError
   // Fallback: cleanJson returns "{}", causes validation error
   ```

### Rate Limits & Quotas

**Free Tier (No Credit Card):**
- 60 requests per minute
- 1,500 requests per day
- No cost

**Paid Tier (with Billing):**
- Rate limits lifted
- Pay per request (~$0.002 per image)

**Quota Monitoring:**
- Check [Google AI Studio](https://makersuite.google.com/)
- Enable billing alerts in Google Cloud Console

### Response Time

**Typical Latency:**
- Single image: 2-4 seconds
- Multiple images: 4-8 seconds
- Network-dependent (user's connection + API processing)

**UI Handling:** Lines 368-390
- Shows loading spinner during analysis
- Disables scan button to prevent duplicate requests
- Error state displays on failure

---

## API Error Handling Strategy

### Network Errors

```javascript
try {
    await apiCall();
} catch (error) {
    if (error.message.includes('network')) {
        // Retry logic
    } else {
        // Show error to user
        alert("Operation failed: " + error.message);
    }
}
```

### Authentication Errors

```javascript
// Firebase Auth automatically handles:
// - Token refresh
// - Session restoration
// - Network reconnection

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Redirect to login
        setUser(null);
    } else {
        // User authenticated
        setUser(user);
    }
});
```

### Data Validation

All external API data is sanitized before use:

1. **Numbers:** `parseStrictNumber()` ensures integers
2. **Dates:** `getSafeDate()` ensures valid ISO format
3. **Strings:** Default values for null/undefined
4. **Arrays:** Array.isArray() checks before mapping

**Implementation:** Lines 320-328 (Firestore), 371-384 (Gemini)

---

## API Dependencies

### Required Environment Variables

```javascript
// Firebase Configuration (lines 30-37)
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

// Gemini API Key (line 40)
const GEMINI_API_KEY = "...";
```

### SDK Versions

- **Firebase SDK:** v10.x (loaded via CDN)
- **React:** v18.x (loaded via CDN)
- **Lucide React:** Latest (loaded via CDN)

### CORS Configuration

**Firebase:** CORS handled automatically by SDK
**Gemini:** Public API, no CORS configuration needed

---

## Testing APIs

### Firebase Auth Testing

```javascript
// Test login
handleGoogleLogin();

// Verify user object
console.log(user);

// Test logout
handleLogout();
```

### Firestore Testing

```javascript
// Test write
saveTransaction();

// Test read
console.log(transactions);

// Test delete
deleteTransaction(transactionId);
```

### Gemini Testing

```javascript
// Test with sample receipt image
const testImage = "data:image/jpeg;base64,...";
const result = await analyzeWithGemini([testImage], "CLP");
console.log(result);
```

**Mock Response:**
```json
{
    "merchant": "Test Store",
    "date": "2025-11-20",
    "total": 10000,
    "category": "Supermarket",
    "items": [
        {
            "name": "Test Item",
            "price": 10000,
            "category": "Other",
            "subcategory": "Test"
        }
    ]
}
```

---

---

## Firebase Cloud Functions

### Function Inventory

| Function | Type | Location | Purpose |
|----------|------|----------|---------|
| `analyzeReceipt` | HTTPS Callable | `functions/src/analyzeReceipt.ts` | Receipt OCR, image processing, storage |
| `onTransactionDeleted` | Firestore Trigger | `functions/src/deleteTransactionImages.ts` | Cascade delete images |

---

### analyzeReceipt Function

**Purpose:** Server-side Gemini API proxy to protect API key and process images
**Endpoint:** `https://us-central1-{projectId}.cloudfunctions.net/analyzeReceipt`
**Method:** Firebase Callable (`httpsCallable`)
**Model:** Gemini 2.0 Flash (`gemini-2.0-flash`)

#### Request Contract

```typescript
interface AnalyzeReceiptRequest {
    images: string[];              // Base64 images OR URLs (for re-scan)
    currency?: string;             // Optional for V3 (auto-detects from receipt)
    receiptType?: ReceiptType;     // 'auto' | 'receipt' | 'invoice' | 'statement'
    promptContext?: 'production' | 'development';
    isRescan?: boolean;            // True when re-scanning stored images (Story 14.15b)
}

type ReceiptType = 'auto' | 'receipt' | 'invoice' | 'statement' | 'ticket';
```

#### Response Contract

```typescript
interface AnalyzeReceiptResponse {
    // Transaction data (from Gemini)
    transactionId: string;         // Pre-generated Firestore document ID
    merchant: string;              // Store name
    date: string;                  // YYYY-MM-DD format
    total: number;                 // Integer (CLP) or cents (USD)
    category: string;              // Store category
    items: Array<{
        name: string;
        price: number;
        category?: string;
        quantity?: number;
        subcategory?: string;
    }>;

    // V3 extended fields (auto-detected)
    time?: string;                 // HH:MM format
    currency?: string;             // Detected currency code (e.g., "CLP", "USD")
    country?: string;              // Country name or null
    city?: string;                 // City name or null
    metadata?: {
        receiptType?: string;      // Detected document type
        confidence?: number;       // 0.0-1.0 confidence score
    };

    // Storage URLs
    imageUrls?: string[];          // Full-size image Firebase Storage URLs
    thumbnailUrl?: string;         // Thumbnail URL (120x160)

    // Tracking fields (Story 9.1)
    promptVersion: string;         // e.g., "3.0.0"
    merchantSource: 'scan';        // Always 'scan' for new receipts
    receiptType?: string;          // Flattened from metadata
}
```

#### Security & Validation

| Check | Requirement | Error Code |
|-------|-------------|------------|
| Authentication | `context.auth` must exist | `unauthenticated` |
| Rate Limit | Max 10 requests/minute per user | `resource-exhausted` |
| Image Count | Max 5 images per request | `invalid-argument` |
| Image Size | Max 10MB per image | `invalid-argument` |
| Image Format | JPEG, PNG, WebP, HEIC, HEIF | `invalid-argument` |

#### Processing Pipeline

```
Request received
    │
    ├─► 1. Validate authentication
    ├─► 2. Check rate limit (10/min per user)
    ├─► 3. Validate image count and size
    │
    ├─► 4. Pre-process images
    │      ├─► If isRescan: fetch from URLs
    │      └─► Else: decode base64, resize (1200x1600), compress (JPEG 80%)
    │
    ├─► 5. Call Gemini 2.0 Flash API
    │      ├─► Build prompt from prompts library
    │      └─► Send optimized images
    │
    ├─► 6. Parse JSON response
    │
    ├─► 7. Upload to Firebase Storage (skip for re-scans)
    │      ├─► Full-size images
    │      └─► Generate thumbnail (120x160)
    │
    └─► 8. Return combined response
```

#### Error Handling

| Scenario | Error Code | Message |
|----------|------------|---------|
| Not logged in | `unauthenticated` | "Must be logged in to analyze receipts" |
| Rate limited | `resource-exhausted` | "Rate limit exceeded. Maximum 10 requests per minute." |
| No images | `invalid-argument` | "images array is required and must not be empty" |
| Image too large | `invalid-argument` | "Image X is too large (YMB). Maximum size is 10MB" |
| Invalid format | `invalid-argument` | "Unsupported image format: X" |
| Gemini failure | `internal` | "Failed to analyze receipt. Please try again or enter manually." |

---

### onTransactionDeleted Function

**Purpose:** Cascade delete receipt images when transaction is deleted
**Trigger:** Firestore `onDelete` at `artifacts/{appId}/users/{userId}/transactions/{transactionId}`
**Location:** `functions/src/deleteTransactionImages.ts`

#### Trigger Contract

```typescript
// Automatically triggered when document is deleted
// Path params extracted from context.params
interface TriggerParams {
    appId: string;
    userId: string;
    transactionId: string;
}
```

#### Behavior

1. Transaction document deleted → trigger fires
2. Extract `userId` and `transactionId` from path
3. Delete Storage folder: `users/{userId}/receipts/{transactionId}/`
4. Log completion (errors don't propagate - orphans acceptable)

#### Storage Cleanup

```
Deleted files:
├── users/{userId}/receipts/{transactionId}/image-0.jpg
├── users/{userId}/receipts/{transactionId}/image-1.jpg
├── users/{userId}/receipts/{transactionId}/image-2.jpg
└── users/{userId}/receipts/{transactionId}/thumbnail.jpg
```

**Error Policy:** Storage errors are logged but don't fail. Orphaned images can be cleaned up by maintenance job.

---

### Supporting Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `imageProcessing.ts` | `functions/src/` | Sharp-based resize, compress, EXIF strip, thumbnail |
| `storageService.ts` | `functions/src/` | Firebase Storage upload/delete operations |
| `prompts/` | `functions/src/prompts/` | Versioned prompt library (V1, V2, V3) |

#### Prompt System

```typescript
// Get active prompt based on context
const prompt = buildPrompt({
    currency: 'CLP',           // Optional for V3
    receiptType: 'auto',       // Document type hint
    context: 'production',     // 'production' or 'development'
});

// Prompt versions available
const versions = ['1.0.0', '2.0.0', '3.0.0'];  // V3 is current
```

---

## Data Caching Layer

### React Query Integration (Story 14.29)

**Purpose:** Cache-first data loading with React Query alongside Firestore real-time subscriptions

**Implementation:** `src/hooks/useFirestoreSubscription.ts`

**Pattern:**
```typescript
// Hook usage in components
const { data, isLoading, error } = useFirestoreSubscription<Transaction[]>(
    queryKey,
    subscribeFn,
    { enabled: true }
);
```

**Cache Behavior:**
- **On navigation:** Returns cached data immediately (no loading spinner)
- **Background sync:** Firestore listener updates cache when data changes
- **Cache duration:** 5 min staleTime, 30 min gcTime

**DevTools:**
- React Query DevTools (TanStack logo) visible in development only
- Guarded by `import.meta.env.DEV`
- Excluded from production builds via tree-shaking

**Reference:** `docs/architecture/react-query-caching.md`

---

**Generated by BMAD Document Project Workflow**
*Last Updated: 2026-01-15 (Epic 14c - Household Sharing + Cloud Functions)*
