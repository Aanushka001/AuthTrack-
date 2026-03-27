FROM python:3.11-slim AS production
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p logs models && \
    addgroup --system appgroup && \
    adduser --system --home /app --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app && \
    chmod 755 logs

USER appuser
ENV HOME=/app

EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120", "app:app"]