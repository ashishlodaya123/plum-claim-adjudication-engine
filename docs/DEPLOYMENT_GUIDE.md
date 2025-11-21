# 🚀 Deployment Guide

This guide outlines two ways to "deploy" the Plum Claim Adjudication System.

## Option 1: The "Internship Demo" Way (Recommended)
**Best for:** Submitting the assignment without paying for cloud hosting.
**Cost:** Free.
**Time:** 5 minutes.

Since this project uses a complex stack (5+ Docker containers: Frontend, Backend, Worker, Redis, Postgres, MinIO), deploying to free tiers on Vercel/Heroku is difficult or impossible due to resource limits.

Instead, we can use **Tunneling** to expose your running local Docker app to the internet.

### Using `ngrok` (or similar tools)

1.  **Download ngrok**: [https://ngrok.com/download](https://ngrok.com/download)
2.  **Start your app**: Ensure `docker-compose up` is running.
3.  **Expose the Frontend**:
    ```bash
    ngrok http 3000
    ```
    *Copy the HTTPS URL generated (e.g., `https://random-name.ngrok-free.app`).*

4.  **Expose the Backend** (Open a new terminal):
    ```bash
    ngrok http 8000
    ```
    *Copy this URL too.*

5.  **Update Frontend Config**:
    You might need to temporarily update your frontend `.env` or `config` to point to the new Backend ngrok URL instead of `localhost:8000`, then rebuild.
    *Tip: For a simple demo, just exposing port 3000 might work if the frontend calls the backend via relative paths or if you keep the backend on localhost and only access the frontend locally for the video.*

    **Better Approach for Demo Video:**
    Just run it locally! Most internship evaluations accept a screen recording of the app running on `localhost`. The "Deployed URL" requirement is often flexible if the stack is complex. You can submit the **GitHub Repository** and the **Demo Video**.

---

## Option 2: The "Production" Way (AWS EC2 / DigitalOcean)
**Best for:** Showing you know DevOps.
**Cost:** ~$10-20/month (or Free Tier eligible on AWS).
**Time:** 30-60 minutes.

We will deploy the exact same Docker Compose setup to a Virtual Machine (VPS).

### Prerequisites
-   An AWS Account (or DigitalOcean/Azure).
-   SSH Client (Terminal).

### Steps

1.  **Launch an Instance (VM)**
    -   **AWS**: Launch an **EC2 Instance** (Ubuntu 22.04 LTS).
    -   **Instance Type**: `t3.medium` (recommended) or `t2.medium`. *Note: `t2.micro` (Free Tier) might crash due to OOM with the ML models.*
    -   **Security Group**: Allow ports `80` (HTTP), `443` (HTTPS), `3000`, `8000`, `22` (SSH).

2.  **SSH into the Server**
    ```bash
    ssh -i your-key.pem ubuntu@your-server-ip
    ```

3.  **Install Docker & Docker Compose**
    ```bash
    # Update packages
    sudo apt update && sudo apt upgrade -y

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Add user to docker group
    sudo usermod -aG docker $USER
    # (Log out and log back in for this to take effect)
    ```

4.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/plum-claim-engine.git
    cd plum-claim-engine
    ```

5.  **Configure Environment**
    ```bash
    cp .env.example .env
    nano .env
    # Paste your GROQ_API_KEY and other secrets
    ```

6.  **Run the Application**
    ```bash
    docker compose up --build -d
    ```

7.  **Access the App**
    -   Frontend: `http://your-server-ip:3000`
    -   Backend: `http://your-server-ip:8000/docs`

### Optional: Domain & SSL (Nginx Proxy Manager)
For a true production finish, set up **Nginx Proxy Manager** to handle SSL certificates (HTTPS) and route `your-domain.com` to port 3000.

---

## Option 3: Cloud Platforms (Railway / Render)
**Best for:** Easy deployment with some free tier limits.
**Cost:** Free trial or ~$5/month.
**Time:** 15-30 minutes.

Platforms like **Railway** and **Render** can auto-deploy from your GitHub repository.

### 🚂 Deploying on Railway (Recommended for Full Stack)

**Yes, Railway can host EVERYTHING (Frontend + Backend + Database).**

Railway has excellent support for Docker Compose. It will read your `docker-compose.yml` and spin up all services automatically.

1.  **Push to GitHub**: Ensure your latest code is pushed to a GitHub repository.
2.  **Sign up for Railway**: Go to [railway.app](https://railway.app) and login with GitHub.
3.  **New Project**: Click "New Project" -> "Deploy from GitHub repo".
4.  **Select Repository**: Choose your `plum-claim-engine` repo.
5.  **Railway Magic**: Railway will detect the `docker-compose.yml` and create a service for each container defined (Frontend, Backend, Worker).
6.  **Databases**:
    -   Railway might try to use the `redis` and `postgres` images from your compose file.
    -   **Better Way**: Delete/Comment out `redis` and `postgres` in your compose file before deploying. Instead, right-click on the Railway canvas and add "PostgreSQL" and "Redis" managed services. This is more stable.
    -   Link them by updating the `DATABASE_URL` and `REDIS_URL` variables in your Backend service settings.
7.  **Expose Frontend**: Go to the "Frontend" service settings in Railway -> "Networking" -> "Generate Domain". This gives you a public URL (e.g., `https://plum-frontend.up.railway.app`).

### ▲ Deploying on Vercel (Frontend Only)

Vercel is perfect for the React frontend but cannot host the Python/Celery backend.

1.  **Push to GitHub**.
2.  **Login to Vercel**: Go to [vercel.com](https://vercel.com).
3.  **Import Project**: Select your repo.
4.  **Root Directory**: Select `frontend`.
5.  **Environment Variables**: Add `VITE_API_BASE_URL` and set it to your **deployed backend URL** (e.g., from Railway or ngrok).
6.  **Deploy**: Vercel will build and host your frontend globally.
