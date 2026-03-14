FROM python:3.10-alpine

WORKDIR /app

# Install build and runtime dependencies in one go (or use multi-stage)
# SQLite doesn't need extra headers on Alpine typically, but we need build-base for some python tools
RUN apk add --no-cache \
    build-base \
    libffi-dev

# Create non-root user
RUN adduser -D -u 1000 portaluser
USER portaluser
ENV PATH="/home/portaluser/.local/bin:${PATH}"

RUN pip install --user --no-cache-dir \
    fastapi \
    uvicorn \
    httpx \
    python-multipart \
    python-jose[cryptography] \
    passlib[bcrypt]

# Copy application code
COPY --chown=portaluser:portaluser . .

EXPOSE 8001

# Run with uvicorn for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
