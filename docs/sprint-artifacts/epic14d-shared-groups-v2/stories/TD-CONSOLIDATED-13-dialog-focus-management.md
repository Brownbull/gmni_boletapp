# TD-CONSOLIDATED-13: Dialog Focus Management

Status: backlog

> **Tier:** 5 - Technical Improvements (BACKLOG)
> **Consolidated from:** TD-14d-17, TD-14d-18
> **Priority:** LOW
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **consistent focus cleanup and management across all dialog components**,
So that **accessibility is maintained and focus traps work correctly**.

## Problem Statement

Dialog components have inconsistent focus management:
1. Focus timeout cleanup varies between dialogs
2. RecoverySyncPrompt lacks error state + focus management tests
3. Some dialogs don't properly restore focus on close

## Acceptance Criteria

- [ ] Standardize focus timeout cleanup pattern across dialogs
- [ ] Add error state + focus management tests for RecoverySyncPrompt
- [ ] Ensure all dialogs restore focus on close
- [ ] All accessibility tests pass

## Cross-References

- **Original stories:**
  - [TD-14d-17](TD-ARCHIVED/TD-14d-17-recovery-prompt-test-coverage.md) - RecoverySyncPrompt test coverage
  - [TD-14d-18](TD-ARCHIVED/TD-14d-18-dialog-focus-cleanup.md) - Dialog focus cleanup
- **Source:** ECC Parallel Review (2026-02-04) on story 14d-v2-1-9
