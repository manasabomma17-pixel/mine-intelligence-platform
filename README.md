# Mine Intelligence Platform

AI-Powered Mining & Geological Intelligence Platform — a Smart India Hackathon (SIH26023) prototype.

## Project purpose

Fragmented mining/geological documents and structured production data are converted into searchable,
evidence-backed intelligence with three features:

1. **AI Mining Assistant** — ingest PDFs (including scanned ones via OCR), chunk + embed them, and
   answer natural-language questions with grounded answers and document/page citations (RAG).
2. **Production Intelligence** — upload Excel/CSV production data, visualize trends, target vs actual,
   mine/mineral comparisons, detect anomalies, and forecast production.
3. **Automated Mine Intelligence Report** — combines RAG findings, production analytics, anomalies,
   forecasts, and citations into a downloadable PDF report.

## Technology stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts
- **Backend:** Python, FastAPI
- **Database:** SQLite (SQLAlchemy)
- **Vector database:** ChromaDB
- **AI:** LangChain, LLM API, embeddings
- **Data:** Pandas, NumPy, scikit-learn / statsmodels
- **Document processing:** PyMuPDF, Tesseract OCR
- **Report:** ReportLab

> See `IMPLEMENTATION_PLAN.md` for the full architecture, schema, pipelines, and API design.

## Repository layout

```
backend/    FastAPI app
frontend/   React (Vite + Tailwind)
data/       Runtime data (DB, uploads, chroma, reports) — gitignored
docs/       Documentation
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- (Later phases) Tesseract OCR binary and an LLM API key

## How to run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in values as needed
uvicorn run:app --reload         # or: python run.py
```

Backend runs at http://localhost:8000. Health check: http://localhost:8000/api/health.
Interactive API docs at http://localhost:8000/docs.

## How to run the frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173. The Vite dev server proxies `/api` to the backend.

## How to run everything for a demo (single server)

```bash
cd frontend && npm run build     # produces frontend/dist
cd ../backend && uvicorn run:app --reload
```

FastAPI serves the built SPA from `frontend/dist`, so one server at http://localhost:8000
serves the whole app.

## Tests

```bash
cd backend && pytest tests/       # once tests are added
```
