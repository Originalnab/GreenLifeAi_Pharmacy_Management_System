#!/bin/sh
set -e

echo "=== [GreenLife AI Backend Entrypoint] ==="
echo "Running database migrations..."
python manage.py migrate --fake-initial --noinput

echo "Running initial database seeds (if needed)..."
python seed_all.py

echo "Starting WSGI server (Gunicorn)..."
exec "$@"
