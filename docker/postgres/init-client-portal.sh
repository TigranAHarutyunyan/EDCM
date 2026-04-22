#!/bin/bash
# Runs once on first PostgreSQL cluster init. Creates a dedicated role + database for the Client Portal.
# Default password must match CLIENT_PORTAL_DB_PASSWORD in .env (default: client_portal_secret).
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'client_portal') THEN
    CREATE ROLE client_portal WITH LOGIN PASSWORD 'client_portal_secret';
  END IF;
END
$$;
EOSQL

EXISTS=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" -tAc \
  "SELECT 1 FROM pg_database WHERE datname = 'client_portal'")

if [ "$EXISTS" != "1" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" \
    -c "CREATE DATABASE client_portal OWNER client_portal;"
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "client_portal" <<'EOSQL'
GRANT ALL ON SCHEMA public TO client_portal;
EOSQL
