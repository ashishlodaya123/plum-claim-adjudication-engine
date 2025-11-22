# Plum Claim Adjudication Engine - System Documentation

## Overview
This document provides a detailed explanation of the Plum Claim Adjudication Engine, including its architecture, core functionalities, and the recently implemented "Bonus Points" features.

## Architecture
The system follows a modern full-stack architecture:
- **Frontend**: React (TypeScript) with Tailwind CSS for styling.
- **Backend**: FastAPI (Python) for the REST API.
- **Database**: PostgreSQL (Async SQLAlchemy) for persistent storage.
- **Task Queue**: Celery with Redis for asynchronous processing of heavy tasks (OCR, LLM).
- **Storage**: MinIO (S3 compatible) for storing claim documents.

## Core Functionalities

### 1. Claim Submission
**Workflow**:
1.  User uploads documents (Images/PDFs) via the Frontend.
2.  Backend receives files, saves them to MinIO, and creates a `Claim` record.
3.  A Celery task is triggered asynchronously to process the claim.

### 2. Document Processing (OCR & Extraction)
**Logic**:
- **OCR**: Uses EasyOCR to extract raw text from images.
- **Extraction**:
    - **Regex**: First attempts to extract structured fields (Amount, Hospital Name) using regular expressions for speed and reliability.
    - **LLM Fallback**: If Regex fails or for complex fields, it uses Llama-3 (via Groq) to extract data.
    - **Confidence**: The system now calculates a confidence score for extraction.

### 3. Adjudication Rules Engine
**Logic**:
The `RulesEngine` evaluates the extracted data against `policy_terms.json`.
- **Eligibility**: Checks if the claim meets minimum amount requirements.
- **Coverage**: Verifies if the treatment type is covered and checks sub-limits.
- **Co-pay**: Calculates co-pay deductions.
- **Fraud Detection**: Flags high-value claims or suspicious patterns.

## New Features (Bonus Points Implementation)

### 1. Dynamic Confidence Scores
**Implementation**:
- **LLM Level**: The LLM is now prompted to return a `confidence_score` (0.0 - 1.0) along with the extracted data, reflecting its own certainty.
- **Rule Level**: The Rules Engine calculates a final confidence score based on:
    - Completeness of data (missing critical fields reduces confidence).
    - Extraction quality (LLM confidence).
    - Business logic (e.g., zero amount claims have low confidence).
- **Impact**: Claims with confidence < 0.7 are automatically flagged for **Manual Review**.

### 2. Manual Review Workflow
**Implementation**:
- **Status**: A new claim status `NEEDS_REVIEW` was introduced.
- **Frontend**: A dedicated **Review Queue** page (`/manual_review`) lists all claims requiring attention.
- **Action**: Reviewers can see the system's decision/confidence and manually **Approve** or **Reject** the claim.

### 3. Admin Dashboard
**Implementation**:
- **Route**: `/admin`
- **Features**:
    - **System Stats**: Real-time view of Total Claims, Approval Rate, Pending Reviews, and Average Confidence.
    - **Policy Config**: Read-only view of the active `policy_terms.json`, allowing admins to verify rules without touching code.

### 4. Evaluation Metrics
**Implementation**:
- **Service**: `MetricsService` compares system decisions against a "Ground Truth" dataset (`test_cases.json`).
- **Metrics Calculated**:
    - **Accuracy**: Overall correctness of decisions.
    - **Precision**: Reliability of "Approved" decisions.
    - **Recall**: Ability to catch all valid claims.
    - **F1 Score**: Balanced metric.
- **Execution**: Run `python backend/evaluate.py` to generate a report.

### 5. CI/CD Pipeline
**Implementation**:
- **Tool**: GitHub Actions (`.github/workflows/ci.yml`).
- **Stages**:
    - **Backend Test**: Installs dependencies and runs tests/linting.
    - **Frontend Build**: Installs npm packages and builds the React app.
    - **Deploy**: Placeholder for deployment step (triggered on push to `main`).

## Future Improvements
- **Advanced RAG**: Implement Retrieval Augmented Generation to query complex policy documents dynamically.
- **Feedback Loop**: Use manual review decisions to fine-tune the LLM prompts or few-shot examples.
