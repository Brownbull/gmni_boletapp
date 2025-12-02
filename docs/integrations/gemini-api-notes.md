# Gemini API Integration Notes

**Created:** 2025-12-02 (Epic 4.5 Retrospective Action Item)
**Owner:** Charlie (Senior Dev)
**Last Updated:** 2025-12-02

---

## Overview

This document captures known behaviors, edge cases, and workarounds for the Google Gemini API integration in Boletapp's receipt analysis feature.

---

## Current Integration

### Cloud Function: `analyzeReceipt`

**Location:** `functions/src/index.ts`

**Model Used:** `gemini-1.5-flash` (configurable via `GEMINI_MODEL` environment variable)

**Purpose:** Analyze receipt images and extract structured transaction data (merchant, date, items, total, category).

---

## Known API Behaviors

### 1. Response Format Variability

**Issue:** Gemini may return JSON wrapped in markdown code blocks or with extra whitespace.

**Workaround:** The `extractJSONFromResponse` utility handles:
- Stripping markdown code block markers (```json ... ```)
- Trimming whitespace
- Graceful fallback on parse failures

**Code Reference:** `functions/src/geminiService.ts`

```typescript
// Extract JSON from potentially markdown-wrapped response
function extractJSONFromResponse(text: string): object {
  // Strip markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text.trim());
}
```

### 2. Category Inference Accuracy

**Observation:** Category inference is generally accurate for common merchants but may need correction for:
- Local/regional stores not in training data
- Merchants with ambiguous names
- New store types

**Mitigation:**
- Epic 6 (Smart Category Learning) will add user preference learning
- Categories are always editable by users

### 3. Image Quality Requirements

**Minimum Requirements:**
- Resolution: At least 640x480 for readable text
- Format: JPEG, PNG supported
- Size: Under 4MB per image (after compression)

**Best Results:**
- Well-lit receipts
- Minimal glare/shadows
- Receipt fills most of frame
- Readable text (not blurry)

**Workaround for Poor Quality:**
- Sharp library normalizes images to 1200x1600px at 80% JPEG quality
- If Gemini fails, user can manually enter transaction

### 4. Multi-Image Handling

**Behavior:** When multiple images are provided (up to 3), Gemini analyzes all images together.

**Use Case:** Multi-page receipts or long receipts captured in sections.

**Note:** All images count as 1 scan for quota purposes.

### 5. Rate Limiting

**Observed Limits:**
- Free tier: ~15 requests/minute, ~1500/day
- Production: Higher limits with billing enabled

**Implementation:**
- Cloud Function includes rate limiting per user (10 req/minute)
- Firebase quota protects against abuse

### 6. Billing Considerations

**Cost Model:** Pay per character (input + output)

**Observed Costs (Epic 4.5):**
- CLP 1 (~$0.001 USD) for testing period
- Very low cost per receipt analysis

**Cost Optimization:**
- Images compressed before sending (reduces input size)
- Concise prompts used
- Response format specified to minimize output tokens

---

## Error Handling

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `RESOURCE_EXHAUSTED` | Rate limit hit | Retry after delay, user message |
| `INVALID_ARGUMENT` | Bad image format | Validate MIME type before sending |
| `INTERNAL` | Gemini service issue | Retry once, then fail gracefully |
| `PERMISSION_DENIED` | API key issue | Check environment config |

### Error Response Pattern

```typescript
try {
  const result = await model.generateContent([...]);
  // Process result
} catch (error) {
  if (error.code === 'RESOURCE_EXHAUSTED') {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again in a minute.'
    );
  }
  // ... other error handling
}
```

---

## Prompt Engineering Notes

### Current Prompt Structure

```
Analyze this receipt image and extract:
1. Merchant name
2. Date (YYYY-MM-DD format)
3. Individual items with prices
4. Total amount
5. Category (one of: [category list])

Return as JSON with this structure:
{
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "items": [{"name": "string", "price": number}],
  "total": number,
  "category": "string"
}
```

### Tips for Prompt Improvement

1. **Be Specific:** Explicit format requirements reduce variability
2. **Provide Examples:** Few-shot examples in prompt can improve accuracy
3. **Constrain Output:** Specifying JSON schema helps consistency
4. **Handle Uncertainty:** Instruct model to use null for unreadable fields

---

## Testing Notes

### Unit Tests

**Location:** `functions/src/__tests__/gemini.test.ts`

**Mocking:** Gemini API is mocked in tests to ensure deterministic results

```typescript
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => mockResponse }
      })
    })
  }))
}));
```

### Integration Testing

- Use Firebase emulators
- Real Gemini API calls only in manual E2E testing
- Document test receipts in `tests/fixtures/` (if added)

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | API key for Gemini | Required |
| `GEMINI_MODEL` | Model identifier | `gemini-1.5-flash` |

**Set via Firebase Functions Config:**
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY" gemini.model="gemini-1.5-flash"
```

---

## Future Considerations

### Epic 6 Integration (Smart Category Learning)

- Will need to incorporate user preferences into prompts
- May adjust category suggestions based on learned patterns
- Consider fine-tuning or few-shot learning approaches

### Model Updates

- Monitor Gemini model updates for improvements
- Test new models before switching in production
- Keep model version in config for easy rollback

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-02 | Initial document created from Epic 4.5 learnings | Claude |

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Cloud Functions Integration](../architecture/architecture.md)
- [Receipt Analysis Flow](../sprint-artifacts/epic4-5/tech-spec.md)
