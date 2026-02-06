# Tech Debt Story TD-14d-55: groupId Field Path Injection Validation

Status: ready-for-dev

> **Source:** ECC Security Review (2026-02-05) on story 14d-v2-1-12a
> **Priority:** MEDIUM (security improvement)
> **Estimated Effort:** S (1-2 hrs)
> **Risk:** MEDIUM (potential data corruption)

## Story

As a **developer**,
I want **groupId parameters validated before use in Firestore field paths**,
So that **malicious or malformed groupIds cannot cause unintended data writes**.

## Problem Statement

The `groupId` parameter in `setGroupPreference()` (and similar functions) is used directly in Firestore field paths without validation:

```typescript
// src/services/userPreferencesService.ts:258
await setDoc(
  docRef,
  {
    [`groupPreferences.${groupId}`]: preference,  // Direct interpolation
  },
  { merge: true }
);
```

A malicious `groupId` containing dots (`.`) could:
- Write to unintended nested paths (e.g., `groupId = "foo.bar"` creates `groupPreferences.foo.bar`)
- Potentially overwrite sibling fields if carefully crafted
- Cause data structure corruption

While Firestore has some built-in protections, explicit validation provides defense-in-depth.

## Acceptance Criteria

**AC1:** Given a `groupId` containing invalid characters (`. / [ ] * \``), When `setGroupPreference()` is called, Then it throws a validation error before Firestore write

**AC2:** Given a `groupId` exceeding 128 characters, When any group preference function is called, Then it throws a validation error

**AC3:** Given an empty or null `groupId`, When any group preference function is called, Then it throws a validation error

**AC4:** Given a valid `groupId`, When any group preference function is called, Then it proceeds normally

**AC5:** Given the validation function exists, Then it is reusable across all functions that use groupId in field paths

## Tasks / Subtasks

### Task 1: Create Validation Utility

- [ ] 1.1 Create `validateGroupId(groupId: string): void` function in appropriate location
- [ ] 1.2 Validate against Firestore reserved characters: `. / [ ] * \``
- [ ] 1.3 Validate max length (128 characters recommended, Firestore limit is 1500 bytes)
- [ ] 1.4 Validate non-empty/non-null
- [ ] 1.5 Throw descriptive error on validation failure

### Task 2: Apply Validation to Service Functions

- [ ] 2.1 Add validation to `setGroupPreference()` (line 240)
- [ ] 2.2 Add validation to `getGroupPreference()` (line 277)
- [ ] 2.3 Add validation to `removeGroupPreference()` (line 302)
- [ ] 2.4 Review other functions that use groupId in field paths

### Task 3: Write Tests

- [ ] 3.1 Test validation rejects dots in groupId
- [ ] 3.2 Test validation rejects slashes in groupId
- [ ] 3.3 Test validation rejects brackets in groupId
- [ ] 3.4 Test validation rejects too-long groupIds
- [ ] 3.5 Test validation rejects empty/null groupIds
- [ ] 3.6 Test validation accepts valid groupIds (nanoid format)

## Dev Notes

### Security Context

This is a **defense-in-depth** measure. The attack surface is limited because:
1. GroupIds are generated server-side or via nanoid (controlled format)
2. Firestore security rules provide authentication
3. Document structure limits impact

However, explicit validation:
- Prevents accidental bugs from malformed data
- Provides clear error messages for debugging
- Follows secure coding best practices

### Proposed Implementation

```typescript
// src/utils/validation.ts or src/services/userPreferencesService.ts

/**
 * Validates a groupId for use in Firestore field paths.
 *
 * @param groupId - The group ID to validate
 * @throws Error if groupId is invalid
 */
export function validateGroupId(groupId: string): void {
  if (!groupId || typeof groupId !== 'string') {
    throw new Error('groupId is required and must be a string');
  }

  // Firestore field path reserved characters
  const invalidChars = /[\/\.\[\]\*`]/;
  if (invalidChars.test(groupId)) {
    throw new Error('groupId contains invalid characters for Firestore field path');
  }

  // Reasonable length limit
  if (groupId.length > 128) {
    throw new Error('groupId exceeds maximum length of 128 characters');
  }
}
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Context window fit | 1-2 hrs | Clean separation |
| Sprint capacity | Uses time | Future sprint |
| Accumulation risk | Other services also lack validation | Compound risk |
| Dependency risk | May affect future stories | Should prioritize |

**Recommendation:** Prioritize in next sprint - security concern with defense-in-depth value.

### Dependencies

- None

### Related TD Stories

- TD-14d-39-server-side-rate-limiting - Also addresses input validation at server level
- TD-14d-45-runtime-boolean-validation - Similar runtime validation pattern

### References

- [14d-v2-1-12a-foundation-types-cooldown.md](./14d-v2-1-12a-foundation-types-cooldown.md) - Source of this tech debt item
- ECC Security Review 2026-02-05 - Finding [M1]
- OWASP A03:2021 - Injection
