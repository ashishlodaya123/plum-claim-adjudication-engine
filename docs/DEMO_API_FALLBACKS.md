# 🛡️ API Resilience & Fallback Strategies

## Overview

In a real-world distributed system, failures are inevitable. This engine implements multiple layers of defense to ensure that a claim is processed correctly, even if individual components fail or behave unexpectedly.

## 🔄 OCR Fallback Pipeline

The OCR service uses a **Hybrid Pipeline** to maximize accuracy:

1.  **Primary Engine (EasyOCR)**:
    -   **Why**: Deep learning-based, excellent for natural scenes and complex layouts.
    -   **Trigger**: Runs first on all images.
    -   **Validation**: We check the `confidence` score of the output.
2.  **Fallback Engine (Tesseract)**:
    -   **Why**: Traditional LSTM-based OCR, reliable for standard fonts and high-contrast documents.
    -   **Trigger**: If EasyOCR confidence drops below **0.4** (configurable), the system automatically switches to Tesseract.
    -   **Benefit**: Prevents a single model's weakness from blocking the entire pipeline.

## 🧠 LLM Extraction & Correction

OCR is rarely perfect. We use an **LLM (Llama 3 via Groq)** as a semantic correction layer.

-   **Problem**: OCR might read "City Cliwic" instead of "City Clinic".
-   **Solution**: The LLM prompt explicitly instructs the model to:
    > "The text is extracted from a medical claim document using OCR and may contain typos... Please correct these errors and infer the correct values based on context."
-   **Result**: The system "heals" the data before it reaches the rules engine.

## 🔁 Retry Logic (Tenacity)

Network blips happen. We use the `tenacity` library to make our system robust.

-   **Database Connections**: On startup, the backend retries connecting to PostgreSQL and Redis for up to 60 seconds. This handles "race conditions" where the database container starts slower than the API.
-   **External APIs**: Calls to the LLM service (Groq) are wrapped in retry blocks to handle transient 5xx errors or rate limits.

## 🛑 Error Handling

-   **Graceful Degradation**: If the LLM fails completely, the system falls back to **Regex Extraction**. While less flexible, it ensures that simple fields (like amounts) can still be captured.
-   **User Feedback**: Errors are not swallowed. They are captured and returned to the frontend with clear messages (e.g., "File too large", "Unsupported format"), allowing the user to correct the action.
