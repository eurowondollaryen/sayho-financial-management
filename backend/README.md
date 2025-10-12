# Backend (FastAPI)

Local FastAPI service that powers the Sayho financial management prototype.

## Prerequisites
- Python 3.11+
- `pip` and `virtualenv` (or `uv`, `pipenv`)

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Run
```bash
uvicorn app.main:app --reload
```
API is available at http://127.0.0.1:8000, with docs at http://127.0.0.1:8000/docs.

## Tests
```bash
pytest
```
Each test run rebuilds the local SQLite schema to keep cases isolated.
