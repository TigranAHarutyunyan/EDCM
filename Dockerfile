# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend & Final Image ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Copy the built frontend from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Collect static files (whitenoise will serve them)
# We need to ensure settings.py is configured for this
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Start Gunicorn, binding to the port provided by Render
# We also run migrations here to ensure the DB is up to date
CMD python manage.py migrate && gunicorn --bind 0.0.0.0:${PORT:-8000} config.wsgi:application
