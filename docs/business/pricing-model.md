# Pricing Model

**Version:** 1.0
**Last Updated:** 2025-11-29
**Status:** Draft (ranges defined, final prices TBD)

---

## Subscription Tier Structure

### Overview

Boletapp uses a 4-tier subscription model with a 1x / 1x / 10x / 30x multiplier structure for scan volume, combined with rolling image retention windows that increase with tier level.

### Tier Comparison

| Feature | Free | Basic | Pro | Max |
|---------|------|-------|-----|-----|
| **Price (USD)** | $0 | $2-3 | $4-5 | $10 |
| **Price (CLP)** | $0 | 2,000-3,000 | 4,000-5,000 | 10,000 |
| **Scans/Month** | 30 | 30 | 300 (10x) | 900 (30x) |
| **Image Retention** | 2 months | 12 months | 12 months | 24 months |
| **Max Stored Images** | 60 | 360 | 3,600 | 21,600 |
| **Data Export** | None | CSV | CSV | CSV + Excel |
| **Analytics** | Basic | Basic | TBD | TBD |

---

## Tier Details

### Free Tier ($0)

**Target User:** Casual users, trial users, low-volume expense tracking

**Features:**
- 30 scans per month
- 2-month rolling image retention (max 60 images)
- Manual transaction entry (unlimited, no images)
- Basic analytics (monthly totals, category breakdown)

**Retention Behavior:**
- Month 1: Up to 30 scans/images
- Month 2: Quota resets, up to 60 images total
- Month 3+: Must confirm deletion of oldest month's images to reset quota
- Transaction DATA preserved when images deleted
- Declining deletion = can only add manual transactions

**Upgrade Triggers:**
- Quota exhausted notification
- Month 3+ deletion confirmation dialog
- "Export data" feature locked

---

### Basic Tier ($2-3 USD / 2,000-3,000 CLP)

**Target User:** Regular users who want longer image retention at affordable price

**Features:**
- 30 scans per month (same as Free)
- 12-month rolling image retention (max 360 images)
- CSV data export
- Basic analytics

**Retention Behavior:**
- Rolling 12-month window
- January Year 2: January Year 1 images deleted automatically
- February Year 2: February Year 1 images deleted, and so on
- No confirmation required (automatic rolling)

**Value Proposition:**
- "Keep your receipts for a full year"
- Export your data anytime
- Affordable entry point

---

### Pro Tier ($4-5 USD / 4,000-5,000 CLP)

**Target User:** Active users, small business owners, expense-conscious households

**Features:**
- 300 scans per month (10x Free)
- 12-month rolling image retention (max 3,600 images)
- CSV data export
- Analytics (level TBD - may include advanced features)

**Retention Behavior:**
- Rolling 12-month window
- At 300 scans/month for 12 months = 3,600 images max

**Value Proposition:**
- "Scan up to 10 receipts per day"
- Full year of receipt images
- Ideal for households tracking all expenses

---

### Max Tier ($10 USD / 10,000 CLP)

**Target User:** Power users, business expense tracking, tax preparation

**Features:**
- 900 scans per month (30x Free)
- 24-month rolling image retention (max 21,600 images)
- CSV + Excel data export (multi-tab aggregation)
- Full analytics suite (level TBD)

**Retention Behavior:**
- Rolling 24-month window
- Two full years of receipt images available

**Value Proposition:**
- "Scan up to 30 receipts per day"
- Two years of receipt history
- Excel export for accountants and tax prep
- Complete expense management solution

---

## Unified Scan = Image Storage Model

**Core Principle:** Every scan operation includes image storage automatically.

```
SCAN OPERATION:
  Upload image(s) → Normalize/Compress → Gemini Analysis → Store Image → Save Transaction
                                                              ↓
                                              Transaction linked to image(s)
```

**Key Rules:**
- Max 3 images per scan (multi-page receipts)
- 3 images = 1 scan (not 3 scans)
- Manual transactions = no images, doesn't count against scan quota
- Scan quota resets monthly on subscription renewal date

---

## Image Retention Summary

| Tier | Retention Window | Max Images | Rolling Behavior |
|------|------------------|------------|------------------|
| Free | 2 months | 60 | Manual confirmation required |
| Basic | 12 months | 360 | Automatic monthly deletion |
| Pro | 12 months | 3,600 | Automatic monthly deletion |
| Max | 24 months | 21,600 | Automatic monthly deletion |

**On Transaction Deletion:**
- Images cascade delete immediately
- No retention of orphaned images

---

## Future Pricing Considerations

### Analytics Differentiation
- **Basic Analytics:** Monthly totals, category breakdown, simple charts
- **Advanced Analytics:** Trend analysis, predictions, category comparisons, custom date ranges
- May justify higher Pro/Max pricing or create analytics add-on

### Payment Provider
- **Chile Market:** Mercado Pago integration
- **Currency:** Chilean Pesos (CLP) primary, USD for reference
- **Billing Cycle:** Monthly (annual discounts future consideration)

### Price Sensitivity Testing
- Start with lower end of ranges ($2, $4, $10)
- Adjust based on conversion rates and churn
- Consider A/B testing different price points

---

## Competitive Positioning

| Aspect | Boletapp | Competitors |
|--------|----------|-------------|
| Entry Price | $2-3/month | Often $5-10/month |
| Image Storage | Included with scan | Often separate/limited |
| Local Market | Chile (CLP, Mercado Pago) | Often US/EU focused |
| AI Scanning | Gemini-powered | Varies |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial pricing model from Epic 4 retrospective |
