# Cost Analysis - Gastify

**Version:** 2.0  
**Last Updated:** 2025-12-06  
**Status:** Updated with ML Training Infrastructure Costs

---

## Executive Summary

Gastify's infrastructure costs remain highly efficient, with per-user costs ranging from **$0.0078/month (Free tier)** to **$0.35/month (Max tier)**. This document now includes **ML training infrastructure costs** for building a proprietary receipt intelligence layer, which represents a strategic investment in long-term defensibility.

**Key Updates in v2.0:**
- Added Training Data Storage costs (Cloud Storage)
- Added Vertex AI Fine-Tuning costs
- Added ML Infrastructure operational costs
- Updated scale projections with ML features
- Added ROI analysis for fine-tuning investment

---

## Cost Components

### 1. Firebase Storage (User Uploads - Temporary)

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

### 2. Gemini API (Receipt Scanning - Current)

**Pricing (Gemini 2.0 Flash):**
- Input (text): $0.075 per 1M tokens
- Input (images): ~750 tokens per image
- Output: $0.30 per 1M tokens

**Per Scan Token Usage:**
- Image input: ~750 tokens
- Text prompt: ~200 tokens
- Response output: ~300 tokens

**Per Scan Cost Calculation:**
```
Image input:    750 tokens × $0.075/1M = $0.000056
Text input:     200 tokens × $0.075/1M = $0.000015
Output:         300 tokens × $0.30/1M  = $0.000090
────────────────────────────────────────────────────
TOTAL PER SCAN (base model): $0.00016 (0.016 cents)
```

**Monthly Gemini Costs by Tier (Base Model):**

| Tier | Scans/Month | Gemini Cost/User/Month |
|------|-------------|------------------------|
| Free | 30 | $0.0048 |
| Basic | 30 | $0.0048 |
| Pro | 300 | $0.048 |
| Max | 900 | $0.144 |

---

### 3. Firebase Cloud Functions

**Pricing:**
- Invocations: $0.40 per million
- Compute: $0.0000100 per GHz-second
- Memory: $0.0000025 per GB-second
- Networking: $0.12 per GB egress

**Per Scan Function Cost:**
- ~2 seconds compute at 512MB memory, 1 CPU
- One invocation
- ~300KB egress

```
Compute:     2s × 1GHz × $0.0000100    = $0.000020
Memory:      2s × 0.5GB × $0.0000025   = $0.0000025
Invocation:  1 × $0.0000004            = $0.0000004
Egress:      0.0003GB × $0.12          = $0.000036
────────────────────────────────────────────────────
TOTAL PER SCAN: ~$0.00006
```

**Monthly Cloud Function Costs by Tier:**

| Tier | Scans/Month | Function Cost/User/Month |
|------|-------------|--------------------------|
| Free | 30 | $0.0018 |
| Basic | 30 | $0.0018 |
| Pro | 300 | $0.018 |
| Max | 900 | $0.054 |

---

### 4. Firebase Authentication

**Pricing:** Free for first 50,000 MAU

- Google OAuth: Free
- Email/Password: Free
- Phone auth: $0.01-0.06 per verification (not used)

**Cost:** $0 (within free tier for foreseeable scale)

---

### 5. Firebase Firestore

**Pricing:**
- Document reads: $0.036 per 100K
- Document writes: $0.108 per 100K
- Document deletes: $0.012 per 100K
- Storage: $0.108 per GB/month

**Estimated Monthly Usage per User:**
- ~100 reads/month (viewing transactions, analytics)
- ~50 writes/month (creating/updating transactions)
- ~30 writes/month (corrections tracking) ← NEW
- ~1MB document storage

```
Reads:     100 × $0.00000036  = $0.000036
Writes:     80 × $0.00000108  = $0.000086
Storage:  0.001GB × $0.108    = $0.000108
────────────────────────────────────────
TOTAL PER USER/MONTH: ~$0.00023
```

---

## NEW: ML Training Infrastructure Costs

### 6. Training Data Storage (Google Cloud Storage)

**Purpose:** Store receipt images for ML model training  
**Pricing (Multi-tier strategy):**

| Storage Class | Price/GB/Month | Use Case |
|---------------|----------------|----------|
| Standard | $0.020 | Last 30 days (active training) |
| Nearline | $0.010 | 30-90 days |
| Coldline | $0.004 | 90-365 days |
| Archive | $0.0012 | Historical (365+ days) |

**Assumptions:**
- Average receipt image: 500KB (compressed JPEG)
- Only users with training consent contribute
- ~60% of users opt-in to training
- Tiered storage lifecycle policy applied

**Storage Growth by Scale:**

| Scale | Total Receipts | Raw Size | With Tiering | Monthly Cost |
|-------|----------------|----------|--------------|--------------|
| Alpha (50 users) | 500 | 250MB | 250MB | $0.005 |
| Beta (500 users) | 5,000 | 2.5GB | 2.5GB | $0.05 |
| Launch (2K users) | 20,000 | 10GB | 10GB | $0.15 |
| Growth (10K users) | 100,000 | 50GB | 40GB* | $0.50 |
| Scale (50K users) | 500,000 | 250GB | 150GB* | $1.50 |

*With tiered storage (older images moved to Coldline/Archive)

**Per-User Training Storage Cost:**

| Tier | Receipts Stored | Storage/User | Cost/User/Month |
|------|-----------------|--------------|-----------------|
| Free | 30 (2 months) | 15MB | $0.0003 |
| Basic | 30 (12 months) | 15MB | $0.0002* |
| Pro | 300 (12 months) | 150MB | $0.0015* |
| Max | 900 (24 months) | 450MB | $0.0027* |

*Lower due to tiered storage (older images in Coldline)

---

### 7. Vertex AI Fine-Tuning

**Purpose:** Train custom Gemini model on Chilean receipt patterns  
**Pricing:**

| Component | Price | Notes |
|-----------|-------|-------|
| Training | $4.00 / 1M input tokens | One-time per model version |
| Inference (tuned) | 2× base model price | ~$0.00032/scan |
| Model storage | Free | 1 year included |

**Fine-Tuning Cost Calculation:**

```
Dataset size: 10,000 receipts (minimum recommended)
Tokens per receipt: ~1,000 (image + prompt + response)
Total tokens: 10M tokens
Epochs: 3-5 (typical)

Training cost:
- Per epoch: 10M × $4.00 / 1M = $40
- Total (4 epochs): $160

Recommended re-training frequency: Quarterly
Annual training cost: $160 × 4 = $640
```

**Fine-Tuned Model Inference Costs:**

| Tier | Scans/Month | Base Model | Fine-Tuned (2×) | Difference |
|------|-------------|------------|-----------------|------------|
| Free | 30 | $0.0048 | $0.0096 | +$0.0048 |
| Basic | 30 | $0.0048 | $0.0096 | +$0.0048 |
| Pro | 300 | $0.048 | $0.096 | +$0.048 |
| Max | 900 | $0.144 | $0.288 | +$0.144 |

---

### 8. ML Operations Costs (At Scale)

**Monitoring & Evaluation:**
- Cloud Monitoring: ~$5/month (after free tier)
- BigQuery for analytics: ~$5-10/month
- Vertex AI Evaluation: ~$2/month

**Estimated Monthly ML Ops by Scale:**

| Scale | Monitoring | Analytics | Evaluation | Total |
|-------|------------|-----------|------------|-------|
| Alpha | $0 | $0 | $0 | $0 |
| Beta | $0 | $0 | $0 | $0 |
| Launch | $5 | $2 | $1 | $8 |
| Growth | $10 | $5 | $2 | $17 |
| Scale | $20 | $15 | $5 | $40 |

---

## Updated Total Cost Per User Per Month

### Scenario A: Without Fine-Tuning (Current State)

| Cost Component | Free | Basic | Pro | Max |
|----------------|------|-------|-----|-----|
| Firebase Storage | $0.0005 | $0.003 | $0.014 | $0.084 |
| Gemini API (base) | $0.0048 | $0.0048 | $0.048 | $0.144 |
| Cloud Functions | $0.0018 | $0.0018 | $0.018 | $0.054 |
| Firestore | $0.0002 | $0.0002 | $0.0002 | $0.0002 |
| Auth | $0 | $0 | $0 | $0 |
| Training Storage | $0.0003 | $0.0002 | $0.0015 | $0.0027 |
| **TOTAL** | **$0.0076** | **$0.0100** | **$0.0817** | **$0.2849** |

### Scenario B: With Fine-Tuned Model (Future State)

| Cost Component | Free | Basic | Pro | Max |
|----------------|------|-------|-----|-----|
| Firebase Storage | $0.0005 | $0.003 | $0.014 | $0.084 |
| Gemini API (tuned) | $0.0096 | $0.0096 | $0.096 | $0.288 |
| Cloud Functions | $0.0018 | $0.0018 | $0.018 | $0.054 |
| Firestore | $0.0002 | $0.0002 | $0.0002 | $0.0002 |
| Auth | $0 | $0 | $0 | $0 |
| Training Storage | $0.0003 | $0.0002 | $0.0015 | $0.0027 |
| **TOTAL** | **$0.0124** | **$0.0148** | **$0.1297** | **$0.4289** |

---

## Updated Margin Analysis by Tier

### Without Fine-Tuning

| Tier | Price | Cost/User | Margin/User | Margin % |
|------|-------|-----------|-------------|----------|
| Free | $0 | $0.0076 | -$0.0076 | N/A |
| Basic ($2) | $2 | $0.0100 | $1.99 | 99.5% |
| Basic ($3) | $3 | $0.0100 | $2.99 | 99.7% |
| Pro ($4) | $4 | $0.0817 | $3.92 | 98.0% |
| Pro ($5) | $5 | $0.0817 | $4.92 | 98.4% |
| Max ($10) | $10 | $0.2849 | $9.72 | 97.2% |

### With Fine-Tuning (Higher Accuracy)

| Tier | Price | Cost/User | Margin/User | Margin % |
|------|-------|-----------|-------------|----------|
| Free | $0 | $0.0124 | -$0.0124 | N/A |
| Basic ($2) | $2 | $0.0148 | $1.99 | 99.3% |
| Basic ($3) | $3 | $0.0148 | $2.99 | 99.5% |
| Pro ($4) | $4 | $0.1297 | $3.87 | 96.8% |
| Pro ($5) | $5 | $0.1297 | $4.87 | 97.4% |
| Max ($10) | $10 | $0.4289 | $9.57 | 95.7% |

**Note:** Fine-tuning increases costs by ~50% but provides:
- Higher accuracy (80% → 95% estimated)
- Fewer user corrections needed
- Better retention through improved UX
- Competitive moat (proprietary model)

---

## Scale Projections (Updated)

### 10,000 Users (80% Free, 15% Pro, 5% Max) - Without Fine-Tuning

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 8,000 | $0.0076 | $60.80 |
| Pro | 1,500 | $0.0817 | $122.55 |
| Max | 500 | $0.2849 | $142.45 |
| **Subtotal (Variable)** | 10,000 | | **$325.80** |
| ML Ops (Fixed) | | | $17.00 |
| **TOTAL** | | | **$342.80/month** |

### 10,000 Users - With Fine-Tuning

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 8,000 | $0.0124 | $99.20 |
| Pro | 1,500 | $0.1297 | $194.55 |
| Max | 500 | $0.4289 | $214.45 |
| **Subtotal (Variable)** | 10,000 | | **$508.20** |
| ML Ops (Fixed) | | | $17.00 |
| Training (Amortized) | | | $53.33* |
| **TOTAL** | | | **$578.53/month** |

*Training cost amortized: $640/year ÷ 12 = $53.33/month

### 50,000 Users (80% Free, 15% Pro, 5% Max) - With Fine-Tuning

| Segment | Users | Cost/User | Total Cost |
|---------|-------|-----------|------------|
| Free | 40,000 | $0.0124 | $496 |
| Pro | 7,500 | $0.1297 | $973 |
| Max | 2,500 | $0.4289 | $1,072 |
| **Subtotal (Variable)** | 50,000 | | **$2,541** |
| ML Ops (Fixed) | | | $40 |
| Training (Amortized) | | | $53 |
| Training Storage | | | $1.50 |
| **TOTAL** | | | **$2,636/month** |

---

## Fine-Tuning ROI Analysis

### Investment Required

| Item | Cost | Frequency |
|------|------|-----------|
| Initial fine-tuning | $160 | One-time |
| Quarterly re-training | $160 | 4×/year |
| **Annual Training Cost** | **$640** | |

### Value Generated

| Benefit | Estimated Impact | Value |
|---------|------------------|-------|
| Accuracy improvement | 80% → 95% | Higher retention |
| Reduced corrections | -60% user edits | Better UX |
| Competitive moat | Proprietary model | Defensibility |
| Chilean market expertise | Specialized accuracy | Market advantage |

### Break-Even Analysis

```
Additional cost per scan (fine-tuned vs base):
$0.00032 - $0.00016 = $0.00016 per scan

At 100,000 scans/month:
- Additional inference cost: $16/month
- Training amortized: $53/month
- Total additional: $69/month

Question: Does 15% accuracy improvement justify $69/month?

If accuracy improvement prevents 1% churn:
- 10,000 users × 1% = 100 users retained
- At $3 ARPU = $300/month in retained revenue
- ROI = $300 / $69 = 4.3× return

Conclusion: Fine-tuning pays for itself if it prevents
even 0.25% monthly churn through better accuracy.
```

---

## Cost Optimization Opportunities

### Current Optimizations
- Image compression before storage (10-15x size reduction)
- Cloud Function handles normalization (consistent results)
- Gemini 2.0 Flash (cost-effective base model)

### ML-Specific Optimizations
- **Tiered storage:** Move old training images to Coldline/Archive
- **Selective training:** Only use high-quality, corrected receipts
- **Incremental training:** Update adapters, not full model
- **Caching:** Cache common merchant normalizations

### Future Optimizations
- **Batch inference:** Process multiple receipts per API call
- **Model distillation:** Train smaller model from fine-tuned Gemini
- **Edge inference:** Run lightweight model on device (future)
- **Committed use discounts:** At 50K+ users, negotiate with GCP

---

## Cost Monitoring Recommendations

### Existing Alerts
1. Firebase budget alerts at $50, $100, $500 thresholds
2. Monitor Gemini API usage in Google Cloud Console
3. Track storage growth monthly

### NEW: ML-Specific Monitoring
4. **Training data volume:** Alert when approaching storage tier thresholds
5. **Correction rate:** Track if model accuracy is degrading
6. **Fine-tuning costs:** Monitor quarterly training expenses
7. **Per-scan cost trend:** Ensure fine-tuned model cost stays within budget

### Recommended Dashboard Metrics
```
┌─────────────────────────────────────────────────────────────┐
│                    ML COST DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Training Data                                               │
│  ├── Total receipts stored: 25,432                          │
│  ├── Storage size: 12.7 GB                                  │
│  ├── Monthly growth: +2.3 GB                                │
│  └── Estimated monthly cost: $0.19                          │
│                                                              │
│  Model Performance                                           │
│  ├── Current model: gastify-cl-v2.3                         │
│  ├── Accuracy (last 7 days): 94.2%                          │
│  ├── Correction rate: 5.8%                                  │
│  └── Last training: 2025-11-15                              │
│                                                              │
│  Inference Costs                                             │
│  ├── Scans this month: 18,432                               │
│  ├── Avg cost/scan: $0.00031                                │
│  ├── Month-to-date: $5.71                                   │
│  └── Projected monthly: $9.52                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary: Cost Impact of ML Features

| Component | Without ML | With ML (Base) | With ML (Fine-tuned) |
|-----------|------------|----------------|----------------------|
| Per-user cost (Pro) | $0.08 | $0.08 | $0.13 |
| 10K users/month | $326 | $343 | $579 |
| 50K users/month | $1,710 | $1,750 | $2,636 |
| Margin impact | Baseline | -1% | -5% |

**Strategic Value:**
- ML infrastructure costs are **minimal** relative to revenue
- Fine-tuning investment ($640/year) is **trivial** at scale
- Training data storage is **negligible** (<$2/month at 50K users)
- **The real value is defensibility**, not cost savings

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial cost analysis from Epic 4 retrospective |
| 2025-12-06 | 2.0 | Added ML training infrastructure costs (Vertex AI, training storage, ML ops) |
