# Business Documentation

**Location:** `docs/business/`
**Last Updated:** 2025-11-29

---

## Overview

This folder contains business strategy, pricing, and cost analysis documents for Boletapp. These documents inform product decisions and ensure sustainable business operations.

---

## Documents

### [Pricing Model](./pricing-model.md)
Subscription tier structure, feature allocation, and pricing ranges.

### [Cost Analysis](./cost-analysis.md)
Detailed breakdown of infrastructure costs by component (storage, API, compute).

### [Revenue Projections](./revenue-projections.md)
Scenario modeling at different user scales and price points.

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-29 | 4-tier model (Free/Basic/Pro/Max) | Provides affordable entry ($2-3) while scaling to power users |
| 2025-11-29 | 12-month rolling retention for paid tiers | Balances storage costs with user value |
| 2025-11-29 | Scan = Image Storage (unified) | Simplifies mental model, ensures consistency |
| 2025-11-29 | CLP pricing (Chilean Pesos) | Target market is Chile via Mercado Pago |

---

## Future Considerations

- **Analytics Tiers**: Simple vs Advanced analytics may affect pricing
- **Annual Discounts**: Consider 10-20% discount for annual subscriptions
- **Enterprise Tier**: If business users emerge, consider team/organization pricing
- **Currency Expansion**: USD/EUR pricing if expanding beyond Chile

---

## Related Documents

- [Epic 7: Subscription & Monetization](../planning/epics.md#epic-7-subscription--monetization)
- [Epic 4.5: Receipt Image Storage](../sprint-artifacts/epic4/epic-4-retro-2025-11-29.md)
- [Architecture: Security & Authentication](../architecture/architecture.md)
