# Story {{N}}.{{M}}: {{story_title}}

**Status:** Draft

---

## User Story

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

---

## Acceptance Criteria

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}

**And** {{additional_criteria}}

---

## Implementation Details

### Tasks / Subtasks

{{tasks_subtasks}}

### Technical Summary

{{technical_summary}}

### Project Structure Notes

- **Files to modify:** {{files_to_modify}}
- **Expected test locations:** {{test_locations}}
- **Estimated effort:** {{story_points}} story points ({{time_estimate}})
- **Prerequisites:** {{dependencies}}

### Key Code References

{{existing_code_references}}

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis (if applicable)
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** {{architecture_references}}

<!-- Additional context XML paths will be added here if story-context workflow is run -->

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->

---

## Deployment Checklist

<!-- Use this section to track deployment steps after code review approval -->

### Git Workflow

- [ ] Feature branch merged to `develop`
- [ ] PR created: `develop` → `staging`
- [ ] Staging PR merged (resolve any conflicts)
- [ ] PR created: `staging` → `main`
- [ ] Main PR merged (resolve any conflicts)

**Branch Strategy Reference:** [docs/branching-strategy.md](../../docs/branching-strategy.md)

### Firebase Deployment

```bash
# 1. Build and deploy Cloud Functions (if modified)
npm --prefix functions run build
firebase deploy --only functions

# 2. Deploy Hosting (if frontend modified)
npm run build
firebase deploy --only hosting

# 3. Deploy Storage Rules (if modified)
firebase deploy --only storage

# 4. Deploy Firestore Rules (if modified)
firebase deploy --only firestore:rules
```

### Production Verification

- [ ] Application accessible at production URL
- [ ] Cloud Functions operational (check Firebase Console)
- [ ] No new errors in Cloud Functions logs
- [ ] Feature working as expected in production
- [ ] Cost monitoring: No unexpected charges

### Conflict Resolution Process

If merge conflicts occur:
1. Create fix branch from target: `git checkout -b fix/<target>-merge-conflicts <target>`
2. Merge source into fix branch: `git merge origin/<source>`
3. Resolve conflicts and commit
4. Create PR: fix branch → target branch
5. After merge, delete fix branch
