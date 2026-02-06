# Business Documentation

**Location:** `docs/business/`
**Last Updated:** 2026-01-13

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

### [Cost Optimization Opportunities](./cost-optimization-opportunities.md)
Analysis of AI provider alternatives, compression strategies, and hybrid architectures to reduce per-scan costs. **Key finding:** Document AI hybrid approach could reduce costs by 77%.

### [Admin Procedures](./admin-procedures.md)
Firebase console procedures for administrative tasks.

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-29 | 4-tier model (Free/Basic/Pro/Max) | Provides affordable entry ($2-3) while scaling to power users |
| 2025-11-29 | 12-month rolling retention for paid tiers | Balances storage costs with user value |
| 2025-11-29 | Scan = Image Storage (unified) | Simplifies mental model, ensures consistency |
| 2025-11-29 | CLP pricing (Chilean Pesos) | Target market is Chile via Mercado Pago |
| 2026-01-13 | Story 14.32 audit confirms healthy costs | No leakage found, Firestore 95% optimized |
| 2026-01-13 | Gemini API = 97% of variable costs | Document AI hybrid identified as best optimization path |

---

## Future Considerations

- **Analytics Tiers**: Simple vs Advanced analytics may affect pricing
- **Annual Discounts**: Consider 10-20% discount for annual subscriptions
- **Enterprise Tier**: If business users emerge, consider team/organization pricing
- **Currency Expansion**: USD/EUR pricing if expanding beyond Chile

---

## Related Documents

- [Epic 7: Subscription & Monetization](../epics.md#epic-7-subscription--monetization)
- [Epic 4.5: Receipt Image Storage](../sprint-artifacts/epic4/epic-4-retro-2025-11-29.md)
- [Architecture: Security & Authentication](../architecture/architecture.md)
