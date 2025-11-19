# PlumHQ Automated Medical Claim Adjudication System

## Overview

This project is a full-stack, production-grade automated medical claim adjudication system. It automates the process of extracting information from uploaded medical documents, validating the claims against a set of rules, and making a decision (Approved, Partially Approved, Rejected, or Manual Review). The system is designed to be highly accurate, reliable, transparent, and explainable.

## Architecture Diagram

The system follows a microservices-based architecture, orchestrated using Docker Compose.

*   **Frontend:** A React (TypeScript) single-page application for users to upload claim documents and view the status and decision of their claims.
*   **Backend:** A FastAPI application that exposes a RESTful API for claim submission and status retrieval.
*   **Background Worker:** A Celery worker that processes the claims asynchronously. The pipeline includes an OCR stage, an extraction stage, and a rule engine stage.
*   **Message Broker:** Redis is used as the message broker for Celery.
*   **Database:** PostgreSQL is used to store claim data, document metadata, extracted information, and decisions.
*   **Object Storage:** MinIO is used to store the uploaded claim documents and the intermediate OCR outputs.
*   **Monitoring:** Prometheus is used to scrape metrics from the FastAPI application, and Grafana is used for visualization and dashboards.

## Tech Stack

*   **Backend:** FastAPI, Python 3.9, Celery, SQLAlchemy
*   **Frontend:** React, TypeScript, Axios
*   **Database:** PostgreSQL
*   **Object Storage:** MinIO
*   **Message Broker:** Redis
*   **OCR:** EasyOCR, Tesseract
*   **LLM:** Groq API
*   **Containerization:** Docker, Docker Compose
*   **Monitoring:** Prometheus, Grafana

## How to Run

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
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:8000/docs`
*   **MinIO Console:** `http://localhost:9001`
*   **Prometheus:** `http://localhost:9090`
*   **Grafana:** `http://localhost:3001`

## API Reference

The API documentation is available at `http://localhost:8000/docs` when the application is running.

*   `POST /claims`: Upload claim documents.
*   `GET /claims/{claim_id}`: Get the status of a claim.
*   `GET /jobs/{job_id}`: Get the progress of a job.

## Test Instructions

To run the tests, execute the following command from the root directory:

```bash
docker-compose run --rm fastapi sh -c "PYTHONPATH=backend python3 -m pytest backend/tests/test_claims.py"
```

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

*   The uploaded documents are in English.
*   The `GROQ_API_KEY` is provided in the `.env` file.

## Limitations

*   The OCR pipeline is not guaranteed to be 100% accurate.
*   The rule engine currently only implements a subset of the rules.
*   The fraud detection is based on simple heuristics.

## Future Improvements

*   Improve the accuracy of the OCR pipeline.
*   Implement a more comprehensive rule engine.
*   Integrate a more sophisticated fraud detection system.
*   Add user authentication and authorization.
*   Implement a proper CI/CD pipeline.
