# Mine Intelligence Platform

AI-Powered Mining & Geological Intelligence Platform — a Smart India Hackathon (SIH26023) **prototype/demo**.

## Project purpose

An interactive frontend demo that walks through the complete user journey of a mining intelligence
platform — login, dashboard, AI assistant with citations, production analytics (trends, anomalies,
forecast), and generated intelligence reports. **All data is mocked**; no real AI, OCR, or databases.

## Features (mock)

1. **Login** — mock authentication (any credentials).
2. **Dashboard** — key stats + mini charts at a glance.
3. **AI Mining Assistant** — mock RAG-style Q&A with document/page citations.
4. **Production Intelligence** — mock trends, target vs actual, comparisons, anomaly detection, forecasting.
5. **Intelligence Reports** — mock report generation and preview.

## Technology stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts, react-router-dom
- **Backend:** Python, FastAPI (thin static-file server for the built SPA)
- All "intelligence" is mock data in the React frontend.

> See `IMPLEMENTATION_PLAN.md` for the full prototype design.

## Repository layout

```
backend/    FastAPI app (serves the built SPA + health endpoint)
frontend/   React (Vite + Tailwind); all mock data lives in src/mock/
data/       Runtime data — gitignored
docs/       Documentation
```

## Prerequisites

- Node.js 18+
- Python 3.10+ (only needed to serve the built app, not for development)

## How to run the frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

## How to run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn run:app --reload         # or: python run.py
```

Backend runs at http://localhost:8000. Health check: http://localhost:8000/api/health.

## How to run everything for a demo (single server)

```bash
cd frontend && npm run build     # produces frontend/dist
cd ../backend && uvicorn run:app --reload
```

FastAPI serves the built SPA from `frontend/dist`, so one server at http://localhost:8000
serves the whole app.
