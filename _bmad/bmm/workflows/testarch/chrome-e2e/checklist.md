# Chrome E2E Workflow Checklist

## Pre-Session Validation

### Environment Requirements

- [ ] **CLI Environment**: Using Claude Code CLI (NOT VS Code extension)
- [ ] **Chrome Running**: Chrome browser is open in WSL
- [ ] **Extension Connected**: `/chrome` shows "Extension: Installed"
- [ ] **Tab Available**: Can get tab context with Chrome MCP tools
- [ ] **Dev Server Running**: Application accessible at configured base_url

### Project Setup

- [ ] **Test Directory Exists**: `tests/e2e/` directory present
- [ ] **Playwright Configured**: `playwright.config.ts` exists
- [ ] **data-testid Attributes**: Key UI elements have testable selectors

---

## Session Execution Validation

### Step 1: Chrome Initialization

- [ ] Tab context retrieved successfully
- [ ] Navigation to base URL completed
- [ ] Baseline screenshot captured
- [ ] Page fully loaded (no loading spinners)

### Step 2: Visual Inspection

- [ ] Target feature/screen identified
- [ ] All relevant UI states captured
- [ ] Screenshots are clear and complete
- [ ] Interactive elements are clickable

### Step 3: DevTools Integration (if used)

- [ ] Network requests visible/captured
- [ ] Console errors checked
- [ ] Performance metrics captured (if needed)
- [ ] DOM inspectable via execute_js

### Step 4: Interactive Debugging (if needed)

- [ ] Issues properly diagnosed
- [ ] Root cause identified
- [ ] Workarounds documented
- [ ] Screenshots of error states captured

### Step 5: Test Generation

- [ ] Test file follows Playwright conventions
- [ ] Uses data-testid selectors (not CSS classes)
- [ ] Includes proper assertions
- [ ] Tests are isolated (no shared state)
- [ ] Generated tests pass when run

---

## Quality Criteria

### Screenshot Quality

| Criterion | Pass | Fail |
|-----------|------|------|
| Full viewport captured | ✅ | ❌ |
| Content visible (not loading) | ✅ | ❌ |
| No black/empty screenshots | ✅ | ❌ |
| Relevant UI elements visible | ✅ | ❌ |

### Test File Quality

| Criterion | Pass | Fail |
|-----------|------|------|
| TypeScript/JavaScript valid | ✅ | ❌ |
| Selectors are stable (data-testid) | ✅ | ❌ |
| Assertions are meaningful | ✅ | ❌ |
| No hardcoded waits (sleep) | ✅ | ❌ |
| Auto-cleanup if creates data | ✅ | ❌ |

### Session Documentation

| Criterion | Pass | Fail |
|-----------|------|------|
| Session log created | ✅ | ❌ |
| Screenshots saved/referenced | ✅ | ❌ |
| Issues documented with details | ✅ | ❌ |
| Next steps identified | ✅ | ❌ |

---

## Common Issues Checklist

### If Chrome Tools Not Available

- [ ] Confirmed using CLI (not VS Code extension)
- [ ] Ran `/chrome` to check status
- [ ] Tried "Reconnect extension" option
- [ ] Restarted Claude Code session
- [ ] Verified Chrome is running before starting Claude

### If Screenshots Fail

- [ ] Chrome window is visible (not minimized)
- [ ] Page has finished loading
- [ ] Content is rendered (not just skeleton)
- [ ] No modal/overlay blocking content

### If Clicks Don't Work

- [ ] Coordinates are within viewport
- [ ] Element is not covered by another element
- [ ] Element is not disabled
- [ ] Tried JS click as alternative

### If Navigation Fails

- [ ] Dev server is running
- [ ] URL is correct (port, protocol)
- [ ] No auth redirect blocking
- [ ] Network is accessible

---

## Session Completion Checklist

Before ending the session, verify:

- [ ] All target features have been tested
- [ ] Screenshots document key states
- [ ] Issues are logged with reproduction steps
- [ ] Test files are generated (if applicable)
- [ ] Generated tests pass
- [ ] Session summary saved to output folder
- [ ] Browser state cleaned up (logged out, storage cleared if needed)

---

## Output Artifacts

### Required

- [ ] Session log markdown file
- [ ] At least one screenshot per tested feature

### Optional (based on session mode)

- [ ] Generated Playwright test files
- [ ] Bug reports for issues found
- [ ] Performance metrics captured
- [ ] Network HAR file (if recorded)

---

## Sign-off

| Item | Status | Notes |
|------|--------|-------|
| Environment validated | | |
| Session completed | | |
| Tests generated (if applicable) | | |
| Documentation complete | | |
| Ready for PR/review | | |

**Tested by**: _______________
**Date**: _______________
**Session duration**: _______________
