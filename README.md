# PlumHQ Automated Medical Claim Adjudication System

## Overview

This project is a full-stack, production-grade automated medical claim adjudication system. It automates the process of extracting information from uploaded medical documents, validating the claims against a set of rules, and making a decision (Approved, Partially Approved, Rejected, or Manual Review). The system is designed to be highly accurate, reliable, transparent, and explainable.

## Architecture Diagram

The system follows a microservices-based architecture, orchestrated using Docker Compose.

- **Frontend:** A React (TypeScript) single-page application for users to upload claim documents and view the status and decision of their claims.
- **Backend:** A FastAPI application that exposes a RESTful API for claim submission and status retrieval.
- **Background Worker:** A Celery worker that processes the claims asynchronously. The pipeline includes an OCR stage, an extraction stage, and a rule engine stage.
- **Message Broker:** Redis is used as the message broker for Celery.
- **Database:** PostgreSQL is used to store claim data, document metadata, extracted information, and decisions.
- **Object Storage:** MinIO is used to store the uploaded claim documents and the intermediate OCR outputs.
- **Monitoring:** Prometheus is used to scrape metrics from the FastAPI application, and Grafana is used for visualization and dashboards.

## Key Features
- **Automated Document Extraction**: Uses OCR (EasyOCR) and LLMs (Groq) to extract key data fields like patient name, hospital, diagnosis, and itemized costs from medical bills and prescriptions.
- **Comprehensive Rules Engine**: Implements a robust set of adjudication rules based on policy terms:
    - **Sub-limits**: Enforces category-specific limits (e.g., Pharmacy: ₹15,000, Vision: ₹5,000).
    - **Co-pay**: Automatically calculates and deducts a 10% co-pay.
    - **Exclusions**: Flags excluded categories (e.g., Cosmetic Surgery).
    - **Fraud Detection**: Flags high-value claims (> ₹50,000) and round-number amounts for manual review.
- **Real-time Dashboard**: A modern, responsive React UI to upload claims, view processing status in real-time, and see detailed adjudication results including approved amounts and rejection reasons.
- **Transparent Decisioning**: Provides clear reasons for every rejection or partial approval, along with a confidence score for the AI's extraction.

## Tech Stack

- **Backend:** FastAPI, Python 3.9, Celery, SQLAlchemy
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Database:** PostgreSQL
- **Object Storage:** MinIO
- **Message Broker:** Redis
- **OCR:** EasyOCR
- **LLM:** Groq API (Llama 3)
- **Containerization:** Docker, Docker Compose
- **Monitoring:** Prometheus, Grafana

## How to Run

### Option 1: Using Docker (Recommended)

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Create a `.env` file:**
    Copy the contents of `.env.example` to a new file named `.env` and fill in the required environment variables, such as your Groq API key.

    ```bash
    cp .env.example .env
    ```

3.  **Run the application:**
    ```bash
    docker-compose up --build
    ```

The application will be available at the following URLs:

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000/docs`
- **MinIO Console:** `http://localhost:9001`
- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001`

### Option 2: Manual Setup (Without Docker)

#### Prerequisites

1. Python 3.9+
2. Node.js 14+
3. PostgreSQL
4. Redis
5. MinIO

#### Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Set up the backend:**

    ```bash
    # Navigate to the backend directory
    cd backend

    # Create a virtual environment
    python -m venv venv

    # Activate the virtual environment
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate

    # Install dependencies
    pip install -r requirements.txt
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory with the following variables:

    ```bash
    DATABASE_URL=postgresql://plum:plum123@localhost:5432/claims
    REDIS_URL=redis://localhost:6379/0
    MINIO_ENDPOINT=http://localhost:9000
    MINIO_ACCESS_KEY=admin
    MINIO_SECRET_KEY=admin123
    MINIO_BUCKET=claims-uploads
    GROQ_API_KEY=your_groq_key_here
    JWT_SECRET=supersecret
    ```

4.  **Set up the database:**

    ```bash
    # Make sure PostgreSQL is running and create the database
    createdb claims
    ```

5.  **Set up MinIO:**

    ```bash
    # Download and run MinIO server
    # Follow instructions at https://min.io/download

    # Create a bucket named 'claims-uploads'
    ```

6.  **Run the backend services:**

    ```bash
    # Terminal 1: Run the FastAPI application
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

    # Terminal 2: Run the Celery worker
    cd backend
    celery -A app.core.celery_app worker -l info

    # Terminal 3: Run Redis (if not already running as a service)
    redis-server

    # Terminal 4: Run PostgreSQL (if not already running as a service)
    postgres -D /usr/local/var/postgres
    ```

7.  **Set up and run the frontend:**

    ```bash
    # In a new terminal, navigate to the frontend directory
    cd frontend

    # Install dependencies
    npm install

    # Run the frontend
    npm start
    ```

The application will be available at the following URLs:

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000/docs`

## API Reference

The API documentation is available at `http://localhost:8000/docs` when the application is running.

- `POST /claims`: Upload claim documents.
- `GET /claims/{claim_id}`: Get the status of a claim.
- `GET /jobs/{job_id}`: Get the progress of a job.

## Test Instructions

To run the tests, execute the following command from the root directory:

```bash
docker-compose run --rm fastapi sh -c "PYTHONPATH=backend python3 -m pytest backend/tests/test_claims.py"
```

Or, for manual setup:

```bash
cd backend
python -m pytest tests/test_claims.py
```

## 🏗️ System Architecture

The system follows a modern **Event-Driven Microservices Architecture**, ensuring scalability, fault tolerance, and asynchronous processing.

```mermaid
graph TD
    Client[Frontend (React + Vite)] -->|Upload Claim| API[Backend API (FastAPI)]
    API -->|Save File| MinIO[MinIO Object Storage]
    API -->|Create Task| Redis[Redis Message Broker]
    Redis -->|Consume Task| Worker[Celery Worker]
    
    subgraph Worker Process
        Worker -->|1. OCR Extraction| OCR[EasyOCR / Tesseract]
        Worker -->|2. Data Extraction| LLM[LLM Service (Groq/Llama3)]
        Worker -->|3. Adjudication| Rules[Rules Engine]
    end
    
    Worker -->|Save Result| DB[(PostgreSQL)]
    Client -->|Poll Status| API
    API -->|Fetch Result| DB
```

### 🔄 Adjudication Decision Flow

The rules engine processes extracted data through a series of strict validation steps:

```mermaid
graph TD
    Start([Start Adjudication]) --> CheckMin{Claim > $500?}
    CheckMin -- No --> RejectMin[REJECT: Below Minimum Amount]
    CheckMin -- Yes --> CheckPolicy{Policy Active?}
    
    CheckPolicy -- No --> RejectPolicy[REJECT: Policy Inactive]
    CheckPolicy -- Yes --> CheckExclusion{Excluded Category?}
    
    CheckExclusion -- Yes --> RejectExcl[REJECT: Excluded Service]
    CheckExclusion -- No --> CheckLimits{Within Sub-limits?}
    
    CheckLimits -- No --> CapAmount[PARTIAL: Cap at Limit]
    CheckLimits -- Yes --> CalcCopay[Apply 10% Co-pay]
    
    CapAmount --> CalcCopay
    CalcCopay --> CheckFraud{Fraud Risk?}
    
    CheckFraud -- High --> Manual[MANUAL REVIEW]
    CheckFraud -- Low --> Approve[APPROVE CLAIM]
```

## 🛠️ Technical Stack & Key Decisions

### Frontend (User Experience)
- **Framework**: React 18 with Vite for lightning-fast builds.
- **Styling**: Tailwind CSS for utility-first styling, ensuring a responsive and modern design.
- **Animations**: Framer Motion for fluid, professional UI transitions (e.g., entry animations, hover states).
- **State Management**: React Hooks (`useState`, `useEffect`) for local state; simplified for this demo but scalable.
- **Design System**: Custom "Enterprise" theme with deep indigo hues, glassmorphism effects, and premium typography (Outfit/Inter).

### Backend (Core Logic)
- **API**: FastAPI (Python) for high-performance, async-ready endpoints.
- **Task Queue**: Celery + Redis for handling long-running OCR and LLM tasks asynchronously. This prevents the API from blocking during file processing.
- **Storage**: MinIO (S3-compatible) for secure, scalable document storage.
- **Database**: PostgreSQL with SQLAlchemy (Async) for reliable relational data persistence.

### Intelligence Layer
- **OCR**: Hybrid pipeline using **EasyOCR** (primary) and **Tesseract** (fallback).
    - *Optimization*: Images are preprocessed (grayscale, resized) to improve accuracy on handwritten text.
- **LLM**: Groq (Llama 3) for context-aware extraction. It corrects OCR typos (e.g., "Cliwic" -> "Clinic") and extracts structured data from unstructured text.
- **Rules Engine**: A deterministic Python-based engine that enforces policy limits, exclusions, and co-pays strictly.

## 🚀 Troubleshooting

### Common Issues

1.  **"Tesseract Not Found" / OCR Errors**
    *   **Cause**: Missing system dependencies in the Docker container.
    *   **Fix**: The `Dockerfile` has been updated to install `tesseract-ocr`. Run `docker compose up --build -d` to rebuild.

2.  **Worker Crashes (SIGKILL / OOM)**
    *   **Cause**: High concurrency or large images exhausting memory.
    *   **Fix**:
        *   Concurrency limited to 1 (`--concurrency=1`).
        *   Images resized to max 1280px.
        *   Shared memory increased (`shm_size: '2gb'`).

3.  **"Connection Refused" (Redis/DB)**
    *   **Cause**: Services starting up slower than the backend.
    *   **Fix**: `init_db.py` includes retry logic (Tenacity) to wait for services to be ready.

## 📚 Documentation

Detailed documentation for each component can be found in the `docs/` folder:

- **[Frontend Walkthrough](docs/DEMO_FRONTEND.md)**: UI components, state, and design choices.
- **[Backend Architecture](docs/DEMO_BACKEND.md)**: API, Celery, and service orchestration.
- **[API & Fallbacks](docs/DEMO_API_FALLBACKS.md)**: Error handling, retries, and resilience.
- **[Future Improvements](docs/DEMO_MISSING_COMPONENTS.md)**: CI/CD, Monitoring, and Security.

## Troubleshooting

### Common Issues

1.  **Celery Worker Connection Error:**
    If you see `InterfaceError: cannot perform operation: another operation is in progress`, it means the database connection is being shared incorrectly across async tasks.
    *   **Fix:** Ensure `poolclass=NullPool` is used in `db.py` for the async engine. (Already implemented in this codebase).

2.  **LLM Extraction Failures:**
    If the "Patient Name" or other fields are missing, check your Groq API key and ensure the model is reachable. The system falls back to LLM extraction if regex fails.

3.  **Frontend Not Updating:**
    If the dashboard doesn't show the latest status, try refreshing the page. The polling interval is set to 2 seconds.

## Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── workers/
│   ├── tests/
├── frontend/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

## Assumptions

- The uploaded documents are in English.
- The `GROQ_API_KEY` is provided in the `.env` file.
