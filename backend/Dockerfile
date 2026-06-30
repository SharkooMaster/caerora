FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for psycopg / Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libjpeg-dev zlib1g-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh && mkdir -p media staticfiles

# Collect static at build time so the image ships ready-to-serve assets
# (WhiteNoise serves them at runtime). This avoids a slow collectstatic onto a
# networked RWX volume on every pod start. No DB/secrets are needed here.
RUN DJANGO_SETTINGS_MODULE=caerora.settings.prod python manage.py collectstatic --noinput

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "caerora.wsgi:application", "--bind", "0.0.0.0:8000"]
