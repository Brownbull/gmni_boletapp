# Cost Analysis

**Version:** 1.0
**Last Updated:** 2025-11-29
**Status:** Estimates based on Firebase and Gemini pricing as of Nov 2025

---

## Executive Summary

Boletapp's infrastructure costs are highly efficient, with per-user costs ranging from **$0.0075/month (Free tier)** to **$0.30/month (Max tier)**. This enables healthy margins (96%+) across all paid tiers, even at the lowest $2/month price point.

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

**Pricing (Gemini 2.0 Flash):**
- Input (text): $0.10 per 1M tokens
- Input (images): $0.0258 per 1M tokens
- Output: $0.40 per 1M tokens

**Per Scan Token Usage:**
- Image input: ~1,000 tokens
- Text prompt: ~500 tokens
- Response output: ~300 tokens

**Per Scan Cost Calculation:**
```
Image input:  1,000 tokens × $0.0258/1M = $0.0000258
Text input:     500 tokens × $0.10/1M   = $0.00005
Output:         300 tokens × $0.40/1M   = $0.00012
────────────────────────────────────────────────────
TOTAL PER SCAN: $0.0002 (0.02 cents)
```

**Monthly Gemini Costs by Tier:**

| Tier | Scans/Month | Gemini Cost/User/Month |
|------|-------------|------------------------|
| Free | 30 | $0.006 |
| Basic | 30 | $0.006 |
| Pro | 300 | $0.06 |
| Max | 900 | $0.18 |

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
| Gemini API | $0.006 | $0.006 | $0.06 | $0.18 |
| Cloud Functions | $0.001 | $0.001 | $0.012 | $0.036 |
| Firestore | $0.0003 | $0.0003 | $0.0003 | $0.0003 |
| Auth | $0 | $0 | $0 | $0 |
| **TOTAL** | **$0.0078** | **$0.0103** | **$0.0863** | **$0.3003** |

---

## Margin Analysis by Tier

| Tier | Price | Cost/User | Margin/User | Margin % |
|------|-------|-----------|-------------|----------|
| Free | $0 | $0.0078 | -$0.0078 | N/A |
| Basic ($2) | $2 | $0.0103 | $1.99 | 99.5% |
| Basic ($3) | $3 | $0.0103 | $2.99 | 99.7% |
| Pro ($4) | $4 | $0.0863 | $3.91 | 97.8% |
| Pro ($5) | $5 | $0.0863 | $4.91 | 98.3% |
| Max ($10) | $10 | $0.3003 | $9.70 | 97.0% |

**Note:** Free tier users are subsidized by paid users. At 80/15/5 distribution (Free/Mid/High), the economics remain highly favorable.

---

## Scale Projections

### 10,000 Users (80% Free, 15% Pro, 5% Max)

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 8,000 | $0.0078 | $62.40 |
| Pro | 1,500 | $0.0863 | $129.45 |
| Max | 500 | $0.3003 | $150.15 |
| **TOTAL** | 10,000 | | **$342/month** |

### 50,000 Users (80% Free, 15% Pro, 5% Max)

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 40,000 | $0.0078 | $312 |
| Pro | 7,500 | $0.0863 | $647 |
| Max | 2,500 | $0.3003 | $751 |
| **TOTAL** | 50,000 | | **$1,710/month** |

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

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial cost analysis from Epic 4 retrospective |
