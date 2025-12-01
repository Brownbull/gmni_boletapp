# boletapp - Epic Breakdown

**Date:** 2025-11-29
**Project Level:** Quick-Flow Brownfield

---

## Epic 4.5: Receipt Image Storage

**Slug:** receipt-image-storage

### Goal

Enable users to store receipt images linked to transactions, providing verification capability, audit trails for tax purposes, and foundation for future export features. Implements the "Scan = Image Storage" unified operation established in Epic 4 retrospective.

### Scope

**In Scope:**
- Firebase Storage initialization and security rules
- Cloud Function enhancement for image processing (normalize, compress, thumbnail)
- Transaction model extension with imageUrls[] and thumbnailUrl
- Client UI updates (thumbnail display, image viewer modal)
- Cascade delete (images removed when transaction deleted)
- Testing infrastructure for Storage emulator

**Out of Scope:**
- Retention policy enforcement (Epic 7)
- Quota tracking per subscription tier (Epic 7)
- Image export to PDF/reports (Epic 5)
- Offline image caching (Future)
- Image editing features (Future)

### Success Criteria

1. Receipt images are stored in Firebase Storage at `users/{userId}/receipts/{transactionId}/`
2. Images are normalized to max 1200x1600px, JPEG 80% quality
3. Thumbnails (120x160px) are generated for list views
4. Transaction documents include `imageUrls[]` and `thumbnailUrl` fields
5. Deleting a transaction cascades to delete associated images
6. Existing transactions without images continue to work (backward compatible)
7. All tests pass (unit, integration, E2E)

### Dependencies

- Epic 4 complete (Cloud Function `analyzeReceipt` exists)
- Firebase Blaze plan (required for Cloud Functions + Storage)
- firebase-admin SDK with Storage permissions

---

## Story Map - Epic 4.5

```
Epic 4.5: Receipt Image Storage (13 points)
│
├── Story 4.5-1: Firebase Storage Infrastructure (3 points)
│   └── Dependencies: None
│   └── Deliverable: Storage rules, emulator config, client init
│
├── Story 4.5-2: Cloud Function Image Processing (5 points)
│   └── Dependencies: Story 4.5-1
│   └── Deliverable: Images stored on scan, URLs returned
│
├── Story 4.5-3: Client Updates & UI (3 points)
│   └── Dependencies: Story 4.5-2
│   └── Deliverable: Thumbnails in history, image viewer modal
│
└── Story 4.5-4: Cascade Delete & Documentation (2 points)
    └── Dependencies: Story 4.5-2
    └── Deliverable: Auto-delete images, updated docs
```

---

## Stories - Epic 4.5

### Story 4.5-1: Firebase Storage Infrastructure

As a **developer**,
I want **Firebase Storage initialized with security rules and emulator support**,
So that **receipt images can be securely stored with user isolation**.

**Acceptance Criteria:**
- AC #1: Storage security rules deployed with user-scoped access pattern
- AC #2: Storage emulator running on port 9199
- AC #3: Firebase Storage exported from src/config/firebase.ts
- AC #4: npm scripts updated to include storage emulator
- AC #5: Infrastructure test validates rules enforcement

**Prerequisites:** None
**Technical Notes:** First story - establishes foundation for all image storage
**Estimated Effort:** 3 points

---

### Story 4.5-2: Cloud Function Image Processing

As a **user scanning receipts**,
I want **my receipt images automatically stored after analysis**,
So that **I can view the original receipt later for verification**.

**Acceptance Criteria:**
- AC #1: sharp library processes images (resize to 1200x1600 max, JPEG 80%)
- AC #2: Thumbnail generated (120x160px, JPEG 70%)
- AC #3: Images stored at `users/{userId}/receipts/{transactionId}/`
- AC #4: analyzeReceipt returns imageUrls[] and thumbnailUrl with transaction
- AC #5: Unit tests cover image processing functions
- AC #6: Integration tests verify full scan flow with Storage emulator

**Prerequisites:** Story 4.5-1 (Storage infrastructure)
**Technical Notes:** Core implementation - modifies analyzeReceipt Cloud Function
**Estimated Effort:** 5 points

---

### Story 4.5-3: Client Updates & UI

As a **user viewing transaction history**,
I want **to see receipt thumbnails and view full-size images**,
So that **I can quickly identify transactions and verify details**.

**Acceptance Criteria:**
- AC #1: Transaction interface extended with imageUrls and thumbnailUrl fields
- AC #2: HistoryView displays thumbnails for transactions with images
- AC #3: Clicking thumbnail opens ImageViewer modal with full-size image
- AC #4: Transactions without images display without errors (backward compatible)
- AC #5: ImageViewer supports multi-image navigation for receipts with multiple pages
- AC #6: E2E test covers scan-to-view flow

**Prerequisites:** Story 4.5-2 (Images available from Cloud Function)
**Technical Notes:** UI changes to HistoryView, new ImageViewer component
**Estimated Effort:** 3 points

---

### Story 4.5-4: Cascade Delete & Documentation

As a **user deleting a transaction**,
I want **associated images automatically deleted**,
So that **I don't accumulate orphaned images in storage**.

**Acceptance Criteria:**
- AC #1: Firestore trigger function deletes Storage folder on transaction delete
- AC #2: Integration test verifies cascade delete behavior
- AC #3: ADR-009 documents image storage architecture decisions
- AC #4: docs/index.md updated with Epic 4.5 section
- AC #5: Architecture docs updated with Storage security rules

**Prerequisites:** Story 4.5-2 (Images exist to delete)
**Technical Notes:** Cloud Function trigger, documentation updates
**Estimated Effort:** 2 points

---

## Implementation Timeline - Epic 4.5

**Total Story Points:** 13 points

**Implementation Sequence:**
1. Story 4.5-1 → Foundation (no dependencies)
2. Story 4.5-2 → Core (depends on 4.5-1)
3. Story 4.5-3 → UI (depends on 4.5-2)
4. Story 4.5-4 → Cleanup (depends on 4.5-2, can run parallel with 4.5-3)

**Notes:**
- Stories 4.5-3 and 4.5-4 can be developed in parallel after 4.5-2 completes
- All stories reference tech-spec.md for detailed implementation guidance
