FROM python:3.10-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir  --prefix=/install -r requirements.txt

#stage 2
FROM python:3.10-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* 
    

COPY --from=builder /install  /usr/local/
COPY . /app

RUN chmod +x /app/entrypoint.sh  \
    && useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser


EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8000/api/health/ >/dev/null || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
