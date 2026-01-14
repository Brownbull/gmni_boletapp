# Cost Optimization Opportunities

**Version:** 1.0
**Created:** 2026-01-13
**Status:** Research & Planning
**Source:** Story 14.32 Usage & Cost Audit

---

## Executive Summary

The primary cost driver for Boletapp is the **Gemini API** (97% of variable costs). This document analyzes alternatives and optimization strategies to reduce per-scan costs while maintaining quality.

### Current Cost Breakdown (per scan)

| Component | Cost | % of Total |
|-----------|------|------------|
| **Gemini API** | $0.026 | 97% |
| Cloud Functions | $0.0004 | 1.5% |
| Firestore | $0.0003 | 1% |
| Storage | $0.0001 | 0.5% |
| **TOTAL** | **$0.027** | 100% |

---

## Part 1: Gemini API Optimization

### Current Configuration

- **Model:** `gemini-2.0-flash`
- **Pricing:** $0.10/1M input tokens, $0.40/1M output tokens
- **Average tokens per scan:** ~260K input (image) + ~500 output
- **Current cost per scan:** ~$0.026

### Optimization Strategy 1: Image Compression Enhancement

**Current:** Images compressed to 1200x1600 JPEG @ 80% quality
**Opportunity:** Further compression could reduce token count

| Compression Level | Resolution | Quality | Est. Tokens | Est. Cost | Savings |
|-------------------|------------|---------|-------------|-----------|---------|
| Current | 1200x1600 | 80% | 260K | $0.026 | baseline |
| Medium | 1000x1333 | 75% | 180K | $0.018 | 31% |
| Aggressive | 800x1066 | 70% | 120K | $0.012 | 54% |

**Trade-off:** Lower quality may reduce OCR accuracy. Requires A/B testing.

**Implementation:**
```typescript
// functions/src/imageProcessing.ts
// Reduce MAX_WIDTH and MAX_HEIGHT
// Test with prompt-testing harness (Epic 8)
```

**Risk:** Medium - could impact extraction accuracy
**Effort:** Low - configuration change
**Recommendation:** Test with Epic 8 prompt harness before deploying

---

### Optimization Strategy 2: Caching Common Responses

**Concept:** Cache Gemini responses for receipts from frequently-visited merchants.

**Mechanism:**
1. Hash normalized image (perceptual hash, not cryptographic)
2. Check cache before API call
3. Store response for 30 days

**Estimated Savings:**
- If 20% of scans are re-scans/duplicates: 20% cost reduction
- If 10% are from identical merchants with similar receipts: additional 5-10%

**Trade-off:** Cache storage costs, complexity, stale data risk
**Risk:** Low-Medium
**Effort:** High - requires new caching infrastructure
**Recommendation:** Defer until scale justifies complexity

---

### Optimization Strategy 3: Tiered Model Selection

**Concept:** Use cheaper/faster models for simple receipts, premium models for complex ones.

| Receipt Type | Model | Cost/Scan | Use Case |
|--------------|-------|-----------|----------|
| Simple | gemini-2.0-flash-lite* | ~$0.01 | Clear, single-page receipts |
| Standard | gemini-2.0-flash | ~$0.026 | Most receipts (current) |
| Complex | gemini-2.0-pro | ~$0.05 | Multi-page, poor quality |

*Note: "lite" model is hypothetical - check Google's current offerings

**Implementation:**
1. Pre-analyze image quality (blur detection, contrast)
2. Route to appropriate model
3. Fallback to higher tier on failure

**Risk:** Medium - routing logic complexity
**Effort:** Medium
**Recommendation:** Monitor Google's model releases for cost-effective options

---

## Part 2: Alternative AI Providers

### Comparison Matrix

| Provider | Model | Input Cost | Output Cost | Quality | Latency |
|----------|-------|------------|-------------|---------|---------|
| **Google Gemini** | 2.0 Flash | $0.10/1M | $0.40/1M | Excellent | ~5-10s |
| **OpenAI** | GPT-4o-mini | $0.15/1M | $0.60/1M | Excellent | ~3-8s |
| **OpenAI** | GPT-4o | $2.50/1M | $10.00/1M | Best | ~5-15s |
| **Anthropic** | Claude 3.5 Sonnet | $3.00/1M | $15.00/1M | Best | ~5-15s |
| **Anthropic** | Claude 3.5 Haiku | $0.80/1M | $4.00/1M | Good | ~2-5s |
| **AWS** | Bedrock (Claude) | Variable | Variable | Good | ~5-10s |
| **Local** | Llama 3.2 Vision | Compute only | Compute only | Moderate | ~10-30s |

### Detailed Analysis

#### Option A: OpenAI GPT-4o-mini

**Pricing:** $0.15/1M input, $0.60/1M output
**Per-scan estimate:** ~$0.04 (50% more expensive than Gemini)

**Pros:**
- Excellent vision capabilities
- Well-documented API
- Strong multi-language support

**Cons:**
- 50% more expensive than current solution
- Requires API migration

**Verdict:** ❌ Not recommended - more expensive

---

#### Option B: Claude 3.5 Haiku (Anthropic)

**Pricing:** $0.80/1M input, $4.00/1M output
**Per-scan estimate:** ~$0.21 (8x more expensive)

**Pros:**
- Excellent reasoning capabilities
- Strong at structured extraction

**Cons:**
- Significantly more expensive
- Vision capabilities less optimized for receipts

**Verdict:** ❌ Not recommended - too expensive for this use case

---

#### Option C: Self-Hosted Llama 3.2 Vision

**Pricing:** Compute cost only (~$0.50-2/hour on GPU)

**Per-scan estimate:**
- At 100 scans/hour: ~$0.005-0.02/scan
- At 10 scans/hour: ~$0.05-0.20/scan

**Pros:**
- No per-token costs at scale
- Full control over model
- No data sent to third parties

**Cons:**
- Requires GPU infrastructure (GCP, AWS, or dedicated)
- Lower accuracy than Gemini for receipt OCR
- Operational complexity
- Cold start latency issues

**Break-even Analysis:**
- GPU cost: ~$1/hour (NVIDIA T4 on GCP)
- At $0.026/scan (Gemini), break-even = 38 scans/hour sustained
- Need ~27,000 scans/month to justify

**Verdict:** ⏸️ Defer - only viable at significant scale (50K+ users)

---

#### Option D: Google Document AI

**Pricing:** $0.001-0.01 per page (volume discounts)

**Per-scan estimate:** ~$0.001-0.005/scan (5-26x cheaper!)

**Pros:**
- Purpose-built for document extraction
- Structured output (entities, tables)
- Very cost-effective

**Cons:**
- Less flexible than LLM (predefined schema)
- May miss contextual information
- Requires separate category inference

**Hybrid Approach:**
1. Use Document AI for OCR/extraction ($0.001)
2. Use Gemini Flash for categorization only ($0.005)
3. Total: ~$0.006/scan (77% savings!)

**Verdict:** ✅ **RECOMMENDED** - Investigate hybrid approach

---

#### Option E: AWS Textract + Bedrock

**Pricing:**
- Textract: $0.0015 per page
- Bedrock (Claude Haiku): $0.00025/1K input

**Per-scan estimate:** ~$0.005-0.01/scan

**Pros:**
- Purpose-built OCR (Textract)
- AWS ecosystem integration
- Pay-per-use

**Cons:**
- Requires AWS migration
- Multi-service complexity
- Less Spanish language optimization

**Verdict:** ⏸️ Consider if migrating to AWS

---

## Part 3: Recommended Optimization Roadmap

### Phase 1: Quick Wins (1-2 weeks, no risk)

| Optimization | Savings | Effort | Risk |
|--------------|---------|--------|------|
| Image compression tuning | 10-30% | Low | Low |
| WebP format (vs JPEG) | 5-10% | Low | None |
| **Total Phase 1** | **15-40%** | | |

### Phase 2: Architecture (1-2 months)

| Optimization | Savings | Effort | Risk |
|--------------|---------|--------|------|
| Document AI hybrid | 50-77% | High | Medium |
| Response caching | 10-20% | Medium | Low |
| **Total Phase 2** | **60-90%** | | |

### Phase 3: Scale Optimizations (6+ months)

| Optimization | Savings | Effort | Risk |
|--------------|---------|--------|------|
| Self-hosted models | Variable | Very High | High |
| Committed use discounts | 10-20% | None | None |
| **Total Phase 3** | **10-50%** | | |

---

## Part 4: Cost Projection Scenarios

### Current State (No Optimization)

| Users | Scans/Month | Gemini Cost | Total Cost |
|-------|-------------|-------------|------------|
| 100 | 500 | $13 | $15 |
| 1,000 | 5,000 | $130 | $150 |
| 10,000 | 50,000 | $1,300 | $1,500 |
| 50,000 | 250,000 | $6,500 | $7,500 |

### With Phase 1 Optimization (30% savings)

| Users | Scans/Month | Gemini Cost | Total Cost |
|-------|-------------|-------------|------------|
| 100 | 500 | $9 | $11 |
| 1,000 | 5,000 | $91 | $105 |
| 10,000 | 50,000 | $910 | $1,050 |
| 50,000 | 250,000 | $4,550 | $5,250 |

### With Phase 2 Optimization (70% savings - Document AI hybrid)

| Users | Scans/Month | Gemini Cost | Total Cost |
|-------|-------------|-------------|------------|
| 100 | 500 | $3 | $5 |
| 1,000 | 5,000 | $30 | $45 |
| 10,000 | 50,000 | $300 | $450 |
| 50,000 | 250,000 | $1,500 | $2,250 |

---

## Part 5: Implementation Priorities

### Immediate (This Sprint)

1. **Set up Firebase budget alerts** - $10, $25, $50, $100 thresholds
2. **Monitor Gemini API dashboard** - Track actual token usage
3. **Test aggressive image compression** - Use Epic 8 harness

### Short-term (Next 1-2 Sprints)

1. **Evaluate Document AI** - Build proof-of-concept
2. **Implement WebP format** - Client-side before upload
3. **Add cost tracking** - Per-user cost attribution

### Medium-term (Next Quarter)

1. **Document AI hybrid architecture** - If POC successful
2. **Response caching** - Redis or Firestore-based
3. **Model routing** - Simple vs complex receipt detection

### Long-term (6+ months)

1. **Self-hosted evaluation** - When user base justifies
2. **Committed use discounts** - Negotiate with Google
3. **Multi-provider redundancy** - Failover options

---

## Part 6: Monitoring & Alerts

### Recommended Budget Alerts

| Threshold | Action |
|-----------|--------|
| $25/month | Monitor - review growth |
| $50/month | Warning - evaluate optimizations |
| $100/month | Alert - implement Phase 1 optimizations |
| $250/month | Critical - implement Phase 2 optimizations |

### Key Metrics to Track

1. **Cost per scan** - Target: <$0.02 after Phase 1
2. **Scans per user per month** - Monitor for abuse
3. **Cache hit rate** - If caching implemented
4. **Model routing distribution** - If tiered models implemented

### Dashboard Locations

- **Firebase Console:** Usage and Billing → Details
- **Google Cloud Console:** Billing → Reports (filter by "Generative Language API")
- **Gemini API:** Google AI Studio → Usage

---

## Appendix A: Google Document AI Proof-of-Concept

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Receipt Processing Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Image Upload                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────┐                                    │
│  │ Document AI (OCR)   │  $0.001/page                       │
│  │ - Text extraction   │                                    │
│  │ - Table detection   │                                    │
│  │ - Entity extraction │                                    │
│  └─────────────────────┘                                    │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────┐                                    │
│  │ Gemini Flash (Mini) │  $0.005/call                       │
│  │ - Categorization    │                                    │
│  │ - Item grouping     │                                    │
│  │ - Merchant matching │                                    │
│  └─────────────────────┘                                    │
│       │                                                     │
│       ▼                                                     │
│  Structured Transaction                                     │
│                                                             │
│  TOTAL: ~$0.006/scan (77% savings)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Document AI Pricing

| Volume | Price per Page |
|--------|----------------|
| 0-1,000 | $0.0065 |
| 1,001-5,000 | $0.0050 |
| 5,001-100,000 | $0.0020 |
| 100,001+ | $0.0010 |

At 50,000 scans/month: $0.002/page = $100/month (vs $1,300 with Gemini alone)

---

## Appendix B: Competitive Intelligence

### How Competitors Handle This

| App | OCR Solution | Est. Cost/Scan |
|-----|--------------|----------------|
| Expensify | In-house ML + human review | Unknown (funded) |
| Wave | Google Vision API | ~$0.002 |
| Zoho Expense | Custom ML | Unknown |
| Receipt Bank | Combination + human | Unknown |

### Key Insight

Most successful expense apps use **hybrid approaches**:
1. Cheap OCR for text extraction
2. Rules-based parsing for common formats
3. ML/LLM only for complex cases
4. Human review for failures

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | Initial document from Story 14.32 audit |
