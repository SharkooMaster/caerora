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

# Only run migrations / collectstatic / seed in the web container, not the worker.
# In Kubernetes these are handled by a dedicated migrate Job, so the web pods
# set RUN_STARTUP_TASKS=0 to skip them (avoids races across replicas). Docker
# Compose leaves it unset, preserving the original single-container behaviour.
RUN_STARTUP_TASKS="${RUN_STARTUP_TASKS:-1}"
if [[ "$RUN_STARTUP_TASKS" == "1" && ( "$*" == *"gunicorn"* || "$*" == *"runserver"* ) ]]; then
    echo "Applying migrations..."
    python manage.py migrate --noinput

    echo "Collecting static files..."
    python manage.py collectstatic --noinput

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
