# Ultraplan Prompt: Gastify (BoletApp) Full-Stack Rebuild

> Copy everything below the line into `/ultraplan` after updating Claude Code to 2.1.91+.

---

## Objective

Rebuild Gastify (currently named BoletApp) — a Chilean smart expense tracker with AI receipt scanning — from its current Firebase/React prototype into a production-grade full-stack application using **FastAPI + PostgreSQL + React + TypeScript**.

## What Gastify Does

Gastify is a PWA that lets users scan receipts and credit card statements with AI (Google Gemini), automatically extracting merchant, date, items, categories, and totals. It tracks spending with analytics, learned category mappings, and multi-currency support. Built for the Chilean market (Spanish-first, CLP default).

**Core Loop:** Scan receipt → AI extracts data → Review/edit → Save transaction → Analytics & insights

**Key Differentiators:**
- **AI receipt scanning** with async pipeline (sub-2s response, server processes in background)
- **Category learning** — remembers merchant→category and item→category mappings per user
- **Unified 4-level taxonomy** — 44 store categories + 42 item categories (Spanish PascalCase)
- **Credit card statement scanning** — PDF upload extracts multiple transactions at once
- **Credit system** — 1 credit per scan, refunded on failure

## Current State (What Exists)

The prototype at this repo has:
- React 18 + TypeScript 5.3 + Vite 5.4 frontend (PWA)
- Firebase Auth (Google OAuth), Firestore (NoSQL), Storage, Cloud Functions
- Zustand (client state) + TanStack Query (server state)
- Gemini 2.5-flash AI for receipt/statement OCR (via 11 Cloud Functions)
- 13 feature modules, ~21K lines TypeScript
- 86 categories (44 store + 42 item) in unified V4 taxonomy
- Async scan pipeline: queue → process → deliver via Firestore listeners
- ~200 unit tests (Vitest) + 13 E2E flows (Playwright)
- Production live, staging environment available

## Target Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend API** | FastAPI (Python 3.12+) | Async, OpenAPI auto-docs |
| **Database** | PostgreSQL 16 | Relational, ACID transactions |
| **ORM** | SQLAlchemy 2.0 + Alembic | Async engine, migration management |
| **Task Queue** | Celery + Redis | Replaces Firestore triggers for async scan pipeline |
| **Auth** | Firebase Auth (keep JWT verification) or Supabase Auth | Google OAuth |
| **File Storage** | Supabase Storage or AWS S3 | Receipt images + thumbnails |
| **Frontend** | React 18 + TypeScript + Vite | Rebuild with same design patterns |
| **State** | Zustand + TanStack Query | Same pattern, new REST endpoints |
| **AI** | Google Gemini 2.5 Flash | Direct API call from FastAPI workers |
| **Cache** | Redis | Rate limiting, session cache, Celery broker |
| **Real-time** | WebSockets (FastAPI) or SSE | Replace Firestore onSnapshot for scan status |
| **Hosting** | Railway or Fly.io (API + workers) + Vercel (frontend) | Budget-friendly |
| **Testing** | pytest (backend) + Vitest (frontend) + Playwright (E2E) | 80% coverage target |

## Database Schema

Translate the current Firestore collections into PostgreSQL tables:

### Core Tables

```sql
-- Users & Auth
users (
  id UUID PK DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,  -- or supabase auth.uid
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  locale TEXT DEFAULT 'es',
  currency TEXT DEFAULT 'CLP',
  theme TEXT DEFAULT 'light',
  color_theme TEXT DEFAULT 'normal',
  font_family TEXT DEFAULT 'system',
  font_size TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Credits
user_credits (
  user_id UUID PK REFERENCES users(id),
  balance INTEGER DEFAULT 10,
  total_earned INTEGER DEFAULT 10,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
)

credit_transactions (
  id UUID PK,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,  -- positive = earn, negative = spend
  type TEXT NOT NULL,  -- 'initial', 'scan_deduct', 'scan_refund', 'purchase', 'bonus'
  scan_id UUID,  -- reference to pending_scan if applicable
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Transactions (core entity)
transactions (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  time TIME,
  merchant TEXT NOT NULL CHECK (char_length(merchant) BETWEEN 1 AND 200),
  alias TEXT,
  store_category TEXT NOT NULL,  -- PascalCase from taxonomy (e.g., 'Supermarket')
  total INTEGER NOT NULL CHECK (total BETWEEN 0 AND 999999999),
  currency TEXT DEFAULT 'CLP',
  country TEXT,
  city TEXT,
  receipt_type TEXT,  -- 'receipt', 'invoice', 'ticket'
  merchant_source TEXT,  -- 'scan', 'learned', 'user'
  prompt_version TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Pre-computed period keys for efficient queries
  period_day DATE GENERATED ALWAYS AS (date) STORED,
  period_week TEXT,  -- YYYY-Www (ISO week)
  period_month TEXT GENERATED ALWAYS AS (to_char(date, 'YYYY-MM')) STORED,
  period_quarter TEXT,  -- YYYY-Qn
  period_year TEXT GENERATED ALWAYS AS (to_char(date, 'YYYY')) STORED
)

-- Transaction line items
transaction_items (
  id UUID PK DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty NUMERIC DEFAULT 1,
  unit_price INTEGER,
  total_price INTEGER NOT NULL,
  item_category TEXT,  -- PascalCase from taxonomy (e.g., 'Produce')
  subcategory TEXT,
  category_source TEXT,  -- 'scan', 'learned', 'user'
  subcategory_source TEXT,
  sort_order INTEGER DEFAULT 0
)

-- Receipt images
transaction_images (
  id UUID PK DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  is_thumbnail BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Async scan pipeline
pending_scans (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'queued',  -- 'queued', 'processing', 'completed', 'failed'
  image_urls TEXT[] NOT NULL,
  result JSONB,  -- extracted transaction data on completion
  error TEXT,
  credit_deducted BOOLEAN DEFAULT false,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Category learning (per-user)
merchant_category_mappings (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  merchant_name TEXT NOT NULL,
  store_category TEXT NOT NULL,
  confidence NUMERIC DEFAULT 1.0,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, merchant_name)
)

item_category_mappings (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  subcategory TEXT,
  confidence NUMERIC DEFAULT 1.0,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, item_name)
)

item_name_mappings (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  original_name TEXT NOT NULL,  -- raw OCR name
  corrected_name TEXT NOT NULL,  -- user-corrected name
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, original_name)
)

-- Merchant trust scoring
merchant_trust_profiles (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  merchant_name TEXT NOT NULL,
  trust_score NUMERIC DEFAULT 0.5,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  UNIQUE (user_id, merchant_name)
)

-- User preferences (cloud-persisted settings)
user_preferences (
  user_id UUID PK REFERENCES users(id),
  preferences JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Notifications
notifications (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Push subscriptions
push_subscriptions (
  id UUID PK,
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,  -- p256dh + auth
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Indexes

```sql
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_month ON transactions(user_id, period_month);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, store_category);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_pending_scans_user_status ON pending_scans(user_id, status);
CREATE INDEX idx_pending_scans_stale ON pending_scans(status, deadline) WHERE status = 'processing';
CREATE INDEX idx_merchant_mappings_user ON merchant_category_mappings(user_id, merchant_name);
CREATE INDEX idx_item_mappings_user ON item_category_mappings(user_id, item_name);
```

## Unified Category Taxonomy (V4 — MUST PRESERVE EXACTLY)

### Store Categories (L2 — Where You Buy) — 44 PascalCase values

Supermarket, Wholesale, Restaurant, Almacen, Minimarket, OpenMarket, Kiosk, LiquorStore, Bakery, Butcher, UtilityCompany, PropertyAdmin, Pharmacy, Medical, Veterinary, HealthBeauty, Bazaar, ClothingStore, ElectronicsStore, HomeGoods, FurnitureStore, Hardware, GardenCenter, PetShop, BookStore, OfficeSupplies, SportsStore, ToyStore, AccessoriesOptical, OnlineStore, AutoShop, GasStation, Transport, GeneralServices, BankingFinance, TravelAgency, SubscriptionService, Government, Education, Lodging, Entertainment, Casino, CharityDonation, Other

### Item Categories (L4 — What You Buy) — 42 PascalCase values

Produce, MeatSeafood, BreadPastry, DairyEggs, Pantry, FrozenFoods, Snacks, Beverages, PreparedFood, BeautyCosmetics, PersonalCare, Medications, Supplements, BabyProducts, CleaningSupplies, HomeEssentials, PetSupplies, PetFood, Furnishings, Apparel, Technology, Tools, Garden, CarAccessories, SportsOutdoors, ToysGames, BooksMedia, OfficeStationery, Crafts, ServiceCharge, TaxFees, Subscription, Insurance, LoanPayment, TicketsEvents, HouseholdBills, CondoFees, EducationFees, Alcohol, Tobacco, GamesOfChance, OtherItem

**Single source of truth:** These must be defined as Python enums AND shared with the frontend as a TypeScript enum, generated from the same source.

## Async Scan Pipeline (CRITICAL — Most Complex Feature)

The current system uses Firestore triggers. The rebuild must replicate this with Celery:

### Current Flow (to replicate)

```
1. User captures receipt images → uploads to Storage
2. Client calls queueReceiptScan(imageUrls)
3. Server: validate credit → deduct 1 credit → create pending_scan → return {scanId, deadline}
   (returns in <1s)
4. Background worker: fetch images → resize to 1200x1600 JPEG 80% → call Gemini → parse JSON → coerce types → generate thumbnail → update pending_scan with result
   (takes 10-30s)
5. Client polls or receives WebSocket event when scan completes
6. UI shows: QuickSave (high confidence) or Editor (low confidence) or Batch Review (multiple receipts)
```

### Target Architecture (Celery + WebSocket)

```
Client → POST /api/v1/scans/queue {imageUrls} → FastAPI
  ├─ Validate auth + credit balance
  ├─ Deduct credit (atomic DB transaction)
  ├─ Create pending_scan record (status=queued)
  ├─ Dispatch Celery task: process_receipt_scan.delay(scan_id)
  └─ Return {scanId, deadline} immediately

Celery Worker picks up task:
  ├─ Update status → processing
  ├─ Fetch images from S3/Storage
  ├─ Resize/compress (Pillow: 1200x1600, JPEG 80%)
  ├─ Call Gemini 2.5-flash with prompt
  ├─ Parse JSON response → coerce numbers → validate
  ├─ Generate thumbnail (120x160)
  ├─ Upload thumbnail to S3/Storage
  ├─ Update pending_scan: status=completed, result=JSONB
  ├─ Send WebSocket notification to client
  └─ On ANY error: atomic credit refund + status=failed

Scheduled task (every hour):
  ├─ Find stale scans (processing + past deadline)
  ├─ Auto-fail + refund credit
  └─ Delete expired scans (>24h old)
```

### Failure Recovery (MUST preserve all paths)

| Failure | Current Behavior | Rebuild Equivalent |
|---------|-----------------|-------------------|
| Gemini API error | processReceiptScan refunds atomically | Celery task catches, refunds in DB transaction |
| User cancels | onPendingScanDeleted trigger refunds | DELETE /api/v1/scans/{id} → refund + cleanup |
| Worker timeout | cleanupPendingScans (hourly) refunds | Celery beat task does same |
| Bad JSON from Gemini | Retry 2-3 times with coercion | Same retry logic in worker |

## Credit Card Statement Scanning

Similar to receipt scanning but for PDF statements:

```
Client → POST /api/v1/statements/queue {pdfUrl}
  ├─ Deduct 1 "super credit"
  ├─ Create pending_scan (type=statement)
  └─ Return {scanId, deadline}

Worker:
  ├─ Fetch PDF from storage
  ├─ Call Gemini with statement-specific prompt
  ├─ Extract MULTIPLE transactions from single PDF
  ├─ Return array of transaction objects
  └─ Refund on failure
```

## API Design

```
# Auth
POST   /api/v1/auth/google              — Google OAuth token exchange → JWT
POST   /api/v1/auth/refresh             — Refresh JWT token
GET    /api/v1/auth/me                   — Current user profile

# Transactions
GET    /api/v1/transactions              — List (paginated, filterable by date/category/merchant)
POST   /api/v1/transactions              — Create transaction
GET    /api/v1/transactions/{id}         — Get with items + images
PATCH  /api/v1/transactions/{id}         — Update transaction
DELETE /api/v1/transactions/{id}         — Delete (cascade items + images)

# Transaction Items (nested or separate)
GET    /api/v1/transactions/{id}/items   — List items
POST   /api/v1/transactions/{id}/items   — Add item
PATCH  /api/v1/items/{id}               — Update item
DELETE /api/v1/items/{id}               — Delete item

# Items View (flattened across transactions)
GET    /api/v1/items                     — Flattened items view (filterable)
GET    /api/v1/items/aggregated          — Aggregated spending by product

# Scan Pipeline
POST   /api/v1/scans/queue              — Queue receipt scan (deducts credit)
GET    /api/v1/scans/{id}               — Poll scan status
DELETE /api/v1/scans/{id}               — Cancel scan (refunds credit)
WS     /api/v1/scans/ws                 — WebSocket for real-time scan updates

# Statement Scanning
POST   /api/v1/statements/queue         — Queue statement scan
GET    /api/v1/statements/{id}          — Poll statement status

# Credits
GET    /api/v1/credits                   — Current balance + history
POST   /api/v1/credits/purchase          — Buy credits (future: payment integration)

# Category Mappings (learning)
GET    /api/v1/mappings/merchants        — User's merchant→category mappings
POST   /api/v1/mappings/merchants        — Save mapping
GET    /api/v1/mappings/items            — User's item→category mappings
POST   /api/v1/mappings/items            — Save mapping
GET    /api/v1/mappings/item-names       — User's item name corrections
POST   /api/v1/mappings/item-names       — Save correction

# Analytics
GET    /api/v1/analytics/dashboard       — Dashboard summary (period, totals, category breakdown)
GET    /api/v1/analytics/trends          — Spending trends over time
GET    /api/v1/analytics/categories      — Category breakdown with comparisons
GET    /api/v1/analytics/merchants       — Top merchants

# Settings / Preferences
GET    /api/v1/preferences               — User preferences
PATCH  /api/v1/preferences               — Update preferences

# Notifications
GET    /api/v1/notifications             — List notifications
PATCH  /api/v1/notifications/{id}/read   — Mark as read
POST   /api/v1/push/subscribe            — Register push subscription

# Image Upload
POST   /api/v1/uploads/receipt-images    — Upload receipt images (returns URLs)

# Export
GET    /api/v1/export/csv                — Export transactions as CSV
```

## Gemini AI Integration Details

### Receipt Prompt (preserve logic)

The Gemini prompt must:
1. Accept 1-5 receipt images (resized to 1200x1600 JPEG 80%)
2. Extract: merchant, date (YYYY-MM-DD), time (HH:mm), total, currency, country, city, receiptType
3. Extract items: name, qty, unitPrice, totalPrice, category (from V4 taxonomy), subcategory
4. Auto-detect currency from receipt content
5. Use V4 PascalCase categories in the prompt (exact match required)
6. Return structured JSON (not markdown, not free text)
7. Handle: Chilean boletas, facturas, international receipts, handwritten receipts

### Statement Prompt

1. Accept PDF (credit card statement)
2. Extract multiple transactions with: date, merchant, amount, category
3. Handle Chilean bank statement formats (BCI, Santander, BancoEstado, etc.)

### Coercion & Validation

After Gemini returns JSON:
- Coerce string numbers to integers (e.g., "1.500" → 1500 for CLP)
- Validate category values against V4 taxonomy enum
- Fallback: "Other" for store, "OtherItem" for items
- Validate total matches sum of items (±tolerance)
- Handle missing fields gracefully

## Category Learning System

Per-user mappings that improve over time:

1. **Merchant → Store Category:** When user confirms "Lider" = "Supermarket", save mapping. Next scan from "Lider" auto-applies "Supermarket".
2. **Item → Item Category:** When user confirms "Leche Colun" = "DairyEggs", save mapping. Next scan with "Leche Colun" auto-applies.
3. **Item Name Corrections:** When user corrects "LCH COLUN 1LT" → "Leche Colun 1L", save mapping. Next scan normalizes OCR output.
4. **Confidence scoring:** Track use_count. Higher count = higher confidence = auto-apply without asking.

## Key Features to Preserve

### 1. Transaction Management
- CRUD with items, images, categories
- Pre-computed period keys (day, week, month, quarter, year) for efficient queries
- Auto-updated timestamps (updatedAt on every save)
- Merchant aliases (user-defined nicknames)

### 2. Analytics Dashboard
- Spending by period (day/week/month/quarter/year)
- Category breakdown (pie/bar charts)
- Top merchants
- Spending trends over time
- Period-over-period comparison

### 3. Items View
- Flatten all transaction items across all transactions
- Aggregate by normalized name + merchant
- Show: total spent, purchase count, avg price, last purchase date
- Filter by category, merchant, date range

### 4. Settings & Preferences
- Theme: light/dark
- Color theme: mono/normal/professional (44+ Tailwind variants)
- Font family + size selection
- Language: Spanish (default) / English
- Currency: CLP (default), USD, EUR
- Cloud-persisted preferences (sync across devices)

### 5. Credit System
- Initial balance: 10 credits
- 1 credit per receipt scan, 1 "super credit" per statement scan
- Atomic deduction on queue, atomic refund on failure
- Full transaction log (earn/spend/refund)

### 6. Notifications
- In-app notification feed
- Web Push (VAPID) for browser notifications
- FCM for mobile (if PWA on Android)

### 7. PWA Capabilities
- Installable on home screen
- Offline support (cache-first for static assets)
- Service worker

### 8. Spanish-First i18n
- All UI text in Spanish (Chilean Spanish)
- English as secondary language
- Category names translated (ES ↔ EN)
- Code and API in English

## Key Source Files to Reference

Read these for full context:
- `docs/architecture/architecture.md` — System overview with Mermaid diagrams
- `docs/architecture/scan-pipeline-architecture.md` — Async scan pipeline
- `docs/architecture/data-models.md` — Firestore collections & Transaction schema
- `docs/architecture/cloud-functions.md` — All 11 functions documented
- `docs/architecture/api-contracts.md` — Cloud Function API specs
- `shared/schema/categories.ts` — Unified V4 category taxonomy (SSoT)
- `src/types/transaction.ts` — Transaction, TransactionItem, TransactionPeriods types
- `src/types/item.ts` — FlattenedItem, AggregatedItem types
- `src/features/scan/` — Scan state machine, handlers, hooks
- `functions/src/processReceiptScan.ts` — Heavy lifting of scan pipeline
- `functions/src/analyzeReceipt.ts` — Gemini integration + prompt
- `functions/src/analyzeStatement.ts` — Statement scanning
- `firestore.rules` — Security rules (data validation patterns)
- `src/utils/categoryTranslations.ts` — ES/EN category translations

## What I Want From This Plan

1. **Monorepo structure** — Directory layout for FastAPI backend + React frontend + shared types
2. **Database setup** — PostgreSQL schema, Alembic migrations, seed data
3. **Auth architecture** — Keep Firebase Auth with JWT verification in FastAPI, or migrate to Supabase Auth
4. **Async scan pipeline** — Celery + Redis setup, worker design, WebSocket delivery
5. **API design** — Pydantic v2 models, OpenAPI spec, request/response contracts
6. **Category system** — Shared enum generation (Python + TypeScript from single source)
7. **AI integration** — Gemini direct from FastAPI/Celery workers, prompt management, retry logic
8. **Frontend migration** — What to reuse vs rebuild, component structure
9. **Real-time updates** — WebSocket or SSE for scan status (replace Firestore onSnapshot)
10. **File storage** — S3-compatible storage for receipt images + thumbnails
11. **Deployment architecture** — Railway/Fly.io + Vercel, CI/CD, environment management
12. **Data migration script** — Export Firestore → PostgreSQL seed (production data)
13. **Testing strategy** — pytest + Vitest + Playwright, coverage targets, test data management
14. **Phase breakdown** — Ordered implementation phases with dependencies and milestones

## Constraints

- Solo developer — no team ceremony overhead
- Chilean market first — Spanish-first UI, CLP currency default
- Must preserve EXACT category taxonomy (44 store + 42 item, PascalCase)
- Must preserve async scan pipeline behavior (queue → process → deliver)
- Must preserve all credit system atomic guarantees (deduct/refund)
- Must preserve all failure recovery paths
- Budget-conscious: prefer free tiers (Railway free, Vercel free, Supabase free)
- Cross-app integration with Gustify (sister cooking app) — shared user base, Gustify reads transactions
