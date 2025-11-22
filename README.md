

## 🚀 Overview

This engine automates the processing of health insurance claims, using a rule-based engine for policy validation and an LLM (Large Language Model) for interpreting complex medical documents. It features a modern Admin Dashboard for real-time monitoring and manual review of flagged claims.

- **Main Adjudication Dashboard Overview**:![Dashboard Overview](img/Main_dashboard.png)

## ✨ Key Features

### 1. Automated Adjudication
*   **Rule Engine**: Validates claims against policy terms (min/max amounts, exclusions).
*   **AI Analysis**: Uses LLMs to extract and verify diagnosis codes (ICD-10) and treatment details from medical documents.
*   **Instant Decisions**: Automatically approves or rejects clear-cut cases.

### 2. Manual Review Workflow
*   **Human-in-the-Loop**: Flagged claims (e.g., low confidence, high value) are routed to a review queue.
*   **Decision Support**: Reviewers see a side-by-side view of the claim data and the AI's analysis.
*   **One-Click Actions**: Approve or reject claims directly from the UI.

### 3. System Metrics Dashboard
*   **Real-Time Monitoring**: Track total request volume, API latency, and active requests.
*   **Traffic Analysis**: Visualize response status codes (2xx, 4xx, 5xx) and top API endpoints.
*   **Live Charts**: Dynamic charts powered by Recharts for instant visibility into system health.

![System Metrics](img/Metrics.png)

## 🛠️ Tech Stack

*   **Backend**: Python, FastAPI, Prometheus (Metrics), Celery (Async Tasks)
*   **Frontend**: React, TypeScript, Tailwind CSS, Recharts
*   **AI/ML**: Groq API (LLM), OCR for document processing
*   **Infrastructure**: Docker, Redis (Caching/Queue)

## 🏁 Quick Start

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Redis (Local or Docker)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📸 Screenshots

### Admin Dashboard
![Admin Dashboard](img/AdminPanel.png)

### Manual Review Interface
![Manual Review](img/Review_page.png)
- **Admin Dashboard**:
  - **Authentication**: Secure login (`admin`/`admin123`).
  - **Policy Management**: View and edit policy rules (JSON) in real-time.
  - **System Metrics**: Live dashboard showing Request Volume and API Latency (powered by Prometheus & Recharts).
  - **Overview Stats**: Approval rates, total claims, and AI confidence metrics.
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

![System Architecture](img/Architecture_Diagram.png)

### 🔄 Adjudication Decision Flow

The rules engine processes extracted data through a series of strict validation steps:

![Adjudication Decision Flow](img/Adjudication_Flow.png)

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
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Instructions for local demo (ngrok) and cloud deployment (AWS/VPS).

## 🌐 Live Demo

> **Note:** Due to the complex microservices architecture (FastAPI, Celery, Redis, Postgres, MinIO), this application is best viewed via the **Demo Video** or by running it locally using Docker Compose.

-   **Demo Video**: [[Link to the demo video](https://go.screenpal.com/watch/cTX3oQnqr27)]


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

- **Document Language**: The system is optimized for English-language medical documents.
- **Currency**: All monetary values are processed in INR (₹) or USD ($) as per the policy configuration.
- **Policy Structure**: The system assumes a specific JSON structure for policy terms (as defined in `policy_terms.json`).
- **LLM Availability**: The system relies on the Groq API being available; a fallback to regex is implemented but less accurate.
- **Document Quality**: It is assumed that uploaded images have sufficient resolution (minimum 300 DPI recommended) for OCR to work effectively.
- **Single Claim per File**: The current iteration assumes one claim per uploaded document file.
