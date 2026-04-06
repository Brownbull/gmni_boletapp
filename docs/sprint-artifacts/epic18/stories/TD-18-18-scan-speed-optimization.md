# Tech Debt Story TD-18-18: Scan Speed Optimization

Status: drafted

> **Source:** Production scan latency 2026-04-02 (12-24s per scan)
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Receipt scanning should feel like a camera shutter, not a loading bar"
**Value:** V5 — "Easier than the receipt drawer" — 12-24s scans push users back to manual entry. Target: under 8s for single receipts.

## Story
As a **user**, I want **receipt scans to complete in under 8 seconds**, so that **scanning feels instant and I reach for the camera instead of the keyboard**.

## Background

### Current Performance (production, 2026-04-02)
| Scan | Items | queueReceiptScan | processReceiptScan | Total |
|------|-------|------------------|--------------------|-------|
| #1 | 1 item | 4.0s | 12.6s | 16.6s |
| #2 | 20 items | 4.2s | 24.1s | 28.3s |
| #3 | failed | 4.3s | 18.6s | 22.9s |

### Breakdown: Where time goes
1. **queueReceiptScan (~4s):** Client image upload to Storage + Firestore transaction for credit deduction + doc creation. The 4s is mostly image upload over mobile networks.
2. **processReceiptScan (12-24s):**
   - Image fetch from Storage: ~1s
   - Image resize/compress (sharp): ~1s
   - **Gemini API call: 8-20s** — THIS is the bottleneck
   - Thumbnail generation + Firestore write: <1s

### Root Cause: Gemini model choice
The code defaults to `gemini-2.5-flash` (line 249 of processReceiptScan.ts) — a thinking model. TD-18-11 identified this as the problem and planned a switch to `gemini-2.5-flash-lite` (non-thinking), but the default in code is still `gemini-2.5-flash`.

The `GEMINI_MODEL` env var is NOT set in `functions/.env`, so the default applies. TD-18-11 may have set it via `firebase functions:config` which was lost on redeploy.

### Previous Investigation (TD-18-11)
- `gemini-2.0-flash`: 2-5s but deprecated June 2026
- `gemini-2.5-flash`: 14-36s (thinking model, current default)
- `gemini-2.5-flash-lite`: non-thinking variant, expected 3-8s

## Acceptance Criteria

### Task 1: Investigate current model and set correct default
- [ ] AC-1: Check which model is actually running in production (`firebase functions:config:get` or logs)
- [ ] AC-2: Update `processReceiptScan.ts` default from `gemini-2.5-flash` to `gemini-2.5-flash-lite` (or the current best non-thinking model)
- [ ] AC-3: Update `ALLOWED_GEMINI_MODELS` list with current available models
- [ ] AC-4: Set `GEMINI_MODEL` explicitly in `functions/.env` so default isn't relied on

### Task 2: Optimize image pipeline
- [ ] AC-5: Review `resizeAndCompress` settings — current is max 1200x1600, JPEG 80%. Could lower to 800x1200 JPEG 70% for scan (Gemini doesn't need high res for text extraction)
- [ ] AC-6: Measure impact: scan same receipt with current vs optimized image settings, compare Gemini response quality and speed

### Task 3: Optimize prompt
- [ ] AC-7: Review current prompt length and structure — shorter prompts = faster inference
- [ ] AC-8: If prompt is >500 tokens, look for ways to compress without losing extraction quality

### Task 4: Verify improvement
- [ ] AC-9: Deploy to staging and time 3 scans with fixture mode OFF (real Gemini)
- [ ] AC-10: Target: processReceiptScan under 8s for single-page receipts
- [ ] AC-11: Document final model choice and timings in story completion notes

## Technical Notes
- The `GEMINI_MODEL` env var approach is correct — allows per-environment override without code change
- `gemini-2.5-flash-lite` needs to be verified as available in the API (check Gemini model list)
- Image optimization is a secondary lever — model choice is 80%+ of the improvement
- Don't optimize prompt at the cost of extraction quality (we have 15 test receipts to validate against)

## Dependencies
- None — self-contained optimization

## Files Likely Touched
1. `functions/src/processReceiptScan.ts` (edit — default model, allowed list)
2. `functions/.env` (edit — set GEMINI_MODEL explicitly)
3. `functions/src/imageProcessing.ts` (edit — resize params, if optimizing)
4. `prompt-testing/prompts/` (edit — if prompt optimization needed)
