FROM python:3.10-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN  apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir  --prefix=/install -r requirements.txt

#stage 2
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app


COPY --from=builder /install /usr/local/


COPY . /app 


RUN useradd --create-home --uid 1000 portaluser \
    && chown -R portaluser:portaluser /app

USER portaluser


EXPOSE 8001

# Use shell form so Render's $PORT env var is respected.
# Render injects PORT at runtime; fall back to 8001 for local Docker Compose.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 4"]
