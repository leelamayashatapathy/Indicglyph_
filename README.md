# IndicGlyph Studio

A unified data review platform for creating high-quality datasets through gamified human review workflows. Supports multiple modalities (text, OCR, audio) with AI-assisted quality control.

## Stack
- **Backend**: FastAPI (async), Pydantic, JWT auth, PostgreSQL
- **Frontend**: React 18, Vite, React Router, Tailwind CSS
- **Database**: PostgreSQL with JSONB support
- **Storage**: MinIO (S3-compatible object storage)
- **Deployment**: Docker & Docker Compose

## Features
- Multi-modal review: text, OCR, and audio workflows
- Gamified reviewer experience: streaks, badges, payouts
- Operator console: datasets, users, payouts, exports, analytics
- JWT authentication with role-based access control
- PostgreSQL with JSONB for flexible schemas
- OCR & audio ingestion pipelines
- Analytics & reporting over review logs and payouts
- Dynamic schema builder for dataset types

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend runs on: `http://localhost:8000`
API docs: `http://localhost:8000/api/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173` (dev) or served by backend on `http://localhost:8000` (production)

## Quick Start with Docker
```bash
# Start all services (PostgreSQL, MinIO, Backend, Frontend)
docker-compose up -d

# Rebuild images if dependencies changed
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```
Services:
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:8000` (served by backend)
- PostgreSQL: `localhost:5432`
- MinIO Console: `http://localhost:9001`

## User Roles
- **user**: Basic user access
- **reviewer**: Can review dataset items and earn rewards
- **platform_operator**: Can manage datasets, users, and system configuration
- **super_operator**: Full platform access including operator management

## Project Structure
```
/backend/app/
  routes/        # API route handlers
  services/      # Business logic
  models/        # Domain models
  auth/          # Auth helpers
  db_adapter.py  # JSONB-backed storage adapter
/frontend/src/
  pages/         # Page components
  services/      # API client
  hooks/         # React hooks
/docs/           # Documentation
```

## Testing
- Backend: `pytest backend/tests/test_analytics.py`
- Extend with queue/payout/review and job lifecycle tests under `backend/tests/` as needed.

## Environment Variables (backend/app/config.py)
- `SECRET_KEY`: Required in non-dev; JWT signing secret.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token lifetime (default 120 minutes).
- `CORS_ALLOWED_ORIGINS`: Comma-separated origins (wildcard blocked in non-dev).
- `DATABASE_URL`: PostgreSQL URL.

## Background Jobs
OCR and ASR uploads are queued; run workers separately using the provided entrypoints (`run_ocr_job_worker`, `run_audio_job_worker`) to process jobs and update statuses.

## Documentation
- [API Reference](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Deep Risks](CODEBASE_DEEP_RISKS.md)
- [Codebase Map](CODEBASE_MAP.md)

## Security Notes
1. Set a strong `SECRET_KEY` and locked-down `CORS_ALLOWED_ORIGINS` before enabling non-dev.
2. Use HTTPS in production.
3. JWT tokens expire after the configured lifetime (default 120 minutes).
4. Passwords are bcrypt hashed; role checks are enforced server-side.
5. Avoid running OCR/ASR workers in the web process; dedicate a worker process.

## License

MIT
