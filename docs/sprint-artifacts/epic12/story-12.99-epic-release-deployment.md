# Story 12.99: Epic Release Deployment

**Epic:** Epic 12 - Batch Mode
**Status:** Draft
**Story Points:** 2
**Dependencies:** All previous Epic 12 stories (12.1 - 12.5)

---

## User Story

As a **product owner**,
I want **Epic 12 deployed to production with verified functionality**,
So that **users who accumulate receipts can use batch processing**.

---

## Acceptance Criteria

- [ ] **AC #1:** All Epic 12 stories completed and code-reviewed
- [ ] **AC #2:** All unit tests passing
- [ ] **AC #3:** E2E tests verify batch flow end-to-end
- [ ] **AC #4:** Staging environment deployment successful
- [ ] **AC #5:** Manual QA verification of batch features
- [ ] **AC #6:** Production deployment completed
- [ ] **AC #7:** Credit system verified working correctly
- [ ] **AC #8:** Rollback plan documented and tested

---

## Tasks / Subtasks

### Task 1: Pre-Deployment Verification (0.5h)
- [ ] Verify all Epic 12 stories marked as Done
- [ ] Run full test suite
- [ ] Run build
- [ ] Check bundle size impact

### Task 2: E2E Test Updates (0.5h)
- [ ] Add E2E tests for batch flow:
  - [ ] Enter batch mode → capture multiple images
  - [ ] Process batch → parallel processing works
  - [ ] Review queue → edit individual receipt
  - [ ] Save all → credits deducted correctly
  - [ ] Batch insight appears
- [ ] Test credit warning system

### Task 3: Manual QA Checklist (0.5h)
- [ ] **Batch Capture:**
  - [ ] Mode toggle works
  - [ ] Can capture up to 10 images
  - [ ] Thumbnail strip displays correctly
  - [ ] Can remove images before processing
- [ ] **Parallel Processing:**
  - [ ] Multiple images process simultaneously
  - [ ] Individual status per image
  - [ ] Error handling per image
- [ ] **Batch Review:**
  - [ ] All receipts shown with summary
  - [ ] Can edit individual receipts
  - [ ] Can discard receipts
  - [ ] Total updates correctly
- [ ] **Credits:**
  - [ ] Warning shows before processing
  - [ ] Insufficient credits blocks batch
  - [ ] Credits deducted on save
- [ ] **Batch Insight:**
  - [ ] Shows aggregate summary
  - [ ] Celebration for 5+ receipts

### Task 4: Production Deployment (0.25h)
- [ ] Deploy to Firebase production
- [ ] Verify credit system in production
- [ ] Monitor error logs

### Task 5: Post-Deployment Verification (0.25h)
- [ ] Smoke test batch flow on production
- [ ] Verify credits working
- [ ] Check for errors

---

## Technical Summary

This story ensures Epic 12 is properly deployed with special attention to the credit system integration and parallel processing reliability.

**Key Verification Points:**
- Credit deduction accuracy
- Parallel processing doesn't lose results
- Batch insight generation works
- Mobile performance acceptable

---

## Release Notes Template

```markdown
# Boletapp - Epic 12 Release

## What's New

### Batch Mode 📦
- Process up to 10 receipts at once
- Parallel processing for faster completion
- Review all before saving

### Credit Transparency 💳
- Clear warning before batch processing
- Know exactly how many credits you'll use
- Credits only charged on successful saves

### Batch Insights 📊
- See aggregate summary after batch save
- Top category, total amount at a glance
- Celebration for big batches!
```

---

## Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Batch flow works end-to-end
- [ ] Credit system accurate
- [ ] No critical bugs
- [ ] Rollback plan documented

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
