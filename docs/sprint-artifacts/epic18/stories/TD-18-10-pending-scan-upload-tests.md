# Tech Debt Story TD-18-10: Pending Scan Upload Service Tests

Status: done

> **Source:** ECC Code Review (2026-03-17) on story 18-13b
> **Priority:** HIGH | **Estimated Effort:** 2 points
> **Stage:** MVP

## Story
As a **developer**, I want **unit tests for pendingScanUpload.ts (uploadScanImages + copyPendingToReceipts)**, so that **the async scan upload pipeline has regression coverage for progress tracking, error paths, MIME validation, and image count limits**.

## Acceptance Criteria
- AC-1: `uploadScanImages` tested: success path with progress callback assertions
- AC-2: `uploadScanImages` tested: upload failure returns meaningful error
- AC-3: `uploadScanImages` tested: empty array returns empty array
- AC-4: `uploadScanImages` tested: exceeding MAX_SCAN_IMAGES throws
- AC-5: `base64ToBlob` tested: rejects non-allowlisted MIME types
- AC-6: `base64ToBlob` tested: rejects malformed data URLs
- AC-7: `copyPendingToReceipts` tested: success with progress callback
- AC-8: `copyPendingToReceipts` tested: rejects non-Firebase-Storage URLs
- AC-9: Test file stays under 300-line limit

## Tasks
- [x] 1.1: Create `tests/unit/features/scan/services/pendingScanUpload.test.ts`
- [x] 1.2: Mock `firebase/storage` (ref, uploadBytesResumable, getDownloadURL)
- [x] 1.3: Test `uploadScanImages` success, progress, failure, empty, limit
- [x] 1.4: Test `base64ToBlob` MIME validation and malformed input
- [x] 1.5: Test `copyPendingToReceipts` success, progress, URL validation

## Dev Notes
- Source story: [18-13b](./18-13b-resilient-scan-client.md)
- Review findings: #7 (TDD guide — zero test coverage for 118-line service)
- Files affected: `src/features/scan/services/pendingScanUpload.ts`
- Firebase Storage mocks: use same pattern as scan hook tests (vi.mock + callbacks)

## Senior Developer Review (ECC)

- **Date:** 2026-03-18
- **Classification:** COMPLEX (11 files)
- **Agents:** code-reviewer, security-reviewer (opus), architect (opus), tdd-guide
- **Overall Score:** 8.2/10
- **Outcome:** APPROVE with 6 quick fixes, 4 PROD backlog deferrals
- **Quick fixes applied:** mock comment (#2), progress assertion (#5), console.error removal (#6), intermediate progress (#9), webp test (#10), fetch URL assertion (#11)
- **Backlog:** 4 PROD items added to deferred-findings.md (file size limit, path validation, URL hardening, response.ok check)

<!-- CITED: L2-004, L2-008 -->
