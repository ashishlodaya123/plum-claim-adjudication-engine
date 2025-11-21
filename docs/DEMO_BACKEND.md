# ⚙️ Backend Architecture & Implementation Guide

## Overview

The backend is a robust, asynchronous system built with **FastAPI** and **Celery**. It is designed to handle heavy computational loads (OCR, LLM inference) without blocking the main application thread, ensuring high availability and responsiveness.

## 🛠️ Tech Stack

-   **API Framework**: FastAPI (Python 3.9+)
-   **Task Queue**: Celery
-   **Message Broker**: Redis
-   **Database**: PostgreSQL (Async SQLAlchemy)
-   **Object Storage**: MinIO (S3 Compatible)
-   **OCR Engine**: EasyOCR + Tesseract (Hybrid)
-   **LLM Integration**: Groq (Llama 3)

## 🏗️ Architecture Components

### 1. API Layer (`app/api`)
-   **Endpoints**:
    -   `POST /claims/upload`: Accepts file uploads, saves to MinIO, creates a DB record, and triggers a Celery task. Returns a Claim ID immediately.
    -   `GET /claims/{id}`: Returns the current status and results of a claim.
-   **Async/Await**: Fully asynchronous request handling for maximum throughput.

### 2. Worker Layer (`app/workers`)
-   **Celery Worker**: Runs in a separate Docker container.
-   **Task**: `process_claim`
    1.  **Fetch**: Downloads document from MinIO.
    2.  **OCR**: Runs `OcrService` to extract raw text.
    3.  **Extraction**: Runs `ExtractionService` (Regex + LLM) to structure data.
    4.  **Adjudication**: Runs `RulesEngine` to apply policy logic.
    5.  **Save**: Updates the database with the final decision.

### 3. Data Layer (`app/models`, `app/schemas`)
-   **SQLAlchemy ORM**: Maps Python objects to PostgreSQL tables (`claims`, `documents`, `extractions`, `decisions`).
-   **Pydantic Schemas**: Ensures strict type validation for API requests and responses.

## 🔄 The Lifecycle of a Claim

1.  **Ingestion**: File lands in MinIO bucket `claims`.
2.  **Queuing**: Task ID pushed to Redis list `celery`.
3.  **Processing**: Worker pops task, processes it (CPU intensive).
4.  **Persistence**: Results stored in Postgres.
5.  **Retrieval**: Frontend polls and retrieves JSON result.

## 🛡️ Security & Scalability

-   **Dockerized**: Each component (API, Worker, DB, Redis, MinIO) runs in its own container.
-   **Environment Variables**: All secrets (API keys, DB credentials) are managed via `.env` files.
-   **Horizontal Scaling**: You can spin up multiple `worker` containers to handle higher load: `docker compose up -d --scale worker=3`.
