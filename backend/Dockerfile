# syntax=docker/dockerfile:1
# Backend Dockerfile for Quality Gate Web App
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies and Node.js
# We combine these to reduce layers and use cache
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y \
    git \
    curl \
    gnupg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Global Quality Tools (Static dependencies)
# Installing these BEFORE requirements.txt allows caching them even if requirements change
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir \
    lizard==1.17.10 \
    ruff==0.8.0 \
    pyright==1.1.389

RUN --mount=type=cache,target=/root/.npm \
    npm install -g \
    prettier@3.1.1 \
    typescript@5.3.3 \
    eslint@8.56.0 \
    @typescript-eslint/parser@6.19.0 \
    @typescript-eslint/eslint-plugin@6.19.0

# Install Poetry and dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir poetry==1.8.2

COPY pyproject.toml poetry.lock ./

RUN --mount=type=cache,target=/root/.cache/pip \
    poetry config virtualenvs.create false && \
    poetry install --no-root --only main --no-interaction --no-ansi

# Verify tool installations
RUN echo "Python tools:" && \
    ruff --version && \
    pyright --version && \
    lizard --version && \
    echo "Node.js tools:" && \
    prettier --version && \
    tsc --version && \
    eslint --version

# Copy application code
COPY . .

# Create directory for reports
RUN mkdir -p /app/reports

# Expose port for FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
