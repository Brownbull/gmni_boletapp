# Gastify Machine Learning Training Guide

**Receipt Scanning Intelligence Strategy & Implementation**

---

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Date** | December 2025 |
| **Status** | Planning Phase |
| **Classification** | Internal - Technical Team |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Collection Architecture](#2-data-collection-architecture)
3. [Model Architecture Options](#3-model-architecture-options)
4. [Infrastructure Requirements](#4-infrastructure-requirements)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Team Responsibilities](#6-team-responsibilities)
7. [Success Metrics & KPIs](#7-success-metrics--kpis)
8. [Risks & Mitigations](#8-risks--mitigations)
9. [Appendix](#9-appendix)

---

## 1. Executive Summary

This document outlines the strategy and implementation plan for building a proprietary ML training pipeline to improve Gastify's receipt scanning accuracy. The goal is to leverage user-corrected data to train specialized models that outperform generic AI solutions on Chilean receipts.

### 1.1 Strategic Objectives

- **Build a proprietary Chilean receipt dataset** — accumulate 50,000+ receipts with human-verified corrections
- **Improve scanning accuracy** — increase from ~80% to 95%+ accuracy on Chilean stores
- **Create competitive moat** — data and models that competitors cannot easily replicate
- **Enable regional expansion** — architecture that scales to Colombia, México, Argentina

### 1.2 Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Scanning Accuracy | ~80% | 95%+ |
| User Corrections Rate | ~20% | <5% |
| Training Dataset Size | 0 | 50,000+ receipts |
| Regional Coverage | Generic | Chile-specialized |

---

## 2. Data Collection Architecture

The foundation of our ML strategy is systematic data collection. Every receipt scanned and every user correction is valuable training data that will compound over time.

### 2.1 Data Collection Points

| Data Type | What We Capture | Why It Matters |
|-----------|-----------------|----------------|
| **Receipt Images** | Original photo, compressed JPEG, metadata (device, lighting) | Training input for vision models |
| **AI Extraction** | Raw JSON response, confidence scores, processing time | Baseline for measuring improvement |
| **User Corrections** | Original value, corrected value, field type, timestamp | Ground truth labels for training |
| **Merchant Data** | Normalized names, patterns, categories, regional info | Lookup tables and classification |

### 2.2 Firestore Schema Design

The following collections support ML training data collection:

#### Transaction Document (Enhanced)

**Path:** `/artifacts/{appId}/users/{userId}/transactions/{txId}`

```typescript
interface Transaction {
  // Existing fields...
  id: string;
  merchant: string;
  date: string;
  total: number;
  category: string;
  items: TransactionItem[];
  
  // NEW: ML Training Fields
  ml: {
    // Image reference
    receiptImagePath?: string;      // Cloud Storage path
    receiptImageUrl?: string;       // Signed URL (temporary)
    
    // AI extraction metadata
    aiExtraction: {
      model: string;                // "gemini-2.0-flash" or "gastify-v1"
      modelVersion: string;         // "2025-01-15"
      rawResponse: string;          // Full JSON response
      processingTimeMs: number;
      extractedAt: Timestamp;
      
      // Original AI values (before any user edits)
      originalMerchant: string;
      originalDate: string;
      originalTotal: number;
      originalCategory: string;
      originalItems: TransactionItem[];
      
      // Confidence scores
      confidence: {
        overall: number;            // 0-1
        merchant: number;
        date: number;
        total: number;
        items: number;
      };
    };
    
    // Training eligibility
    training: {
      eligible: boolean;            // User gave consent
      exported: boolean;            // Already in training set
      exportedAt?: Timestamp;
      qualityScore?: number;        // 0-1, based on image quality
    };
  };
}
```

#### Corrections Collection (New)

**Path:** `/artifacts/{appId}/users/{userId}/corrections/{corrId}`

```typescript
type CorrectionField = 
  | 'merchant' 
  | 'date' 
  | 'total' 
  | 'category' 
  | 'item_name' 
  | 'item_price' 
  | 'item_category'
  | 'item_added'
  | 'item_removed';

interface Correction {
  id: string;
  
  // Reference
  transactionId: string;
  userId: string;
  
  // What changed
  field: CorrectionField;
  itemIndex?: number;               // For item-level corrections
  
  // Values
  originalValue: any;               // What AI said
  correctedValue: any;              // What user changed to
  
  // Context
  context: {
    receiptImagePath?: string;
    merchantType?: string;          // supermarket, pharmacy, etc.
    region: 'CL' | 'CO' | 'MX' | 'AR';
    aiModel: string;
    aiModelVersion: string;
  };
  
  // Metadata
  correctedAt: Timestamp;
  correctionSource: 'user_edit' | 'bulk_import' | 'admin';
  
  // Training
  usedInTraining: boolean;
  trainingBatchId?: string;
}
```

#### Training Data Collection (Consolidated)

**Path:** `/artifacts/{appId}/training_data/{dataId}`

```typescript
interface TrainingDataPoint {
  id: string;
  
  // Source
  sourceTransactionId: string;
  sourceUserId: string;             // For audit, anonymized in export
  
  // Image
  image: {
    storagePath: string;            // gs://gastify-receipts/...
    width: number;
    height: number;
    format: 'jpeg' | 'png' | 'webp';
    sizeBytes: number;
    qualityScore: number;           // 0-1, computed
  };
  
  // Ground truth (after user corrections)
  groundTruth: {
    merchant: string;
    merchantNormalized: string;
    date: string;
    total: number;
    currency: 'CLP' | 'COP' | 'MXN' | 'ARS';
    category: string;
    items: Array<{
      name: string;
      price: number;
      category?: string;
    }>;
  };
  
  // AI comparison (for measuring improvement)
  aiPrediction: {
    model: string;
    merchant: string;
    date: string;
    total: number;
    category: string;
    items: Array<{name: string; price: number}>;
  };
  
  // Classification
  metadata: {
    region: 'CL' | 'CO' | 'MX' | 'AR';
    storeType: 'supermarket' | 'pharmacy' | 'restaurant' | 'gas_station' | 'other';
    receiptType: 'thermal' | 'printed' | 'digital' | 'handwritten';
    difficulty: 'easy' | 'medium' | 'hard';
  };
  
  // Training management
  training: {
    split: 'train' | 'validation' | 'test';
    addedAt: Timestamp;
    batchId: string;
    version: number;
  };
}
```

#### Merchants Database

**Path:** `/artifacts/{appId}/merchants/{merchantId}`

```typescript
interface Merchant {
  id: string;
  
  // Identification
  canonicalName: string;            // "Jumbo"
  displayName: string;              // "Jumbo Las Condes"
  
  // Matching patterns
  patterns: string[];               // ["JUMBO", "JUMBO SA", "JUMBO 1234"]
  regexPatterns?: string[];         // For complex matching
  
  // Classification
  category: string;                 // Default category
  storeType: 'supermarket' | 'pharmacy' | 'restaurant' | 'gas_station' | 'other';
  chain?: string;                   // "Cencosud"
  
  // Regional
  regions: Array<'CL' | 'CO' | 'MX' | 'AR'>;
  
  // Stats (updated periodically)
  stats: {
    transactionCount: number;
    lastSeen: Timestamp;
    avgTransactionAmount: number;
    commonItems: string[];          // Top 10 items
  };
  
  // Management
  verified: boolean;
  source: 'manual' | 'auto_extracted' | 'user_suggestion';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.3 Data Volume Milestones

| Milestone | Receipts | Capabilities Unlocked |
|-----------|----------|----------------------|
| **Alpha** | 1,000 | Evaluate accuracy, identify problem areas, build merchant database |
| **Beta** | 10,000 | Fine-tune adapters, train category classifier, A/B test improvements |
| **Launch** | 50,000 | Train specialized vision model, regional variants, competitive moat |
| **Scale** | 100,000+ | Full custom pipeline, B2B data licensing potential, multi-region |

---

## 3. Model Architecture Options

We have multiple approaches to improve scanning accuracy, ranging from quick wins to sophisticated ML pipelines. The strategy is to implement progressively more complex solutions as our data grows.

### 3.1 Tier 1: Enhanced Prompting (Now)

**Timeline:** Immediate | **Data Required:** 0 | **Cost:** $0 additional

Improvements that require no training, just better prompt engineering:

- **Few-shot examples:** Include 3-5 Chilean receipt examples in the prompt
- **Merchant normalization:** Post-process AI output against merchant database
- **Confidence thresholds:** Flag low-confidence extractions for user verification
- **Image preprocessing:** Auto-rotate, enhance contrast, crop to receipt

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENHANCED PROMPTING ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Receipt Image                                                          │
│       │                                                                  │
│       ↓                                                                  │
│   Pre-processing (rotation, contrast, crop)                              │
│       │                                                                  │
│       ↓                                                                  │
│   Gemini API + Dynamic Few-Shot Examples                                 │
│       │                                                                  │
│       ↓                                                                  │
│   Post-processing (merchant normalization, validation)                   │
│       │                                                                  │
│       ↓                                                                  │
│   Confidence Scoring                                                     │
│       │                                                                  │
│       ↓                                                                  │
│   App Display (with "verify" prompt if low confidence)                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tier 2: Gemini Fine-Tuning (3-6 Months)

**Timeline:** 3-6 months | **Data Required:** 10,000+ receipts | **Cost:** ~$150-200 training

Fine-tune Gemini model using Vertex AI's supervised tuning:

- **Training data:** JSONL format with image + expected output pairs
- **Model:** gemini-1.5-flash base with LoRA adapters
- **Expected improvement:** 80% → 92-95% accuracy on Chilean receipts
- **Inference cost:** 2× base model (~$0.00032 per scan)

#### Training Data Format (JSONL)

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"inline_data": {"mime_type": "image/jpeg", "data": "<base64_image>"}},
        {"text": "Extract receipt data as JSON: merchant, date (YYYY-MM-DD), total, items array with name and price."}
      ]
    }
  ],
  "system_instruction": "You are a receipt scanning assistant for Chilean stores. Extract data accurately.",
  "expected_output": {
    "merchant": "Jumbo Las Condes",
    "date": "2025-01-15",
    "total": 45670,
    "category": "Groceries",
    "items": [
      {"name": "Leche Colun 1L", "price": 1290},
      {"name": "Pan Molde Ideal", "price": 2490}
    ]
  }
}
```

#### Fine-Tuning Configuration

```python
from google.cloud import aiplatform

# Initialize Vertex AI
aiplatform.init(project="gastify-prod", location="us-central1")

# Create fine-tuning job
tuning_job = aiplatform.Model.tune(
    base_model="gemini-1.5-flash-001",
    training_dataset="gs://gastify-training/chilean_receipts_v1.jsonl",
    validation_dataset="gs://gastify-training/chilean_receipts_val.jsonl",
    epochs=4,
    learning_rate_multiplier=1.0,
    adapter_size="ADAPTER_SIZE_FOUR",  # LoRA rank
    tuned_model_display_name="gastify-receipt-scanner-cl-v1"
)

# Wait for completion
tuning_job.wait()
print(f"Tuned model: {tuning_job.tuned_model_endpoint_name}")
```

### 3.3 Tier 3: Specialized OCR Pipeline (6-12 Months)

**Timeline:** 6-12 months | **Data Required:** 50,000+ receipts | **Cost:** ~$500/month infrastructure

Build a multi-stage pipeline with specialized components:

| Component | Model | Size | Purpose |
|-----------|-------|------|---------|
| **Document Detection** | YOLOv8 / RT-DETR | 20-50MB | Find and crop receipt from image |
| **OCR Engine** | PaddleOCR | 100MB | Extract text with position data |
| **Layout Analysis** | LayoutLMv3 | 400MB | Understand receipt structure |
| **Field Extraction** | Fine-tuned BERT | 250MB | Extract merchant, date, total, items |
| **Category Classifier** | BERT-tiny / TF-IDF | 20MB | Classify spending category |
| **Merchant Normalizer** | RapidFuzz + DB | N/A | Normalize merchant names |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPECIALIZED PIPELINE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │   Receipt    │    │  Document    │    │    Text      │              │
│   │    Image     │ →  │  Detection   │ →  │   Regions    │              │
│   └──────────────┘    │  (YOLO/DETR) │    └──────────────┘              │
│                       └──────────────┘           │                       │
│                                                  ↓                       │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │  Structured  │    │   Field      │    │    OCR       │              │
│   │    JSON      │ ←  │  Extraction  │ ←  │  (PaddleOCR) │              │
│   └──────────────┘    │   (LayoutLM) │    └──────────────┘              │
│         │             └──────────────┘                                   │
│         ↓                                                                │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │   Final      │    │  Category    │    │  Merchant    │              │
│   │   Output     │ ←  │  Classifier  │ ←  │  Normalizer  │              │
│   └──────────────┘    │  (BERT-tiny) │    │  (fuzzy+DB)  │              │
│                       └──────────────┘    └──────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Regional Model Strategy

Train separate adapters for each country to maximize accuracy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-REGION MODEL ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Base Model (Gemini 1.5 Flash or Custom)                               │
│       │                                                                  │
│       ├─→ LoRA Adapter: Chile 🇨🇱                                        │
│       │   - Jumbo, Líder, Santa Isabel patterns                         │
│       │   - RUT format, boleta electrónica                              │
│       │                                                                  │
│       ├─→ LoRA Adapter: Colombia 🇨🇴                                     │
│       │   - Éxito, Carulla, D1 patterns                                 │
│       │   - NIT format, factura electrónica                             │
│       │                                                                  │
│       └─→ LoRA Adapter: México 🇲🇽                                       │
│           - Walmart, Soriana, OXXO patterns                             │
│           - RFC format, CFDI requirements                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Infrastructure Requirements

### 4.1 Cloud Services Needed

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **Cloud Storage** | Receipt images | $0.02/GB/month (tiered: $0.004-0.02) |
| **Vertex AI** | Fine-tuning | $4/1M tokens training, $150-200 per version |
| **Cloud Functions** | Processing pipeline | ~$0.00006 per scan |
| **BigQuery** | Analytics & metrics | $5-10/month |
| **Cloud Monitoring** | Observability | $5-20/month |

### 4.2 Data Storage Strategy

Implement tiered storage to optimize costs while maintaining access:

| Storage Class | Price/GB/Month | Use Case |
|---------------|----------------|----------|
| **Standard** | $0.020 | Last 30 days — Active training data, recent receipts |
| **Nearline** | $0.010 | 30-90 days — Recently used training data |
| **Coldline** | $0.004 | 90-365 days — Historical training archive |
| **Archive** | $0.0012 | 365+ days — Long-term preservation |

#### Lifecycle Policy Configuration

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 30, "matchesStorageClass": ["STANDARD"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {"age": 90, "matchesStorageClass": ["NEARLINE"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "ARCHIVE"},
        "condition": {"age": 365, "matchesStorageClass": ["COLDLINE"]}
      }
    ]
  }
}
```

### 4.3 Monthly Cost Projections

| Scale | Storage | Inference | Training* | Total |
|-------|---------|-----------|-----------|-------|
| **Alpha** (500 users) | $0.05 | $0.80 | $13 | ~$15 |
| **Beta** (2K users) | $0.20 | $3.20 | $13 | ~$20 |
| **Launch** (10K users) | $1.00 | $32 | $13 | ~$50 |
| **Scale** (50K users) | $5.00 | $160 | $13 | ~$180 |

*Training cost amortized: $160 quarterly ÷ 12 months = ~$13/month

---

## 5. Implementation Roadmap

### Phase 1: Data Foundation (Weeks 1-4)

**Goal:** Set up infrastructure to collect training data from every scan

#### Week 1-2: Storage Infrastructure

1. **Create Cloud Storage bucket**
   ```bash
   gsutil mb -l us-central1 -c STANDARD gs://gastify-receipts
   gsutil lifecycle set lifecycle.json gs://gastify-receipts
   ```

2. **Implement image upload service**
   ```typescript
   // services/storage.ts
   import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

   export async function storeReceiptImage(
     userId: string,
     imageBase64: string,
     transactionId: string
   ): Promise<string> {
     const storage = getStorage();
     const imageRef = ref(storage, `receipts/${userId}/${transactionId}.jpg`);
     
     // Convert base64 to blob
     const response = await fetch(`data:image/jpeg;base64,${imageBase64}`);
     const blob = await response.blob();
     
     // Compress if needed
     const compressedBlob = await compressImage(blob, 0.8, 2048);
     
     await uploadBytes(imageRef, compressedBlob);
     return getDownloadURL(imageRef);
   }
   ```

#### Week 3-4: Schema & Corrections Tracking

3. **Update transaction schema with ML fields**
   - Add `ml.receiptImagePath`
   - Add `ml.aiExtraction` object
   - Add `ml.training` flags

4. **Create corrections collection**
   ```typescript
   // services/corrections.ts
   export async function logCorrection(
     user: User,
     transactionId: string,
     field: CorrectionField,
     originalValue: any,
     correctedValue: any,
     context: CorrectionContext
   ): Promise<string> {
     const correctionsRef = collection(
       db,
       `artifacts/${appId}/users/${user.uid}/corrections`
     );

     const correction: Omit<Correction, 'id'> = {
       transactionId,
       userId: user.uid,
       field,
       originalValue,
       correctedValue,
       context,
       correctedAt: Timestamp.now(),
       correctionSource: 'user_edit',
       usedInTraining: false,
     };

     const docRef = await addDoc(correctionsRef, correction);
     return docRef.id;
   }
   ```

5. **Implement user consent flow**
   - Add toggle in Settings: "Help improve scanning by sharing anonymized data"
   - Store consent in user document
   - Only process images from consented users

6. **Build initial merchant database**
   - Create spreadsheet with 200+ Chilean merchants
   - Import to Firestore merchants collection
   - Include patterns, categories, and chain info

### Phase 2: Enhanced Prompting (Weeks 5-8)

**Goal:** Improve accuracy without training using prompt engineering

#### Week 5-6: Few-Shot Examples

1. **Curate Chilean receipt examples**
   - Select 5-10 representative receipts from major chains
   - Include: Jumbo, Líder, Santa Isabel, Unimarc, Tottus
   - Cover different formats: thermal, printed, digital

2. **Update Gemini prompt with examples**
   ```typescript
   const RECEIPT_PROMPT = `
   You are a receipt scanning assistant specialized in Chilean stores.
   
   Examples of correct extractions:
   
   Example 1 (Jumbo):
   Input: [receipt image]
   Output: {"merchant": "Jumbo", "date": "2025-01-15", "total": 45670, ...}
   
   Example 2 (Líder):
   Input: [receipt image]  
   Output: {"merchant": "Líder", "date": "2025-01-14", "total": 32100, ...}
   
   Now extract data from this receipt:
   `;
   ```

#### Week 7-8: Post-Processing & Confidence

3. **Implement merchant normalization**
   ```typescript
   // utils/merchants.ts
   import Fuse from 'fuse.js';

   const merchantFuse = new Fuse(MERCHANT_LIST, {
     keys: ['patterns'],
     threshold: 0.3,
   });

   export function normalizeMerchant(rawMerchant: string): string {
     const result = merchantFuse.search(rawMerchant.toUpperCase());
     if (result.length > 0 && result[0].score < 0.3) {
       return result[0].item.canonicalName;
     }
     return rawMerchant;
   }
   ```

4. **Add confidence scoring**
   - Parse Gemini response for uncertainty indicators
   - Display "Please verify" for low-confidence fields
   - Track which fields users modify most often

5. **Set up A/B testing framework**
   - Compare old prompt vs enhanced prompt
   - Measure correction rate for each variant
   - Run for 2 weeks minimum

### Phase 3: Model Fine-Tuning (Months 3-5)

**Goal:** Train custom Gemini model on Chilean receipt data

#### Month 3: Data Preparation

1. **Export training dataset**
   ```typescript
   // scripts/export-training-data.ts
   async function exportTrainingData() {
     const trainingData = await getTrainingEligibleTransactions();
     
     const jsonlLines = trainingData.map(tx => ({
       contents: [
         {
           role: "user",
           parts: [
             { inline_data: { mime_type: "image/jpeg", data: tx.imageBase64 } },
             { text: EXTRACTION_PROMPT }
           ]
         }
       ],
       expected_output: {
         merchant: tx.correctedMerchant || tx.merchant,
         date: tx.correctedDate || tx.date,
         total: tx.correctedTotal || tx.total,
         category: tx.correctedCategory || tx.category,
         items: tx.correctedItems || tx.items,
       }
     }));
     
     // Write JSONL file
     const jsonl = jsonlLines.map(l => JSON.stringify(l)).join('\n');
     await uploadToGCS('gastify-training/receipts_v1.jsonl', jsonl);
   }
   ```

2. **Split dataset**
   - 80% training (8,000+ receipts)
   - 10% validation (1,000+ receipts)
   - 10% test (1,000+ receipts)

#### Month 4: Fine-Tuning

3. **Configure and run Vertex AI tuning**
   ```bash
   # Create tuning job
   gcloud ai tuning-jobs create \
     --region=us-central1 \
     --display-name="gastify-cl-v1" \
     --base-model="gemini-1.5-flash-001" \
     --training-dataset-uri="gs://gastify-training/train.jsonl" \
     --validation-dataset-uri="gs://gastify-training/val.jsonl" \
     --epoch-count=4 \
     --adapter-size="ADAPTER_SIZE_FOUR"
   ```

4. **Evaluate model performance**
   - Run test set through both base and tuned models
   - Calculate per-field accuracy
   - Generate confusion matrix for categories

#### Month 5: Deployment

5. **Deploy with shadow mode**
   ```typescript
   // services/gemini.ts
   export async function analyzeReceipt(image: string): Promise<ReceiptData> {
     const shadowMode = await getFeatureFlag('ml_shadow_mode');
     
     // Always run base model
     const baseResult = await runBaseModel(image);
     
     if (shadowMode) {
       // Also run tuned model, compare but don't use
       const tunedResult = await runTunedModel(image);
       await logComparison(baseResult, tunedResult);
       return baseResult;
     }
     
     const useTuned = await getFeatureFlag('ml_use_tuned');
     if (useTuned) {
       return await runTunedModel(image);
     }
     
     return baseResult;
   }
   ```

6. **Gradual rollout**
   - Week 1: 10% of users
   - Week 2: 50% of users
   - Week 3: 100% of users

### Phase 4: Continuous Improvement (Ongoing)

**Goal:** Establish feedback loop for continuous model improvement

1. **Automated retraining pipeline**
   - Cloud Scheduler triggers weekly data export
   - Cloud Function evaluates if retraining needed
   - Quarterly model updates with new correction data

2. **Regional model variants**
   - Separate LoRA adapters for Chile, Colombia, México
   - A/B test regional vs generic model per user location

3. **Model performance monitoring**
   ```typescript
   // Dashboard metrics
   interface MLMetrics {
     accuracy: {
       overall: number;
       byField: Record<string, number>;
       byMerchant: Record<string, number>;
     };
     corrections: {
       rate: number;
       byField: Record<string, number>;
       trend: number[]; // Last 30 days
     };
     latency: {
       p50: number;
       p95: number;
       p99: number;
     };
   }
   ```

4. **Auto-correction patterns**
   - Detect when same correction is made 5+ times
   - Automatically apply pattern to future extractions
   - Flag for human review after 10 applications

---

## 6. Team Responsibilities

| Role | Responsibilities | Deliverables |
|------|------------------|--------------|
| **Backend Engineer** | Implement data collection, Cloud Storage integration, Firestore schemas | Storage service, corrections tracking, consent flow |
| **Frontend Engineer** | Update EditView for correction tracking, add consent UI, confidence indicators | Enhanced edit flow, settings updates, UX improvements |
| **ML Engineer** | Prepare training data, configure Vertex AI, evaluate models | Training pipeline, model evaluation, deployment scripts |
| **Data Analyst** | Build merchant database, analyze correction patterns, define metrics | Merchant normalization DB, accuracy dashboards, weekly reports |
| **DevOps** | Set up Cloud Storage, configure Vertex AI access, monitoring | Infrastructure as code, CI/CD for models, alerting |

### Detailed Task Breakdown

#### Backend Engineer Tasks

- [ ] Create Cloud Storage bucket with lifecycle policy
- [ ] Implement `storeReceiptImage()` service
- [ ] Add ML fields to transaction Firestore schema
- [ ] Create corrections collection and `logCorrection()` service
- [ ] Implement `detectCorrectionPattern()` for auto-corrections
- [ ] Build training data export script
- [ ] Create API endpoint for model switching (A/B testing)

#### Frontend Engineer Tasks

- [ ] Add consent toggle in Settings view
- [ ] Update EditView to track field changes
- [ ] Add confidence indicators to scan results
- [ ] Implement "Please verify" UI for low-confidence fields
- [ ] Add correction count to user profile
- [ ] Create opt-out flow for training data

#### ML Engineer Tasks

- [ ] Define JSONL schema for training data
- [ ] Write data validation and cleaning scripts
- [ ] Configure Vertex AI tuning job
- [ ] Build model evaluation pipeline
- [ ] Create accuracy comparison dashboard
- [ ] Implement shadow mode deployment
- [ ] Set up automated retraining triggers

#### Data Analyst Tasks

- [ ] Research and document Chilean merchant patterns
- [ ] Create initial merchant database (200+ entries)
- [ ] Define accuracy metrics and KPIs
- [ ] Build correction pattern analysis queries
- [ ] Create weekly accuracy report template
- [ ] Identify problematic receipt types

#### DevOps Tasks

- [ ] Set up GCP project and IAM permissions
- [ ] Configure Cloud Storage with proper access controls
- [ ] Enable Vertex AI APIs
- [ ] Set up Cloud Monitoring dashboards
- [ ] Create alerting for model accuracy degradation
- [ ] Implement CI/CD for model deployment

---

## 7. Success Metrics & KPIs

### 7.1 Primary Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| **Overall Accuracy** | ~80% | 95%+ | % of scans with no corrections needed |
| **Merchant Accuracy** | ~75% | 98%+ | % of merchants correctly identified |
| **Total Amount Accuracy** | ~90% | 99%+ | % of totals extracted correctly |
| **User Correction Rate** | ~20% | <5% | % of transactions requiring edits |
| **Processing Latency** | 2-3s | <2s | P95 time from upload to result |

### 7.2 Training Data Metrics

- **Dataset Growth Rate:** Target 1,000+ new receipts per week
- **Consent Rate:** Target 60%+ users opting in to training
- **Data Quality Score:** % of images meeting quality threshold (lighting, focus, completeness)
- **Correction Coverage:** % of errors with user corrections (for training signal)

### 7.3 Business Impact Metrics

- **User Retention:** Correlation between accuracy and D7/D30 retention
- **Scans per User:** Higher accuracy should increase engagement
- **NPS Impact:** Track NPS changes after accuracy improvements
- **Support Tickets:** Reduction in scanning-related complaints

### 7.4 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    ML PERFORMANCE DASHBOARD                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACCURACY (Last 7 Days)                                      │
│  ├── Overall:        94.2%  ▲ +2.1% vs last week            │
│  ├── Merchant:       97.8%  ▲ +1.3%                         │
│  ├── Total Amount:   98.9%  ▲ +0.4%                         │
│  └── Date:           99.1%  → +0.0%                         │
│                                                              │
│  CORRECTIONS                                                 │
│  ├── Rate:           5.8%   ▼ -1.2% vs last week            │
│  ├── Most Corrected: merchant (42%), items (31%)            │
│  └── Auto-applied:   234 corrections this week              │
│                                                              │
│  TRAINING DATA                                               │
│  ├── Total Receipts: 25,432                                 │
│  ├── This Week:      +1,247                                 │
│  ├── Consent Rate:   64%                                    │
│  └── Quality Score:  89% meeting threshold                  │
│                                                              │
│  MODEL STATUS                                                │
│  ├── Current:        gastify-cl-v2.3                        │
│  ├── Last Training:  2025-11-15                             │
│  └── Next Scheduled: 2025-02-15                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Insufficient training data** | High | Medium | Start collection immediately; incentivize consent with features |
| **Fine-tuning doesn't improve accuracy** | Medium | Low | Validate with small dataset first; A/B test before full rollout |
| **Vertex AI pricing increases** | Medium | Low | Build abstraction layer; evaluate open-source alternatives |
| **User privacy concerns** | High | Medium | Clear consent flow; anonymization; easy opt-out option |
| **Model bias toward certain stores** | Medium | Medium | Monitor per-merchant accuracy; balance training data distribution |
| **Increased inference costs** | Low | Certain | Budget 2× inference cost; offset with accuracy-driven retention gains |
| **Data quality issues** | Medium | Medium | Implement quality scoring; filter low-quality images from training |
| **Regional model divergence** | Low | Low | Share base training across regions; only specialize adapters |

### Contingency Plans

**If fine-tuning fails to improve accuracy:**
1. Analyze failure modes in detail
2. Increase dataset size and diversity
3. Try different hyperparameters
4. Consider specialized OCR pipeline (Tier 3) earlier

**If user consent rate is too low:**
1. A/B test different consent messaging
2. Offer incentives (premium features, badges)
3. Make value proposition clearer
4. Consider processing receipts without images (text-only)

**If costs exceed projections:**
1. Implement aggressive image tiering
2. Reduce retraining frequency
3. Evaluate self-hosted alternatives at scale
4. Negotiate enterprise pricing with Google

---

## 9. Appendix

### 9.1 Glossary

| Term | Definition |
|------|------------|
| **LoRA (Low-Rank Adaptation)** | Efficient fine-tuning technique that trains small adapter layers instead of the full model weights |
| **Few-shot learning** | Including examples in the prompt to guide model behavior without training |
| **Ground truth** | The correct answer, typically human-verified, used for training and evaluation |
| **Vertex AI** | Google Cloud's ML platform for training and deploying models |
| **JSONL** | JSON Lines format, one JSON object per line, commonly used for training data |
| **Confidence score** | Model's self-assessed probability that an extraction is correct (0-1) |
| **Shadow mode** | Running a new model alongside the current one to compare results without affecting users |
| **A/B testing** | Comparing two variants by showing each to different user groups |

### 9.2 Reference Documents

- Gastify Architecture Document (`architecture.md`)
- Cost Analysis v2.0 (`cost_analysis_v2.md`)
- DeepSeek vs Gemini Analysis (`deepseek_vs_gemini_analysis.md`)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini Fine-Tuning Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/models/tune-models)

### 9.3 Implementation Checklist

#### Phase 1: Data Foundation

- [ ] Cloud Storage bucket created and configured
- [ ] Lifecycle policy applied for cost optimization
- [ ] Transaction schema updated with ML fields
- [ ] Corrections collection implemented
- [ ] `logCorrection()` service working
- [ ] User consent flow added to settings
- [ ] Consent stored in user document
- [ ] Merchant database initialized (200+ entries)
- [ ] Merchant normalization function working

#### Phase 2: Enhanced Prompting

- [ ] Few-shot examples curated (5-10 receipts)
- [ ] Prompt updated with examples
- [ ] Post-processing pipeline implemented
- [ ] Merchant fuzzy matching working
- [ ] Date validation added
- [ ] Total verification against items
- [ ] Confidence scoring added to UI
- [ ] "Please verify" prompts showing
- [ ] A/B test framework set up
- [ ] Baseline metrics recorded

#### Phase 3: Model Fine-Tuning

- [ ] 10,000+ receipts collected with corrections
- [ ] Training data exported to JSONL
- [ ] Data validation passed
- [ ] Train/val/test split created
- [ ] Vertex AI tuning job configured
- [ ] Tuning job completed successfully
- [ ] Model evaluation shows improvement
- [ ] Shadow mode deployment completed
- [ ] Comparison metrics logged
- [ ] 10% rollout completed
- [ ] 50% rollout completed
- [ ] 100% rollout completed

#### Phase 4: Continuous Improvement

- [ ] Automated export pipeline running
- [ ] Retraining triggers configured
- [ ] Performance monitoring dashboard live
- [ ] Alerting configured
- [ ] Regional adapters planned
- [ ] Auto-correction patterns working

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Technical Team | Initial document |

---

*This document serves as the technical guide for implementing ML-powered receipt scanning improvements for Gastify. For questions, contact the technical lead.*
