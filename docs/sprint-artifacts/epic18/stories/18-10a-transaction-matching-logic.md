# Story 18-10a: Transaction Matching + Merge Logic

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the brain — teach the system to recognize what matches and how to combine the pieces"

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Extensibility:** Pure function accepts any Transaction[] — Epic 19 passes group transactions as second phase
- **Fuzzy matching:** Reuse TD-18-6 lowercase containment matching + Levenshtein similarity scoring

## Story
As a developer, I want a matching algorithm that proposes matches between statement transactions and existing app transactions (fuzzy merchant + exact amount + date proximity), plus merge logic that combines matched transactions while preserving receipt items and setting statement verification fields, so that the matching UI story can present proposals to the user. The algorithm must be a pure function accepting any Transaction[] as candidates for Epic 19 group matching extensibility.

## Acceptance Criteria

### Functional
- **AC-1:** Matching algorithm: fuzzy merchant name + exact amount + date ±5 days
- **AC-2:** Each statement transaction classified: proposed match (with confidence), or "no match found"
- **AC-3:** Confidence scoring: HIGH (all 3 match), MEDIUM (2 of 3), LOW (1 of 3), NONE
- **AC-4:** Merge rules: receipt items preserved (V1 authoritative), statement amount authoritative (V2 truthful)
- **AC-5:** Merge sets: statementVerified=true, statementVerifiedAt=now, statementImportId
- **AC-6:** Amount conflict flagged when abs(receipt.total - statement.amount) > threshold
- **AC-7:** Re-import protection: filter already-verified transactions before matching
- **AC-8:** Uses merchant_mappings for alias normalization before fuzzy matching
- **AC-9:** Group by cardHolderType before matching — titular statements match against user's transactions; additional cardholder transactions are "create new" by default (user can manually match)
- **AC-10:** Pure function interface: `matchStatementTransactions(statementTxns[], candidateTxns[])` — accepts any Transaction[] as candidates (extensible for Epic 19 group matching)

### Architectural
- **AC-ARCH-1:** Matching algorithm in `src/features/statement-scan/utils/transactionMatcher.ts`
- **AC-ARCH-2:** Merge logic in `src/features/statement-scan/utils/transactionMerger.ts`
- **AC-ARCH-3:** Pure functions with no UI dependencies — testable in isolation

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Matching algorithm | `src/features/statement-scan/utils/transactionMatcher.ts` | NEW |
| Merge logic | `src/features/statement-scan/utils/transactionMerger.ts` | NEW |
| Matcher tests | `tests/unit/features/statement-scan/transactionMatcher.test.ts` | NEW |
| Merger tests | `tests/unit/features/statement-scan/transactionMerger.test.ts` | NEW |
| Feature barrel | `src/features/statement-scan/index.ts` | MODIFY (export matcher + merger) |

## Tasks

### Task 1: Matching Algorithm (5 subtasks)
- [ ] 1.1: Create transactionMatcher: matchStatementTransactions(statementTxns[], candidateTxns[]) → MatchResult[] — pure function, no Firestore deps
- [ ] 1.2: Implement fuzzy merchant matching: normalize via merchant_mappings, then lowercase containment (reuse TD-18-6 approach) + Levenshtein similarity scoring for confidence
- [ ] 1.3: Implement composite scoring: merchant similarity + amount exact + date proximity (±5 days)
- [ ] 1.4: Classify confidence: HIGH (all 3 match), MEDIUM (2 of 3), LOW (1 of 3), NONE
- [ ] 1.5: Group statement transactions by cardHolderType before matching — titular matches normally, additional defaults to "create new"

### Task 2: Merge Logic (3 subtasks)
- [ ] 2.1: Create transactionMerger: mergeTransactions(existing, statement) → merged Transaction
- [ ] 2.2: Merge rules: receipt items preserved, statement amount authoritative, set statementVerified/At/ImportId
- [ ] 2.3: Handle amount conflicts: flag when abs(receipt.total - statement.amount) > threshold

### Task 3: Re-import Protection (2 subtasks)
- [ ] 3.1: Before matching, filter out already-verified transactions (statementVerified=true for same period)
- [ ] 3.2: Return re-import metadata: { alreadyVerifiedCount, filteredTransactions[] }

### Task 4: Tests (3 subtasks)
- [ ] 4.1: Matcher tests: exact match, fuzzy merchant, date range, no match, multiple candidates
- [ ] 4.2: Merger tests: merge with same amount, merge with conflict, preserve items, set verified fields
- [ ] 4.3: Re-import tests: already-verified filtering, mixed verified/unverified batches

### Task 5: Firestore Index (1 subtask)
- [ ] 5.1: Add composite index on `(userId, date, total)` to `firestore.indexes.json` for efficient matching queries

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 14
- **Files:** ~6

## Dependencies
- 18-4 statement UI (provides the statement scan flow and store)

## Risk Flags
- ALGORITHM_COMPLEXITY (fuzzy matching with confidence scoring is non-trivial)
