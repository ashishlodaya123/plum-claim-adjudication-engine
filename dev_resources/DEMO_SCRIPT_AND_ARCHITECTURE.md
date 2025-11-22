# Demo Video Guide & System Architecture

This document is designed to help you record a compelling demo video (5-10 mins) for the Plum Intern Assignment. It covers the "Why" and "How" of the system, along with a script to structure your presentation.

---

## 1. System Architecture & Tech Stack

### **High-Level Architecture**
The system follows an **Event-Driven Microservices Architecture**. This was chosen to ensure scalability and responsiveness. We don't want the user to wait while a heavy AI model processes a document; instead, we accept the file, give the user a tracking ID, and process it in the background.

### **Tech Stack & Intuition (The "Why")**

| Component | Technology | Why we chose it? |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI (Python)** | • **Speed**: High performance (Starlette-based).<br>• **Async Support**: Native `async/await` is crucial for handling I/O-bound tasks (DB, S3, AI calls).<br>• **Auto-Docs**: Generates Swagger UI automatically, saving dev time. |
| **Frontend** | **React + Vite + Tailwind** | • **Vite**: Lightning-fast build times compared to CRA.<br>• **Tailwind**: Utility-first CSS allows for rapid UI development without context switching.<br>• **Recharts**: Composable, reliable charting library for the dashboard. |
| **Async Task Queue** | **Celery + Redis** | • **Decoupling**: Separates the heavy lifting (OCR/LLM) from the HTTP request cycle.<br>• **Reliability**: Redis acts as a robust message broker. If the worker crashes, the task persists in the queue. |
| **Database** | **PostgreSQL + SQLAlchemy** | • **Relational Integrity**: Claims data is structured and relational (Policies -> Claims -> Items).<br>• **Async Driver**: `asyncpg` prevents database queries from blocking the main event loop. |
| **Object Storage** | **MinIO** | • **S3 Compatible**: Industry standard API. Easy to switch to AWS S3 in production.<br>• **Security**: Keeps sensitive medical documents out of the database (which should only store metadata). |
| **AI/LLM** | **Groq (Llama 3)** | • **Latency**: Groq's LPU (Language Processing Unit) inference is incredibly fast (sub-second), making the "real-time" feel possible.<br>• **Accuracy**: Llama 3 70B is comparable to GPT-4 for extraction tasks but faster/cheaper. |
| **OCR** | **EasyOCR** | • **Robustness**: Handles noisy images better than Tesseract out-of-the-box.<br>• **Fallback**: We implemented a hybrid pipeline (EasyOCR -> Tesseract) to maximize text recovery. |

---

## 2. Key Functionalities & Logic

### **A. Automated Adjudication Engine**
*   **Logic**: It's a deterministic pipeline.
    1.  **Extraction**: OCR gets raw text -> LLM cleans it and extracts JSON (Patient Name, Diagnosis, Amounts).
    2.  **Validation**: The `RulesEngine` class checks this JSON against `policy_terms.json`.
    3.  **Decision**:
        *   *Reject* if Amount < Min Limit or Category is Excluded.
        *   *Partial* if Amount > Sub-limit (Cap it).
        *   *Co-pay* is applied (10%) automatically.
        *   *Approve* if all checks pass.

### **B. Manual Review (Human-in-the-Loop)**
*   **Logic**: We calculate a **Confidence Score** (based on missing fields or LLM uncertainty).
*   **Routing**: If `Confidence < 0.7` OR `Amount > ₹50,000` (Fraud Risk), the status is set to `NEEDS_REVIEW` instead of `APPROVED`/`REJECTED`.
*   **UI**: The "Manual Review" page fetches only these specific claims, allowing a human to override the AI.

### **C. System Metrics**
*   **Logic**: We use **Prometheus** middleware to intercept every request.
*   **Metrics**:
    *   `http_requests_total`: Counts 200s, 400s, 500s.
    *   `http_request_duration_seconds`: Measures latency.
*   **Visualization**: The frontend polls `/admin/metrics` every 5 seconds to update the charts.

---

## 3. Demo Video Script (Suggested Flow)

**Duration**: 5-8 Minutes

### **Intro (0:00 - 1:00)**
*   **Hook**: "Hi, I'm [Name]. For the Plum assignment, I built an automated claims adjudication engine that doesn't just process claims but *understands* them using AI."
*   **Architecture**: Briefly show the Architecture Diagram (from README). Mention the Event-Driven design (FastAPI + Celery).

### **Part 1: The Happy Path (Automated Approval) (1:00 - 3:00)**
*   **Action**: Go to "New Claim". Upload a standard OPD bill (e.g., `Bill_A.jpg`).
*   **Talk Track**: "I'm uploading a standard consultation bill. Behind the scenes, this file is sent to MinIO, and a Celery task is triggered."
*   **Observation**: Show the status change: `Processing` -> `Completed`.
*   **Result**: Click the claim. Show the extracted data (Patient Name, Diagnosis) and the **Decision**: "Approved". Point out the "Auto-calculated Co-pay".

### **Part 2: The Rejection (Policy Enforcement) (3:00 - 4:30)**
*   **Action**: Upload a bill for "Cosmetic Surgery" or a very low amount (< ₹100).
*   **Talk Track**: "Now, let's test the Rules Engine. This policy explicitly excludes Cosmetic Surgery."
*   **Result**: Show the status `Rejected`.
*   **Highlight**: Hover over the "Rejection Reason" tooltip. "The system automatically flagged this as an Excluded Category."

### **Part 3: Manual Review & Fraud Detection (4:30 - 6:00)**
*   **Action**: Upload a high-value claim (e.g., ₹80,000) or a blurry image.
*   **Talk Track**: "AI isn't perfect, and high-value claims need human eyes. I've configured the system to flag claims over ₹50k."
*   **Result**: Status becomes `Needs Review`.
*   **Action**: Navigate to "Manual Review" tab.
*   **Walkthrough**: Show the side-by-side view. "Here, the adjudicator can see the original document and the AI's extraction. I can edit the amount if the AI misread it, then hit Approve."

### **Part 4: Admin Dashboard & Metrics (6:00 - 7:00)**
*   **Action**: Go to "Admin Dashboard".
*   **Talk Track**: "Finally, for the operations team, we have real-time observability."
*   **Highlight**:
    *   Show the "Request Volume" chart updating (if you just made requests).
    *   Show the "Status Distribution" pie chart.
    *   Explain that this uses Prometheus metrics, not just database counts.

### **Outro (7:00 - End)**
*   **Summary**: "In summary, this system combines the speed of Rules Engines with the flexibility of LLMs, wrapped in a scalable, production-ready architecture."
*   **Future Work**: "Given more time, I would add user authentication and a mobile app for claimants."
*   **Closing**: "Thank you for watching."

---

## 4. Files to Move to `dev_resources/`

To clean up your root directory for the final submission, move these files into `dev_resources/`:

1.  `DOCKER_INSTRUCTIONS.md`
2.  `GAP_ANALYSIS.md`
3.  `LOCAL_SETUP.md`
4.  `WSL_DOCKER_SETUP.md`
5.  `prd.md`
6.  `docs/` folder contents (You can move the entire `docs` folder content here if you want the root to be very clean, or just keep the `docs` folder as is. The assignment asked for documentation, so keeping `docs/` in root is actually standard practice. **Recommendation**: Keep `docs/` in root, but move the setup/analysis MD files listed above into `dev_resources`).
