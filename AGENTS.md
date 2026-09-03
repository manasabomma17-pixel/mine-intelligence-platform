# AGENTS.md

## Project

- Python + React prototype for Smart India Hackathon (SIH26023): AI-Powered Mining & Geological Intelligence Platform.
- Backend: FastAPI + SQLite (SQLAlchemy) + ChromaDB + LangChain + ReportLab. Frontend: React + Vite + Tailwind + Recharts.
- **Read `IMPLEMENTATION_PLAN.md` first** — it is the authoritative blueprint (architecture, folder layout, schema, pipelines, endpoints, dependencies, dev phases). Build against it.

## Commands

- Backend: `cd backend && uvicorn run:app --reload` (or run `python run.py`)
- Frontend dev: `cd frontend && npm run dev` (Vite proxies `/api` to backend)
- Frontend build (served by FastAPI): `npm run build`
- Tests: `pytest tests/` (once added)

## Conventions

- Single monolith: FastAPI serves the built SPA from `frontend/dist` — one server for demo.
- No microservices, no auth (prototype), no extraneous infra.
- SQLite holds relational metadata + normalized production records; Chroma holds embeddings, linked via `Document.id`/`chunk.doc_id`.
- LLM provider abstracted via LangChain and set by env var (`LLM_PROVIDER`); default OpenAI. Keys live in `.env` (gitignored); use `.env.example`.
- Seed data lives in `backend/app/data/` (committed) so the demo works offline.

## Gotchas

- OCR (`pytesseract`) requires the system `tesseract` binary — not just the pip package.

## Early-stage note

- Repo is scaffolding/plan only so far; no application code has been committed yet.
