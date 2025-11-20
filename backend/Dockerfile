# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Upgrade pip and install base packages
RUN pip install --upgrade pip

# Install packages in groups to improve reliability
RUN pip install --no-cache-dir \
    fastapi uvicorn python-multipart redis psycopg2-binary sqlalchemy alembic \
    pydantic[email] pydantic-settings python-jose[cryptography] passlib[bcrypt] tenacity \
    python-dotenv aiofiles sentry-sdk httpx asyncpg

RUN pip install --no-cache-dir \
    celery pytesseract opencv-python-headless groq boto3 fastapi-limiter \
    prometheus-fastapi-instrumentator grafana-client pytest pytest-asyncio

# EasyOCR has many dependencies, install it separately
RUN pip install --no-cache-dir easyocr

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run database initialization and then start the app
CMD python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload