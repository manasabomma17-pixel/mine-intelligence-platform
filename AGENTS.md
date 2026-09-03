# AGENTS.md

## Project

- Smart India Hackathon (SIH26023) prototype: AI-Powered Mining & Geological Intelligence Platform.
- **Frontend-first interactive demo.** All data is mocked. No real OCR, RAG, LLM, ChromaDB, PostgreSQL, auth, GIS, or voice.
- Tech: React + Vite + Tailwind CSS + Recharts. FastAPI serves the built SPA.
- **Read `IMPLEMENTATION_PLAN.md` first** — it is the authoritative blueprint.

## Commands

- Frontend dev: `cd frontend && npm run dev` (Vite proxies `/api` to backend)
- Frontend build (served by FastAPI): `cd frontend && npm run build`
- Backend: `cd backend && uvicorn run:app --reload` (serves built SPA at :8000)

## Conventions

- Single monolith: FastAPI is a thin static-file server for the built React SPA.
- No microservices, no real auth, no extraneous infra.
- All "intelligence" lives in frontend mock data and React component logic.
- The backend has zero business logic — it only serves the SPA and a health endpoint.
- Recharts for all charts. Tailwind for all styling. No UI library.

## Gotchas

- `uvicorn run:app` requires the `app` import in `backend/run.py`.
- `frontend/dist` must be built before the backend SPA mount works.

## Scope note

- This is a hackathon demo, not production software. Prioritize polish, interactivity, and a clear user journey over backend complexity.
