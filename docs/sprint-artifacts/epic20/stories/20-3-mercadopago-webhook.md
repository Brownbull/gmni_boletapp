# Story 20-3: Mercado Pago Payment Webhook

## Status: ready-for-dev

## Intent
**Epic Handle:** "Tickets at the door, wristbands inside"
**Story Handle:** "This story adds the cash register -- the server-side payment handler that issues wristbands"

## Story
As a system, I want a Cloud Function webhook that processes Mercado Pago payment notifications, so that subscription tiers are updated automatically when users pay.

## Acceptance Criteria

### Functional
- **AC-1:** Given an HTTP trigger Cloud Function `paymentWebhook`, when Mercado Pago POSTs a payment notification, then the subscription doc is updated
- **AC-2:** Given a successful payment, when processed, then user's tier is upgraded and tierExpiry is set
- **AC-3:** Given a failed/cancelled payment, when processed, then user's tier is downgraded to free
- **AC-4:** Given the webhook, when an invalid signature is received, then the request is REJECTED
- **AC-5:** Given the webhook, when processing completes, then Mercado Pago receives a 200 response (required for their retry logic)

### Architectural
- **AC-ARCH-LOC-1:** Webhook at `functions/src/payments/paymentWebhook.ts`
- **AC-ARCH-PATTERN-1:** HTTP trigger (not callable) -- Mercado Pago POSTs directly
- **AC-ARCH-PATTERN-2:** Signature validation before processing any payload
- **AC-ARCH-NO-1:** Client never handles payment credentials
- **AC-ARCH-NO-2:** No payment provider SDK on client side

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Payment webhook | `functions/src/payments/paymentWebhook.ts` | Cloud Function (HTTP) | NEW |
| Mercado Pago utils | `functions/src/payments/mercadopagoUtils.ts` | Utility | NEW |
| Payment types | `functions/src/payments/types.ts` | Types | NEW |
| Tests | `functions/src/payments/__tests__/paymentWebhook.test.ts` | Jest | NEW |
| Functions index | `functions/src/index.ts` | Barrel | MODIFIED |

## Tasks

### Task 1: Webhook Infrastructure (3 subtasks)
- [ ] 1.1: Create HTTP trigger Cloud Function -- receives POST from Mercado Pago
- [ ] 1.2: **HARDENING:** Validate webhook signature (Mercado Pago HMAC validation)
- [ ] 1.3: Parse payment notification payload: payment ID, status, external reference (userId)

### Task 2: Subscription Update Logic (3 subtasks)
- [ ] 2.1: On `approved` payment: update subscription doc with new tier, set tierExpiry, store externalSubscriptionId
- [ ] 2.2: On `cancelled`/`rejected`: downgrade to free tier
- [ ] 2.3: **HARDENING:** Idempotent processing -- handle duplicate notifications gracefully

### Task 3: Mercado Pago Configuration (2 subtasks)
- [ ] 3.1: Store Mercado Pago credentials as environment variables (Functions config)
- [ ] 3.2: Configure webhook URL in Mercado Pago dashboard (staging first)

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit tests: signature validation, payment status routing, subscription update
- [ ] 4.2: Unit tests: invalid signature rejected, duplicate notification handled

### Task 5: Build and Deploy (1 subtask)
- [ ] 5.1: `cd functions && npm run build` -- deploy to staging, test with Mercado Pago sandbox

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~5

## Dependencies
- **20-1** (subscription data model)

## Risk Flags
- DATA_PIPELINE (payment processing -- critical path)
- INPUT_SANITIZATION (webhook payload validation)
- ERROR_RESILIENCE (must always return 200 to avoid retries, even on internal errors)

## Dev Notes
- Architecture decision 3b: Cloud Function HTTP trigger, not callable
- Mercado Pago sandbox: use test credentials for development/staging. Production credentials only for production deploy.
- CRITICAL: Always return HTTP 200 to Mercado Pago, even if internal processing fails. Log errors, but don't trigger retries.
- External reference: encode userId in the payment metadata when creating the subscription (Story 20-4)
- NFR-5.3: "Mercado Pago integration processes payments server-side; client never handles payment credentials"
