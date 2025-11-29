# Deployment Guide – Replit + Replit DB

## Backend (FastAPI)
1) Create a **Python → FastAPI** app.
2) Add files under `backend/app/` or root `app/` (ensure imports match).
3) Install:
```
pip install fastapi uvicorn replit python-jose[cryptography] passlib[bcrypt] pydantic httpx python-decouple
```
4) Run:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
5) Open `/docs` and `/health`.

## Frontend (React + Vite)
1) Create **React → Vite** app.
2) Install: `axios zustand react-router-dom tailwindcss postcss autoprefixer`
3) Set `.env` → `VITE_API_URL=https://<backend-url>/api`
4) `npm run dev` → verify login + review loop.

## Secrets (Replit → Tools → Secrets)
- `JWT_SECRET` = long random string
- `OCR_API_KEY` = optional

## Scaling Later
- Swap `db_adapter.py` for Mongo driver, keep routes/services intact.
