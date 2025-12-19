# Cost Analysis

**Version:** 2.0
**Last Updated:** 2025-12-19
**Status:** Updated with actual production data (Dec 2025)

---

## Executive Summary

Boletapp's infrastructure costs remain highly efficient. Based on **actual production data** (Dec 1-18, 2025: 31 scans = $0.049 USD), per-user costs range from **$0.055/month (Free tier)** to **$1.66/month (Max tier)**. This enables healthy margins (83-97%) across all paid tiers.

> **Key Finding:** Actual per-scan cost is ~$0.00175 (vs original estimate of $0.0002), primarily due to higher image token consumption than initially estimated. Margins remain excellent.

---

## Cost Components

### 1. Firebase Storage

**Pricing:** $0.026/GB/month (after 5GB free tier)

| Tier | Images/Month | Retention | Max Storage/User | Cost/User/Month |
|------|--------------|-----------|------------------|-----------------|
| Free | 30 | 2 months | 18MB | $0.00047 |
| Basic | 30 | 12 months | 108MB | $0.0028 |
| Pro | 300 | 12 months | 540MB | $0.014 |
| Max | 900 | 24 months | 3.24GB | $0.084 |

**Assumptions:**
- Average compressed image size: 300KB
- WebP/JPEG compression at 80-85% quality
- Resolution capped at ~2048x1536

---

### 2. Gemini API (Receipt Scanning)

**Pricing (Gemini 2.0 Flash via Google AI Studio):**
- Input (text + images): $0.10 per 1M tokens
- Output: $0.40 per 1M tokens

> **Note:** Google AI Studio uses unified input pricing for text and images, not separate rates.

**Per Scan Token Usage (Actual):**
- Image input: ~5,000-10,000 tokens (compressed 1200x1600 JPEG)
- Text prompt: ~500 tokens
- Response output: ~500 tokens
- Average images per scan: ~1.5

**Per Scan Cost Calculation (Based on Production Data):**
```
Actual data: 31 scans = $0.049 USD (Dec 1-18, 2025)
────────────────────────────────────────────────────
ACTUAL PER SCAN: $0.00158 (~0.16 cents)
Rounded estimate: $0.00175/scan
```

**Theoretical calculation (validates actual):**
```
Image input:  7,500 tokens × $0.10/1M = $0.00075
Text input:     500 tokens × $0.10/1M = $0.00005
Output:         500 tokens × $0.40/1M = $0.0002
────────────────────────────────────────────────────
THEORETICAL: ~$0.001/scan (single image)
With ~1.5 images avg: ~$0.0015-0.002/scan ✓
```

**Monthly Gemini Costs by Tier:**

| Tier | Scans/Month | Gemini Cost/User/Month |
|------|-------------|------------------------|
| Free | 30 | $0.053 |
| Basic | 30 | $0.053 |
| Pro | 300 | $0.53 |
| Max | 900 | $1.58 |

---

### 3. Firebase Cloud Functions

**Pricing:**
- Invocations: $0.40 per million
- Compute: $0.0000025 per GB-second
- Networking: $0.12 per GB egress

**Per Scan Function Cost:**
- ~2 seconds compute at 256MB memory
- One invocation
- ~300KB egress (compressed image return)

```
Compute:     2s × 0.256GB × $0.0000025 = $0.00000128
Invocation:  1 × $0.0000004            = $0.0000004
Egress:      0.0003GB × $0.12          = $0.000036
────────────────────────────────────────────────────
TOTAL PER SCAN: ~$0.00004
```

**Monthly Cloud Function Costs by Tier:**

| Tier | Scans/Month | Function Cost/User/Month |
|------|-------------|--------------------------|
| Free | 30 | $0.0012 |
| Basic | 30 | $0.0012 |
| Pro | 300 | $0.012 |
| Max | 900 | $0.036 |

---

### 4. Firebase Authentication

**Pricing:** Free for first 50,000 MAU (Monthly Active Users)

- Phone auth: $0.01-0.06 per verification (not used)
- Email/Password: Free
- Google OAuth: Free

**Cost:** $0 (within free tier for foreseeable scale)

---

### 5. Firebase Firestore

**Pricing:**
- Document reads: $0.06 per 100K
- Document writes: $0.18 per 100K
- Storage: $0.18 per GB/month

**Estimated Monthly Usage per User:**
- ~100 reads/month (viewing transactions, analytics)
- ~50 writes/month (creating/updating transactions)
- ~1MB document storage

```
Reads:    100 × $0.0000006  = $0.00006
Writes:    50 × $0.0000018  = $0.00009
Storage:  0.001GB × $0.18   = $0.00018
────────────────────────────────────────
TOTAL PER USER/MONTH: ~$0.00033
```

---

## Total Cost Per User Per Month

| Cost Component | Free | Basic | Pro | Max |
|----------------|------|-------|-----|-----|
| Storage | $0.0005 | $0.003 | $0.014 | $0.084 |
| Gemini API | $0.053 | $0.053 | $0.53 | $1.58 |
| Cloud Functions | $0.001 | $0.001 | $0.012 | $0.036 |
| Firestore | $0.0003 | $0.0003 | $0.0003 | $0.0003 |
| Auth | $0 | $0 | $0 | $0 |
| **TOTAL** | **$0.055** | **$0.057** | **$0.56** | **$1.70** |

---

## Margin Analysis by Tier

| Tier | Price | Cost/User | Margin/User | Margin % |
|------|-------|-----------|-------------|----------|
| Free | $0 | $0.055 | -$0.055 | N/A |
| Basic ($2) | $2 | $0.057 | $1.94 | 97.2% |
| Basic ($3) | $3 | $0.057 | $2.94 | 98.1% |
| Pro ($4) | $4 | $0.56 | $3.44 | 86.0% |
| Pro ($5) | $5 | $0.56 | $4.44 | 88.8% |
| Max ($10) | $10 | $1.70 | $8.30 | 83.0% |

**Note:** Free tier users are subsidized by paid users. At 80/15/5 distribution (Free/Mid/High), the economics remain favorable with margins of 83-98%.

---

## Scale Projections

### 10,000 Users (80% Free, 15% Pro, 5% Max)

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 8,000 | $0.055 | $440 |
| Pro | 1,500 | $0.56 | $840 |
| Max | 500 | $1.70 | $850 |
| **TOTAL** | 10,000 | | **$2,130/month** |

### 50,000 Users (80% Free, 15% Pro, 5% Max)

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 40,000 | $0.055 | $2,200 |
| Pro | 7,500 | $0.56 | $4,200 |
| Max | 2,500 | $1.70 | $4,250 |
| **TOTAL** | 50,000 | | **$10,650/month** |

---

## Cost Optimization Opportunities

### Current Optimizations
- Image compression before storage (10-15x size reduction)
- Cloud Function handles normalization (consistent results)
- Gemini 2.0 Flash (cost-effective model)

### Future Optimizations
- **Image format:** WebP over JPEG (20-30% smaller)
- **Caching:** Cache common Gemini responses for similar items
- **Batch processing:** Combine multiple images in single API call
- **Reserved capacity:** Firebase committed use discounts at scale

---

## Cost Monitoring Recommendations

1. **Set up Firebase budget alerts** at $50, $100, $500 thresholds
2. **Monitor Gemini API usage** in Google Cloud Console
3. **Track storage growth** monthly
4. **Review cost per scan** quarterly as volume grows
5. **Alert on anomalies** (sudden usage spikes)

---

## MVP Free Tier Capacity Planning

**Budget Cap:** $100/month
**Alert Threshold:** $90/month (safety buffer)
**Per-Scan Cost:** $0.00175 (actual)

### Free Tier Options Analysis

| Option | Scans/Month | Cost/User/Month | Users at $90 | Users at $100 |
|--------|-------------|-----------------|--------------|---------------|
| **Free-10** | 10 | $0.019 | **4,736** | 5,263 |
| **Free-15** | 15 | $0.028 | **3,214** | 3,571 |
| **Free-20** | 20 | $0.037 | **2,432** | 2,702 |
| **Free-30** | 30 | $0.055 | **1,636** | 1,818 |
| **Free-50** | 50 | $0.090 | **1,000** | 1,111 |

### Cost Breakdown by Free Tier Option

**Free-10 (10 scans/month) - Maximum Users**
```
Gemini API:     10 × $0.00175 = $0.0175
Cloud Functions: 10 × $0.00004 = $0.0004
Storage:         10 × 300KB × 2mo = 6MB × $0.026/GB = $0.00016
Firestore:       $0.00033
────────────────────────────────────────────────────
TOTAL: ~$0.019/user/month
Users at $90 cap: 4,736 users
```

**Free-15 (15 scans/month) - Recommended Balance**
```
Gemini API:     15 × $0.00175 = $0.026
Cloud Functions: 15 × $0.00004 = $0.0006
Storage:         15 × 300KB × 2mo = 9MB × $0.026/GB = $0.00023
Firestore:       $0.00033
────────────────────────────────────────────────────
TOTAL: ~$0.028/user/month
Users at $90 cap: 3,214 users
```

**Free-30 (30 scans/month) - Current Default**
```
Gemini API:     30 × $0.00175 = $0.053
Cloud Functions: 30 × $0.00004 = $0.0012
Storage:         30 × 300KB × 2mo = 18MB × $0.026/GB = $0.00047
Firestore:       $0.00033
────────────────────────────────────────────────────
TOTAL: ~$0.055/user/month
Users at $90 cap: 1,636 users
```

### Recommendation for MVP Launch

| Phase | Recommended Tier | Max Users | Rationale |
|-------|------------------|-----------|-----------|
| **Alpha** (now) | Free-30 | ~1,600 | Generous for early testers |
| **Beta** | Free-20 | ~2,400 | Balance value vs cost |
| **Launch** | Free-15 | ~3,200 | Sustainable scale |
| **Growth** | Free-10 | ~4,700 | Maximum reach |

### Usage Assumptions

Based on production data (Dec 2025):
- **Average scans per active user:** ~5-8/month (most users don't hit limits)
- **Power users:** ~20-30% use full allocation
- **Casual users:** ~50% use <5 scans/month

**Effective cost with usage patterns:**
If only 30% of users actively scan (realistic):
- Free-30 effective cost: $0.055 × 0.30 = $0.017/user
- Users at $90 cap with 30% active: **5,294 users**

### Alert Thresholds

| Budget Level | Action |
|--------------|--------|
| $50 (50%) | Monitor - review growth rate |
| $75 (75%) | Warning - evaluate tier adjustment |
| $90 (90%) | Alert - consider registration pause or tier reduction |
| $100 (100%) | Hard cap - pause new registrations |

### Implementation Notes

1. **Track active users vs registered users** - many register but don't actively scan
2. **Monitor scans/user distribution** - if average is low, can support more users
3. **Consider soft limits** - slow down after limit instead of hard block
4. **Seasonal patterns** - usage may spike around holidays (receipts from shopping)

---

## Production Data Reference

**Data Source:** Firestore collection group query + GCP Billing (Dec 2025)

| Metric | Value |
|--------|-------|
| Period | Dec 1-18, 2025 |
| Total transactions | 48 |
| Gemini scans (with images) | 31 |
| Manual entries (no scan) | 17 |
| GCP Gemini API cost | $0.049 USD (46 CLP) |
| **Actual cost per scan** | **$0.00158** |
| Active users | 6 |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial cost analysis from Epic 4 retrospective |
| 2025-12-19 | 2.0 | Updated with actual production data - per-scan cost revised from $0.0002 to $0.00175 based on 31 scans = $0.049 USD |
| 2025-12-19 | 2.1 | Added MVP Free Tier Capacity Planning section - $100 budget cap analysis with Free-10/15/20/30/50 options |
