# syntax=docker/dockerfile:1

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies for runtime (paramiko, SSL)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libffi-dev \
       libssl-dev \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -ms /bin/bash appuser
WORKDIR /app

# Install Python dependencies first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application source
COPY src /app/src

# Prepare data directory (bind-mounted in compose for persistence)
RUN mkdir -p /app/data && chown -R appuser:appuser /app

USER appuser

# Expose default API port; can be overridden with API_PORT env
EXPOSE 8000

# Run uvicorn with configurable workers and port; trust proxy headers if behind reverse proxy
CMD uvicorn src.api.app:app --host 0.0.0.0 --port ${API_PORT:-8000} --workers ${WORKERS:-1} --proxy-headers
