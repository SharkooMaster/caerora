#!/usr/bin/env bash
set -e

echo "Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
python - <<'PY'
import os, time, socket
host = os.environ.get("POSTGRES_HOST", "postgres")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Postgres not reachable")
print("Postgres is up.")
PY

# Run migrations / collectstatic / seed only in the web container, not the worker.
# RUN_STARTUP_TASKS (default 1) keeps the original single-container behaviour for
# Docker Compose. COLLECT_STATIC (default 1) runs collectstatic at startup; in
# Kubernetes it is set to 0 because static is baked into the image at build time
# and served by WhiteNoise, so we avoid a slow collectstatic onto a RWX volume.
RUN_STARTUP_TASKS="${RUN_STARTUP_TASKS:-1}"
COLLECT_STATIC="${COLLECT_STATIC:-1}"
if [[ "$RUN_STARTUP_TASKS" == "1" && ( "$*" == *"gunicorn"* || "$*" == *"runserver"* ) ]]; then
    echo "Applying migrations..."
    python manage.py migrate --noinput

    if [[ "$COLLECT_STATIC" == "1" ]]; then
        echo "Collecting static files..."
        python manage.py collectstatic --noinput
    fi

    if [[ -n "$DJANGO_SUPERUSER_USERNAME" && -n "$DJANGO_SUPERUSER_PASSWORD" ]]; then
        echo "Ensuring superuser exists..."
        python manage.py ensure_superuser || true
    fi

    if [[ "${SEED_ON_START:-0}" == "1" ]]; then
        echo "Seeding demo data..."
        python manage.py seed_demo || true
    fi
fi

exec "$@"
