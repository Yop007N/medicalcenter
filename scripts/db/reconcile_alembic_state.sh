#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_NAME="${DB_NAME:-medical_services_dev}"
DB_USER="${DB_USER:-postgres}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] docker is required" >&2
  exit 1
fi

if ! docker compose ps "$BACKEND_SERVICE" "$DB_SERVICE" >/dev/null 2>&1; then
  echo "[ERROR] backend/postgres services are not available in docker compose" >&2
  exit 1
fi

run_sql() {
  local sql="$1"
  docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -tAc "$sql"
}

table_count="$(run_sql "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d '[:space:]')"
has_alembic="$(run_sql "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alembic_version');" | tr -d '[:space:]')"

if [[ "$has_alembic" == "t" ]]; then
  echo "[INFO] alembic_version exists. Running upgrade to head..."
  docker compose exec -T "$BACKEND_SERVICE" alembic upgrade head
else
  if [[ "$table_count" == "0" ]]; then
    echo "[INFO] Empty schema detected. Running alembic upgrade head..."
    docker compose exec -T "$BACKEND_SERVICE" alembic upgrade head
  else
    echo "[WARN] Schema has $table_count tables but alembic_version is missing. Stamping head..."
    docker compose exec -T "$BACKEND_SERVICE" alembic stamp head
  fi
fi

echo "[INFO] Current Alembic version:"
run_sql "SELECT version_num FROM alembic_version;"
