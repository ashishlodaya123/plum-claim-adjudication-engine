# Local Setup Guide

This guide explains how to run the Plum Claim Adjudication Engine locally using a "Hybrid" approach:
- **Backing Services** (Postgres, Redis, Minio) run in Docker.
- **Applications** (Backend, Worker, Frontend) run in local terminals.

## Prerequisites
- Docker Desktop (running)
- Python 3.8+
- Node.js 16+
- Git Bash or WSL (for Windows)

## Step 1: Start Backing Services
We use a dedicated compose file for just the database, cache, and storage.

```bash
# Note: Use 'docker compose' (v2) instead of 'docker-compose' (v1)
docker compose -f docker-compose.backing.yml up -d
```

## Step 2: Configure Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Ensure your `.env.local` file has the following content:
   ```properties
   DATABASE_URL=postgresql+asyncpg://plum:plum123@localhost:5432/claims
   REDIS_URL=redis://localhost:6380/0
   MINIO_ENDPOINT=http://localhost:9000
   MINIO_ACCESS_KEY=admin
   MINIO_SECRET_KEY=admin123
   MINIO_BUCKET=claims
   GROQ_API_KEY=gsk_api
   JWT_SECRET=supersecret
   ```
3. Install dependencies (if not already done):
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize the database and Minio bucket:
   ```bash
   python init_db.py
   ```

## Step 3: Start Backend API
Open a **new terminal**, navigate to `backend`, and run:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --env-file .env.local
```
*The API will be available at http://localhost:8000*

## Step 4: Start Celery Worker
Open a **new terminal**, navigate to `backend`, and run:
```bash
# Windows users MUST use '-P solo' or '-P gevent'
celery -A app.core.celery_app worker --loglevel=info --concurrency=1 -P solo -Q main-queue
```

## Step 5: Start Frontend
Open a **new terminal**, navigate to `frontend`, and run:
```bash
cd frontend
npm install  # Only needed first time
npm start
```
*The UI will be available at http://localhost:3000*

## Troubleshooting
- **Port Conflicts**: If ports 5432, 6380, or 9000 are in use, stop other services or edit `docker-compose.backing.yml`.
- **Celery Issues**: If the worker doesn't pick up tasks, ensure Redis is running on port 6380 (`docker ps`).
- **Database Errors**: Run `python init_db.py` again to ensure tables exist.

## Running Tests
To run the backend automated tests:

## Maintenance & Disk Space
Docker can consume a lot of disk space over time. To clean up unused images, containers, and volumes:

```bash
# Remove unused containers, networks, images (both dangling and unreferenced)
docker system prune -a

# Remove unused volumes (WARNING: This will delete database/minio data if not running!)
# Only run this if you want to reset your data.
docker volume prune
```
