# Story 20-2: Subscription Store and Client-Side Feature Gating

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story adds the wristband scanner at each door -- client checks tier before showing premium features"

## Story
As a user, I want premium features hidden or prompted when I'm on the free tier, so that I understand what upgrading would unlock.

## Acceptance Criteria

### Functional
- **AC-1:** Given subscription store uses onSnapshot, when subscription changes server-side, then client updates in real-time
- **AC-2:** Given a free-tier user, when they access a pro feature (e.g., advanced export), then an upgrade prompt is shown
- **AC-3:** Given a pro-tier user, when they access a pro feature, then the feature works normally
- **AC-4:** Given `useSubscriptionGating` hook, when called with a feature name, then it returns `{ allowed: boolean, tier: string, upgrade: () => void }`

### Architectural
- **AC-ARCH-LOC-1:** Store at `src/features/subscription/stores/useSubscriptionStore.ts`
- **AC-ARCH-LOC-2:** Gating hook at `src/features/subscription/hooks/useSubscriptionGating.ts`
- **AC-ARCH-LOC-3:** Upgrade prompt at `src/features/subscription/components/UpgradePrompt.tsx`
- **AC-ARCH-PATTERN-1:** TanStack Query + onSnapshot for real-time subscription state
- **AC-ARCH-PATTERN-2:** Client gating is UX only -- server verifies before execution (NFR-2.9)
- **AC-ARCH-NO-1:** No hardcoded tier checks scattered in components -- all through useSubscriptionGating

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Subscription store | `src/features/subscription/stores/useSubscriptionStore.ts` | Zustand + TQ | NEW |
| Gating hook | `src/features/subscription/hooks/useSubscriptionGating.ts` | Feature hook | NEW |
| Upgrade prompt | `src/features/subscription/components/UpgradePrompt.tsx` | FSD component | NEW |
| Subscription banner | `src/features/subscription/components/SubscriptionBanner.tsx` | FSD component | NEW |
| Tests | `tests/unit/features/subscription/` | Vitest | NEW |

## Tasks

### Task 1: Subscription Store (2 subtasks)
- [ ] 1.1: Create store with TanStack Query + onSnapshot for real-time subscription doc
- [ ] 1.2: Handle missing subscription doc (no doc = free tier)

### Task 2: Gating Hook (2 subtasks)
- [ ] 2.1: Create `useSubscriptionGating(featureName)` -- checks tier config against current tier
- [ ] 2.2: Return `{ allowed, requiredTier, showUpgrade }` for component consumption

### Task 3: UI Components (3 subtasks)
- [ ] 3.1: Create `UpgradePrompt.tsx` -- modal showing feature benefits and upgrade CTA
- [ ] 3.2: Create `SubscriptionBanner.tsx` -- persistent banner for free users showing current tier and upgrade option
- [ ] 3.3: **HARDENING (PURE_COMPONENT):** Handle loading state (subscription not yet loaded)

### Task 4: Integration Points (2 subtasks)
- [ ] 4.1: Add gating to CSV export (premium analytics export)
- [ ] 4.2: Add gating to groups feature (group creation requires pro tier)

### Task 5: Tests and Verification (2 subtasks)
- [ ] 5.1: Unit tests: gating hook returns correct values for free/pro/max
- [ ] 5.2: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~5

## Dependencies
- **20-1** (types and tier config)

## Risk Flags
- PURE_COMPONENT (loading state, tier display)
- CROSS_STORE (subscription store read by multiple features)

## Dev Notes
- Architecture doc: "Client checks for UX, server verifies before execution. Subscription uses onSnapshot for real-time updates."
- Absence of subscription doc = free tier. Don't create a default doc for every user.
- The gating hook should be the ONLY way components check tier -- no direct tier comparisons in components.
- Integration points (export, groups) will need minor modifications to existing components to call `useSubscriptionGating`.
