# Revenue Projections

**Version:** 1.0
**Last Updated:** 2025-11-29
**Status:** Projections for planning purposes

---

## Assumptions

### User Distribution
- **Free:** 80% of total users
- **Basic/Pro (Mid-tier):** 15% of total users
- **Max (High-tier):** 5% of total users

### Pricing Scenarios
Testing multiple price points to inform final pricing decisions:

| Scenario | Basic | Pro | Max |
|----------|-------|-----|-----|
| Low | $2 | $4 | $10 |
| Mid | $2.50 | $4.50 | $10 |
| High | $3 | $5 | $10 |

---

## Revenue Projections by Scale

### Scenario: 10,000 Users

**User Breakdown:**
- Free: 8,000 users
- Paid (Mid): 1,500 users
- Paid (High): 500 users

| Price Point | Mid Revenue | High Revenue | Total Revenue | Total Cost | Net Margin |
|-------------|-------------|--------------|---------------|------------|------------|
| $2 / $4 / $10 | $6,000 | $5,000 | $11,000 | $342 | $10,658 (96.9%) |
| $2.50 / $4.50 / $10 | $6,750 | $5,000 | $11,750 | $342 | $11,408 (97.1%) |
| $3 / $5 / $10 | $7,500 | $5,000 | $12,500 | $342 | $12,158 (97.3%) |

---

### Scenario: 25,000 Users

**User Breakdown:**
- Free: 20,000 users
- Paid (Mid): 3,750 users
- Paid (High): 1,250 users

| Price Point | Mid Revenue | High Revenue | Total Revenue | Total Cost | Net Margin |
|-------------|-------------|--------------|---------------|------------|------------|
| $2 / $4 / $10 | $15,000 | $12,500 | $27,500 | $855 | $26,645 (96.9%) |
| $2.50 / $4.50 / $10 | $16,875 | $12,500 | $29,375 | $855 | $28,520 (97.1%) |
| $3 / $5 / $10 | $18,750 | $12,500 | $31,250 | $855 | $30,395 (97.3%) |

---

### Scenario: 50,000 Users

**User Breakdown:**
- Free: 40,000 users
- Paid (Mid): 7,500 users
- Paid (High): 2,500 users

| Price Point | Mid Revenue | High Revenue | Total Revenue | Total Cost | Net Margin |
|-------------|-------------|--------------|---------------|------------|------------|
| $2 / $4 / $10 | $30,000 | $25,000 | $55,000 | $1,710 | $53,290 (96.9%) |
| $2.50 / $4.50 / $10 | $33,750 | $25,000 | $58,750 | $1,710 | $57,040 (97.1%) |
| $3 / $5 / $10 | $37,500 | $25,000 | $62,500 | $1,710 | $60,790 (97.3%) |

---

### Scenario: 100,000 Users

**User Breakdown:**
- Free: 80,000 users
- Paid (Mid): 15,000 users
- Paid (High): 5,000 users

| Price Point | Mid Revenue | High Revenue | Total Revenue | Total Cost | Net Margin |
|-------------|-------------|--------------|---------------|------------|------------|
| $2 / $4 / $10 | $60,000 | $50,000 | $110,000 | $3,420 | $106,580 (96.9%) |
| $2.50 / $4.50 / $10 | $67,500 | $50,000 | $117,500 | $3,420 | $114,080 (97.1%) |
| $3 / $5 / $10 | $75,000 | $50,000 | $125,000 | $3,420 | $121,580 (97.3%) |

---

## Annual Revenue Projections

### At 50,000 Users (Mid pricing: $2.50 / $4.50 / $10)

| Metric | Monthly | Annual |
|--------|---------|--------|
| Revenue | $58,750 | $705,000 |
| Costs | $1,710 | $20,520 |
| Net Margin | $57,040 | $684,480 |

### At 100,000 Users (Mid pricing: $2.50 / $4.50 / $10)

| Metric | Monthly | Annual |
|--------|---------|--------|
| Revenue | $117,500 | $1,410,000 |
| Costs | $3,420 | $41,040 |
| Net Margin | $114,080 | $1,368,960 |

---

## Break-Even Analysis

### Fixed Costs (Estimated Monthly)
- Developer time: Variable (not included)
- Domain/SSL: ~$2/month
- Monitoring tools: ~$0-20/month
- Total fixed: ~$25/month

### Variable Costs
- Per-user costs as calculated in cost-analysis.md

### Break-Even Users (Paid Only)
At $2/month Basic tier:
- Cost per paid user: $0.01
- Revenue per paid user: $2.00
- Break-even: 1 paid user covers 256 free users

**Minimum Viable Scale:**
- 100 paid users @ $2 = $200 revenue
- Covers ~25,600 free users in infrastructure costs
- Actual break-even for basic operations: ~50 paid users

---

## Sensitivity Analysis

### If Conversion Rate Changes

| Paid % | 10K Users Revenue | 50K Users Revenue |
|--------|-------------------|-------------------|
| 10% (5% mid, 5% high) | $9,000 | $45,000 |
| 15% (10% mid, 5% high) | $11,000 | $55,000 |
| 20% (15% mid, 5% high) | $11,750 | $58,750 |
| 25% (20% mid, 5% high) | $13,500 | $67,500 |

### If Pricing Changes

| Max Price | 10K Users Revenue | Impact vs $10 |
|-----------|-------------------|---------------|
| $8 | $10,500 | -$500 |
| $10 | $11,000 | baseline |
| $12 | $11,500 | +$500 |
| $15 | $12,250 | +$1,250 |

---

## Chilean Peso (CLP) Conversion

**Exchange Rate:** ~$1 USD = 900-1000 CLP (varies)

| Tier | USD | CLP (approx) |
|------|-----|--------------|
| Basic | $2-3 | 2,000-3,000 |
| Pro | $4-5 | 4,000-5,000 |
| Max | $10 | 10,000 |

**Note:** CLP pricing should be set as round numbers (2,000 / 4,000 / 10,000) rather than exact USD conversion for user-friendly pricing.

---

## Key Insights

1. **Margins are excellent** (96-97%) across all scenarios due to low infrastructure costs
2. **Free tier is sustainable** - each paid user subsidizes ~100+ free users
3. **Scale has minimal cost impact** - costs grow linearly, margins stay constant
4. **Pricing flexibility** - even at $2 entry, business is highly profitable
5. **Risk is low** - break-even at ~50 paid users

---

## Recommendations

1. **Start with lower pricing** ($2 / $4 / $10) to maximize adoption
2. **Monitor conversion rates** - adjust if <10% paid conversion
3. **Consider annual discounts** (10-15%) to improve retention
4. **Track cohort LTV** - understand user lifetime value by tier
5. **A/B test pricing** in different regions if expanding beyond Chile

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial revenue projections from Epic 4 retrospective |
