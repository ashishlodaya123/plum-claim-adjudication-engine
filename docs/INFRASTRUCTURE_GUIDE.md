# 🏗️ Infrastructure & Monitoring Guide

This guide explains how to access and use the infrastructure services running alongside the Claims Adjudication Engine.

## 🗄️ MinIO (Object Storage)

MinIO is used to store uploaded claim documents (PDFs, Images) and internal processing artifacts.

-   **URL**: [http://localhost:9001](http://localhost:9001) (Console)
-   **API Endpoint**: `http://localhost:9000` (Used by backend)

### 🔐 Login Credentials
-   **Username**: `admin`
-   **Password**: `admin123`

### 📂 How to Use
1.  **Login** to the console.
2.  Click on **Buckets** in the left sidebar.
3.  Select the **`claims`** bucket.
4.  You will see folders for each claim ID. Inside, you can view:
    -   The original uploaded file.
    -   Debug images (e.g., preprocessed OCR images).

---

## 📈 Prometheus (Metrics)

Prometheus scrapes metrics from the FastAPI backend to track performance and errors.

-   **URL**: [http://localhost:9090](http://localhost:9090)

### 🔍 Useful Queries
Enter these in the search bar to see real-time data:

| Query | Description |
| :--- | :--- |
| `http_requests_total` | Total number of API requests received. |
| `http_requests_total{status="200"}` | Count of successful (200 OK) requests. |
| `rate(http_requests_total[1m])` | Requests per second (last 1 minute). |
| `http_request_duration_seconds_bucket` | Latency histogram (how fast requests are). |
| `process_cpu_seconds_total` | CPU usage of the backend service. |

---

## 📊 Grafana (Visualization)

Grafana visualizes the data collected by Prometheus in beautiful dashboards.

-   **URL**: [http://localhost:3001](http://localhost:3001)

### 🔐 Login Credentials
-   **Username**: `admin`
-   **Password**: `admin` (You will be asked to change this on first login; you can skip it).

### ⚙️ Setup Data Source (First Time Only)
If you don't see any data, you might need to connect Prometheus:

1.  Go to **Configuration (Gear Icon)** -> **Data Sources**.
2.  Click **Add data source**.
3.  Select **Prometheus**.
4.  **URL**: `http://prometheus:9090` (Important: Use the Docker service name, not localhost).
5.  Click **Save & Test**. You should see "Data source is working".

### 📉 Creating a Dashboard
1.  Click **Create (+)** -> **Dashboard**.
2.  Click **Add a new panel**.
3.  In the **Metrics browser**, enter a query (e.g., `rate(http_requests_total[1m])`).
4.  Click **Apply**.
