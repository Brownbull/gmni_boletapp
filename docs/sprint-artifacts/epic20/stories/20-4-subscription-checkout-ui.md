# Story 20-4: Subscription Checkout & Upgrade UI

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story builds the ticket counter -- the client-side flow where users pick a wristband and pay"

## Story
As a user, I want to view subscription plans and upgrade via Mercado Pago checkout, so that I can unlock premium features.

## Acceptance Criteria

### Functional
- **AC-1:** Given a free-tier user, when they tap "Upgrade" from the UpgradePrompt or SubscriptionBanner, then a plan selection view is shown
- **AC-2:** Given plan selection, when user selects a tier (pro/max), then they are redirected to Mercado Pago checkout with correct plan details
- **AC-3:** Given successful payment redirect back, when user returns to app, then subscription status reflects the new tier (via onSnapshot from 20-1)
- **AC-4:** Given a subscribed user, when they view subscription settings, then they see current tier, expiry date, and option to manage subscription
- **AC-5:** Given Mercado Pago checkout, when user cancels payment, then they return to the app in their current tier with no error

### Architectural
- **AC-ARCH-LOC-1:** Plan selection at `src/features/subscription/views/PlanSelectionView.tsx`
- **AC-ARCH-LOC-2:** Subscription settings at `src/features/subscription/views/SubscriptionSettingsView.tsx`
- **AC-ARCH-PATTERN-1:** Mercado Pago checkout URL generated server-side (Cloud Function), client only redirects
- **AC-ARCH-PATTERN-2:** No payment credentials or SDK on client side (NFR-5.3)
- **AC-ARCH-NO-1:** Client never constructs payment URLs directly
- **AC-ARCH-NO-2:** No polling for payment status -- onSnapshot handles real-time updates

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Plan selection view | `src/features/subscription/views/PlanSelectionView.tsx` | FSD view | NEW |
| Subscription settings | `src/features/subscription/views/SubscriptionSettingsView.tsx` | FSD view | NEW |
| Checkout Cloud Function | `functions/src/payments/createCheckout.ts` | Cloud Function (callable) | NEW |
| Checkout hook | `src/features/subscription/hooks/useCheckout.ts` | Feature hook | NEW |
| Routes | `src/app/routes.tsx` | App config | MODIFIED |
| Tests | `tests/unit/features/subscription/useCheckout.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Checkout Cloud Function (3 subtasks)
- [ ] 1.1: Create `createCheckout` callable Cloud Function -- accepts tier, userId, generates Mercado Pago preference with back_urls
- [ ] 1.2: Include userId in `external_reference` for webhook correlation (Story 20-3)
- [ ] 1.3: **HARDENING (INPUT_SANITIZATION):** Validate tier parameter (must be 'pro' or 'max'), sanitize all inputs

### Task 2: Checkout Hook (2 subtasks)
- [ ] 2.1: Create `useCheckout` hook -- calls createCheckout Cloud Function, handles redirect to Mercado Pago
- [ ] 2.2: Handle checkout errors (network failure, invalid response) with user-facing messages

### Task 3: Plan Selection UI (3 subtasks)
- [ ] 3.1: Create `PlanSelectionView.tsx` -- shows tier cards (free/pro/max) with feature comparison
- [ ] 3.2: Wire "Select Plan" button to `useCheckout` hook
- [ ] 3.3: **HARDENING (PURE_COMPONENT):** Loading state during checkout creation, error state on failure

### Task 4: Subscription Settings (2 subtasks)
- [ ] 4.1: Create `SubscriptionSettingsView.tsx` -- shows current tier, expiry, manage link
- [ ] 4.2: Add route and navigation entry for subscription settings

### Task 5: Tests and Build (2 subtasks)
- [ ] 5.1: Unit tests: useCheckout hook, plan selection rendering, settings display
- [ ] 5.2: `cd functions && npm run build` and `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~6

## Dependencies
- **20-1** (tier config, types)
- **20-2** (subscription store, gating hook, UpgradePrompt triggers this flow)
- **20-3** (webhook processes the payment after checkout)

## Risk Flags
- INPUT_SANITIZATION (tier parameter validation in Cloud Function)
- PURE_COMPONENT (loading/error states in checkout flow)

## Dev Notes
- Mercado Pago Checkout Pro: create a "preference" server-side, redirect user to Mercado Pago's hosted checkout page. No SDK on client.
- `back_urls`: success/failure/pending URLs point back to the app. On return, the subscription store's onSnapshot picks up the tier change.
- The `external_reference` field links payment to userId -- this is how the webhook (20-3) knows which user to update.
- Sandbox mode for development: use Mercado Pago test credentials and test cards.
- Architecture decision 3b: HTTP trigger for webhook (20-3), callable for checkout creation (this story).
