# boletapp - Technical Specification

**Author:** Gabe
**Date:** 2025-11-29
**Project Level:** Quick-Flow Brownfield
**Change Type:** Infrastructure Epic (Image Storage)
**Development Context:** Epic 4.5 - Receipt Image Storage

---

## Context

### Available Documents

**Documents Loaded:**
- ✅ **docs/index.md** - Comprehensive documentation index (brownfield codebase map)
- ✅ **Epic 4 Retrospective** - Contains Epic 4.5 definition with architecture, business decisions, pricing model
- ✅ **Architecture documentation** - System design, 8 ADRs, data flow diagrams
- ✅ **Cloud Function source** - analyzeReceipt.ts with Gemini integration
- ✅ **Transaction types** - Current data model
- ✅ **Firestore service** - Current CRUD operations

**Key Context from Epic 4 Retrospective:**
- Epic 4.5 was defined during Epic 4 retrospective
- Core principle: **Scan = Image Storage** (unified operation)
- Architecture decision: Image compression in Cloud Function (consistent results)
- 4-tier subscription model with image retention policies defined
- Cost analysis completed (~$0.0026/user/month at scale)

### Project Stack

**Frontend (package.json):**

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.3.3 | Type-safe development |
| Vite | 5.4.0 | Build tool with HMR |
| Firebase | 10.14.1 | Auth, Firestore, Functions, Storage |
| Lucide React | 0.460.0 | Icon library |

**Testing Stack:**

| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 4.0.13 | Unit/Integration testing |
| Playwright | 1.56.1 | E2E testing |
| @testing-library/react | 16.3.0 | Component testing |
| @axe-core/playwright | 4.11.0 | Accessibility testing |

**Cloud Functions (functions/package.json):**
- firebase-functions
- @google/generative-ai (Gemini 2.0 Flash)

**Firebase Services in Use:**
- ✅ Firebase Auth (Google OAuth)
- ✅ Cloud Firestore (transaction storage)
- ✅ Cloud Functions (analyzeReceipt)
- ✅ Firebase Hosting (production deployment)
- ⬚ **Firebase Storage** (NOT YET USED - target of this epic)

### Existing Codebase Structure

**Architecture Pattern:** Modular SPA with 31 TypeScript files across 7 logical layers

```
src/
├── config/          # Configuration (3 files)
│   ├── constants.ts     # App constants, categories
│   ├── firebase.ts      # Firebase initialization
│   └── gemini.ts        # [REMOVED in Epic 4 - now uses Cloud Function]
├── types/           # TypeScript interfaces (2 files)
│   ├── transaction.ts   # Transaction, TransactionItem, StoreCategory
│   └── settings.ts      # Language, currency, theme types
├── services/        # External API integrations (2 files)
│   ├── firestore.ts     # Firestore CRUD operations
│   └── gemini.ts        # Cloud Function client wrapper
├── hooks/           # Custom React hooks (2 files)
│   ├── useAuth.ts       # Authentication state
│   └── useTransactions.ts  # Real-time Firestore sync
├── utils/           # Pure utility functions (7 files)
├── components/      # Reusable UI components (5 files)
├── views/           # Page components (7 files)
│   └── ScanView.tsx     # Receipt upload interface (key integration point)
├── App.tsx          # Main orchestrator
└── main.tsx         # Entry point

functions/
├── src/
│   ├── index.ts           # Cloud Functions entry point
│   └── analyzeReceipt.ts  # Gemini AI analysis (KEY MODIFICATION TARGET)
└── package.json
```

**Current Scan Flow (from analyzeReceipt.ts):**
```
User uploads image(s) → Cloud Function receives base64
                              ↓
                         Validates (size, count, MIME type)
                              ↓
                         Calls Gemini API
                              ↓
                         Returns parsed transaction JSON
                              ↓
                    Client saves to Firestore (NO image storage)
```

**Existing Code Patterns:**
- TypeScript strict mode
- Named exports (e.g., `export async function addTransaction()`)
- Async/await for all asynchronous operations
- Firebase Admin SDK in Cloud Functions
- Firebase Client SDK in React app
- Error handling with HttpsError in Cloud Functions

**Test Patterns:**
- Unit tests: `tests/unit/*.test.ts`
- Integration tests: `tests/integration/*.test.tsx`
- E2E tests: `tests/e2e/*.spec.ts`
- Firebase emulators for local testing

---

## The Change

### Problem Statement

Users currently scan receipts for AI-powered data extraction, but the original receipt images are discarded after processing. This creates several problems:

1. **No Verification** - Users cannot view the original receipt to verify extracted data accuracy
2. **No Audit Trail** - No visual record of expenses for personal or tax purposes
3. **Missing Feature Foundation** - Future features (PDF export with images, expense reports) require image access
4. **Subscription Value Gap** - Cannot differentiate subscription tiers based on image retention

The Epic 4 retrospective established that **Scan = Image Storage** should be a unified operation, not separate features.

### Proposed Solution

Extend the existing `analyzeReceipt` Cloud Function to:

1. **Normalize & Compress** images before storage (consistent quality, reduced costs)
2. **Store to Firebase Storage** with user-scoped paths
3. **Generate Thumbnails** for efficient list view rendering
4. **Return Storage URLs** to client for inclusion in transaction documents
5. **Cascade Delete** images when transactions are deleted

**New Scan Flow:**
```
User uploads image(s) → Cloud Function receives base64
                              ↓
                         Validates (size, count, MIME type)
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Gemini Analysis    Normalize/Compress Images
                    ↓                   ↓
              Extract Data         Store to Firebase Storage
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                    Return Transaction + imageUrls[] + thumbnailUrl
                              ↓
                    Client saves to Firestore (WITH image URLs)
```

### Scope

**In Scope:**

1. **Firebase Storage Setup**
   - Initialize Firebase Storage in project
   - Configure storage security rules (user-scoped access)
   - Set up Storage emulator for testing

2. **Cloud Function Enhancement**
   - Add image normalization/compression (sharp library)
   - Store full-size images to Firebase Storage
   - Generate and store thumbnails
   - Return download URLs with transaction data

3. **Transaction Model Update**
   - Add `imageUrls: string[]` field
   - Add `thumbnailUrl: string` field
   - Update TypeScript interfaces

4. **Client Updates**
   - Update Firestore service to handle image URLs
   - Display thumbnails in HistoryView
   - Add image viewer modal for full-size images

5. **Cascade Delete**
   - Delete Storage images when transaction is deleted
   - Cloud Function trigger or client-side deletion

6. **Testing**
   - Unit tests for image processing functions
   - Integration tests with Storage emulator
   - E2E tests for scan-to-view flow

**Out of Scope:**

1. **Retention Policy Enforcement** - Automatic image deletion based on subscription tier (Epic 7)
2. **Quota Tracking** - Counting scans/images against subscription limits (Epic 7)
3. **Image Export** - Exporting images in reports/PDFs (Epic 5)
4. **Offline Image Storage** - Local caching for offline access (Future)
5. **Image Editing** - Crop, rotate, enhance receipt images (Future)
6. **Subscription Tier Gating** - Blocking storage based on tier (Epic 7)

---

## Implementation Details

### Source Tree Changes

**Cloud Functions (functions/src/):**

| File | Action | Changes |
|------|--------|---------|
| `analyzeReceipt.ts` | MODIFY | Add image storage logic after Gemini analysis |
| `imageProcessing.ts` | CREATE | Image normalization, compression, thumbnail generation |
| `storageService.ts` | CREATE | Firebase Storage upload/delete operations |
| `deleteTransactionImages.ts` | CREATE | Cloud Function trigger for cascade delete |
| `index.ts` | MODIFY | Export new deleteTransactionImages function |

**Frontend (src/):**

| File | Action | Changes |
|------|--------|---------|
| `types/transaction.ts` | MODIFY | Add `imageUrls`, `thumbnailUrl` fields |
| `services/firestore.ts` | MODIFY | Handle image URLs in CRUD operations |
| `services/storage.ts` | CREATE | Firebase Storage client utilities |
| `config/firebase.ts` | MODIFY | Initialize Firebase Storage |
| `views/HistoryView.tsx` | MODIFY | Display thumbnails in transaction list |
| `components/ImageViewer.tsx` | CREATE | Modal for viewing full-size images |
| `components/TransactionCard.tsx` | CREATE | Transaction list item with thumbnail |

**Configuration:**

| File | Action | Changes |
|------|--------|---------|
| `storage.rules` | CREATE | Firebase Storage security rules |
| `firebase.json` | MODIFY | Add storage configuration |
| `.env` | MODIFY | Add Storage bucket URL (if needed) |

**Tests:**

| File | Action | Changes |
|------|--------|---------|
| `tests/unit/imageProcessing.test.ts` | CREATE | Unit tests for image utilities |
| `tests/integration/image-storage.test.tsx` | CREATE | Integration tests with emulator |
| `tests/e2e/scan-with-images.spec.ts` | CREATE | E2E test for full scan flow |

### Technical Approach

**1. Image Processing (Cloud Function - sharp library):**

```typescript
// Normalization settings (definitive choices)
const IMAGE_CONFIG = {
  fullSize: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 80,
    format: 'jpeg' as const
  },
  thumbnail: {
    width: 120,
    height: 160,
    quality: 70,
    format: 'jpeg' as const
  }
};
```

- **Library:** sharp v0.33.x (Node.js native, fast, well-maintained)
- **Full-size:** Max 1200x1600px, JPEG 80% quality (~100-200KB per image)
- **Thumbnail:** 120x160px, JPEG 70% quality (~5-10KB per image)
- **Processing:** Resize, convert to JPEG, strip metadata (EXIF)

**2. Storage Path Structure:**

```
gs://boletapp-d609f.appspot.com/
└── users/
    └── {userId}/
        └── receipts/
            └── {transactionId}/
                ├── image-0.jpg
                ├── image-1.jpg
                ├── image-2.jpg
                └── thumbnail.jpg
```

- User-scoped paths for security rules
- Transaction-grouped for cascade delete
- Sequential naming for multi-page receipts

**3. Security Rules (storage.rules):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/receipts/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**4. Transaction Model Extension:**

```typescript
export interface Transaction {
  id?: string;
  date: string;
  merchant: string;
  alias?: string;
  category: StoreCategory;
  total: number;
  items: TransactionItem[];
  // NEW FIELDS
  imageUrls?: string[];      // Full-size image download URLs
  thumbnailUrl?: string;     // Thumbnail download URL (first image)
  createdAt?: any;
  updatedAt?: any;
}
```

**5. Cascade Delete Strategy:**

Option A: Firestore Trigger (selected - cleaner, guaranteed execution)
```typescript
// deleteTransactionImages.ts
export const deleteTransactionImages = functions.firestore
  .document('artifacts/{appId}/users/{userId}/transactions/{transactionId}')
  .onDelete(async (snapshot, context) => {
    const { userId, transactionId } = context.params;
    await deleteStorageFolder(`users/${userId}/receipts/${transactionId}`);
  });
```

### Existing Patterns to Follow

**Cloud Function Patterns (from analyzeReceipt.ts):**
```typescript
// Error handling pattern
throw new functions.https.HttpsError(
  'invalid-argument',
  'User-friendly error message'
);

// Authentication check pattern
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
}

// Logging pattern
console.log(`Action completed for user ${context.auth.uid}: details`);
```

**Service Function Patterns (from firestore.ts):**
```typescript
// Named export with explicit types
export async function functionName(
  param1: Type1,
  param2: Type2
): Promise<ReturnType> {
  // Implementation
}
```

**React Component Patterns (from ScanView.tsx):**
```typescript
// Functional component with props interface
interface ComponentProps {
  prop1: Type1;
  prop2: Type2;
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onAction,
}) => {
  // Implementation
};
```

### Integration Points

**1. Cloud Function → Firebase Storage:**
- Firebase Admin SDK: `admin.storage().bucket()`
- Upload buffers from sharp processing
- Generate signed URLs or public URLs

**2. Cloud Function → Firestore (Trigger):**
- `functions.firestore.document().onDelete()` trigger
- Access document path params for user/transaction IDs

**3. Client → Firebase Storage:**
- Firebase Client SDK: `getStorage()`, `ref()`, `getDownloadURL()`
- Display images via download URLs (no direct bucket access)

**4. Client → Firestore:**
- Existing `addTransaction()` now includes `imageUrls` and `thumbnailUrl`
- Existing `deleteTransaction()` triggers cascade delete via Cloud Function

**5. Storage Emulator:**
- Port 9199 (Firebase default)
- Add to `firebase.json` emulators config
- Update test setup scripts

---

## Development Context

### Relevant Existing Code

**Cloud Function (functions/src/analyzeReceipt.ts):**
- Lines 129-234: Main `analyzeReceipt` function
- Lines 55-77: `validateImages()` - reuse validation logic
- Lines 85-106: `extractMimeType()` - reuse MIME extraction
- Lines 169-183: Image processing section - insertion point for storage

**Firestore Service (src/services/firestore.ts):**
- Lines 15-26: `addTransaction()` - add imageUrls to document
- Lines 39-47: `deleteTransaction()` - triggers cascade via Cloud Function

**Transaction Types (src/types/transaction.ts):**
- Lines 14-24: `Transaction` interface - add new fields

**Firebase Config (src/config/firebase.ts):**
- Firebase app initialization - add Storage export

**History View (src/views/HistoryView.tsx):**
- Transaction list rendering - add thumbnail display

### Dependencies

**Framework/Libraries:**

**Cloud Functions (NEW):**
| Package | Version | Purpose |
|---------|---------|---------|
| sharp | 0.33.5 | Image processing (resize, compress, format) |
| firebase-admin | (existing) | Storage Admin SDK |

**Frontend (EXISTING - no new deps):**
| Package | Version | Purpose |
|---------|---------|---------|
| firebase | 10.14.1 | Storage Client SDK (already included) |

**Internal Modules:**

**Cloud Functions:**
- `functions/src/analyzeReceipt.ts` - Main entry (MODIFY)
- `functions/src/imageProcessing.ts` - Image utilities (CREATE)
- `functions/src/storageService.ts` - Storage operations (CREATE)

**Frontend:**
- `src/config/firebase.ts` - Add Storage export
- `src/services/firestore.ts` - Handle image URLs
- `src/services/storage.ts` - Storage utilities (CREATE)
- `src/types/transaction.ts` - Extended interface

### Configuration Changes

**firebase.json (MODIFY):**
```json
{
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "storage": {
      "port": 9199
    }
  }
}
```

**storage.rules (CREATE):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/receipts/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**functions/package.json (MODIFY):**
```json
{
  "dependencies": {
    "sharp": "^0.33.5"
  }
}
```

**package.json scripts (MODIFY):**
```json
{
  "scripts": {
    "emulators": "firebase emulators:start --only auth,firestore,storage,functions --project boletapp-d609f --import=./emulator-data --export-on-exit=./emulator-data"
  }
}
```

### Existing Conventions (Brownfield)

**Code Style (MUST CONFORM):**
- TypeScript strict mode
- Single quotes for strings
- No semicolons
- 2-space indentation
- Named exports pattern
- Async/await for asynchronous operations
- JSDoc comments for public functions

**Test Standards (MUST CONFORM):**
- Vitest for unit/integration tests
- Playwright for E2E tests
- Test file naming: `*.test.ts`, `*.test.tsx`, `*.spec.ts`
- Firebase emulators for integration tests
- @testing-library/react for component testing

**Error Handling Pattern:**
- Cloud Functions: throw `functions.https.HttpsError` with appropriate codes
- Client: try/catch with user-friendly error messages
- Console logging for debugging

### Test Framework & Standards

**Unit Tests (Vitest):**
- Location: `tests/unit/`
- Naming: `*.test.ts`
- Coverage: imageProcessing utilities, storage helpers

**Integration Tests (Vitest + Firebase Emulators):**
- Location: `tests/integration/`
- Naming: `*.test.tsx`
- Coverage: Full scan flow with Storage emulator

**E2E Tests (Playwright):**
- Location: `tests/e2e/`
- Naming: `*.spec.ts`
- Coverage: User journey from scan to viewing stored images

**Test Commands:**
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration with emulators
npm run test:e2e           # E2E with Playwright
npm run test:all           # All tests
```

---

## Implementation Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 20.x | Cloud Functions runtime |
| **Framework** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | 5.3.3 | Type-safe development |
| **Build** | Vite | 5.4.0 | Frontend bundling |
| **Storage** | Firebase Storage | 10.14.1 | Image file storage |
| **Database** | Cloud Firestore | 10.14.1 | Transaction documents |
| **Functions** | Cloud Functions | (latest) | Backend logic |
| **Image Processing** | sharp | 0.33.5 | Resize, compress, format |
| **Testing** | Vitest | 4.0.13 | Unit/Integration tests |
| **E2E Testing** | Playwright | 1.56.1 | End-to-end tests |

---

## Technical Details

### Image Processing Pipeline

**Input:** Base64-encoded images (JPEG, PNG, WebP, HEIC)
**Output:** Normalized JPEG images + thumbnail

```typescript
async function processReceiptImages(
  images: string[],
  transactionId: string,
  userId: string
): Promise<{ imageUrls: string[], thumbnailUrl: string }> {
  const bucket = admin.storage().bucket()
  const imageUrls: string[] = []

  for (let i = 0; i < images.length; i++) {
    const buffer = Buffer.from(images[i].split(',')[1], 'base64')

    // Process full-size image
    const fullSize = await sharp(buffer)
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    const fullPath = `users/${userId}/receipts/${transactionId}/image-${i}.jpg`
    await bucket.file(fullPath).save(fullSize, { contentType: 'image/jpeg' })

    const [url] = await bucket.file(fullPath).getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Long-lived URL
    })
    imageUrls.push(url)
  }

  // Generate thumbnail from first image
  const thumbnailBuffer = await sharp(Buffer.from(images[0].split(',')[1], 'base64'))
    .resize(120, 160, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer()

  const thumbnailPath = `users/${userId}/receipts/${transactionId}/thumbnail.jpg`
  await bucket.file(thumbnailPath).save(thumbnailBuffer, { contentType: 'image/jpeg' })

  const [thumbnailUrl] = await bucket.file(thumbnailPath).getSignedUrl({
    action: 'read',
    expires: '03-01-2500'
  })

  return { imageUrls, thumbnailUrl }
}
```

### Storage Size Estimates

| Image Type | Dimensions | Quality | Est. Size |
|------------|------------|---------|-----------|
| Full-size | 1200x1600 max | 80% JPEG | 100-200 KB |
| Thumbnail | 120x160 | 70% JPEG | 5-10 KB |

**Per Transaction (3 images max):**
- Full-size: 300-600 KB
- Thumbnails: 5-10 KB
- **Total: ~310-610 KB per transaction**

**Monthly Storage Cost (from Epic 4 retro):**
- 10,000 users: ~$26/month
- 50,000 users: ~$130/month

### Error Scenarios

| Scenario | Handling |
|----------|----------|
| Storage upload fails | Retry once, then return transaction without images |
| Image too large (after validation) | Sharp handles gracefully with resize |
| Unsupported format | Reject before processing (existing validation) |
| Thumbnail generation fails | Use first full-size URL as fallback |
| Cascade delete fails | Log error, images become orphaned (cleanup job future) |

### Security Considerations

1. **User Isolation:** Storage rules enforce user can only access their own images
2. **Signed URLs:** Long-lived but scoped to specific files
3. **No Public Access:** Bucket is not publicly accessible
4. **Input Validation:** Existing image validation in analyzeReceipt.ts
5. **Size Limits:** 10MB per image, 3 images max (prevent abuse)

---

## Development Setup

**Prerequisites:**
- Node.js 20.x
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project access (boletapp-d609f)

**Local Development:**

```bash
# 1. Clone repo (if not already)
git clone https://github.com/Brownbull/gmni_boletapp.git
cd gmni_boletapp

# 2. Install dependencies
npm install
cd functions && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Add VITE_FIREBASE_* variables

# 4. Start emulators (now includes Storage)
npm run emulators

# 5. Start dev server
npm run dev

# 6. Run tests
npm run test:unit
npm run test:integration
```

**Cloud Functions Development:**

```bash
cd functions

# Build TypeScript
npm run build

# Deploy functions only
firebase deploy --only functions

# View logs
firebase functions:log
```

---

## Implementation Guide

### Setup Steps

1. **Create feature branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/epic-4.5-receipt-image-storage
   ```

2. **Initialize Firebase Storage**
   - Create `storage.rules` file
   - Update `firebase.json` with storage config
   - Deploy rules: `firebase deploy --only storage`

3. **Add sharp to Cloud Functions**
   ```bash
   cd functions
   npm install sharp
   ```

4. **Update emulator config**
   - Add storage emulator to firebase.json
   - Update npm scripts

5. **Verify dev environment**
   ```bash
   npm run emulators  # Should show storage emulator on port 9199
   ```

### Implementation Steps

**Story 4.5-1: Firebase Storage Infrastructure**
1. Create storage.rules with user-scoped access
2. Update firebase.json with storage configuration
3. Add Storage emulator to emulators config
4. Initialize Firebase Storage in src/config/firebase.ts
5. Deploy storage rules to production
6. Write infrastructure tests

**Story 4.5-2: Cloud Function Image Processing**
1. Add sharp dependency to functions/package.json
2. Create imageProcessing.ts with resize/compress utilities
3. Create storageService.ts with upload/delete operations
4. Modify analyzeReceipt.ts to store images after Gemini analysis
5. Return imageUrls and thumbnailUrl in response
6. Write unit tests for image processing
7. Write integration tests with Storage emulator

**Story 4.5-3: Client Updates & UI**
1. Update Transaction interface with new fields
2. Modify firestore.ts to handle image URLs
3. Create storage.ts client utilities
4. Update HistoryView to display thumbnails
5. Create ImageViewer modal component
6. Create TransactionCard component
7. Write component tests
8. Write E2E tests for scan-to-view flow

**Story 4.5-4: Cascade Delete & Cleanup**
1. Create deleteTransactionImages Cloud Function trigger
2. Handle delete in storageService.ts
3. Deploy trigger function
4. Write integration tests for cascade delete
5. Update documentation

### Testing Strategy

**Unit Tests:**
- imageProcessing.ts: resize, compress, thumbnail generation
- storageService.ts: path generation, URL handling
- Transaction type validation

**Integration Tests:**
- Full scan flow with Storage emulator
- Image upload and retrieval
- Cascade delete on transaction deletion
- Error handling (storage failures)

**E2E Tests:**
- User scans receipt → images stored → view in history
- User deletes transaction → images deleted
- Multiple images per receipt
- Thumbnail display in list view

**Manual Testing Checklist:**
- [ ] Scan single image receipt
- [ ] Scan multi-page receipt (3 images)
- [ ] View thumbnail in history list
- [ ] Click thumbnail to view full-size
- [ ] Delete transaction, verify images deleted
- [ ] Test with different image formats (JPEG, PNG)
- [ ] Test with large images (verify compression)

### Acceptance Criteria

**AC1: Storage Infrastructure**
- Given the Firebase project
- When storage rules are deployed
- Then users can only access their own receipt images

**AC2: Image Processing**
- Given a receipt scan with 1-3 images
- When the Cloud Function processes them
- Then full-size images are resized to max 1200x1600 and compressed to JPEG 80%
- And a thumbnail (120x160) is generated from the first image

**AC3: Storage & URLs**
- Given processed images
- When stored to Firebase Storage
- Then they are saved at `users/{userId}/receipts/{transactionId}/`
- And download URLs are returned to the client

**AC4: Transaction Model**
- Given a successful scan
- When the transaction is saved to Firestore
- Then it includes `imageUrls[]` and `thumbnailUrl` fields

**AC5: UI Display**
- Given transactions with images in Firestore
- When viewing History
- Then thumbnails are displayed for each transaction
- And clicking a thumbnail opens full-size image viewer

**AC6: Cascade Delete**
- Given a transaction with stored images
- When the transaction is deleted
- Then all associated images in Storage are also deleted

**AC7: Backward Compatibility**
- Given existing transactions without images
- When displayed in History
- Then they render without errors (no thumbnail shown)

---

## Developer Resources

### File Paths Reference

**Cloud Functions:**
- `/functions/src/index.ts` - Entry point
- `/functions/src/analyzeReceipt.ts` - Main function (MODIFY)
- `/functions/src/imageProcessing.ts` - Image utilities (CREATE)
- `/functions/src/storageService.ts` - Storage operations (CREATE)
- `/functions/src/deleteTransactionImages.ts` - Cascade trigger (CREATE)

**Frontend:**
- `/src/config/firebase.ts` - Add Storage export (MODIFY)
- `/src/types/transaction.ts` - Add image fields (MODIFY)
- `/src/services/firestore.ts` - Handle image URLs (MODIFY)
- `/src/services/storage.ts` - Storage utilities (CREATE)
- `/src/views/HistoryView.tsx` - Display thumbnails (MODIFY)
- `/src/components/ImageViewer.tsx` - Full-size modal (CREATE)
- `/src/components/TransactionCard.tsx` - List item (CREATE)

**Configuration:**
- `/storage.rules` - Storage security rules (CREATE)
- `/firebase.json` - Add storage config (MODIFY)
- `/functions/package.json` - Add sharp (MODIFY)

**Tests:**
- `/tests/unit/imageProcessing.test.ts` (CREATE)
- `/tests/integration/image-storage.test.tsx` (CREATE)
- `/tests/e2e/scan-with-images.spec.ts` (CREATE)

### Key Code Locations

| Function/Class | File | Line |
|----------------|------|------|
| analyzeReceipt | functions/src/analyzeReceipt.ts | 129 |
| validateImages | functions/src/analyzeReceipt.ts | 55 |
| extractMimeType | functions/src/analyzeReceipt.ts | 85 |
| Transaction interface | src/types/transaction.ts | 14 |
| addTransaction | src/services/firestore.ts | 15 |
| deleteTransaction | src/services/firestore.ts | 39 |
| HistoryView | src/views/HistoryView.tsx | 1 |
| Firebase init | src/config/firebase.ts | 1 |

### Testing Locations

| Test Type | Location | Pattern |
|-----------|----------|---------|
| Unit | tests/unit/ | *.test.ts |
| Integration | tests/integration/ | *.test.tsx |
| E2E | tests/e2e/ | *.spec.ts |

### Documentation to Update

- [ ] `docs/architecture/architecture.md` - Add ADR-009 for image storage
- [ ] `docs/architecture/data-models.md` - Document imageUrls/thumbnailUrl fields
- [ ] `docs/architecture/api-contracts.md` - Update analyzeReceipt response
- [ ] `docs/index.md` - Add Epic 4.5 section
- [ ] `docs/security/README.md` - Document Storage security rules
- [ ] `README.md` - Update features list

---

## UX/UI Considerations

### UI Components Affected

**HistoryView (MODIFY):**
- Add thumbnail to left of each transaction row
- Thumbnail size: 40x50px (fits row height)
- Placeholder for transactions without images

**ImageViewer (CREATE):**
- Modal overlay with dark background
- Swipeable gallery for multi-image receipts
- Close button (X) in top-right
- Pinch-to-zoom on mobile
- Download button (optional)

**TransactionCard (CREATE):**
- Encapsulate transaction list item
- Thumbnail on left
- Merchant, date, total on right
- Category badge
- Click to expand/edit

### UX Flow Changes

**Current Flow:**
```
Scan → Edit → Save → History (text only)
```

**New Flow:**
```
Scan → Edit → Save → History (with thumbnails)
                         ↓
                   Click thumbnail
                         ↓
                   Image Viewer Modal
```

### Visual/Interaction Patterns

- Follow existing card design (rounded corners, shadow)
- Thumbnail with subtle border
- Loading skeleton while image loads
- Error state if image fails to load
- Empty state for transactions without images

### Accessibility

- Thumbnail alt text: "Receipt from {merchant}"
- Image viewer: Escape key to close
- Focus trap in modal
- Screen reader announcement on modal open/close

### User Feedback

- Loading spinner during image upload
- Success toast after scan complete
- Error message if storage fails (with retry option)
- Progress indicator for multi-image upload

---

## Testing Approach

**CONFORM TO EXISTING TEST STANDARDS:**

**Test Framework:** Vitest 4.0.13 + Playwright 1.56.1
**Coverage Requirements:** 45% lines, 30% branches (existing thresholds)

**Unit Test Coverage:**
- `imageProcessing.ts`: 90%+ (pure functions)
- `storageService.ts`: 80%+ (mocked Firebase)

**Integration Test Coverage:**
- Full scan flow with emulators
- CRUD operations with image URLs
- Cascade delete verification

**E2E Test Coverage:**
- Happy path: scan → view → delete
- Multi-image receipt
- Error handling (network failure simulation)

**Test Data:**
- Sample receipt images (JPEG, PNG)
- Various sizes (small, medium, large)
- Edge cases (corrupt, unsupported format)

---

## Deployment Strategy

### Deployment Steps

1. **Deploy Storage Rules (First)**
   ```bash
   firebase deploy --only storage
   ```

2. **Deploy Cloud Functions**
   ```bash
   cd functions && npm run build
   firebase deploy --only functions
   ```

3. **Deploy Frontend**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

4. **Verify in Staging**
   - Test scan flow end-to-end
   - Verify images stored correctly
   - Test cascade delete

5. **Production Deployment**
   - Same steps as staging
   - Monitor error rates

6. **Post-Deploy Verification**
   - Scan test receipt
   - View in history
   - Delete and verify cleanup

### Rollback Plan

**If Storage Issues:**
1. Storage rules can be reverted in Firebase Console
2. Previous rules version available in deployment history

**If Cloud Function Issues:**
1. Redeploy previous function version:
   ```bash
   firebase functions:delete analyzeReceipt
   # Deploy previous version from git
   git checkout <previous-commit> -- functions/
   firebase deploy --only functions
   ```

**If Frontend Issues:**
1. Firebase Console > Hosting > Previous deployment > Rollback
2. Or: `git checkout <previous-commit> && npm run deploy`

**Data Safety:**
- Existing transactions unaffected (new fields are optional)
- No data migration required
- Backward compatible schema

### Monitoring

**Firebase Console:**
- Storage usage and bandwidth
- Function execution logs
- Error rates

**Alerts to Configure:**
- Storage quota approaching limit
- Function error rate > 1%
- High bandwidth usage

**Logs to Monitor:**
```bash
# Cloud Function logs
firebase functions:log --only analyzeReceipt

# Look for patterns
# - "Receipt analyzed for user" (success)
# - "Error" (failures)
# - Storage upload failures
```

**Metrics to Track:**
- Images stored per day
- Average image size
- Storage growth rate
- Scan success rate (with/without images)
