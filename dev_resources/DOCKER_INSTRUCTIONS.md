# Docker Deployment Instructions

## 1. Shut Down Existing Containers
Since you have some services running (postgres, redis, minio), you need to stop them first to avoid port conflicts.

Run this command in your terminal:
```bash
docker compose down
```
This will stop and remove all containers defined in your `docker-compose.yml`.

## 2. Start the Full Stack
To build and start all services (Frontend, Backend, Worker, Database, Redis, MinIO, Monitoring), run:

```bash
docker compose up --build -d
```
*   `--build`: Forces a rebuild of the images (important since we added new code).
*   `-d`: Runs in detached mode (in the background).

## 3. Verify Deployment
Once the command finishes, wait about 30-60 seconds for everything to initialize (especially the database).

*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
*   **MinIO Console:** [http://localhost:9001](http://localhost:9001) (User: `admin`, Pass: `admin123`)
*   **Grafana:** [http://localhost:3001](http://localhost:3001) (User: `admin`, Pass: `admin`)

## 4. Troubleshooting
If something isn't working, check the logs:

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service (e.g., backend)
docker compose logs -f fastapi
```

## 5. Stopping the App
To stop everything:
```bash
docker compose down
```
