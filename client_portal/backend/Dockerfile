FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    httpx \
    python-multipart \
    "python-jose[cryptography]" \
    "passlib[bcrypt]"

COPY . /app

RUN useradd --create-home --uid 1000 portaluser \
    && chown -R portaluser:portaluser /app

USER portaluser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
