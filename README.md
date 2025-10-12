# Sayho Financial Management (Local Dev)

This prototype implements the core requirements from `Codex.md` so the project can be explored locally with separate backend (FastAPI) and frontend (React + Vite) services.

## Prerequisites
- Python 3.11+
- Node.js 20+
- `npm` or `yarn`

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
The API starts on http://127.0.0.1:8000 with OpenAPI docs at `/docs`.

Run backend tests:
```bash
pytest
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```
The SPA runs on http://127.0.0.1:5173 and proxies API calls to the backend via the local Vite dev server configuration.

## First Login Flow
1. Visit http://127.0.0.1:5173/signup to create an account.
2. After sign-up you are redirected to the dashboard.
3. Create a goal, then add transactions and adjust settings.

## Project Layout
- `backend/`: FastAPI app with async SQLite, JWT auth, goal/transaction routes, and pytest suite.
- `frontend/`: Vite + React + Material UI client with auth flow, goal management, and transaction UI.
- `Codex.md`: Original requirements reference.

## Notes
- Both services default to SQLite and local storage, no external services required.
- Environment variables can be adjusted via `backend/.env`.
