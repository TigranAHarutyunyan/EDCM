# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --frozen-lockfile
COPY frontend/ ./
RUN npm install .
RUN npm run build

# --- Stage 2: Backend & Final Image ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for psycopg2 and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Create a non-root user for security
RUN useradd -m -u 1000 appuser

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools && \
    pip install -r requirements.txt

# Copy the entire project
COPY --chown=appuser:appuser . .

# Copy the built frontend from Stage 1
COPY --from=frontend-build --chown=appuser:appuser /app/frontend/dist ./frontend/dist

# Copy entrypoint script and make it executable
COPY --chown=appuser:appuser entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create necessary directories with correct permissions
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R appuser:appuser /app/staticfiles /app/media /app/logs

# Switch to non-root user
USER appuser

# Collect static files (whitenoise will serve them)
# Use a dummy secret key for collecting static files if not provided
RUN SECRET_KEY=build-time-only python manage.py collectstatic --noinput --clear

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health/ || exit 1

# Use entrypoint script for orchestration
ENTRYPOINT ["/app/entrypoint.sh"]


