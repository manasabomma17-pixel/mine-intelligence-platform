# Mine Intelligence Platform — Implementation Plan

Smart India Hackathon (SIH26023) prototype.
AI-Powered Mining & Geological Intelligence Platform.

This document is the blueprint. **No application code is written yet** — build follows this plan.

---

## 1. Architecture

Monolith: a single FastAPI backend serving both a JSON API and the built React frontend (static files), plus ChromaDB as a local vector store. SQLite for relational metadata. No microservices, no message queue, no external infra.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                      │
│  React SPA (Vite + Tailwind + Recharts)                      │
│  ┌──────────────┬──────────────┬─────────────────────┐       │
│  │ AI Assistant │ Production   │ Report              │       │
│  │ tab          │ Intelligence│ Generator           │       │
│  └──────────────┴──────────────┴─────────────────────┘       │
│         │                    │                        │       │
└─────────┼────────────────────┼────────────────────────┼───────┘
          │        JSON API (REST / FastAPI)            │
┌─────────▼────────────────────▼────────────────────────▼──────┐
│  FastAPI backend (single process, uvicorn)                    │
│                                                               │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ RAG Engine │  │ Production   │  │ Report Generator   │    │
│  │ (LangChain)│  │ Analytics    │  │ (ReportLab)        │    │
│  └─────┬──────┘  └──────┬───────┘  └────────────────────┘    │
│        │                 │                                    │
│  ┌─────▼──────┐   ┌──────▼───────┐   ┌──────────────────┐    │
│  │ ChromaDB   │   │ Pandas/NumPy │   │ SQLite (SQLAlchemy)│  │
│  │ (vector)   │   │ sklearn      │   │ metadata + data   │   │
│  └────────────┘   └──────────────┘   └──────────────────┘    │
│                                                               │
│  ┌───────────────────────────────┐                            │
│  │ LLM API (LangChain)           │                            │
│  │ + embeddings                  │                            │
│  └───────────────────────────────┘                            │
└───────────────────────────────────────────────────────────────┘
```

Key decisions:
- **FastAPI** serves the built React SPA from `frontend/dist` so there is exactly one server to deploy/run.
- **SQLite** (single file) via SQLAlchemy for document metadata, uploaded file records, and normalized production data.
- **ChromaDB** persistent client on local disk for embeddings. Relational metadata in SQLite; embeddings in Chroma; the `file_id` links them.
- **LLM via LangChain** abstraction so the provider (OpenAI/other) can be swapped with an env var.
- All heavy pipelines (ingest, OCR, analytics) run synchronously for the prototype. For large jobs we may move to `BackgroundTasks`, but keep it simple.

---

## 2. Folder structure

```
mine-intelligence-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app factory, CORS, static mount, router registration
│   │   ├── config.py             # settings from env vars (pydantic-settings)
│   │   ├── database.py           # SQLAlchemy engine, session, Base
│   │   ├── models.py             # ORM models (Document, ProductionDataset, MetricsCache)
│   │   ├── schemas.py            # Pydantic request/response models
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── assistant.py      # /assistant/ask + /assistant/ingest routes
│   │   │   ├── production.py     # upload, trends, targets, forecast, anomalies
│   │   │   └── report.py         # generate + download report
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py         # PDF save, metadata tracking
│   │   │   ├── ocr.py            # PyMuPDF extract, fallback to Tesseract
│   │   │   ├── chunking.py       # LangChain text splitters
│   │   │   ├── embeddings.py     # embedding provider wrapper
│   │   │   ├── vectorstore.py    # Chroma client + collection helpers
│   │   │   ├── rag.py            # retrieval + LangChain chain + citations
│   │   │   ├── analytics.py      # trends, targets, comparisons, aggregations
│   │   │   ├── anomalies.py      # anomaly detection
│   │   │   ├── forecast.py       # forecasting
│   │   │   └── report.py         # assemble content + generate PDF (ReportLab)
│   │   └── data/                 # sample seed documents + CSVs (committed)
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py                    # uvicorn entrypoint
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # dev proxy to backend
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # tab/route shell
│       ├── api/client.js         # fetch wrapper
│       ├── components/           # shared UI (cards, upload, spinner)
│       ├── features/
│       │   ├── assistant/        # chat UI, citations
│       │   ├── production/       # trends, targets, comparisons, anomalies, forecast charts
│       │   └── report/           # report builder + download
│       └── ... (Recharts wrappers)
├── tests/
│   ├── test_ingest.py
│   ├── test_analytics.py
│   └── test_api.py
├── data/                         # runtime: sqlite file, chroma dir (gitignored)
├── AGENTS.md
└── README.md
```

---

## 3. Backend modules

| Module | Responsibility |
|---|---|
| `main.py` | App factory, mount `/api` router, serve `frontend/dist` static, CORS, startup DB+Chroma init. |
| `config.py` | Central settings via `pydantic-settings` (DB path, Chroma path, LLM provider/key, model names, embedding model). |
| `database.py` | SQLAlchemy engine/session for the SQLite file. |
| `models.py` | ORM models (see schema). |
| `schemas.py` | Pydantic DTOs for ask request/response, upload responses, analytics payloads, etc. |
| `services/ocr.py` | Extract text from PDF. Try `PyMuPDF` text layer first; if pages yield no/little text, run `pytesseract` on rendered page images. Returns per-page text. |
| `services/chunking.py` | Split page text into chunks (`RecursiveCharacterTextSplitter`), keep page number + doc id per chunk. |
| `services/embeddings.py` | LangChain `Embeddings` wrapper around configured provider. |
| `services/vectorstore.py` | Chroma `PersistentClient`; collection per task; upsert chunks; similarity search with metadata (doc_id, page). |
| `services/rag.py` | Build retrieval QA chain (LangChain). Retrieve top-k, stuff into context, call LLM with "ground only in this context" prompt. Return answer + source chunks for citations. |
| `services/analytics.py` | Load uploaded data into Pandas; compute monthly trends, target vs actual, group by mine/mineral, basic aggregates. |
| `services/anomalies.py` | IsolationForest (or simple z-score) per series; return flagged rows. |
| `services/forecast.py` | LinearRegression / statsmodels on aggregate metric over time; return future points + confidence band. |
| `services/report.py` | Assemble sections (RAG summary, analytics tables, anomalies, forecast, citations) as structured data; render PDF via ReportLab. |
| `api/*` | Thin route handlers; orchestrate services; no business logic inline. |

---

## 4. Frontend modules

| Module | Responsibility |
|---|---|
| `App.jsx` | 3-tab layout: AI Assistant / Production Intelligence / Report. |
| `api/client.js` | `fetch` wrapper with base URL from Vite proxy; handles JSON + file upload + PDF download. |
| `features/assistant/` | Upload document card (PDF drag-drop), chat box, message list, answer + inline document/page citations (click → highlight). |
| `features/production/` | File upload (xlsx/csv), target-vs-actual line/bar chart, mine/mineral comparison, trend chart, anomaly scatter/table, forecast line with band. Uses Recharts. |
| `features/report/` | "Generate report" button → POST → gets PDF blob → download link + preview summary. |
| `components/` | Reusable upload, chart card, spinner, empty state, error toast. |

Design: single-page, tabbed, Tailwind for styling, Recharts for all charts. No routing library needed (tabs suffice) — keep it minimal.

---

## 5. Database schema (SQLite / SQLAlchemy)

```
Document
  id            INTEGER PK
  filename      TEXT
  file_path     TEXT            # stored copy path
  num_pages     INTEGER
  ingested_at   DATETIME
  status        TEXT            # queued | processing | done | failed

ProductionDataset
  id            INTEGER PK
  filename      TEXT
  file_path     TEXT
  sheet         TEXT            # original sheet/table name
  columns       JSON            # normalized column mapping
  uploaded_at   DATETIME

ProductionRecord
  id            INTEGER PK
  dataset_id    FK -> ProductionDataset
  period        TEXT            # e.g. "2024-01" (normalized date)
  mine          TEXT
  mineral       TEXT
  target        FLOAT NULL
  actual        FLOAT
  unit          TEXT NULL
```

Note: `ProductionRecord` is the normalized form of any uploaded CSV/XLSX. Normalization maps common column naming (`date`, `mine`, `mineral`, `target`, `actual`) onto a canonical schema so all analytics are uniform regardless of upload format.

The vector store (Chroma) is not in the SQLite schema — chunk metadata (doc_id, page) lives in Chroma, cross-referenced to `Document.id`.

---

## 6. RAG pipeline

1. **Ingest (POST /assistant/ingest):** save uploaded PDF; record a `Document` row (status=processing).
2. **OCR/Extract:** `ocr.py` returns `{page_number: text}` using PyMuPDF text layer → Tesseract fallback.
3. **Chunk:** per page, `RecursiveCharacterTextSplitter` → chunks with metadata `{doc_id, page}`.
4. **Embed + store:** embed each chunk, upsert into Chroma collection (persistent).
5. **Ask (POST /assistant/ask):**
   - Embed the user question.
   - Similarity search top-k in Chroma.
   - Build LangChain `RetrievalQA` / custom chain with a grounding prompt: "Answer using ONLY the provided context. If the answer is not in context, say you don't know."
   - LLM returns answer.
6. **Citations:** return the retrieved chunks (doc, page, snippet) alongside the answer; frontend renders them as clickable citations.

Design choice: keep the chain fully context-grounded to avoid hallucination and to make citations honest — which is the "evidence-backed" selling point.

---

## 7. OCR pipeline

1. Attempt text extraction per page with `fitz` (PyMuPDF) directly.
2. For each page where extracted text length < threshold:
   - Render page to image at ~200 DPI (`page.get_pixmap()`).
   - Run `pytesseract.image_to_string` on the image.
3. Merge per-page results into `{page: text}`.
4. Tesseract must be installed on the host (note in README). Scanned/low-quality PDFs are the primary trigger.

Fallback ordering matters: text-layer first (fast, accurate) → OCR only where needed (slow) → keeps prototype responsive.

---

## 8. Production analytics pipeline

1. **Upload (POST /production/upload):** accept CSV or XLSX; parse with Pandas.
2. **Normalize:** auto-map columns to `{period, mine, mineral, target, actual, unit}` (heuristics + optional explicit mapping). Reject rows that don't parse.
3. **Persist:** write normalized records to `ProductionRecord`.
4. **Compute on demand (GET endpoints):**
   - **Trends:** group actual by period → line chart data.
   - **Target vs actual:** group by period (and optional mine/mineral) → compare series.
   - **Comparisons:** pivot actual by mine (or mineral) for side-by-side bars.
   - All endpoints read the same normalized records, so they compose.

---

## 9. Anomaly detection approach

- For a chosen series (mine + mineral, metric = actual over time), fit `IsolationForest` on the (period-index → value) pattern; flag low-confidence/suspicious points.
- Fallback: **z-score** method — flag points where |z| > threshold (e.g. 2.5) — simpler and transparent for small datasets.
- Return list of anomaly rows: `{period, value, expected, deviation}`.
- Keep both methods in code but default to z-score for prototype transparency.

---

## 10. Forecasting approach

- Use the normalized aggregate (e.g. monthly total actual) as a time series.
- Default: `LinearRegression` over time index (simple, no external deps). If meaningful seasonality, optionally `statsmodels` simple model — but prototype default is linear to keep it robust on small/sparse data.
- Return: predicted future periods + confidence band (e.g. ±1 std of residuals).
- Guard: if < 2 data points, return empty forecast with an explanatory message.

---

## 11. Report generation approach

1. **Assemble content (POST /report/generate):**
   - RAG summary: ask a fixed set of "capstone" questions (e.g. key geological findings, safety/closures, resource notes) and collect answers + citations.
   - Analytics: trends table, target-vs-actual summary, top mine/mineral comparisons.
   - Anomalies: flagged rows + short explainer.
   - Forecast: projected values + band.
2. **Render (ReportLab):** a structured PDF with sections, tables, and an appendix of citations. Persist to `data/reports/<uuid>.pdf`.
3. **Serve (GET /report/{id}/download):** return the PDF file.

Keeps report data structured first, then formatted — so the same data could later render HTML/markdown without rework.

---

## 12. API endpoints

```
POST /assistant/ingest       multipart file (PDF) -> {document_id, pages, chunks}
POST /assistant/ask          {"question"} -> {answer, citations:[{document_id, page, snippet}]}
GET  /assistant/documents    list ingested documents

POST /production/upload      multipart file (csv/xlsx) -> {dataset_id, rows, columns}
GET  /production/trends      ?mine=&mineral=&metric=actual -> {labels:[], values:[]}
GET  /production/targets     ?mine=&mineral= -> {labels:[], target:[], actual:[]}
GET  /production/comparisons ?group_by=mine|mineral&metric= -> {series:[...]}
GET  /production/anomalies   ?mine=&mineral= -> {rows:[{period, value, expected, deviation}]}
GET  /production/forecast    ?mine=&mineral=&horizon= -> {dates:[], values:[], lower:[], upper:[]}
GET  /production/datasets    list uploaded datasets

POST /report/generate        {} -> {report_id}
GET  /report/{id}/download   -> application/pdf
```

All endpoints are GET/POST JSON; file uploads via multipart. No auth (prototype).

---

## 13. Dependencies

**Backend (`requirements.txt`):**
```
fastapi
uvicorn[standard]
python-multipart          # file uploads
sqlalchemy
pydantic
pydantic-settings
pandas
numpy
scikit-learn
pymupdf
pytesseract              # requires system tesseract binary
langchain
langchain-community
chromadb
openai                    # or provider of choice
tiktoken                  # tokenization for splitters (if OpenAI)
reportlab
```

**Frontend (`package.json`):**
```
react
react-dom
vite
@vitejs/plugin-react
tailwindcss
postcss
autoprefixer
recharts
```

Optional/conditional: `statsmodels` only if seasonal forecasting is added.

---

## 14. Environment variables (`.env`)

```
# Backend
DATABASE_PATH=./data/app.db
CHROMA_PATH=./data/chroma
DATA_DIR=./data
REPORTS_DIR=./data/reports
UPLOAD_DIR=./data/uploads

# LLM provider (LangChain route)
LLM_PROVIDER=openai                 # swap target
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini               # cheap / fast
EMBEDDING_MODEL=text-embedding-3-small

# OCR
OCR_ENABLED=true
OCR_MIN_TEXT_PER_PAGE=20            # chars below which OCR kicks in

# Dev
CORS_ORIGINS=http://localhost:5173
```

Backend reads these via `pydantic-settings`; `.env.example` committed, real `.env` gitignored.

---

## 15. Development phases

**Phase 0 — Scaffolding**
- Create folder structure; minimal FastAPI app (health endpoint); Vite + Tailwind React shell with 3 tabs; wire Vite proxy. Confirm both run.

**Phase 1 — AI Assistant (RAG)**
- PDF ingest + metadata + OCR + chunking + embeddings + Chroma + ask endpoint + citation payload.
- Frontend: upload + chat + citations.

**Phase 2 — Production Intelligence**
- Upload/normalize CSV/XLSX; persistence; trends/targets/comparisons endpoints; anomalies + forecast.
- Frontend: upload + Recharts for each visualization.

**Phase 3 — Report Generation**
- Assemble content in services; ReportLab PDF; generate/download endpoint.
- Frontend: generate + download button + summary.

**Phase 4 — Polish & Demo**
- Seed sample documents + CSV in `backend/app/data` (committed) so demo works offline.
- README with setup + run instructions; test key endpoints; ensure backend serves built frontend (single command demo).

**Delivery:** `uvicorn run:app` after `npm run build` → one serving app at `http://localhost:8000`.

---

## Open questions (to confirm if not already decided)
- LLM provider/API key available during the demo (network access + budget)? `openai` assumed; fallback could be a local/cheap model.
- Is Tesseract installable in the demo environment? If not, OCR falls back to "best effort" and we seed text-layer PDFs for the demo.
- Preferred chart granularity/units for sample production data (affects seeded CSV shape) — will be decided when creating seed data.
