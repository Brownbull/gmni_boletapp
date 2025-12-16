# Story 11.1: One Image = One Transaction

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Draft
**Story Points:** 3
**Dependencies:** None

---

## User Story

As a **user**,
I want **each image I scan to create exactly one transaction**,
So that **the scanning process is simple and predictable**.

---

## Acceptance Criteria

- [ ] **AC #1:** Single image upload enforced (multi-image selection removed)
- [ ] **AC #2:** Camera capture returns single image only
- [ ] **AC #3:** Clear messaging: "Escanea una boleta a la vez"
- [ ] **AC #4:** Legacy multi-image code paths removed or deprecated
- [ ] **AC #5:** Error handling for oversized images maintained
- [ ] **AC #6:** Existing single-image scan flow unchanged in behavior
- [ ] **AC #7:** Tests updated to reflect single-image assumption

---

## Tasks / Subtasks

### Task 1: Audit Current Multi-Image Code (0.5h)
- [ ] Identify all multi-image handling in scan flow
- [ ] Document code paths to simplify/remove
- [ ] List components affected: ScanView, image upload, processing queue

### Task 2: Simplify Image Upload Component (1h)
- [ ] Remove `multiple` attribute from file input
- [ ] Update drag-and-drop to accept single file only
- [ ] Add validation: reject if multiple files dropped
- [ ] Show friendly message if user tries multiple selection

### Task 3: Simplify Camera Capture (0.5h)
- [ ] Ensure camera returns single image
- [ ] Remove any multi-capture UI elements
- [ ] Clear any "capture next" logic if present

### Task 4: Update Scan Flow Logic (0.5h)
- [ ] Remove queue/batch processing for standard scan
- [ ] Simplify state: one image → one processing result
- [ ] Keep error retry for single image

### Task 5: Add User Messaging (0.25h)
- [ ] Add hint text: "Escanea una boleta a la vez"
- [ ] Add to translations (EN/ES)
- [ ] Show in scan view UI

### Task 6: Clean Up Legacy Code (0.5h)
- [ ] Remove or mark deprecated multi-image code
- [ ] Add comments explaining single-image design decision
- [ ] Document for future Batch Mode (Epic 12) reference

### Task 7: Testing (0.5h)
- [ ] Update unit tests to enforce single-image
- [ ] Test: multiple file drag rejected gracefully
- [ ] Test: existing single-image flow unchanged
- [ ] Manual test on mobile camera

---

## Technical Summary

This story simplifies the scan flow by enforcing "one image = one transaction" as the default mode. This reduces cognitive load for users and simplifies the codebase. Batch mode (Epic 12) will re-introduce multi-image support as a separate, explicit mode.

**Current Complexity:**
- File input may allow `multiple`
- Processing queue handles array of images
- State management for multiple pending scans

**Target Simplicity:**
- Single image input only
- One processing result
- Clear linear flow: capture → process → review → save

---

## Project Structure Notes

- **Files to modify:**
  - `src/views/ScanView.tsx` - Main scan UI
  - `src/components/ImageUpload.tsx` (if exists)
  - `src/services/scanService.ts` (if exists)
  - `src/utils/translations.ts` - Add messaging

- **Estimated effort:** 3 story points (~4-5 hours)
- **Prerequisites:** None

---

## Key Code References

**Current State (to audit):**
```typescript
// Check for multi-image handling
<input type="file" accept="image/*" multiple />

// Check for array processing
const processImages = async (images: File[]) => { ... }
```

**Target State:**
```typescript
// Single image only
<input type="file" accept="image/*" />

// Single image processing
const processImage = async (image: File) => { ... }
```

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 11 scope
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Quick Save flow

---

## Definition of Done

- [ ] All 7 acceptance criteria verified
- [ ] Single image enforced in all scan entry points
- [ ] Multi-image selection gracefully rejected
- [ ] User messaging added
- [ ] Tests updated and passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
