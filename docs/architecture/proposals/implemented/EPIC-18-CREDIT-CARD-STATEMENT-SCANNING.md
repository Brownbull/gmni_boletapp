# Epic 18: Credit Card Statement Scanning — Architecture Plan V5

**Status:** IN PROGRESS
**Finalized:** 2026-03-19 (V5 — async pipeline + hard lock + credit decisions)
**Supersedes:** V4 (2026-03-11), V3, V2, V1

## Core Concept: Async Transaction Reconciliation

```
Long-press scan button → "Credit Card Statement" option
→ PDF Upload to Storage → queueStatementScan (<1s, deduct 1 super credit)
→ processStatementScan (Firestore trigger, 30-90s):
    Read PDF → Gemini extraction → Backend transformer → Write result to pending doc
→ Client Firestore listener picks up result
→ Review extracted transactions → Matching phase → User decisions → Save
```

The epic delivers the complete flow: a user uploads a credit card statement PDF,
the system extracts transactions asynchronously, matches them against existing
app transactions, merges information, and marks matched transactions as
statement-verified (hard locked).

## Entry Point

**Long-press scan button** reveals menu with three options:
1. Single Scan (existing)
2. Batch Scan (existing)
3. Credit Card Statement Scan (new — Epic 18)

## Async Pipeline Architecture

### queueStatementScan (HTTPS Callable — accept function)
- Validates: auth, PDF in Storage (URL), optional password, file size ≤ 7MB
- Deducts 1 super credit (atomic via runTransaction)
- Creates `pending_statement_scans/{scanId}` document:
  ```typescript
  {
    userId: string,
    pdfStorageUrl: string,       // Already uploaded to Storage by client
    password?: string,            // NEVER logged, stripped from errors
    status: 'queued',
    creditDeducted: true,
    createdAt: serverTimestamp(),
    importId: string,             // UUID for this import session (becomes statementImportId)
  }
  ```
- Returns `{ scanId, importId }` in <1s
- Idempotent: if scanId doc exists, return existing

### processStatementScan (Firestore onCreate trigger)
- Reads PDF from Storage URL
- Calls Gemini with statement prompt
- Runs backend transformer:
  - Filter positive amounts only (skip abonos/negatives)
  - Map chargeType from statement type (cargo→purchase, interes→interest, etc.)
  - Parse installments ("3/6"→{3,6}, "1/1"→omit)
  - Extract cardHolderType per transaction (titular/additional)
  - Parse dates (DD/MM/YYYY → YYYY-MM-DD)
  - Map originalCurrency/originalAmount to currency field
  - Apply V2 accuracy guardrail (sum ≈ totalDebit ±5%)
  - Generate synthetic "Cargo sin detallar" items via reconcileItemsTotal()
- Writes result to pending doc:
  ```typescript
  {
    status: 'completed' | 'error',
    result: {
      statementInfo: StatementInfo,
      transformedTransactions: Transaction[],  // Already transformed, ready for review
      metadata: { confidence, totalVerified, deviation, transactionCount },
    },
    error?: { code, message },  // On failure
    completedAt: serverTimestamp(),
  }
  ```
- On failure: refunds super credit (creditDeducted→false), sets status='error'

### onPendingStatementScanDeleted (Firestore onDelete trigger)
- Refunds credit if creditDeducted=true
- Does NOT delete the PDF from Storage (user may want to re-scan)

### cleanupPendingStatementScans (scheduled, every 60min)
- Auto-fail stale 'queued'/'processing' docs past 5min deadline
- Delete completed/error docs older than 24h

### Client Flow
- Long-press scan button → select "Credit Card Statement"
- Upload PDF to Firebase Storage (`users/{uid}/statements/{sha256}.pdf`)
- Call queueStatementScan with Storage URL
- Listen to `pending_statement_scans/{scanId}` via onSnapshot
- On result: display review UI with pre-transformed transactions
- Survives network drops, app restarts, background/foreground transitions

## PDF Upload Strategy

PDF is uploaded to Storage FIRST, then URL passed to callable. This avoids the 10MB callable limit:
- Client: `uploadBytes(ref, pdfFile)` → get download URL
- Callable receives URL (small payload), not base64 PDF
- Storage path: `users/{uid}/statements/{sha256}.pdf`
- Dedup: if hash already exists in Storage, skip upload and show "Already imported" prompt

## Credit Model

- **1 super credit per statement scan** (regardless of transaction count)
- Deducted on queueStatementScan (atomic via runTransaction)
- Refunded on: processing failure, scan deletion, cleanup timeout
- Rate limit: 5 statements/min/user (in-memory per-instance for MVP; Firestore-based at scale)

## New Fields on Transaction (src/types/transaction.ts)

### chargeType (financial movement classification)
- File: `shared/schema/chargeTypes.ts`
- Type: `chargeType?: ChargeType` (undefined = purchase)
- Values: purchase, interest, fee, insurance, transfer, adjustment, other
- ES labels: Compra, Interés, Comisión, Seguro, Transferencia, Ajuste, Otro
- Mapping from statement: cargo→purchase, interes→interest, comision→fee, seguro→insurance, otro→other
- NOTE: "payment" (abono) removed — abonos are negative amounts, skipped by transformer
- RULE: `total` is ALWAYS positive. `chargeType` classifies the spending type.

### installmentCurrent / installmentTotal (flat, no nesting)
- `installmentCurrent?: number` (e.g., 3)
- `installmentTotal?: number` (e.g., 6)
- Parsing: "3/6"→3,6; "1/1"→omit both; "0/6"→0,6; null/malformed→omit

### recurrenceFrequency
- `recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly'`
- Not populated by statement scan automatically
- User sets during transaction edit (advanced section, always available)
- Can coexist with installment fields

### source (transaction provenance)
- `source?: 'receipt_scan' | 'statement_scan' | 'manual'`

### sourceDocumentUrl (link to source PDF)
- `sourceDocumentUrl?: string`
- Points to Firebase Storage: `users/{uid}/statements/{sha256}.pdf`

### cardHolderType / cardHolderName (flat)
- `cardHolderType?: 'titular' | 'additional'`
- `cardHolderName?: string` (only for additional)

### Location
- Existing `country?` and `city?` fields — best-effort from statement descriptions

### Statement Reconciliation Fields
- `statementVerified?: boolean` — true = matched against statement + HARD LOCKED
- `statementVerifiedAt?: Timestamp` — when the match was confirmed
- `statementImportId?: string` — links to the import session UUID

## Transaction Lock Mechanism

### Lock Rule
- `statementVerified === true` → transaction is **hard locked**
- Editor: ALL fields disabled, banner "Verified against credit card statement on {date}"
- Unlock: explicit "Unlock and Break Verification" button
  - Shows confirmation dialog: "This will break the statement verification. You'll need to re-match this transaction."
  - Resets: statementVerified=false, statementVerifiedAt=null, statementImportId=null
  - After unlock: transaction is fully editable again

### Lock Scope
- ALL fields locked (amount, merchant, category, items, date, chargeType, installments, etc.)
- Read-only badges remain visible: source, verified status, import date

## Transaction Matching + Merge

### Core Rule: User Always Decides
Matching is NEVER automatic. The system proposes matches; the user approves every action.

### Matching Algorithm
- Pure function: `matchStatementTransactions(statementTxns[], candidateTxns[])` — accepts any Transaction[]
- Match criteria: fuzzy merchant (lowercase containment + Levenshtein) + exact amount + date ±5 days
- Uses existing merchant_mappings for alias normalization
- Confidence: HIGH (all 3), MEDIUM (2 of 3), LOW (1 of 3), NONE
- CardHolder grouping: titular statements match against user's transactions; additional cardholder defaults to "create new" (user can manually match)

### Extensibility for Epic 19 Shared Groups
```
Phase 1 (Epic 18): match against user's own transactions
Phase 2 (Epic 19): match unmatched against selected share group's transaction copies
```
Same function, different candidateTxns[] input. The matcher has no knowledge of where candidates come from.

### Epic 19 Group Matching Rules (design only — implementation in Epic 19)
- User selects a share group to match against
- Group transactions are copies (Epic 19 "copy & bucket" model)
- Match criteria: same date + same amount (stricter than user matching)
- Anyone in the group can match (no confirmation needed)
- Matched group transaction gets locked on both sides (group copy + statement)
- No effect on the original transaction of the user who shared it

### User Actions Per Statement Transaction (exactly 3 options)

**1. Approve match** — system found a matching app transaction, user confirms
   - Merge: receipt items PRESERVED (V1 authoritative), statement amount authoritative (V2 truthful)
   - Set statementVerified=true, statementVerifiedAt=now, statementImportId
   - If amounts differ: AmountConflictDialog (user picks which to keep)

**2. Reject match + create new** — system found a match but user disagrees
   - Create as new transaction (source='statement_scan', synthetic "Cargo sin detallar" item)
   - Original app transaction left untouched

**3. No match found** — user picks:
   - (a) Manually search/select existing → treat as option 1
   - (b) Create new → treat as option 2

### Re-import Detection
- Fast path: check PDF hash exists in Storage before calling Gemini → "Already imported" prompt
- Full path: matching finds all transactions already verified → nothing new to match

## Spending Filter Rule

All positive amounts from the statement are SPENDING:
- cargo (purchases), interes (interest), comision (fees), seguro (insurance), otro (other)
- Skip negative amounts (abonos = payments to the card)
- Transformer filter: `transactions.filter(t => t.amount > 0)`
- chargeType classifies spending type (e.g., "you paid $50,000 in insurance fees this year")

## Consent & Data Privacy

- First-time consent modal before first statement upload
- Disclosure: "Your statement PDF will be sent to Google AI for processing"
- Consent stored in Firestore: `artifacts/{appId}/users/{userId}/consents/statement_ai_processing`
- **BLOCKER:** Verify Google Gemini API data retention policy before shipping consent flow
- Future: agreements section in user settings for viewing active consents (ENT-2)

## Firestore Rules Changes

### New field validation in hasValidFieldBounds:
```cel
&& (!('chargeType' in data) || data.chargeType in ['purchase','interest','fee','insurance','transfer','adjustment','other'])
&& (!('source' in data) || data.source in ['receipt_scan','statement_scan','manual'])
&& (!('cardHolderType' in data) || data.cardHolderType in ['titular','additional'])
&& (!('installmentCurrent' in data) || (data.installmentCurrent is number && data.installmentCurrent >= 0 && data.installmentCurrent <= 999))
&& (!('installmentTotal' in data) || (data.installmentTotal is number && data.installmentTotal >= 0 && data.installmentTotal <= 999))
```

### New rules for pending_statement_scans:
```
match /pending_statement_scans/{scanId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create, update: if false;  // Admin SDK only
}
```

### Storage rules for statements:
```
match /users/{userId}/statements/{filename} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.size < 7 * 1024 * 1024;
}
```

## Cloud Function Hardening
- PDF magic bytes validation (`%PDF-` header check)
- Transaction type enum validation (cargo|abono|interes|comision|seguro|otro)
- PDF size limit: 7MB (verified against test data)
- Rate limiter: 5/min/user (in-memory per-instance for MVP)
- Password NEVER logged (stripped from all error objects)

## Accuracy Guardrails
- Transformer verifies: sum(positive amounts) ≈ statementInfo.totalDebit (5% tolerance)
- If metadata.confidence < 0.7: flag entire import for manual review
- Surface confidence + deviation in review screen
- Single month per statement only
- Disclaimer: "Statements with more than ~150 transactions may have reduced accuracy"

## Backward Compatibility
- undefined chargeType → treat as 'purchase'
- undefined installment fields → one-time (not shown)
- undefined source → treat as 'manual'
- undefined statementVerified → treat as false (not locked)
- No Firestore migration needed — all fields optional

## Story Map (~47 points remaining)

### Critical Path (sequential):
1. **18-5** prompt V2 — 3 pts (fix categories, cardHolder, location)
2. **18-2** type extensions — 5 pts (+chargeType schema, Firestore rules)
3. **18-3** async statement backend — 8 pts (queue+process CFs, backend transformer, credit, rules)
4. **18-4** statement UI + consent — 5 pts (Storage upload, Firestore listener, consent, review)
5. **18-10a** matching + merge logic — 5 pts (pure function, cardholder grouping, extensible)
6. **18-10b** matching UI — 5 pts (review, approve/reject, amount conflict, atomic save)
7. **18-6** editor new fields + lock — 5 pts (chargeType, installments, recurrence, hard lock mode)

### Independent (end of epic):
8. **18-7** receiptType fix — 2 pts
9. **18-9** admin endpoint security — 3 pts
10. **18-11** statement E2E — 3 pts

### Completed:
- 18-0, 18-1 (spike), 18-8, TD-18-2 through TD-18-12, 18-13a, 18-13b

## Open Items
- **BLOCKER:** Verify Google Gemini API data retention policy before shipping consent (MVP-5)
- **Future (ENT-1):** Statement list/history view (view imported statements)
- **Future (ENT-2):** Agreements/settings UI for consent management
- **Future (Epic 19):** Shared group matching implementation
